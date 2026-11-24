use std::collections::{HashMap, HashSet};
use std::env;
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::{Path, PathBuf};

use chrono::{DateTime, NaiveDate, NaiveDateTime, Utc};
use rand::rngs::OsRng;
use rand::RngCore;
use regex::Regex;

use crate::crypto::{decrypt_state, encrypt_state};
use crate::models::{
    AuditItem, AuditSeverity, BlockDef, ColDef, CustomTab, EncryptedBackupPackage, ExtraItem,
    FieldDef, GuideData, GuideState, MergeConflict, MergePlan, PlaybookStep, RegionPreset,
    SearchHit, SectionTemplate,
};

const EMBEDDED_GUIDE_DATA: &str = include_str!("../assets/guide-data.json");

pub struct GuideStore {
    pub data: GuideData,
    pub state: GuideState,
    state_path: Option<PathBuf>,
    pub active_lock_pass: Option<String>,
}

fn short_id(prefix: &str) -> String {
    let n = OsRng.next_u32();
    format!("{prefix}_{n:08x}")
}

fn write_atomic_0600(tmp_path: &Path, final_path: &Path, bytes: &[u8]) -> Result<(), String> {
    if let Some(parent) = final_path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Failed to create directory: {e}"))?;
    }
    #[cfg(unix)]
    {
        use std::os::unix::fs::{OpenOptionsExt, PermissionsExt};
        let mut f = OpenOptions::new()
            .write(true)
            .create(true)
            .truncate(true)
            .mode(0o600)
            .open(tmp_path)
            .map_err(|e| format!("Failed to open temp file: {e}"))?;
        f.write_all(bytes)
            .map_err(|e| format!("Failed to write temp file: {e}"))?;
        f.sync_all()
            .map_err(|e| format!("Failed to flush temp file: {e}"))?;
        fs::set_permissions(tmp_path, fs::Permissions::from_mode(0o600))
            .map_err(|e| format!("Failed to set permissions: {e}"))?;
    }
    #[cfg(not(unix))]
    {
        fs::write(tmp_path, bytes).map_err(|e| format!("Failed to write temp file: {e}"))?;
    }
    fs::rename(tmp_path, final_path).map_err(|e| format!("Failed to rename temp file: {e}"))?;
    Ok(())
}

fn default_xdg_state_path() -> PathBuf {
    let base = env::var_os("XDG_DATA_HOME")
        .filter(|s| !s.is_empty())
        .map(PathBuf::from)
        .unwrap_or_else(|| {
            let home = env::var_os("HOME").map(PathBuf::from).unwrap_or_else(|| PathBuf::from("."));
            home.join(".local").join("share")
        });
    base.join("family-field-guide").join("state.json")
}

impl GuideStore {
    pub fn load_embedded_data() -> Result<GuideData, String> {
        serde_json::from_str::<GuideData>(EMBEDDED_GUIDE_DATA)
            .map_err(|e| format!("Failed to parse bundled guide-data.json: {e}"))
    }

    pub fn new_default() -> Result<Self, String> {
        Self::with_state_path(Some(default_xdg_state_path()))
    }

    pub fn new_in_memory() -> Result<Self, String> {
        Self::with_state_path(None)
    }

    pub fn with_state_path(state_path: Option<PathBuf>) -> Result<Self, String> {
        let data = Self::load_embedded_data()?;
        let state = if let Some(ref path) = state_path {
            if let Ok(raw) = fs::read(path) {
                match serde_json::from_slice::<GuideState>(&raw) {
                    Ok(parsed) => parsed,
                    Err(_) => {
                        let mut corrupt_os = path.as_os_str().to_os_string();
                        corrupt_os.push(".corrupt");
                        let corrupt_path = PathBuf::from(corrupt_os);
                        if fs::rename(path, &corrupt_path).is_err() {
                            let _ = fs::copy(path, &corrupt_path);
                        }
                        #[cfg(unix)]
                        {
                            use std::os::unix::fs::PermissionsExt;
                            let _ = fs::set_permissions(
                                &corrupt_path,
                                fs::Permissions::from_mode(0o600),
                            );
                        }
                        GuideState::default()
                    }
                }
            } else {
                GuideState::default()
            }
        } else {
            GuideState::default()
        };

        let mut store = Self {
            data,
            state,
            state_path,
            active_lock_pass: None,
        };
        store.normalize();
        Ok(store)
    }

    fn locked_path(&self) -> Option<PathBuf> {
        self.state_path.as_ref().map(|p| {
            p.parent()
                .map(|dir| dir.join("state.locked.json"))
                .unwrap_or_else(|| PathBuf::from("state.locked.json"))
        })
    }

    pub fn is_locked_on_disk(&self) -> bool {
        match (&self.state_path, self.locked_path()) {
            (Some(state_p), Some(locked_p)) => locked_p.exists() && !state_p.exists(),
            _ => false,
        }
    }

    fn write_locked_file(&self, pass: &str) -> Result<(), String> {
        let (Some(ref state_p), Some(locked_p)) = (&self.state_path, self.locked_path()) else {
            return Ok(());
        };
        let pkg = encrypt_state(&self.state, pass)?;
        let encoded =
            serde_json::to_vec_pretty(&pkg).map_err(|e| format!("JSON encode error: {e}"))?;
        let locked_tmp = locked_p.with_extension("json.tmp");
        write_atomic_0600(&locked_tmp, &locked_p, &encoded)?;
        if state_p.exists() {
            let _ = fs::remove_file(state_p);
        }
        Ok(())
    }

    fn write_plaintext_file(&self) -> Result<(), String> {
        let Some(ref path) = self.state_path else {
            return Ok(());
        };
        let encoded =
            serde_json::to_vec_pretty(&self.state).map_err(|e| format!("JSON encode error: {e}"))?;
        let tmp = path.with_extension("json.tmp");
        write_atomic_0600(&tmp, path, &encoded)
    }

    pub fn save(&mut self, touch: bool) {
        if self.active_lock_pass.is_none() && self.is_locked_on_disk() {
            return;
        }
        if touch {
            self.state.updated = Some(Utc::now().to_rfc3339());
        }
        if let Some(ref pass) = self.active_lock_pass {
            let _ = self.write_locked_file(pass);
            return;
        }
        let _ = self.write_plaintext_file();
    }

    pub fn enable_local_lock(&mut self, pass: &str) -> Result<(), String> {
        if pass.trim().len() < 8 {
            return Err("Use at least 8 characters for the local lock passphrase.".to_string());
        }
        self.write_locked_file(pass)?;
        self.active_lock_pass = Some(pass.to_string());
        Ok(())
    }

    pub fn unlock_local_lock(&mut self, pass: &str) -> Result<(), String> {
        let Some(locked_p) = self.locked_path() else {
            return Err("No local lock file path configured.".to_string());
        };
        let raw = fs::read(&locked_p)
            .map_err(|_| "Could not read encrypted local guide file.".to_string())?;
        let pkg: EncryptedBackupPackage = serde_json::from_slice(&raw)
            .map_err(|_| "Encrypted local guide file is corrupted.".to_string())?;
        let decrypted = decrypt_state(&pkg, pass)?;
        self.state = decrypted;
        self.normalize();
        self.active_lock_pass = Some(pass.to_string());
        Ok(())
    }

    pub fn disable_local_lock(&mut self) -> Result<(), String> {
        if self.active_lock_pass.is_none() && self.is_locked_on_disk() {
            return Err("Unlock the guide before disabling local lock.".to_string());
        }
        self.write_plaintext_file()?;
        if let Some(locked_p) = self.locked_path() {
            if locked_p.exists() {
                fs::remove_file(&locked_p)
                    .map_err(|e| format!("Could not remove state.locked.json: {e}"))?;
            }
        }
        self.active_lock_pass = None;
        Ok(())
    }

    pub fn lock_now(&mut self) {
        if let Some(ref pass) = self.active_lock_pass {
            let _ = self.write_locked_file(pass);
        }
        self.state = GuideState::default();
        self.active_lock_pass = None;
    }

    pub fn normalize(&mut self) {
        if !self.data.REGIONS.contains_key(&self.state.region) {
            self.state.region = "us".to_string();
        }
        if !self.data.PLAYBOOK.contains_key(&self.state.track) {
            self.state.track = "hurt".to_string();
        }
        for tab in &self.data.TABS {
            for block in &tab.blocks {
                if block.block_type == "list" {
                    if let Some(ref bid) = block.id {
                        if !self.state.lists.contains_key(bid) {
                            let seed = block.seed.clone().unwrap_or_else(|| vec![HashMap::new()]);
                            self.state.lists.insert(bid.clone(), seed);
                        }
                    }
                }
            }
        }
        for items in self.state.extra.values() {
            for item in items {
                if item.item_type == "list" && !self.state.lists.contains_key(&item.id) {
                    self.state.lists.insert(item.id.clone(), vec![HashMap::new()]);
                }
            }
        }
        let valid_tabs: HashSet<String> = self.all_tab_ids().into_iter().collect();
        if !valid_tabs.contains(&self.state.tab) {
            self.state.tab = "start".to_string();
        }
    }

    pub fn all_tab_ids(&self) -> Vec<String> {
        let mut ids: Vec<String> = self.data.TABS.iter().map(|t| t.id.clone()).collect();
        for ct in &self.state.custom_tabs {
            ids.push(ct.id.clone());
        }
        ids
    }

    pub fn current_region(&self) -> &RegionPreset {
        self.data
            .REGIONS
            .get(&self.state.region)
            .or_else(|| self.data.REGIONS.get("us"))
            .expect("us region exists in guide-data.json")
    }

    pub fn localized_field(&self, f: &FieldDef) -> FieldDef {
        if let Some(ov) = self
            .current_region()
            .field_overrides
            .as_ref()
            .and_then(|m| m.get(&f.id))
        {
            FieldDef {
                id: f.id.clone(),
                label: ov.label.clone().unwrap_or_else(|| f.label.clone()),
                placeholder: ov.ph.clone().unwrap_or_else(|| f.placeholder.clone()),
                wide: f.wide,
            }
        } else {
            f.clone()
        }
    }

    pub fn localized_list(&self, b: &BlockDef) -> (Option<String>, Vec<String>, Vec<ColDef>) {
        let ov = b
            .id
            .as_ref()
            .and_then(|id| self.current_region().list_overrides.as_ref().and_then(|m| m.get(id)));
        let mut sugs = b.suggestions.clone().unwrap_or_default();
        if let Some(extra) = ov.and_then(|o| o.extra_suggestions.as_ref()) {
            for s in extra {
                if !sugs.contains(s) {
                    sugs.push(s.clone());
                }
            }
        }
        let cols = b
            .cols
            .as_ref()
            .map(|cs| {
                cs.iter()
                    .map(|col| ColDef {
                        key: col.key.clone(),
                        label: ov
                            .and_then(|o| o.col_labels.as_ref())
                            .and_then(|m| m.get(&col.key))
                            .cloned()
                            .unwrap_or_else(|| col.label.clone()),
                    })
                    .collect()
            })
            .unwrap_or_default();
        let hint = ov.and_then(|o| o.hint.clone()).or_else(|| b.hint.clone());
        (hint, sugs, cols)
    }

    pub fn localized_step(&self, s: &PlaybookStep) -> PlaybookStep {
        if let Some(ov) = self
            .current_region()
            .step_overrides
            .as_ref()
            .and_then(|m| m.get(&s.id))
        {
            PlaybookStep {
                id: s.id.clone(),
                t: ov.t.clone().unwrap_or_else(|| s.t.clone()),
                d: ov.d.clone().unwrap_or_else(|| s.d.clone()),
                ref_label: s.ref_label.clone(),
                ref_tab: s.ref_tab.clone(),
                ref_block: s.ref_block.clone(),
            }
        } else {
            s.clone()
        }
    }

    pub fn find_list_def(&self, id: &str) -> Option<&BlockDef> {
        for tab in &self.data.TABS {
            if let Some(b) = tab.blocks.iter().find(|b| b.id.as_deref() == Some(id)) {
                return Some(b);
            }
        }
        None
    }

    pub fn is_row_user_edited(&self, block_id: &str, row: &HashMap<String, String>) -> bool {
        let non_empty: Vec<(&String, &String)> =
            row.iter().filter(|(_, v)| !v.trim().is_empty()).collect();
        if non_empty.is_empty() {
            return false;
        }
        if let Some(def) = self.find_list_def(block_id) {
            let (_, sugs, _) = self.localized_list(def);
            if let Some(seeds) = &def.seed {
                let matches_seed = seeds.iter().any(|seed_row| {
                    let seed_entries: Vec<(&String, &String)> = seed_row
                        .iter()
                        .filter(|(_, v)| !v.trim().is_empty())
                        .collect();
                    if seed_entries.len() != non_empty.len() {
                        return false;
                    }
                    seed_entries.iter().all(|(k, v)| {
                        row.get(*k).map(|rv| rv.trim()).unwrap_or("") == v.trim()
                    })
                });
                if matches_seed {
                    return false;
                }
            }
            if !sugs.is_empty() && non_empty.len() == 1 {
                let (fk, fv) = non_empty[0];
                let scol = def
                    .suggest_col
                    .as_deref()
                    .or_else(|| def.cols.as_ref().and_then(|c| c.first()).map(|c| c.key.as_str()))
                    .unwrap_or("");
                if fk == scol && sugs.iter().any(|s| s.eq_ignore_ascii_case(fv.trim())) {
                    return false;
                }
            }
        }
        true
    }

    pub fn has_any_content(&self) -> bool {
        if self.state.f.values().any(|v| !v.trim().is_empty()) {
            return true;
        }
        for (id, rows) in &self.state.lists {
            if rows.iter().any(|r| self.is_row_user_edited(id, r)) {
                return true;
            }
        }
        !self.state.custom_tabs.is_empty() || !self.state.extra.is_empty() || !self.state.photos.is_empty()
    }

    pub fn completion_percent(&self) -> i32 {
        let mut total = 0i32;
        let mut got = 0i32;
        let has = |id: &str| -> i32 {
            if self.state.f.get(id).map(|v| v.trim()).unwrap_or("").is_empty() {
                0
            } else {
                1
            }
        };
        let list_filled = |id: &str| -> i32 {
            let count = self
                .state
                .lists
                .get(id)
                .map(|rows| rows.iter().filter(|r| self.is_row_user_edited(id, r)).count())
                .unwrap_or(0);
            (count.min(2)) as i32
        };

        for tab in &self.data.TABS {
            for b in &tab.blocks {
                if b.block_type == "fields" {
                    if let Some(ref fields) = b.fields {
                        for f in fields {
                            total += 1;
                            got += has(&f.id);
                        }
                    }
                } else if b.block_type == "list" {
                    if let Some(ref lid) = b.id {
                        total += 2;
                        got += list_filled(lid);
                    }
                }
            }
        }
        for items in self.state.extra.values() {
            for x in items {
                if x.item_type == "field" {
                    total += 1;
                    got += has(&x.id);
                } else {
                    total += 2;
                    got += list_filled(&x.id);
                }
            }
        }
        for g in &self.data.GLANCE {
            total += 1;
            got += has(&g.id);
        }
        for k in &self.data.KIDS {
            total += 1;
            got += has(&k.id);
        }
        total += 1;
        got += has("letter");

        if total > 0 {
            ((got as f64 / total as f64) * 100.0).round() as i32
        } else {
            0
        }
    }

    // MARK: - Demo, Mutations & Custom Sections

    pub fn load_demo(&mut self, touch: bool) {
        let src = self
            .data
            .DEMO_FAMILIES
            .get(&self.state.region)
            .or_else(|| self.data.DEMO_FAMILIES.get("default"))
            .expect("default demo exists")
            .clone();

        let mut next = GuideState::default();
        next.region = self.state.region.clone();
        next.large_text = self.state.large_text;
        next.high_contrast = self.state.high_contrast;
        next.is_demo = true;
        next.track = src.track.unwrap_or_else(|| "hurt".to_string());
        next.tab = "start".to_string();
        next.f = src.f.unwrap_or_default();
        if let Some(patch) = src.f_extra_patch {
            for (k, v) in patch {
                next.f.insert(k, v);
            }
        }
        next.lists = src.lists.unwrap_or_default();
        next.custom_tabs = src.custom_tabs.unwrap_or_default();
        next.extra = src.extra.unwrap_or_default();

        self.state = next;
        self.normalize();
        self.save(touch);
    }

    pub fn clear_demo(&mut self) {
        let mut next = GuideState::default();
        next.region = self.state.region.clone();
        next.large_text = self.state.large_text;
        next.high_contrast = self.state.high_contrast;
        self.state = next;
        self.normalize();
        self.save(false);
    }

    pub fn add_custom_section(&mut self, name: &str) {
        let clean = name.trim();
        if clean.is_empty() {
            return;
        }
        let tid = short_id("tab");
        self.state.custom_tabs.push(CustomTab {
            id: tid.clone(),
            label: clean.to_string(),
            title: clean.to_string(),
        });
        self.state.tab = tid;
        self.save(true);
    }

    pub fn apply_section_template(&mut self, tpl: &SectionTemplate) {
        let tid = short_id("tab");
        self.state.custom_tabs.push(CustomTab {
            id: tid.clone(),
            label: tpl.name.clone(),
            title: tpl.name.clone(),
        });
        let mut items = Vec::new();
        for f in &tpl.fields {
            items.push(ExtraItem {
                item_type: "field".to_string(),
                id: short_id("x"),
                label: Some(f.label.clone()),
                title: None,
                wide: Some(f.wide),
                cols: None,
            });
        }
        for l in &tpl.lists {
            let lid = short_id("l");
            let cols = l
                .cols
                .iter()
                .enumerate()
                .map(|(i, lbl)| ColDef {
                    key: format!("c{i}"),
                    label: lbl.clone(),
                })
                .collect();
            items.push(ExtraItem {
                item_type: "list".to_string(),
                id: lid.clone(),
                label: None,
                title: Some(l.title.clone()),
                wide: None,
                cols: Some(cols),
            });
            self.state.lists.insert(lid, vec![HashMap::new()]);
        }
        self.state.extra.insert(tid.clone(), items);
        self.state.tab = tid;
        self.save(true);
    }

    pub fn delete_custom_section(&mut self, tab_id: &str) {
        if let Some(items) = self.state.extra.remove(tab_id) {
            for x in items {
                self.state.f.remove(&x.id);
                self.state.lists.remove(&x.id);
            }
        }
        self.state.custom_tabs.retain(|t| t.id != tab_id);
        if self.state.tab == tab_id {
            self.state.tab = "start".to_string();
        }
        self.save(true);
    }

    // MARK: - Readiness & Privacy Audit

    pub fn compute_audit(&self) -> Vec<AuditItem> {
        let f = |id: &str| -> &str { self.state.f.get(id).map(|s| s.trim()).unwrap_or("") };
        let rows_of = |id: &str| -> Vec<&HashMap<String, String>> {
            self.state
                .lists
                .get(id)
                .map(|rows| {
                    rows.iter()
                        .filter(|r| self.is_row_user_edited(id, r))
                        .collect()
                })
                .unwrap_or_default()
        };

        let mut items: Vec<AuditItem> = Vec::new();
        let reg = self.current_region();

        let mut miss_core = Vec::new();
        if f("q_first").is_empty() {
            miss_core.push("First person to call");
        }
        if f("q_binder").is_empty() {
            miss_core.push("Where papers live");
        }
        if !miss_core.is_empty() {
            items.push(AuditItem {
                id: "start_core".to_string(),
                sev: AuditSeverity::High,
                title: "Start-here essentials incomplete".to_string(),
                detail: format!("Missing: {}.", miss_core.join(", ")),
                tab: Some("start".to_string()),
                block: Some("If you read nothing else".to_string()),
                field: Some(if f("q_first").is_empty() { "q_first" } else { "q_binder" }.to_string()),
                act: None,
            });
        } else {
            items.push(AuditItem {
                id: "start_core".to_string(),
                sev: AuditSeverity::Ok,
                title: "First-call & paper locations set".to_string(),
                detail: "Your spouse knows who to call and where originals live.".to_string(),
                tab: None,
                block: None,
                field: None,
                act: None,
            });
        }

        if f("d_phone").is_empty() {
            items.push(AuditItem {
                id: "phone_2fa".to_string(),
                sev: AuditSeverity::High,
                title: "No phone unlock instructions".to_string(),
                detail: "Banks and email send 2FA codes to your phone—without unlock notes, your spouse can get locked out.".to_string(),
                tab: Some("docs".to_string()),
                block: Some("Getting into things".to_string()),
                field: Some("d_phone".to_string()),
                act: None,
            });
        } else if f("d_2fa").is_empty() && f("d_sim").is_empty() {
            items.push(AuditItem {
                id: "phone_2fa".to_string(),
                sev: AuditSeverity::Med,
                title: "Add 2FA recovery or carrier SIM PIN".to_string(),
                detail: "Phone unlock is noted, but 2FA recovery codes or SIM PIN instructions will prevent lockouts.".to_string(),
                tab: Some("docs".to_string()),
                block: Some("Getting into things".to_string()),
                field: Some("d_2fa".to_string()),
                act: None,
            });
        } else {
            items.push(AuditItem {
                id: "phone_2fa".to_string(),
                sev: AuditSeverity::Ok,
                title: "Phone & 2FA access documented".to_string(),
                detail: "Unlock and 2FA/SIM instructions are covered.".to_string(),
                tab: None,
                block: None,
                field: None,
                act: None,
            });
        }

        let accts = rows_of("accounts");
        let joint_re = Regex::new(r"(?i)joint|both|shared|either|survivor|&|\band\b").unwrap();
        let has_joint = accts
            .iter()
            .any(|r| joint_re.is_match(r.get("own").map(|s| s.as_str()).unwrap_or("")));
        if accts.is_empty() {
            items.push(AuditItem {
                id: "joint_bank".to_string(),
                sev: AuditSeverity::Med,
                title: "No bank accounts listed yet".to_string(),
                detail: "List checking/savings (last 4 digits) and mark which ones are Joint.".to_string(),
                tab: Some("money".to_string()),
                block: Some("accounts".to_string()),
                field: None,
                act: None,
            });
        } else if !has_joint {
            items.push(AuditItem {
                id: "joint_bank".to_string(),
                sev: AuditSeverity::High,
                title: "No bank account marked Joint".to_string(),
                detail: "Solo accounts often freeze upon death, stranding household bills until probate.".to_string(),
                tab: Some("money".to_string()),
                block: Some("accounts".to_string()),
                field: None,
                act: None,
            });
        } else {
            items.push(AuditItem {
                id: "joint_bank".to_string(),
                sev: AuditSeverity::Ok,
                title: "Joint bank access listed".to_string(),
                detail: "At least one account is marked joint/shared.".to_string(),
                tab: None,
                block: None,
                field: None,
                act: None,
            });
        }

        let inv_rows = rows_of("invest");
        let life_re = Regex::new(r"(?i)life|term").unwrap();
        let life_rows: Vec<&HashMap<String, String>> = rows_of("insurance")
            .into_iter()
            .filter(|r| life_re.is_match(r.get("type").map(|s| s.as_str()).unwrap_or("")))
            .collect();
        let total_benef_miss = inv_rows
            .iter()
            .filter(|r| r.get("benef").map(|s| s.trim()).unwrap_or("").is_empty())
            .count()
            + life_rows
                .iter()
                .filter(|r| r.get("benef").map(|s| s.trim()).unwrap_or("").is_empty())
                .count();
        let india_note = if reg.india_notes {
            " In India, bank/demat nominees are custodians—ensure your will/legal heirs match."
        } else {
            ""
        };
        if total_benef_miss > 0 {
            items.push(AuditItem {
                id: "beneficiaries".to_string(),
                sev: AuditSeverity::High,
                title: format!("{total_benef_miss} retirement/life-insurance entry missing a Beneficiary"),
                detail: format!("Named beneficiaries override your will—record who is named on each.{india_note}"),
                tab: Some("money".to_string()),
                block: Some("insurance".to_string()),
                field: None,
                act: None,
            });
        } else if inv_rows.is_empty() && life_rows.is_empty() {
            items.push(AuditItem {
                id: "beneficiaries".to_string(),
                sev: AuditSeverity::Med,
                title: "No life insurance or retirement accounts listed".to_string(),
                detail: format!("Record policies and retirement accounts along with named beneficiaries.{india_note}"),
                tab: Some("money".to_string()),
                block: Some("insurance".to_string()),
                field: None,
                act: None,
            });
        } else {
            items.push(AuditItem {
                id: "beneficiaries".to_string(),
                sev: AuditSeverity::Ok,
                title: "Beneficiaries recorded".to_string(),
                detail: format!("Listed life insurance & retirement entries name a beneficiary.{india_note}"),
                tab: None,
                block: None,
                field: None,
                act: None,
            });
        }

        let mut miss_legal = Vec::new();
        if f("d_will").is_empty() {
            miss_legal.push("Will / trust");
        }
        if f("d_hcd").is_empty() {
            miss_legal.push("Healthcare directive");
        }
        if f("d_fpoa").is_empty() {
            miss_legal.push("Financial POA");
        }
        if !miss_legal.is_empty() {
            let only_med = miss_legal.len() == 1 && f("d_hcd").is_empty();
            items.push(AuditItem {
                id: "legal_med".to_string(),
                sev: AuditSeverity::High,
                title: format!("Missing legal/medical papers ({})", miss_legal.len()),
                detail: format!("Not recorded: {}.", miss_legal.join(", ")),
                tab: Some(if only_med { "health" } else { "docs" }.to_string()),
                block: None,
                field: None,
                act: None,
            });
        } else {
            items.push(AuditItem {
                id: "legal_med".to_string(),
                sev: AuditSeverity::Ok,
                title: "Core legal & medical directives mapped".to_string(),
                detail: "Will/trust, healthcare directive, and financial POA locations are recorded.".to_string(),
                tab: None,
                block: None,
                field: None,
                act: None,
            });
        }

        if f("d_pm").is_empty() && f("d_legacy").is_empty() {
            items.push(AuditItem {
                id: "digital_legacy".to_string(),
                sev: AuditSeverity::Med,
                title: "No password manager or legacy contact noted".to_string(),
                detail: "Set up Password Manager emergency access or Apple/Google Legacy Contacts.".to_string(),
                tab: Some("docs".to_string()),
                block: None,
                field: Some("d_pm".to_string()),
                act: None,
            });
        } else {
            items.push(AuditItem {
                id: "digital_legacy".to_string(),
                sev: AuditSeverity::Ok,
                title: "Digital legacy / password access set".to_string(),
                detail: "Password manager or platform legacy contacts are documented.".to_string(),
                tab: None,
                block: None,
                field: None,
                act: None,
            });
        }

        let seed_re = Regex::new(r"(?i)\b([a-z]{3,}\s+){11,}[a-z]{3,}\b").unwrap();
        let crypto_name_re =
            Regex::new(r"(?i)crypto|seed|wallet|ledger|trezor|bitcoin|eth|mnemonic").unwrap();

        let crypto_rows = rows_of("crypto");
        let mut seed_hit: Option<(String, Option<String>, Option<String>)> = None;

        if crypto_rows
            .iter()
            .any(|row| row.values().any(|v| seed_re.is_match(v)))
        {
            seed_hit = Some(("money".to_string(), Some("crypto".to_string()), None));
        }

        if seed_hit.is_none() {
            for fid in ["d_pm", "d_2fa", "d_phone", "d_keys", "d_safe", "d_sim", "d_email"] {
                if seed_re.is_match(f(fid)) {
                    seed_hit = Some(("docs".to_string(), None, Some(fid.to_string())));
                    break;
                }
            }
        }

        if seed_hit.is_none() {
            for (tid, extras) in &self.state.extra {
                let tab_is_crypto = self
                    .state
                    .custom_tabs
                    .iter()
                    .find(|t| &t.id == tid)
                    .is_some_and(|t| {
                        crypto_name_re.is_match(&t.title) || crypto_name_re.is_match(&t.label)
                    });
                for item in extras {
                    let item_name = item
                        .label
                        .as_deref()
                        .or(item.title.as_deref())
                        .unwrap_or("");
                    if !(tab_is_crypto
                        || crypto_name_re.is_match(item_name)
                        || crypto_name_re.is_match(&item.id))
                    {
                        continue;
                    }
                    if item.item_type == "field" {
                        if seed_re.is_match(f(&item.id)) {
                            seed_hit = Some((tid.clone(), None, Some(item.id.clone())));
                            break;
                        }
                    } else if rows_of(&item.id)
                        .iter()
                        .any(|row| row.values().any(|v| seed_re.is_match(v)))
                    {
                        seed_hit = Some((tid.clone(), Some(item.id.clone()), None));
                        break;
                    }
                }
                if seed_hit.is_some() {
                    break;
                }
            }
        }

        if let Some((tab, block, field)) = seed_hit {
            items.push(AuditItem {
                id: "crypto_safety".to_string(),
                sev: AuditSeverity::High,
                title: "Possible crypto seed phrase detected!".to_string(),
                detail: "Never store 12/24-word recovery seeds in this guide—write ONLY where the physical backup lives.".to_string(),
                tab: Some(tab),
                block,
                field,
                act: None,
            });
        } else if !crypto_rows.is_empty() {
            let miss_crypto = crypto_rows.iter().any(|r| {
                r.get("access").map(|s| s.trim()).unwrap_or("").is_empty()
                    || r.get("helper").map(|s| s.trim()).unwrap_or("").is_empty()
            });
            if miss_crypto {
                items.push(AuditItem {
                    id: "crypto_safety".to_string(),
                    sev: AuditSeverity::Med,
                    title: "Crypto entry missing recovery location or helper".to_string(),
                    detail: "Record where the seed/hardware wallet is stored and a trusted helper.".to_string(),
                    tab: Some("money".to_string()),
                    block: Some("crypto".to_string()),
                    field: None,
                    act: None,
                });
            } else {
                items.push(AuditItem {
                    id: "crypto_safety".to_string(),
                    sev: AuditSeverity::Ok,
                    title: "Crypto recovery map documented (no raw seeds)".to_string(),
                    detail: "Holdings, storage locations, and trusted helper instructions are recorded.".to_string(),
                    tab: None,
                    block: None,
                    field: None,
                    act: None,
                });
            }
        }

        let gov_rows = rows_of("gov_ids");
        let formatted_id_re =
            Regex::new(r"\b\d{3}-\d{2}-\d{4}\b|\b\d{4}[\s-]\d{4}[\s-]\d{4}\b").unwrap();
        let long_digits_re = Regex::new(r"\b\d{9,}\b").unwrap();

        let mut id_hit: Option<(String, Option<String>, Option<String>)> = None;
        if gov_rows.iter().any(|row| {
            row.values().any(|v| formatted_id_re.is_match(v))
                || row
                    .get("last4")
                    .is_some_and(|v| long_digits_re.is_match(v))
        }) {
            id_hit = Some(("docs".to_string(), Some("gov_ids".to_string()), None));
        }
        if id_hit.is_none() {
            for (fid, val) in &self.state.f {
                if formatted_id_re.is_match(val) {
                    id_hit = Some(("docs".to_string(), None, Some(fid.clone())));
                    break;
                }
            }
        }
        if id_hit.is_none() {
            for lid in self.state.lists.keys() {
                if rows_of(lid)
                    .iter()
                    .any(|row| row.values().any(|v| formatted_id_re.is_match(v)))
                {
                    id_hit = Some(("docs".to_string(), Some(lid.clone()), None));
                    break;
                }
            }
        }

        if let Some((tab, block, field)) = id_hit {
            items.push(AuditItem {
                id: "gov_id_privacy".to_string(),
                sev: AuditSeverity::High,
                title: "Possible full SSN / National ID detected!".to_string(),
                detail: "Safety rule: enter ONLY the last 4 digits and where the original card lives.".to_string(),
                tab: Some(tab),
                block,
                field,
                act: None,
            });
        } else if !gov_rows.is_empty() {
            items.push(AuditItem {
                id: "gov_id_privacy".to_string(),
                sev: AuditSeverity::Ok,
                title: "Key IDs mapped safely (last 4 only)".to_string(),
                detail: "Government IDs record only last 4 digits and physical locations.".to_string(),
                tab: None,
                block: None,
                field: None,
                act: None,
            });
        }

        if !f("q_life").is_empty() || !life_rows.is_empty() {
            let has_payout = ![
                f("m_payout_first"),
                f("m_payout_payoff"),
                f("m_payout_advisor"),
                f("m_payout_monthly"),
            ]
            .iter()
            .all(|s| s.is_empty());
            if has_payout {
                items.push(AuditItem {
                    id: "payout_plan".to_string(),
                    sev: AuditSeverity::Ok,
                    title: "Survivor big-money instructions documented".to_string(),
                    detail: "Plain-English instructions for handling insurance payouts are filled in.".to_string(),
                    tab: None,
                    block: None,
                    field: None,
                    act: None,
                });
            } else {
                items.push(AuditItem {
                    id: "payout_plan".to_string(),
                    sev: AuditSeverity::Med,
                    title: "Add personal instructions for life insurance / big money".to_string(),
                    detail: "Tell your spouse what to do first with payouts, which debts to leave alone, and who to trust.".to_string(),
                    tab: Some("money".to_string()),
                    block: None,
                    field: Some("m_payout_first".to_string()),
                    act: None,
                });
            }
        }

        if reg.cross_border {
            let visa_re = Regex::new(r"(?i)i-797|i-140|h-1b|h-4|oci|visa|immig").unwrap();
            let immig_re = Regex::new(r"(?i)immig|visa|cross").unwrap();
            let blob = format!(
                "{} {} {}",
                serde_json::to_string(&self.state.f).unwrap_or_default(),
                serde_json::to_string(self.state.lists.get("doclocs").unwrap_or(&Vec::new()))
                    .unwrap_or_default(),
                serde_json::to_string(&self.state.custom_tabs).unwrap_or_default(),
            );
            let has_visa_info = visa_re.is_match(&blob);
            let has_immig_pro = self
                .state
                .lists
                .get("pros")
                .map(|rows| {
                    rows.iter().any(|r| {
                        let joined = r.values().cloned().collect::<Vec<_>>().join(" ");
                        immig_re.is_match(&joined)
                    })
                })
                .unwrap_or(false);
            if has_visa_info && has_immig_pro {
                items.push(AuditItem {
                    id: "cross_border".to_string(),
                    sev: AuditSeverity::Ok,
                    title: "Cross-border & visa readiness covered".to_string(),
                    detail: "Visa papers, separate country planning, and immigration counsel are noted.".to_string(),
                    tab: None,
                    block: None,
                    field: None,
                    act: None,
                });
            } else {
                items.push(AuditItem {
                    id: "cross_border".to_string(),
                    sev: AuditSeverity::High,
                    title: "Cross-border / Visa readiness incomplete".to_string(),
                    detail: "Record visa filings, immigration attorney, local temporary guardian, and separate wills.".to_string(),
                    tab: Some("docs".to_string()),
                    block: None,
                    field: None,
                    act: None,
                });
            }
        }

        let has_content = self.has_any_content();
        if has_content && self.state.last_backup.is_none() {
            items.push(AuditItem {
                id: "backup_fresh".to_string(),
                sev: AuditSeverity::High,
                title: "No locked backup saved yet".to_string(),
                detail: "Export an AES-256-GCM locked backup file now.".to_string(),
                tab: None,
                block: None,
                field: None,
                act: Some("backup".to_string()),
            });
        } else if has_content
            && self.state.updated.as_ref().zip(self.state.last_backup.as_ref()).is_some_and(|(u, lb)| u > lb)
        {
            items.push(AuditItem {
                id: "backup_fresh".to_string(),
                sev: AuditSeverity::Med,
                title: "Recent changes aren't in your latest backup".to_string(),
                detail: "Save a fresh locked backup so your spouse's copy matches.".to_string(),
                tab: None,
                block: None,
                field: None,
                act: Some("backup".to_string()),
            });
        } else {
            items.push(AuditItem {
                id: "backup_fresh".to_string(),
                sev: AuditSeverity::Ok,
                title: "Locked backup status".to_string(),
                detail: self
                    .state
                    .last_backup
                    .as_deref()
                    .map(|d| format!("Saved ({}).", &d.chars().take(10).collect::<String>()))
                    .unwrap_or_else(|| "Ready.".to_string()),
                tab: None,
                block: None,
                field: None,
                act: None,
            });
        }

        if self.state.last_dry_run.is_none() {
            items.push(AuditItem {
                id: "fire_drill".to_string(),
                sev: AuditSeverity::Med,
                title: "Run a 10-minute Family Fire Drill".to_string(),
                detail: "Verify your spouse can unlock the guide and locate papers and phone access.".to_string(),
                tab: None,
                block: None,
                field: None,
                act: Some("drill".to_string()),
            });
        } else {
            items.push(AuditItem {
                id: "fire_drill".to_string(),
                sev: AuditSeverity::Ok,
                title: "Family Fire Drill completed".to_string(),
                detail: "Completed.".to_string(),
                tab: None,
                block: None,
                field: None,
                act: None,
            });
        }

        items.sort_by_key(|item| item.sev);
        items
    }

    // MARK: - Search

    pub fn search(&self, query: &str) -> Vec<SearchHit> {
        let term = query.trim().to_lowercase();
        if term.is_empty() {
            return Vec::new();
        }
        let mut hits: Vec<SearchHit> = Vec::new();
        let mut push = |tab_id: &str, tab_label: &str, title: &str, sub: &str, bk: &str, fid: &str, tk: &str| {
            if hits.len() < 20 {
                hits.push(SearchHit {
                    tab_id: tab_id.to_string(),
                    tab_label: tab_label.to_string(),
                    title: title.to_string(),
                    sub: sub.to_string(),
                    block_key: bk.to_string(),
                    field_id: fid.to_string(),
                    track_key: tk.to_string(),
                });
            }
        };

        for raw_g in &self.data.GLANCE {
            let rf = self.localized_field(&FieldDef {
                id: raw_g.id.clone(),
                label: raw_g.label.clone(),
                placeholder: raw_g.placeholder.clone(),
                wide: false,
            });
            let val = self.state.f.get(&rf.id).map(|s| s.as_str()).unwrap_or("");
            if rf.label.to_lowercase().contains(&term) || val.to_lowercase().contains(&term) {
                push(
                    "start",
                    "Start here",
                    &rf.label,
                    if val.is_empty() { "Quick glance" } else { val },
                    "glance",
                    &rf.id,
                    "",
                );
            }
        }

        for tab in &self.data.TABS {
            for b in &tab.blocks {
                if b.block_type == "fields" {
                    if let Some(ref fields) = b.fields {
                        for raw_f in fields {
                            let rf = self.localized_field(raw_f);
                            let val = self.state.f.get(&rf.id).map(|s| s.as_str()).unwrap_or("");
                            let bt = b.title.as_deref().unwrap_or("");
                            if rf.label.to_lowercase().contains(&term)
                                || val.to_lowercase().contains(&term)
                                || bt.to_lowercase().contains(&term)
                            {
                                push(
                                    &tab.id,
                                    &tab.label,
                                    &rf.label,
                                    if val.is_empty() { bt } else { val },
                                    bt,
                                    &rf.id,
                                    "",
                                );
                            }
                        }
                    }
                } else if b.block_type == "list" {
                    if let Some(ref bid) = b.id {
                        let (hint, sugs, _) = self.localized_list(b);
                        let matched_row = self.state.lists.get(bid).and_then(|rows| {
                            rows.iter().find(|r| {
                                r.values().any(|v| v.to_lowercase().contains(&term))
                            })
                        });
                        let matched_sug = sugs.iter().find(|s| s.to_lowercase().contains(&term));
                        let bt = b.title.as_deref().unwrap_or("Table");
                        if bt.to_lowercase().contains(&term)
                            || matched_row.is_some()
                            || matched_sug.is_some()
                            || hint.as_deref().unwrap_or("").to_lowercase().contains(&term)
                        {
                            let preview = matched_row
                                .map(|r| {
                                    r.values()
                                        .filter(|v| !v.is_empty())
                                        .cloned()
                                        .collect::<Vec<_>>()
                                        .join(" · ")
                                })
                                .or_else(|| matched_sug.map(|s| format!("Quick-add: {s}")))
                                .or(hint)
                                .unwrap_or_else(|| "Table".to_string());
                            push(&tab.id, &tab.label, bt, &preview, bid, "", "");
                        }
                    }
                }
            }
        }

        for g in &self.data.MONEY_GUIDE {
            let txt = format!(
                "{} {} {} {}",
                g.title,
                g.summary,
                g.bullets.join(" "),
                g.note.as_deref().unwrap_or("")
            )
            .to_lowercase();
            if txt.contains(&term) {
                push("money", "Money Guide", &g.title, &g.summary, "money_guide", "", "");
            }
        }

        if let Some(pf) = self.current_region().pro_finder.as_ref() {
            let dirs = [
                pf.legal.as_deref(),
                pf.visa.as_deref(),
                pf.money.as_deref(),
                pf.tax.as_deref(),
            ];
            if let Some(Some(hit)) = dirs.into_iter().find(|d| {
                d.unwrap_or("").to_lowercase().contains(&term)
            }) {
                push(
                    "contacts",
                    "Finding Help",
                    &format!("Local directories ({})", self.current_region().label),
                    hit,
                    "pro_finder",
                    "",
                    "",
                );
            }
        }

        for c in &self.data.PRO_FINDER {
            let txt = format!(
                "{} {} {} {}",
                c.title,
                c.summary,
                c.bullets.join(" "),
                c.note.as_deref().unwrap_or("")
            )
            .to_lowercase();
            if txt.contains(&term) {
                push("contacts", "Finding Help", &c.title, &c.summary, "pro_finder", "", "");
            }
        }

        for (tk, pb) in &self.data.PLAYBOOK {
            for ph in &pb.phases {
                for raw_s in &ph.steps {
                    let s = self.localized_step(raw_s);
                    if s.t.to_lowercase().contains(&term) || s.d.to_lowercase().contains(&term) {
                        push("start", "Playbook", &s.t, &s.d, &s.id, "", tk);
                    }
                }
            }
        }

        for sc in &self.data.SCRIPTS {
            if sc.title.to_lowercase().contains(&term) || sc.body.to_lowercase().contains(&term) {
                push("start", "Scripts", &sc.title, &sc.body, "scripts", "", "");
            }
        }

        hits
    }

    // MARK: - Two-Spouse Smart Merge

    fn row_sig(row: &HashMap<String, String>) -> String {
        let mut pairs: Vec<(String, String)> = row
            .iter()
            .filter_map(|(k, v)| {
                let cv = v.trim().to_lowercase();
                if cv.is_empty() {
                    None
                } else {
                    Some((k.clone(), cv))
                }
            })
            .collect();
        pairs.sort_by(|a, b| a.0.cmp(&b.0));
        pairs
            .into_iter()
            .map(|(k, v)| format!("{k}={v}"))
            .collect::<Vec<_>>()
            .join("|")
    }

    pub fn field_label(&self, id: &str, extra_incoming: &HashMap<String, Vec<ExtraItem>>) -> String {
        if id == "letter" {
            return "A note to you".to_string();
        }
        if let Some(g) = self.data.GLANCE.iter().find(|g| g.id == id) {
            return g.label.clone();
        }
        if let Some(k) = self.data.KIDS.iter().find(|k| k.id == id) {
            return k.label.clone();
        }
        for t in &self.data.TABS {
            for b in &t.blocks {
                if b.block_type == "fields" {
                    if let Some(f) = b.fields.as_ref().and_then(|fs| fs.iter().find(|f| f.id == id)) {
                        return f.label.clone();
                    }
                }
            }
        }
        for items in self.state.extra.values().chain(extra_incoming.values()) {
            if let Some(lbl) = items.iter().find(|x| x.id == id).and_then(|x| x.label.as_ref()) {
                return lbl.clone();
            }
        }
        id.to_string()
    }

    pub fn compute_merge_plan(&self, incoming: &GuideState) -> MergePlan {
        let mut new_fields = 0usize;
        let mut conflict_fields = Vec::new();
        for (id, val) in &incoming.f {
            let iv = val.trim();
            if iv.is_empty() {
                continue;
            }
            let cv = self.state.f.get(id).map(|s| s.trim()).unwrap_or("");
            if cv.is_empty() {
                new_fields += 1;
            } else if cv != iv {
                conflict_fields.push(MergeConflict {
                    id: id.clone(),
                    label: self.field_label(id, &incoming.extra),
                });
            }
        }

        let cur_tab_ids: HashSet<&String> = self.state.custom_tabs.iter().map(|t| &t.id).collect();
        let new_tabs = incoming
            .custom_tabs
            .iter()
            .filter(|t| !cur_tab_ids.contains(&t.id))
            .count();

        let mut new_extras = 0usize;
        for (tid, arr) in &incoming.extra {
            let ex: HashSet<&String> = self
                .state
                .extra
                .get(tid)
                .map(|v| v.iter().map(|x| &x.id).collect())
                .unwrap_or_default();
            new_extras += arr.iter().filter(|x| !ex.contains(&x.id)).count();
        }

        let mut new_rows = 0usize;
        for (lid, rows) in &incoming.lists {
            let mut sigs: HashSet<String> = self
                .state
                .lists
                .get(lid)
                .map(|cur| {
                    cur.iter()
                        .map(Self::row_sig)
                        .filter(|s| !s.is_empty())
                        .collect()
                })
                .unwrap_or_default();
            for r in rows {
                if self.is_row_user_edited(lid, r) {
                    let sig = Self::row_sig(r);
                    if !sig.is_empty() && !sigs.contains(&sig) {
                        new_rows += 1;
                        sigs.insert(sig);
                    }
                }
            }
        }

        let new_checks = incoming
            .checks
            .iter()
            .filter(|(k, v)| **v && !*self.state.checks.get(*k).unwrap_or(&false))
            .count();

        MergePlan {
            new_fields,
            conflict_fields,
            new_tabs,
            new_extras,
            new_rows,
            new_checks,
        }
    }

    fn parse_iso_timestamp(s: &str) -> Option<DateTime<Utc>> {
        let trimmed = s.trim();
        if trimmed.is_empty() {
            return None;
        }
        if let Ok(dt) = DateTime::parse_from_rfc3339(trimmed) {
            return Some(dt.with_timezone(&Utc));
        }
        if let Ok(ndt) = NaiveDateTime::parse_from_str(trimmed, "%Y-%m-%dT%H:%M:%S") {
            return Some(ndt.and_utc());
        }
        if let Ok(nd) = NaiveDate::parse_from_str(trimmed, "%Y-%m-%d") {
            return nd.and_hms_opt(0, 0, 0).map(|ndt| ndt.and_utc());
        }
        None
    }

    fn merge_newer_iso(target: &mut Option<String>, incoming: &Option<String>) -> bool {
        let Some(ref inc_raw) = incoming else {
            return false;
        };
        let Some(inc_dt) = Self::parse_iso_timestamp(inc_raw) else {
            return false;
        };
        let should_replace = match target.as_deref().and_then(Self::parse_iso_timestamp) {
            Some(cur_dt) => inc_dt > cur_dt,
            None => true,
        };
        if should_replace {
            *target = Some(inc_raw.trim().to_string());
            true
        } else {
            false
        }
    }

    pub fn apply_merge(&mut self, incoming: &GuideState, overwrite_conflicts: bool) -> String {
        let mut added_f = 0usize;
        let mut updated_f = 0usize;
        let mut added_r = 0usize;
        let mut added_c = 0usize;
        let mut added_s = 0usize;
        let mut added_p = 0usize;

        let mut cur_tab_ids: HashSet<String> =
            self.state.custom_tabs.iter().map(|t| t.id.clone()).collect();
        for t in &incoming.custom_tabs {
            if !cur_tab_ids.contains(&t.id) {
                self.state.custom_tabs.push(t.clone());
                cur_tab_ids.insert(t.id.clone());
                added_s += 1;
            }
        }

        for (tid, arr) in &incoming.extra {
            let cur_arr = self.state.extra.entry(tid.clone()).or_default();
            let mut ex: HashSet<String> = cur_arr.iter().map(|x| x.id.clone()).collect();
            for x in arr {
                if !ex.contains(&x.id) {
                    cur_arr.push(x.clone());
                    ex.insert(x.id.clone());
                }
            }
        }

        for (id, val) in &incoming.f {
            let iv = val.trim();
            if iv.is_empty() {
                continue;
            }
            let cv = self.state.f.get(id).map(|s| s.trim()).unwrap_or("");
            if cv.is_empty() {
                self.state.f.insert(id.clone(), val.clone());
                added_f += 1;
            } else if cv != iv && overwrite_conflicts {
                self.state.f.insert(id.clone(), val.clone());
                updated_f += 1;
            }
        }

        let list_keys: Vec<String> = incoming.lists.keys().cloned().collect();
        for lid in list_keys {
            let rows = &incoming.lists[&lid];
            let mut cur_rows = self.state.lists.get(&lid).cloned().unwrap_or_default();
            let mut sigs: HashSet<String> = cur_rows
                .iter()
                .map(Self::row_sig)
                .filter(|s| !s.is_empty())
                .collect();
            let mut added_here = 0usize;
            for r in rows {
                if self.is_row_user_edited(&lid, r) {
                    let sig = Self::row_sig(r);
                    if !sig.is_empty() && !sigs.contains(&sig) {
                        cur_rows.push(r.clone());
                        sigs.insert(sig);
                        added_r += 1;
                        added_here += 1;
                    }
                }
            }
            if added_here > 0 {
                cur_rows.retain(|r| r.values().any(|v| !v.trim().is_empty()));
                if cur_rows.is_empty() {
                    cur_rows.push(HashMap::new());
                }
            }
            self.state.lists.insert(lid, cur_rows);
        }

        for (k, v) in &incoming.checks {
            if *v && !*self.state.checks.get(k).unwrap_or(&false) {
                self.state.checks.insert(k.clone(), true);
                added_c += 1;
            }
        }

        for (k, v) in &incoming.fire_drill {
            if *v && !*self.state.fire_drill.get(k).unwrap_or(&false) {
                self.state.fire_drill.insert(k.clone(), true);
                added_c += 1;
            }
        }

        let photo_re =
            Regex::new(r"^data:image/(?:jpeg|jpg|png|webp|gif);base64,[A-Za-z0-9+/=]+$").unwrap();
        let mut existing_urls: HashSet<String> =
            self.state.photos.iter().map(|p| p.data_url.clone()).collect();
        let mut existing_ids: HashSet<String> = self
            .state
            .photos
            .iter()
            .filter(|p| !p.id.is_empty())
            .map(|p| p.id.clone())
            .collect();
        for p in &incoming.photos {
            if self.state.photos.len() >= 10 {
                break;
            }
            if !photo_re.is_match(&p.data_url) {
                continue;
            }
            if existing_urls.contains(&p.data_url)
                || (!p.id.is_empty() && existing_ids.contains(&p.id))
            {
                continue;
            }
            existing_urls.insert(p.data_url.clone());
            if !p.id.is_empty() {
                existing_ids.insert(p.id.clone());
            }
            self.state.photos.push(p.clone());
            added_p += 1;
        }

        Self::merge_newer_iso(&mut self.state.last_dry_run, &incoming.last_dry_run);
        Self::merge_newer_iso(&mut self.state.reviewed, &incoming.reviewed);

        self.normalize();
        self.save(true);

        let mut parts = Vec::new();
        if added_f > 0 {
            parts.push(format!("+{added_f} fields"));
        }
        if updated_f > 0 {
            parts.push(format!("{updated_f} updated"));
        }
        if added_r > 0 {
            parts.push(format!("+{added_r} rows"));
        }
        if added_s > 0 {
            parts.push(format!("+{added_s} sections"));
        }
        if added_c > 0 {
            parts.push(format!("+{added_c} checks"));
        }
        if added_p > 0 {
            parts.push(format!("+{added_p} photos"));
        }
        if parts.is_empty() {
            "Already up to date".to_string()
        } else {
            format!("Merged ({})", parts.join(", "))
        }
    }

    // MARK: - Printable / Shareable Sheets

    pub fn export_er_grab_sheet_text(&self) -> String {
        let f = |id: &str| -> &str { self.state.f.get(id).map(|s| s.trim()).unwrap_or("") };
        let reg = self.current_region();
        let mut lines = vec![
            "1-PAGE ER & MEDICAL TREATMENT GRAB SHEET".to_string(),
            format!("Region: {} | Emergency #: {}", reg.label, reg.emergency),
            "==================================================".to_string(),
        ];
        let pairs = [
            ("24/7 SPECIALIST TRIAGE / ER", "h_triage"),
            ("RED-FLAG RULE", "h_redflag"),
            ("Diagnosis / Protocol", "h_diag"),
            ("Ports / Implants / Arm Limits", "h_devices"),
            ("Daily Meds & Allergies", "d_meds"),
            ("Rescue Meds", "h_rescue"),
            ("Pharmacy", "h_pharm"),
            ("Medical POA", "d_mpoa"),
            ("Portal Proxy / HIPAA", "h_portal"),
            ("Insurance", "d_ins"),
            ("Call First", "q_first"),
        ];
        for (lbl, key) in pairs {
            let val = f(key);
            if !val.is_empty() {
                lines.push(format!("{lbl}: {val}"));
            }
        }
        lines.join("\n")
    }

    pub fn export_executive_summary_text(&self) -> String {
        let f = |id: &str| -> &str { self.state.f.get(id).map(|s| s.trim()).unwrap_or("") };
        let rows_of = |id: &str| -> Vec<&HashMap<String, String>> {
            self.state
                .lists
                .get(id)
                .map(|rows| {
                    rows.iter()
                        .filter(|r| self.is_row_user_edited(id, r))
                        .collect()
                })
                .unwrap_or_default()
        };
        let reg = self.current_region();
        let mut out = vec![
            format!("OUR FAMILY FIELD GUIDE — 1-PAGE SUMMARY ({})", reg.label),
            "==================================================".to_string(),
        ];
        for (lbl, key) in [
            ("Call First", "q_first"),
            ("Papers Location", "q_binder"),
            ("Total Life Insurance", "q_life"),
            ("Monthly Spending", "m_monthly"),
            ("Payout First Step", "m_payout_first"),
        ] {
            let val = f(key);
            if !val.is_empty() {
                out.push(format!("{lbl}: {val}"));
            }
        }

        let accts = rows_of("accounts");
        if !accts.is_empty() {
            out.push("\nBank Accounts:".to_string());
            for a in accts {
                let inst = a.get("inst").or_else(|| a.get("type")).map(|s| s.as_str()).unwrap_or("Account");
                let own = a.get("own").map(|s| s.as_str()).unwrap_or("");
                let last4 = a.get("last4").map(|s| s.as_str()).unwrap_or("");
                out.push(format!(" - {inst} ({own}, *{last4})"));
            }
        }
        let crypto = rows_of("crypto");
        if !crypto.is_empty() {
            out.push("\nCrypto / Digital:".to_string());
            for c in crypto {
                let plat = c.get("platform").map(|s| s.as_str()).unwrap_or("Wallet");
                let acc = c.get("access").map(|s| s.as_str()).unwrap_or("");
                out.push(format!(" - {plat}: {acc}"));
            }
        }
        let ins = rows_of("insurance");
        if !ins.is_empty() {
            out.push("\nInsurance:".to_string());
            for i in ins {
                let t = i.get("type").map(|s| s.as_str()).unwrap_or("Policy");
                let co = i.get("co").map(|s| s.as_str()).unwrap_or("");
                let amt = i.get("amt").map(|s| s.as_str()).unwrap_or("");
                let benef = i.get("benef").map(|s| s.as_str()).unwrap_or("");
                out.push(format!(" - {t}: {co} {amt} (Benef: {benef})"));
            }
        }
        let ids = rows_of("gov_ids");
        if !ids.is_empty() {
            out.push("\nKey IDs (last 4 only):".to_string());
            for id in ids {
                let t = id.get("idtype").map(|s| s.as_str()).unwrap_or("ID");
                let l4 = id.get("last4").map(|s| s.as_str()).unwrap_or("");
                let wh = id.get("where").map(|s| s.as_str()).unwrap_or("");
                out.push(format!(" - {t} *{l4} ({wh})"));
            }
        }
        if !f("h_diag").is_empty() || !f("h_triage").is_empty() || !f("h_redflag").is_empty() {
            out.push("\nER / Active Illness Alert:".to_string());
            if !f("h_diag").is_empty() {
                out.push(format!(" - Diagnosis: {}", f("h_diag")));
            }
            if !f("h_triage").is_empty() {
                out.push(format!(" - Triage: {}", f("h_triage")));
            }
            if !f("h_redflag").is_empty() {
                out.push(format!(" - Red-flag rule: {}", f("h_redflag")));
            }
        }
        out.join("\n")
    }
}
