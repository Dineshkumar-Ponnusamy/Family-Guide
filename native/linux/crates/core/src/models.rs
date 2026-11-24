use std::collections::HashMap;
use std::fmt;

use serde::de::{self, SeqAccess, Visitor};
use serde::ser::SerializeSeq;
use serde::{Deserialize, Deserializer, Serialize, Serializer};

#[derive(Debug, Clone, Deserialize, Serialize)]
#[allow(non_snake_case)]
pub struct GuideData {
    pub TABS: Vec<TabDef>,
    pub PLAYBOOK: HashMap<String, PlaybookDef>,
    pub SCRIPTS: Vec<ScriptItem>,
    pub MONEY_GUIDE: Vec<GuideCard>,
    pub PRO_FINDER: Vec<GuideCard>,
    pub GLANCE: Vec<GlanceItem>,
    pub KIDS: Vec<KidsItem>,
    pub ESSENTIALS: Vec<EssentialItem>,
    pub SECTION_TEMPLATES: Vec<SectionTemplate>,
    pub FIRE_DRILL: Vec<FireDrillItem>,
    pub REGIONS: HashMap<String, RegionPreset>,
    pub DEMO_FAMILIES: HashMap<String, DemoFamily>,
    pub DICE_WORDS: Vec<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct TabDef {
    pub id: String,
    pub label: String,
    pub title: String,
    pub lede: String,
    pub blocks: Vec<BlockDef>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BlockDef {
    #[serde(rename = "type")]
    pub block_type: String,
    pub id: Option<String>,
    pub title: Option<String>,
    pub hint: Option<String>,
    pub crisis_editable: Option<bool>,
    pub fields: Option<Vec<FieldDef>>,
    pub cols: Option<Vec<ColDef>>,
    pub seed: Option<Vec<HashMap<String, String>>>,
    pub suggest_col: Option<String>,
    pub suggestions: Option<Vec<String>>,
}

impl BlockDef {
    pub fn stable_id(&self) -> String {
        self.id
            .clone()
            .or_else(|| self.title.clone())
            .unwrap_or_else(|| self.block_type.clone())
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct FieldDef {
    pub id: String,
    pub label: String,
    pub placeholder: String,
    pub wide: bool,
}

impl<'de> Deserialize<'de> for FieldDef {
    fn deserialize<D: Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        struct FieldVisitor;
        impl<'de> Visitor<'de> for FieldVisitor {
            type Value = FieldDef;
            fn expecting(&self, f: &mut fmt::Formatter) -> fmt::Result {
                f.write_str("a tuple [id, label, placeholder?, wide?]")
            }
            fn visit_seq<A: SeqAccess<'de>>(self, mut seq: A) -> Result<FieldDef, A::Error> {
                let id: String = seq
                    .next_element()?
                    .ok_or_else(|| de::Error::invalid_length(0, &self))?;
                let label: String = seq
                    .next_element()?
                    .ok_or_else(|| de::Error::invalid_length(1, &self))?;
                let placeholder: String = seq.next_element::<Option<String>>()?.flatten().unwrap_or_default();
                let wide: bool = seq.next_element::<Option<bool>>()?.flatten().unwrap_or(false);
                while seq.next_element::<de::IgnoredAny>()?.is_some() {}
                Ok(FieldDef {
                    id,
                    label,
                    placeholder,
                    wide,
                })
            }
        }
        deserializer.deserialize_seq(FieldVisitor)
    }
}

impl Serialize for FieldDef {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        let mut seq = serializer.serialize_seq(Some(4))?;
        seq.serialize_element(&self.id)?;
        seq.serialize_element(&self.label)?;
        seq.serialize_element(&self.placeholder)?;
        seq.serialize_element(&self.wide)?;
        seq.end()
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ColDef {
    pub key: String,
    pub label: String,
}

impl<'de> Deserialize<'de> for ColDef {
    fn deserialize<D: Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        struct ColVisitor;
        impl<'de> Visitor<'de> for ColVisitor {
            type Value = ColDef;
            fn expecting(&self, f: &mut fmt::Formatter) -> fmt::Result {
                f.write_str("a tuple [key, label]")
            }
            fn visit_seq<A: SeqAccess<'de>>(self, mut seq: A) -> Result<ColDef, A::Error> {
                let key: String = seq
                    .next_element()?
                    .ok_or_else(|| de::Error::invalid_length(0, &self))?;
                let label: String = seq
                    .next_element()?
                    .ok_or_else(|| de::Error::invalid_length(1, &self))?;
                while seq.next_element::<de::IgnoredAny>()?.is_some() {}
                Ok(ColDef { key, label })
            }
        }
        deserializer.deserialize_seq(ColVisitor)
    }
}

impl Serialize for ColDef {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        let mut seq = serializer.serialize_seq(Some(2))?;
        seq.serialize_element(&self.key)?;
        seq.serialize_element(&self.label)?;
        seq.end()
    }
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct PlaybookDef {
    pub label: String,
    pub phases: Vec<PlaybookPhase>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct PlaybookPhase {
    pub when: String,
    pub steps: Vec<PlaybookStep>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PlaybookStep {
    pub id: String,
    pub t: String,
    pub d: String,
    #[serde(rename = "ref")]
    pub ref_label: Option<String>,
    pub ref_tab: Option<String>,
    pub ref_block: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ScriptItem {
    pub title: String,
    pub body: String,
}

impl<'de> Deserialize<'de> for ScriptItem {
    fn deserialize<D: Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        struct ScriptVisitor;
        impl<'de> Visitor<'de> for ScriptVisitor {
            type Value = ScriptItem;
            fn expecting(&self, f: &mut fmt::Formatter) -> fmt::Result {
                f.write_str("a tuple [title, body]")
            }
            fn visit_seq<A: SeqAccess<'de>>(self, mut seq: A) -> Result<ScriptItem, A::Error> {
                let title: String = seq
                    .next_element()?
                    .ok_or_else(|| de::Error::invalid_length(0, &self))?;
                let body: String = seq
                    .next_element()?
                    .ok_or_else(|| de::Error::invalid_length(1, &self))?;
                while seq.next_element::<de::IgnoredAny>()?.is_some() {}
                Ok(ScriptItem { title, body })
            }
        }
        deserializer.deserialize_seq(ScriptVisitor)
    }
}

impl Serialize for ScriptItem {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        let mut seq = serializer.serialize_seq(Some(2))?;
        seq.serialize_element(&self.title)?;
        seq.serialize_element(&self.body)?;
        seq.end()
    }
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct GuideCard {
    pub id: String,
    pub title: String,
    pub badge: String,
    pub summary: String,
    pub bullets: Vec<String>,
    pub note: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct GlanceItem {
    pub id: String,
    pub label: String,
    pub placeholder: String,
}

impl<'de> Deserialize<'de> for GlanceItem {
    fn deserialize<D: Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        struct GlanceVisitor;
        impl<'de> Visitor<'de> for GlanceVisitor {
            type Value = GlanceItem;
            fn expecting(&self, f: &mut fmt::Formatter) -> fmt::Result {
                f.write_str("a tuple [id, label, placeholder?]")
            }
            fn visit_seq<A: SeqAccess<'de>>(self, mut seq: A) -> Result<GlanceItem, A::Error> {
                let id: String = seq
                    .next_element()?
                    .ok_or_else(|| de::Error::invalid_length(0, &self))?;
                let label: String = seq
                    .next_element()?
                    .ok_or_else(|| de::Error::invalid_length(1, &self))?;
                let placeholder: String = seq.next_element::<Option<String>>()?.flatten().unwrap_or_default();
                while seq.next_element::<de::IgnoredAny>()?.is_some() {}
                Ok(GlanceItem {
                    id,
                    label,
                    placeholder,
                })
            }
        }
        deserializer.deserialize_seq(GlanceVisitor)
    }
}

impl Serialize for GlanceItem {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        let mut seq = serializer.serialize_seq(Some(3))?;
        seq.serialize_element(&self.id)?;
        seq.serialize_element(&self.label)?;
        seq.serialize_element(&self.placeholder)?;
        seq.end()
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct KidsItem {
    pub id: String,
    pub emoji: String,
    pub label: String,
    pub placeholder: String,
}

impl<'de> Deserialize<'de> for KidsItem {
    fn deserialize<D: Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        struct KidsVisitor;
        impl<'de> Visitor<'de> for KidsVisitor {
            type Value = KidsItem;
            fn expecting(&self, f: &mut fmt::Formatter) -> fmt::Result {
                f.write_str("a tuple [id, emoji, label, placeholder?]")
            }
            fn visit_seq<A: SeqAccess<'de>>(self, mut seq: A) -> Result<KidsItem, A::Error> {
                let id: String = seq
                    .next_element()?
                    .ok_or_else(|| de::Error::invalid_length(0, &self))?;
                let emoji: String = seq
                    .next_element()?
                    .ok_or_else(|| de::Error::invalid_length(1, &self))?;
                let label: String = seq
                    .next_element()?
                    .ok_or_else(|| de::Error::invalid_length(2, &self))?;
                let placeholder: String = seq.next_element::<Option<String>>()?.flatten().unwrap_or_default();
                while seq.next_element::<de::IgnoredAny>()?.is_some() {}
                Ok(KidsItem {
                    id,
                    emoji,
                    label,
                    placeholder,
                })
            }
        }
        deserializer.deserialize_seq(KidsVisitor)
    }
}

impl Serialize for KidsItem {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        let mut seq = serializer.serialize_seq(Some(4))?;
        seq.serialize_element(&self.id)?;
        seq.serialize_element(&self.emoji)?;
        seq.serialize_element(&self.label)?;
        seq.serialize_element(&self.placeholder)?;
        seq.end()
    }
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct EssentialItem {
    pub id: String,
    #[serde(rename = "type")]
    pub item_type: String,
    pub label: String,
    pub tab: String,
    pub block: String,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct SectionTemplate {
    pub name: String,
    pub desc: String,
    pub fields: Vec<TemplateField>,
    pub lists: Vec<TemplateList>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct TemplateField {
    pub label: String,
    pub wide: bool,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct TemplateList {
    pub title: String,
    pub cols: Vec<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct FireDrillItem {
    pub id: String,
    pub t: String,
    pub d: String,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RegionPreset {
    pub label: String,
    pub emergency: String,
    pub currency: String,
    #[serde(default)]
    pub cross_border: bool,
    #[serde(default)]
    pub india_notes: bool,
    pub money_guide: Option<RegionMoneyGuide>,
    pub pro_finder: Option<RegionProFinder>,
    pub field_overrides: Option<HashMap<String, FieldOverride>>,
    pub list_overrides: Option<HashMap<String, ListOverride>>,
    pub step_overrides: Option<HashMap<String, StepOverride>>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RegionMoneyGuide {
    pub deposit_cap: Option<String>,
    pub tax_note: Option<String>,
    pub fiduciary_name: Option<String>,
    pub safe_cash: Option<String>,
    pub sample_title: Option<String>,
    pub sample_lines: Option<Vec<String>>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct RegionProFinder {
    pub legal: Option<String>,
    pub visa: Option<String>,
    pub money: Option<String>,
    pub tax: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct FieldOverride {
    pub label: Option<String>,
    pub ph: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ListOverride {
    pub hint: Option<String>,
    pub col_labels: Option<HashMap<String, String>>,
    pub extra_suggestions: Option<Vec<String>>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct StepOverride {
    pub t: Option<String>,
    pub d: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DemoFamily {
    pub track: Option<String>,
    pub f: Option<HashMap<String, String>>,
    pub lists: Option<HashMap<String, Vec<HashMap<String, String>>>>,
    pub custom_tabs: Option<Vec<CustomTab>>,
    pub extra: Option<HashMap<String, Vec<ExtraItem>>>,
    #[serde(rename = "f_extra_patch")]
    pub f_extra_patch: Option<HashMap<String, String>>,
}

// MARK: - User State (`familyFieldGuide.v1`)

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
pub struct CustomTab {
    pub id: String,
    pub label: String,
    pub title: String,
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
pub struct ExtraItem {
    #[serde(rename = "type")]
    pub item_type: String,
    pub id: String,
    pub label: Option<String>,
    pub title: Option<String>,
    pub wide: Option<bool>,
    pub cols: Option<Vec<ColDef>>,
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct PhotoSnippet {
    pub id: String,
    pub label: String,
    pub data_url: String,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(default, rename_all = "camelCase")]
pub struct GuideState {
    pub f: HashMap<String, String>,
    pub lists: HashMap<String, Vec<HashMap<String, String>>>,
    pub checks: HashMap<String, bool>,
    pub track: String,
    pub tab: String,
    pub region: String,
    pub is_demo: bool,
    pub dismiss_demo: bool,
    pub read_mode: bool,
    pub hide_essentials: bool,
    pub large_text: bool,
    pub high_contrast: bool,
    pub custom_tabs: Vec<CustomTab>,
    pub extra: HashMap<String, Vec<ExtraItem>>,
    pub fire_drill: HashMap<String, bool>,
    pub photos: Vec<PhotoSnippet>,
    pub last_dry_run: Option<String>,
    pub updated: Option<String>,
    pub reviewed: Option<String>,
    pub last_backup: Option<String>,
}

impl Default for GuideState {
    fn default() -> Self {
        Self {
            f: HashMap::new(),
            lists: HashMap::new(),
            checks: HashMap::new(),
            track: "hurt".to_string(),
            tab: "start".to_string(),
            region: "us".to_string(),
            is_demo: false,
            dismiss_demo: false,
            read_mode: false,
            hide_essentials: false,
            large_text: false,
            high_contrast: false,
            custom_tabs: Vec::new(),
            extra: HashMap::new(),
            fire_drill: HashMap::new(),
            photos: Vec::new(),
            last_dry_run: None,
            updated: None,
            reviewed: None,
            last_backup: None,
        }
    }
}

// MARK: - Interop Package, Audit, Merge & Search Models

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct EncryptedBackupPackage {
    pub app: String,
    pub v: u32,
    pub salt: String,
    pub iv: String,
    pub data: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum AuditSeverity {
    High = 0,
    Med = 1,
    Ok = 2,
}

#[derive(Debug, Clone)]
pub struct AuditItem {
    pub id: String,
    pub sev: AuditSeverity,
    pub title: String,
    pub detail: String,
    pub tab: Option<String>,
    pub block: Option<String>,
    pub field: Option<String>,
    pub act: Option<String>,
}

#[derive(Debug, Clone)]
pub struct MergeConflict {
    pub id: String,
    pub label: String,
}

#[derive(Debug, Clone)]
pub struct MergePlan {
    pub new_fields: usize,
    pub conflict_fields: Vec<MergeConflict>,
    pub new_tabs: usize,
    pub new_extras: usize,
    pub new_rows: usize,
    pub new_checks: usize,
}

#[derive(Debug, Clone)]
pub struct SearchHit {
    pub tab_id: String,
    pub tab_label: String,
    pub title: String,
    pub sub: String,
    pub block_key: String,
    pub field_id: String,
    pub track_key: String,
}
