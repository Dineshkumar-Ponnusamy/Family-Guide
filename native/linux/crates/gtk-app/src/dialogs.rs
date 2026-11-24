use std::cell::RefCell;
use std::fs;
use std::rc::Rc;

use family_guide_core::crypto::{
    decrypt_state, encrypt_state, generate_passphrase, parse_backup_payload, sss_combine_2of3,
    sss_split_2of3,
};
use family_guide_core::models::AuditSeverity;
use family_guide_core::store::GuideStore;
use gtk4::gio;
use gtk4::gio::prelude::FileExt;
use gtk4::prelude::*;
use gtk4::{
    Align, Box as GtkBox, Button, CheckButton, Entry, FileDialog, Label, Orientation,
    PasswordEntry, ScrolledWindow, TextView, Window, WrapMode,
};

use crate::theme::copy_to_clipboard;

pub type SharedStore = Rc<RefCell<GuideStore>>;
pub type RefreshFn = Rc<dyn Fn()>;

fn modal_window(parent: &impl IsA<Window>, title: &str, w: i32, h: i32) -> Window {
    Window::builder()
        .transient_for(parent)
        .modal(true)
        .title(title)
        .default_width(w)
        .default_height(h)
        .build()
}

pub fn show_search_dialog(parent: &impl IsA<Window>, store: SharedStore, on_refresh: RefreshFn) {
    let win = modal_window(parent, "Search Family Field Guide", 640, 520);
    let root = GtkBox::new(Orientation::Vertical, 10);
    root.set_margin_top(14);
    root.set_margin_bottom(14);
    root.set_margin_start(14);
    root.set_margin_end(14);

    let entry = Entry::builder()
        .placeholder_text("Search fields, tables, $1M, AILA, NALSA, insurance, triage...")
        .build();
    let results_box = GtkBox::new(Orientation::Vertical, 6);
    let scroll = ScrolledWindow::builder()
        .vexpand(true)
        .child(&results_box)
        .build();

    root.append(&entry);
    root.append(&scroll);
    win.set_child(Some(&root));

    let populate = {
        let store = store.clone();
        let results_box = results_box.clone();
        let win_weak = win.downgrade();
        let on_refresh = on_refresh.clone();
        move |query: &str| {
            while let Some(child) = results_box.first_child() {
                results_box.remove(&child);
            }
            let hits = store.borrow().search(query);
            if query.trim().is_empty() {
                let lbl = Label::new(Some("Type any keyword (phone, visa, beneficiary, ER, $1M, AILA, etc.)."));
                lbl.add_css_class("ffg-muted");
                lbl.set_halign(Align::Start);
                results_box.append(&lbl);
                return;
            }
            if hits.is_empty() {
                let lbl = Label::new(Some("No matching entries."));
                lbl.add_css_class("ffg-muted");
                lbl.set_halign(Align::Start);
                results_box.append(&lbl);
                return;
            }
            for hit in hits {
                let row_btn = Button::new();
                row_btn.add_css_class("flat");
                let vbox = GtkBox::new(Orientation::Vertical, 2);
                vbox.set_margin_top(4);
                vbox.set_margin_bottom(4);
                let top = Label::new(Some(&format!("{} — {}", hit.tab_label, hit.title)));
                top.set_halign(Align::Start);
                top.add_css_class("ffg-section-title");
                let sub = Label::new(Some(&hit.sub));
                sub.set_halign(Align::Start);
                sub.set_wrap(true);
                sub.add_css_class("ffg-muted");
                vbox.append(&top);
                vbox.append(&sub);
                row_btn.set_child(Some(&vbox));

                let store_c = store.clone();
                let on_refresh_c = on_refresh.clone();
                let win_c = win_weak.clone();
                let tab_id = hit.tab_id.clone();
                let track_key = hit.track_key.clone();
                row_btn.connect_clicked(move |_| {
                    {
                        let mut st = store_c.borrow_mut();
                        st.state.tab = tab_id.clone();
                        if !track_key.is_empty() {
                            st.state.track = track_key.clone();
                        }
                        st.save(false);
                    }
                    on_refresh_c();
                    if let Some(w) = win_c.upgrade() {
                        w.close();
                    }
                });
                results_box.append(&row_btn);
            }
        }
    };

    populate("");
    entry.connect_changed(move |e| populate(&e.text()));
    win.present();
}

pub fn show_text_sheet_dialog(parent: &impl IsA<Window>, title: &str, default_filename: &str, content: String) {
    let win = modal_window(parent, title, 720, 600);
    let root = GtkBox::new(Orientation::Vertical, 10);
    root.set_margin_top(14);
    root.set_margin_bottom(14);
    root.set_margin_start(14);
    root.set_margin_end(14);

    let tv = TextView::builder()
        .editable(false)
        .monospace(true)
        .wrap_mode(WrapMode::WordChar)
        .build();
    tv.buffer().set_text(&content);
    let scroll = ScrolledWindow::builder().vexpand(true).child(&tv).build();

    let actions = GtkBox::new(Orientation::Horizontal, 8);
    let status = Label::new(None);
    status.add_css_class("ffg-muted");
    status.set_hexpand(true);
    status.set_halign(Align::Start);

    let copy_btn = Button::with_label("Copy All");
    let content_c = content.clone();
    let status_c = status.clone();
    copy_btn.connect_clicked(move |_| {
        copy_to_clipboard(&content_c);
        status_c.set_text("Copied to clipboard.");
    });

    let save_btn = Button::with_label("Save .txt…");
    let win_c = win.clone();
    let fname = default_filename.to_string();
    let status_s = status.clone();
    save_btn.connect_clicked(move |_| {
        let dialog = FileDialog::builder()
            .title("Save Printable Text Sheet")
            .initial_name(&fname)
            .modal(true)
            .build();
        let content_w = content.clone();
        let status_w = status_s.clone();
        dialog.save(Some(&win_c), None::<&gio::Cancellable>, move |res| {
            if let Ok(file) = res {
                if let Some(path) = file.path() {
                    match fs::write(&path, &content_w) {
                        Ok(_) => status_w.set_text(&format!("Saved {}", path.display())),
                        Err(e) => status_w.set_text(&format!("Error: {e}")),
                    }
                }
            }
        });
    });

    let close_btn = Button::with_label("Close");
    let win_cl = win.clone();
    close_btn.connect_clicked(move |_| win_cl.close());

    actions.append(&status);
    actions.append(&copy_btn);
    actions.append(&save_btn);
    actions.append(&close_btn);

    root.append(&scroll);
    root.append(&actions);
    win.set_child(Some(&root));
    win.present();
}

pub fn show_audit_dialog(parent: &impl IsA<Window>, store: SharedStore, on_refresh: RefreshFn) {
    let win = modal_window(parent, "Readiness Audit & 10-Minute Fire Drill", 720, 640);
    let root = GtkBox::new(Orientation::Vertical, 12);
    root.set_margin_top(14);
    root.set_margin_bottom(14);
    root.set_margin_start(14);
    root.set_margin_end(14);

    let list_box = GtkBox::new(Orientation::Vertical, 10);
    let scroll = ScrolledWindow::builder()
        .vexpand(true)
        .child(&list_box)
        .build();

    let hdr1 = Label::new(Some("Readiness & Privacy Audit"));
    hdr1.set_halign(Align::Start);
    hdr1.add_css_class("ffg-title");
    list_box.append(&hdr1);

    let audit_items = store.borrow().compute_audit();
    for item in audit_items {
        let card = GtkBox::new(Orientation::Vertical, 4);
        card.add_css_class("ffg-card");

        let top = GtkBox::new(Orientation::Horizontal, 8);
        let badge = Label::new(Some(match item.sev {
            AuditSeverity::High => "HIGH",
            AuditSeverity::Med => "MEDIUM",
            AuditSeverity::Ok => "OK",
        }));
        badge.add_css_class(match item.sev {
            AuditSeverity::High => "ffg-badge-high",
            AuditSeverity::Med => "ffg-badge-med",
            AuditSeverity::Ok => "ffg-badge-ok",
        });

        let title = Label::new(Some(&item.title));
        title.set_halign(Align::Start);
        title.set_wrap(true);
        title.add_css_class("ffg-section-title");
        top.append(&badge);
        top.append(&title);
        card.append(&top);

        let det = Label::new(Some(&item.detail));
        det.set_halign(Align::Start);
        det.set_wrap(true);
        det.add_css_class("ffg-muted");
        card.append(&det);

        if let Some(tab) = item.tab.clone() {
            let jump = Button::with_label(&format!("Go to {}", tab));
            jump.set_halign(Align::Start);
            let store_c = store.clone();
            let on_refresh_c = on_refresh.clone();
            let win_c = win.clone();
            jump.connect_clicked(move |_| {
                {
                    let mut st = store_c.borrow_mut();
                    st.state.tab = tab.clone();
                    st.save(false);
                }
                on_refresh_c();
                win_c.close();
            });
            card.append(&jump);
        }
        list_box.append(&card);
    }

    let hdr2 = Label::new(Some("10-Minute Family Fire Drill"));
    hdr2.set_halign(Align::Start);
    hdr2.add_css_class("ffg-title");
    hdr2.set_margin_top(12);
    list_box.append(&hdr2);

    let drill_items = store.borrow().data.FIRE_DRILL.clone();
    for d in drill_items {
        let row = GtkBox::new(Orientation::Horizontal, 8);
        row.add_css_class("ffg-card");
        let checked = *store.borrow().state.fire_drill.get(&d.id).unwrap_or(&false);
        let cb = CheckButton::with_label(&format!("{} — {}", d.t, d.d));
        cb.set_active(checked);
        let store_c = store.clone();
        let on_refresh_c = on_refresh.clone();
        let did = d.id.clone();
        cb.connect_toggled(move |b| {
            {
                let mut st = store_c.borrow_mut();
                st.state.fire_drill.insert(did.clone(), b.is_active());
                let total_drill = st.data.FIRE_DRILL.len();
                let done = st.state.fire_drill.values().filter(|v| **v).count();
                if total_drill > 0 && done >= total_drill {
                    st.state.last_dry_run = Some(chrono::Utc::now().to_rfc3339());
                }
                st.save(true);
            }
            on_refresh_c();
        });
        row.append(&cb);
        list_box.append(&row);
    }

    let close_btn = Button::with_label("Close");
    close_btn.set_halign(Align::End);
    let win_cl = win.clone();
    close_btn.connect_clicked(move |_| win_cl.close());

    root.append(&scroll);
    root.append(&close_btn);
    win.set_child(Some(&root));
    win.present();
}

pub fn show_save_backup_dialog(parent: &impl IsA<Window>, store: SharedStore, on_refresh: RefreshFn) {
    let win = modal_window(parent, "Save Encrypted Backup (AES-256-GCM)", 640, 560);
    let root = GtkBox::new(Orientation::Vertical, 10);
    root.set_margin_top(14);
    root.set_margin_bottom(14);
    root.set_margin_start(14);
    root.set_margin_end(14);

    let info = Label::new(Some(
        "Creates a family-field-guide.v1 encrypted JSON backup using PBKDF2-HMAC-SHA256 (250,000 rounds) + AES-256-GCM. Byte-for-byte compatible with Web, macOS, iOS, Android, and Windows.",
    ));
    info.set_wrap(true);
    info.set_halign(Align::Start);
    info.add_css_class("ffg-muted");
    root.append(&info);

    let pass_row = GtkBox::new(Orientation::Horizontal, 8);
    let pass_entry = PasswordEntry::builder()
        .placeholder_text("Enter passphrase or generate 6-word Diceware passphrase...")
        .show_peek_icon(true)
        .hexpand(true)
        .build();
    let confirm_entry = PasswordEntry::builder()
        .placeholder_text("Confirm backup passphrase...")
        .show_peek_icon(true)
        .hexpand(true)
        .build();
    let gen_btn = Button::with_label("Generate 6-word Diceware");
    let store_g = store.clone();
    let pass_g = pass_entry.clone();
    let confirm_g = confirm_entry.clone();
    gen_btn.connect_clicked(move |_| {
        let phrase = generate_passphrase(&store_g.borrow().data.DICE_WORDS, 6);
        pass_g.set_text(&phrase);
        confirm_g.set_text(&phrase);
    });
    pass_row.append(&pass_entry);
    pass_row.append(&gen_btn);
    root.append(&pass_row);
    root.append(&confirm_entry);

    let shamir_btn = Button::with_label("Split into 2-of-3 Shamir Recovery Cards");
    shamir_btn.set_halign(Align::Start);
    root.append(&shamir_btn);

    let cards_box = GtkBox::new(Orientation::Vertical, 6);
    root.append(&cards_box);

    let shamir_pass = pass_entry.clone();
    let cards_box_c = cards_box.clone();
    shamir_btn.connect_clicked(move |_| {
        while let Some(c) = cards_box_c.first_child() {
            cards_box_c.remove(&c);
        }
        let phrase = shamir_pass.text().to_string();
        match sss_split_2of3(phrase.trim()) {
            Ok(cards) => {
                let roles = [
                    "Card 1 (Spouse Wallet)",
                    "Card 2 (Home Fireproof Safe)",
                    "Card 3 (Trusted Executor / Parent)",
                ];
                for (i, card) in cards.iter().enumerate() {
                    let row = GtkBox::new(Orientation::Horizontal, 6);
                    row.add_css_class("ffg-card");
                    let lbl = Label::new(Some(&format!("{}: {}", roles[i], card)));
                    lbl.set_wrap(true);
                    lbl.set_hexpand(true);
                    lbl.set_halign(Align::Start);
                    let cp = Button::with_label("Copy");
                    let card_txt = card.clone();
                    cp.connect_clicked(move |_| copy_to_clipboard(&card_txt));
                    row.append(&lbl);
                    row.append(&cp);
                    cards_box_c.append(&row);
                }
            }
            Err(err) => {
                let lbl = Label::new(Some(&err));
                lbl.add_css_class("ffg-badge-high");
                cards_box_c.append(&lbl);
            }
        }
    });

    let status = Label::new(None);
    status.set_halign(Align::Start);
    status.set_wrap(true);
    root.append(&status);

    let btn_row = GtkBox::new(Orientation::Horizontal, 8);
    btn_row.set_halign(Align::End);
    let save_btn = Button::with_label("Encrypt & Save Backup (.json)…");
    save_btn.add_css_class("suggested-action");
    let close_btn = Button::with_label("Close");

    let win_s = win.clone();
    let store_s = store.clone();
    let pass_s = pass_entry.clone();
    let confirm_s = confirm_entry.clone();
    let status_s = status.clone();
    let on_refresh_s = on_refresh.clone();
    save_btn.connect_clicked(move |_| {
        let phrase = pass_s.text().to_string();
        let confirm = confirm_s.text().to_string();
        if phrase.trim().len() < 8 {
            status_s.set_text("Use at least 8 characters for the backup passphrase.");
            return;
        }
        if phrase.trim() != confirm.trim() {
            status_s.set_text("Backup passphrases do not match.");
            return;
        }
        let pkg = {
            let st = store_s.borrow();
            match encrypt_state(&st.state, phrase.trim()) {
                Ok(p) => p,
                Err(e) => {
                    status_s.set_text(&e);
                    return;
                }
            }
        };
        let json_out = match serde_json::to_string_pretty(&pkg) {
            Ok(j) => j,
            Err(e) => {
                status_s.set_text(&format!("Encode error: {e}"));
                return;
            }
        };
        let dialog = FileDialog::builder()
            .title("Save Encrypted Backup")
            .initial_name("family-field-guide-backup.json")
            .modal(true)
            .build();
        let store_w = store_s.clone();
        let status_w = status_s.clone();
        let on_refresh_w = on_refresh_s.clone();
        dialog.save(Some(&win_s), None::<&gio::Cancellable>, move |res| {
            if let Ok(file) = res {
                if let Some(path) = file.path() {
                    match fs::write(&path, &json_out) {
                        Ok(_) => {
                            {
                                let mut st = store_w.borrow_mut();
                                st.state.last_backup = Some(chrono::Utc::now().to_rfc3339());
                                st.save(false);
                            }
                            on_refresh_w();
                            status_w.set_text(&format!("Saved encrypted backup to {}", path.display()));
                        }
                        Err(e) => status_w.set_text(&format!("Write error: {e}")),
                    }
                }
            }
        });
    });

    let win_cl = win.clone();
    close_btn.connect_clicked(move |_| win_cl.close());

    btn_row.append(&save_btn);
    btn_row.append(&close_btn);
    root.append(&btn_row);
    win.set_child(Some(&root));
    win.present();
}

pub fn show_open_merge_dialog(parent: &impl IsA<Window>, store: SharedStore, on_refresh: RefreshFn) {
    let win = modal_window(parent, "Open / Two-Spouse Smart Merge Backup", 660, 560);
    let root = GtkBox::new(Orientation::Vertical, 10);
    root.set_margin_top(14);
    root.set_margin_bottom(14);
    root.set_margin_start(14);
    root.set_margin_end(14);

    let loaded_raw: Rc<RefCell<Option<String>>> = Rc::new(RefCell::new(None));
    let decoded_state: Rc<RefCell<Option<family_guide_core::models::GuideState>>> =
        Rc::new(RefCell::new(None));

    let file_row = GtkBox::new(Orientation::Horizontal, 8);
    let file_lbl = Label::new(Some("No backup file selected (.json or standalone .html)"));
    file_lbl.set_hexpand(true);
    file_lbl.set_halign(Align::Start);
    file_lbl.add_css_class("ffg-muted");
    let pick_btn = Button::with_label("Choose Backup File…");
    file_row.append(&file_lbl);
    file_row.append(&pick_btn);
    root.append(&file_row);

    let pass_entry = PasswordEntry::builder()
        .placeholder_text("Backup passphrase")
        .show_peek_icon(true)
        .build();
    root.append(&pass_entry);

    let shamir_lbl = Label::new(Some("Or unlock passphrase from any 2 Shamir Recovery Cards:"));
    shamir_lbl.set_halign(Align::Start);
    shamir_lbl.add_css_class("ffg-muted");
    root.append(&shamir_lbl);
    let card_a = Entry::builder().placeholder_text("Card 1 (FFG-1-...)").build();
    let card_b = Entry::builder().placeholder_text("Card 2 (FFG-2-...)").build();
    let combine_btn = Button::with_label("Recover Passphrase from 2 Cards");
    combine_btn.set_halign(Align::Start);
    root.append(&card_a);
    root.append(&card_b);
    root.append(&combine_btn);

    let summary_lbl = Label::new(None);
    summary_lbl.set_halign(Align::Start);
    summary_lbl.set_wrap(true);
    root.append(&summary_lbl);

    let merge_btns = GtkBox::new(Orientation::Horizontal, 8);
    let decrypt_btn = Button::with_label("1. Unlock & Preview Merge");
    let merge_keep_btn = Button::with_label("Smart Merge (Keep Mine)");
    let merge_over_btn = Button::with_label("Smart Merge (Use Incoming)");
    let replace_btn = Button::with_label("Replace Everything");
    merge_keep_btn.set_sensitive(false);
    merge_over_btn.set_sensitive(false);
    replace_btn.set_sensitive(false);
    merge_btns.append(&decrypt_btn);
    merge_btns.append(&merge_keep_btn);
    merge_btns.append(&merge_over_btn);
    merge_btns.append(&replace_btn);
    root.append(&merge_btns);

    let win_p = win.clone();
    let loaded_p = loaded_raw.clone();
    let file_lbl_p = file_lbl.clone();
    pick_btn.connect_clicked(move |_| {
        let dialog = FileDialog::builder()
            .title("Select Encrypted Backup (.json or .html)")
            .modal(true)
            .build();
        let loaded_c = loaded_p.clone();
        let lbl_c = file_lbl_p.clone();
        dialog.open(Some(&win_p), None::<&gio::Cancellable>, move |res| {
            if let Ok(file) = res {
                if let Some(path) = file.path() {
                    match fs::read_to_string(&path) {
                        Ok(txt) => {
                            *loaded_c.borrow_mut() = Some(txt);
                            lbl_c.set_text(&format!("Selected: {}", path.display()));
                        }
                        Err(e) => lbl_c.set_text(&format!("Read error: {e}")),
                    }
                }
            }
        });
    });

    let ca_c = card_a.clone();
    let cb_c = card_b.clone();
    let pass_comb = pass_entry.clone();
    let sum_comb = summary_lbl.clone();
    combine_btn.connect_clicked(move |_| {
        match sss_combine_2of3(&ca_c.text(), &cb_c.text()) {
            Ok(secret) => {
                pass_comb.set_text(&secret);
                sum_comb.set_text("Recovered passphrase from 2 Shamir cards.");
            }
            Err(e) => sum_comb.set_text(&e),
        }
    });

    let loaded_d = loaded_raw.clone();
    let decoded_d = decoded_state.clone();
    let pass_d = pass_entry.clone();
    let store_d = store.clone();
    let sum_d = summary_lbl.clone();
    let mk = merge_keep_btn.clone();
    let mo = merge_over_btn.clone();
    let rb = replace_btn.clone();
    decrypt_btn.connect_clicked(move |_| {
        let Some(ref raw) = *loaded_d.borrow() else {
            sum_d.set_text("Choose a backup file first.");
            return;
        };
        let pkg = match parse_backup_payload(raw) {
            Ok(p) => p,
            Err(e) => {
                sum_d.set_text(&e);
                return;
            }
        };
        match decrypt_state(&pkg, pass_d.text().as_str()) {
            Ok(st_in) => {
                let plan = store_d.borrow().compute_merge_plan(&st_in);
                sum_d.set_text(&format!(
                    "Unlocked! Preview: +{} new fields, +{} rows, +{} sections, +{} checks, {} conflicts.",
                    plan.new_fields,
                    plan.new_rows,
                    plan.new_tabs,
                    plan.new_checks,
                    plan.conflict_fields.len()
                ));
                *decoded_d.borrow_mut() = Some(st_in);
                mk.set_sensitive(true);
                mo.set_sensitive(true);
                rb.set_sensitive(true);
            }
            Err(e) => sum_d.set_text(&e),
        }
    });

    let wire_merge = |btn: &Button, overwrite: Option<bool>| {
        let decoded_c = decoded_state.clone();
        let store_c = store.clone();
        let on_refresh_c = on_refresh.clone();
        let win_c = win.clone();
        btn.connect_clicked(move |_| {
            let Some(ref incoming) = *decoded_c.borrow() else {
                return;
            };
            {
                let mut st = store_c.borrow_mut();
                match overwrite {
                    Some(ov) => {
                        st.apply_merge(incoming, ov);
                    }
                    None => {
                        st.state = incoming.clone();
                        st.normalize();
                        st.save(true);
                    }
                }
            }
            on_refresh_c();
            win_c.close();
        });
    };
    wire_merge(&merge_keep_btn, Some(false));
    wire_merge(&merge_over_btn, Some(true));
    wire_merge(&replace_btn, None);

    let close_btn = Button::with_label("Cancel");
    close_btn.set_halign(Align::End);
    let win_cl = win.clone();
    close_btn.connect_clicked(move |_| win_cl.close());
    root.append(&close_btn);

    win.set_child(Some(&root));
    win.present();
}

pub fn show_add_section_dialog(parent: &impl IsA<Window>, store: SharedStore, on_refresh: RefreshFn) {
    let win = modal_window(parent, "+ Add Custom Section", 560, 520);
    let root = GtkBox::new(Orientation::Vertical, 10);
    root.set_margin_top(14);
    root.set_margin_bottom(14);
    root.set_margin_start(14);
    root.set_margin_end(14);

    let hdr = Label::new(Some("Choose a Ready-Made Template or Create Your Own"));
    hdr.set_halign(Align::Start);
    hdr.add_css_class("ffg-section-title");
    root.append(&hdr);

    let list = GtkBox::new(Orientation::Vertical, 6);
    let templates = store.borrow().data.SECTION_TEMPLATES.clone();
    for tpl in templates {
        let card = GtkBox::new(Orientation::Horizontal, 8);
        card.add_css_class("ffg-card");
        let txt = GtkBox::new(Orientation::Vertical, 2);
        txt.set_hexpand(true);
        let t = Label::new(Some(&tpl.name));
        t.set_halign(Align::Start);
        t.add_css_class("ffg-section-title");
        let d = Label::new(Some(&tpl.desc));
        d.set_halign(Align::Start);
        d.set_wrap(true);
        d.add_css_class("ffg-muted");
        txt.append(&t);
        txt.append(&d);
        let add_btn = Button::with_label("Add");
        let store_c = store.clone();
        let on_refresh_c = on_refresh.clone();
        let win_c = win.clone();
        add_btn.connect_clicked(move |_| {
            store_c.borrow_mut().apply_section_template(&tpl);
            on_refresh_c();
            win_c.close();
        });
        card.append(&txt);
        card.append(&add_btn);
        list.append(&card);
    }

    let scroll = ScrolledWindow::builder().vexpand(true).child(&list).build();
    root.append(&scroll);

    let custom_row = GtkBox::new(Orientation::Horizontal, 8);
    let custom_entry = Entry::builder()
        .placeholder_text("Blank custom section name...")
        .hexpand(true)
        .build();
    let custom_btn = Button::with_label("Create Blank");
    let store_b = store.clone();
    let entry_b = custom_entry.clone();
    let on_refresh_b = on_refresh.clone();
    let win_b = win.clone();
    custom_btn.connect_clicked(move |_| {
        let name = entry_b.text().to_string();
        if !name.trim().is_empty() {
            store_b.borrow_mut().add_custom_section(&name);
            on_refresh_b();
            win_b.close();
        }
    });
    custom_row.append(&custom_entry);
    custom_row.append(&custom_btn);
    root.append(&custom_row);

    win.set_child(Some(&root));
    win.present();
}
