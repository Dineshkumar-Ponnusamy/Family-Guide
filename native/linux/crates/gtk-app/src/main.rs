mod dialogs;
mod theme;

use std::cell::{Cell, RefCell};
use std::collections::HashMap;
use std::rc::Rc;

use family_guide_core::models::{BlockDef, ColDef, FieldDef, GuideCard};
use family_guide_core::store::GuideStore;
use gtk4::prelude::*;
use gtk4::{
    Align, Application, ApplicationWindow, Box as GtkBox, Button, CheckButton, DropDown, Entry,
    Frame, Grid, HeaderBar, Label, Orientation, Overlay, Paned, PasswordEntry, ProgressBar,
    ScrolledWindow, TextView, ToggleButton, Window, WrapMode,
};

use dialogs::{
    show_add_section_dialog, show_audit_dialog, show_open_merge_dialog, show_save_backup_dialog,
    show_search_dialog, show_text_sheet_dialog, RefreshFn, SharedStore,
};
use theme::{apply_accessibility_classes, brand_logo_widget, copy_to_clipboard, install_css};

const APP_ID: &str = "io.github.dineshkumarponnusamy.familyfieldguide";

fn region_order() -> Vec<&'static str> {
    vec![
        "us", "us_in", "in", "visa_intl", "uk", "ca", "au", "eu", "generic",
    ]
}

fn playbook_order() -> Vec<&'static str> {
    vec![
        "hurt",
        "illness",
        "gone",
        "windfall",
        "money",
        "caregiver",
        "visa",
    ]
}

fn build_ui(app: &Application) {
    install_css();

    let store: SharedStore = Rc::new(RefCell::new(
        GuideStore::new_default().unwrap_or_else(|_| {
            GuideStore::new_in_memory().expect("embedded schema loads")
        }),
    ));
    let is_syncing = Rc::new(Cell::new(false));
    let session_lock_pass: Rc<RefCell<Option<String>>> = Rc::new(RefCell::new(None));

    let win = ApplicationWindow::builder()
        .application(app)
        .title("Our Family Field Guide")
        .default_width(1240)
        .default_height(820)
        .build();

    let header = HeaderBar::new();
    win.set_titlebar(Some(&header));

    // Region selector
    let reg_keys = region_order();
    let reg_labels: Vec<String> = {
        let st = store.borrow();
        reg_keys
            .iter()
            .filter_map(|k| st.data.REGIONS.get(*k).map(|r| r.label.clone()))
            .collect()
    };
    let reg_strs: Vec<&str> = reg_labels.iter().map(|s| s.as_str()).collect();
    let region_dd = DropDown::from_strings(&reg_strs);
    if let Some(pos) = reg_keys
        .iter()
        .position(|k| *k == store.borrow().state.region)
    {
        region_dd.set_selected(pos as u32);
    }

    let read_toggle = ToggleButton::with_label("Read Mode");
    read_toggle.set_active(store.borrow().state.read_mode);

    let large_toggle = ToggleButton::with_label("A+");
    large_toggle.set_active(store.borrow().state.large_text);

    let contrast_toggle = ToggleButton::with_label("Contrast");
    contrast_toggle.set_active(store.borrow().state.high_contrast);

    let search_btn = Button::with_label("Search /");
    let lock_btn = Button::with_label("Lock Screen");

    header.pack_start(&region_dd);
    header.pack_end(&lock_btn);
    header.pack_end(&search_btn);
    header.pack_end(&contrast_toggle);
    header.pack_end(&large_toggle);
    header.pack_end(&read_toggle);

    // Main overlay for Lock Screen + Split workspace
    let overlay = Overlay::new();
    let paned = Paned::new(Orientation::Horizontal);
    paned.set_position(295);
    paned.add_css_class("ffg-root");

    // Sidebar with Brand Logo + Eyebrow + Title + Meter
    let sidebar = GtkBox::new(Orientation::Vertical, 8);
    sidebar.add_css_class("ffg-sidebar");
    sidebar.set_margin_top(12);
    sidebar.set_margin_bottom(12);
    sidebar.set_margin_start(12);
    sidebar.set_margin_end(12);

    let brand_row = GtkBox::new(Orientation::Horizontal, 10);
    brand_row.append(&brand_logo_widget(40));
    let brand_txt = GtkBox::new(Orientation::Vertical, 2);
    let eyebrow = Label::new(Some("OPEN THIS FIRST"));
    eyebrow.set_halign(Align::Start);
    eyebrow.add_css_class("ffg-eyebrow");
    let brand_lbl = Label::new(Some("Our Family Field Guide"));
    brand_lbl.set_halign(Align::Start);
    brand_lbl.set_wrap(true);
    brand_lbl.add_css_class("ffg-section-title");
    brand_txt.append(&eyebrow);
    brand_txt.append(&brand_lbl);
    brand_row.append(&brand_txt);
    sidebar.append(&brand_row);

    let progress_lbl = Label::new(None);
    progress_lbl.set_halign(Align::Start);
    progress_lbl.add_css_class("ffg-field-label");
    let progress_bar = ProgressBar::new();
    sidebar.append(&progress_lbl);
    sidebar.append(&progress_bar);

    let nav_box = GtkBox::new(Orientation::Vertical, 4);
    let nav_scroll = ScrolledWindow::builder()
        .vexpand(true)
        .child(&nav_box)
        .build();
    sidebar.append(&nav_scroll);

    let add_sec_btn = Button::with_label("+ Add Section");
    let exec_btn = Button::with_label("1-Page Executive Summary");
    let er_btn = Button::with_label("1-Page ER Grab Sheet");
    let audit_btn = Button::with_label("Readiness & Fire Drill");
    let save_bk_btn = Button::with_label("Save Locked Backup");
    let open_bk_btn = Button::with_label("Open / Merge Backup");

    sidebar.append(&add_sec_btn);
    sidebar.append(&exec_btn);
    sidebar.append(&er_btn);
    sidebar.append(&audit_btn);
    sidebar.append(&save_bk_btn);
    sidebar.append(&open_bk_btn);

    // Right pane
    let content_box = GtkBox::new(Orientation::Vertical, 14);
    content_box.set_margin_top(18);
    content_box.set_margin_bottom(28);
    content_box.set_margin_start(22);
    content_box.set_margin_end(22);
    let content_scroll = ScrolledWindow::builder()
        .hexpand(true)
        .vexpand(true)
        .child(&content_box)
        .build();

    paned.set_start_child(Some(&sidebar));
    paned.set_end_child(Some(&content_scroll));
    overlay.set_child(Some(&paned));

    // Lock screen overlay child with Brand Logo
    let lock_box = GtkBox::new(Orientation::Vertical, 12);
    lock_box.set_valign(Align::Center);
    lock_box.set_halign(Align::Center);
    lock_box.add_css_class("ffg-card");
    let lock_logo = brand_logo_widget(64);
    lock_logo.set_halign(Align::Center);
    let lock_title = Label::new(Some("Our Family Field Guide is Locked"));
    lock_title.add_css_class("ffg-title");
    let lock_sub = Label::new(Some("Enter your session lock passphrase to continue."));
    lock_sub.add_css_class("ffg-muted");
    let lock_pass_entry = PasswordEntry::builder()
        .placeholder_text("Session passphrase")
        .show_peek_icon(true)
        .build();
    let lock_err_lbl = Label::new(None);
    lock_err_lbl.add_css_class("ffg-eyebrow");
    let unlock_btn = Button::with_label("Unlock Guide");
    unlock_btn.add_css_class("suggested-action");
    lock_box.append(&lock_logo);
    lock_box.append(&lock_title);
    lock_box.append(&lock_sub);
    lock_box.append(&lock_pass_entry);
    lock_box.append(&lock_err_lbl);
    lock_box.append(&unlock_btn);
    lock_box.set_visible(false);
    overlay.add_overlay(&lock_box);

    win.set_child(Some(&overlay));

    // Build shared refresh closure cleanly inside Rc<RefCell<Option<RefreshFn>>>
    let refresh_slot: Rc<RefCell<Option<RefreshFn>>> = Rc::new(RefCell::new(None));
    let trigger_refresh: RefreshFn = {
        let slot = refresh_slot.clone();
        Rc::new(move || {
            if let Some(ref f) = *slot.borrow() {
                f();
            }
        })
    };

    let render_fn: RefreshFn = {
        let store = store.clone();
        let nav_box = nav_box.clone();
        let content_box = content_box.clone();
        let progress_bar = progress_bar.clone();
        let progress_lbl = progress_lbl.clone();
        let paned = paned.clone();
        let read_toggle = read_toggle.clone();
        let large_toggle = large_toggle.clone();
        let contrast_toggle = contrast_toggle.clone();
        let region_dd = region_dd.clone();
        let is_syncing = is_syncing.clone();
        let trigger_refresh = trigger_refresh.clone();

        Rc::new(move || {
            is_syncing.set(true);
            {
                let st = store.borrow();
                apply_accessibility_classes(&paned, st.state.large_text, st.state.high_contrast);
                read_toggle.set_active(st.state.read_mode);
                large_toggle.set_active(st.state.large_text);
                contrast_toggle.set_active(st.state.high_contrast);
                let keys = region_order();
                if let Some(pos) = keys.iter().position(|k| *k == st.state.region) {
                    region_dd.set_selected(pos as u32);
                }

                let pct = st.completion_percent();
                progress_bar.set_fraction((pct as f64 / 100.0).clamp(0.0, 1.0));
                progress_lbl.set_text(&format!(
                    "{}% FILLED · {}",
                    pct,
                    st.current_region().label.to_uppercase()
                ));
            }
            is_syncing.set(false);

            // Clear & rebuild sidebar tabs
            while let Some(c) = nav_box.first_child() {
                nav_box.remove(&c);
            }
            let (core_tabs, custom_tabs, active_tab, read_mode, is_demo) = {
                let st = store.borrow();
                (
                    st.data.TABS.clone(),
                    st.state.custom_tabs.clone(),
                    st.state.tab.clone(),
                    st.state.read_mode,
                    st.state.is_demo,
                )
            };

            for t in &core_tabs {
                let btn = Button::with_label(&t.label);
                btn.set_halign(Align::Fill);
                if t.id == active_tab {
                    btn.add_css_class("ffg-nav-active");
                }
                let tid = t.id.clone();
                let store_c = store.clone();
                let trig = trigger_refresh.clone();
                btn.connect_clicked(move |_| {
                    {
                        let mut st = store_c.borrow_mut();
                        st.state.tab = tid.clone();
                        st.save(false);
                    }
                    trig();
                });
                nav_box.append(&btn);
            }
            for ct in &custom_tabs {
                let btn = Button::with_label(&ct.label);
                btn.set_halign(Align::Fill);
                if ct.id == active_tab {
                    btn.add_css_class("ffg-nav-active");
                }
                let tid = ct.id.clone();
                let store_c = store.clone();
                let trig = trigger_refresh.clone();
                btn.connect_clicked(move |_| {
                    {
                        let mut st = store_c.borrow_mut();
                        st.state.tab = tid.clone();
                        st.save(false);
                    }
                    trig();
                });
                nav_box.append(&btn);
            }

            // Clear & rebuild right pane
            while let Some(c) = content_box.first_child() {
                content_box.remove(&c);
            }

            // Read Mode calm banner (matches Web / Apple / Android / Windows)
            if read_mode {
                let read_banner = GtkBox::new(Orientation::Horizontal, 8);
                read_banner.add_css_class("ffg-banner-read");
                let r_lbl = Label::new(Some(
                    "Read Mode — showing only filled-in answers so you can't overwrite details by accident.",
                ));
                r_lbl.set_hexpand(true);
                r_lbl.set_wrap(true);
                r_lbl.set_halign(Align::Start);
                let back_btn = Button::with_label("Back to Edit Mode");
                let store_rb = store.clone();
                let trig_rb = trigger_refresh.clone();
                back_btn.connect_clicked(move |_| {
                    {
                        let mut st = store_rb.borrow_mut();
                        st.state.read_mode = false;
                        st.save(false);
                    }
                    trig_rb();
                });
                read_banner.append(&r_lbl);
                read_banner.append(&back_btn);
                content_box.append(&read_banner);
            }

            // Demo banner
            let demo_banner = GtkBox::new(Orientation::Horizontal, 8);
            demo_banner.add_css_class(if is_demo {
                "ffg-banner-demo-active"
            } else {
                "ffg-banner-demo"
            });
            let demo_lbl = Label::new(Some(if is_demo {
                "Sample family preview — explore freely, or clear to start your own guide."
            } else {
                "New here? Preview how a filled guide looks (US + India H-1B or Standard)."
            }));
            demo_lbl.set_hexpand(true);
            demo_lbl.set_wrap(true);
            demo_lbl.set_halign(Align::Start);
            let demo_btn = Button::with_label(if is_demo {
                "Clear sample & start my guide"
            } else {
                "Load sample family"
            });
            let store_dm = store.clone();
            let trig_dm = trigger_refresh.clone();
            demo_btn.connect_clicked(move |_| {
                {
                    let mut st = store_dm.borrow_mut();
                    if st.state.is_demo {
                        st.clear_demo();
                    } else {
                        st.load_demo(false);
                    }
                }
                trig_dm();
            });
            demo_banner.append(&demo_lbl);
            demo_banner.append(&demo_btn);
            content_box.append(&demo_banner);

            // Render active core tab OR custom tab
            if let Some(tab) = core_tabs.iter().find(|t| t.id == active_tab) {
                let hdr = Label::new(Some(&tab.title));
                hdr.set_halign(Align::Start);
                hdr.add_css_class("ffg-title");
                let lede = Label::new(Some(&tab.lede));
                lede.set_halign(Align::Start);
                lede.set_wrap(true);
                lede.add_css_class("ffg-muted");
                content_box.append(&hdr);
                content_box.append(&lede);

                for b in &tab.blocks {
                    render_block(&content_box, b, &store, read_mode, &trigger_refresh);
                }

                render_extras_for_tab(&content_box, &tab.id, &store, read_mode, &trigger_refresh);
            } else if let Some(ct) = custom_tabs.iter().find(|c| c.id == active_tab) {
                let top_row = GtkBox::new(Orientation::Horizontal, 8);
                let hdr = Label::new(Some(&ct.title));
                hdr.set_halign(Align::Start);
                hdr.set_hexpand(true);
                hdr.add_css_class("ffg-title");
                top_row.append(&hdr);
                if !read_mode {
                    let del_btn = Button::with_label("Delete Section");
                    let tid_del = ct.id.clone();
                    let store_del = store.clone();
                    let trig_del = trigger_refresh.clone();
                    del_btn.connect_clicked(move |_| {
                        store_del.borrow_mut().delete_custom_section(&tid_del);
                        trig_del();
                    });
                    top_row.append(&del_btn);
                }
                content_box.append(&top_row);
                render_extras_for_tab(&content_box, &ct.id, &store, read_mode, &trigger_refresh);
            }
        })
    };

    *refresh_slot.borrow_mut() = Some(render_fn.clone());
    render_fn();

    // Wire HeaderBar controls
    {
        let store_c = store.clone();
        let is_syncing_c = is_syncing.clone();
        let trig = trigger_refresh.clone();
        region_dd.connect_selected_notify(move |dd| {
            if is_syncing_c.get() {
                return;
            }
            let keys = region_order();
            let idx = dd.selected() as usize;
            if let Some(k) = keys.get(idx) {
                {
                    let mut st = store_c.borrow_mut();
                    st.state.region = (*k).to_string();
                    st.normalize();
                    st.save(false);
                }
                trig();
            }
        });
    }

    {
        let store_c = store.clone();
        let is_syncing_c = is_syncing.clone();
        let trig = trigger_refresh.clone();
        read_toggle.connect_toggled(move |t| {
            if is_syncing_c.get() {
                return;
            }
            {
                let mut st = store_c.borrow_mut();
                st.state.read_mode = t.is_active();
                st.save(false);
            }
            trig();
        });
    }

    {
        let store_c = store.clone();
        let is_syncing_c = is_syncing.clone();
        let trig = trigger_refresh.clone();
        large_toggle.connect_toggled(move |t| {
            if is_syncing_c.get() {
                return;
            }
            {
                let mut st = store_c.borrow_mut();
                st.state.large_text = t.is_active();
                st.save(false);
            }
            trig();
        });
    }

    {
        let store_c = store.clone();
        let is_syncing_c = is_syncing.clone();
        let trig = trigger_refresh.clone();
        contrast_toggle.connect_toggled(move |t| {
            if is_syncing_c.get() {
                return;
            }
            {
                let mut st = store_c.borrow_mut();
                st.state.high_contrast = t.is_active();
                st.save(false);
            }
            trig();
        });
    }

    {
        let win_c = win.clone();
        let store_c = store.clone();
        let trig = trigger_refresh.clone();
        search_btn.connect_clicked(move |_| {
            show_search_dialog(&win_c, store_c.clone(), trig.clone());
        });
    }

    {
        let win_l = win.clone();
        let lock_box_c = lock_box.clone();
        let paned_c = paned.clone();
        let pass_store = session_lock_pass.clone();
        let entry_clear = lock_pass_entry.clone();
        let err_clear = lock_err_lbl.clone();
        lock_btn.connect_clicked(move |_| {
            let modal = Window::builder()
                .transient_for(&win_l)
                .modal(true)
                .title("Lock Session")
                .default_width(380)
                .default_height(170)
                .build();
            let vbox = GtkBox::new(Orientation::Vertical, 10);
            vbox.set_margin_top(14);
            vbox.set_margin_bottom(14);
            vbox.set_margin_start(14);
            vbox.set_margin_end(14);
            let lbl = Label::new(Some("Set a quick passphrase to lock this window:"));
            lbl.set_halign(Align::Start);
            let pw_in = PasswordEntry::builder()
                .placeholder_text("Session passphrase")
                .show_peek_icon(true)
                .build();
            let msg_lbl = Label::new(None);
            msg_lbl.add_css_class("ffg-eyebrow");
            let go_btn = Button::with_label("Lock");
            go_btn.add_css_class("suggested-action");
            go_btn.set_halign(Align::End);
            vbox.append(&lbl);
            vbox.append(&pw_in);
            vbox.append(&msg_lbl);
            vbox.append(&go_btn);
            modal.set_child(Some(&vbox));

            let modal_c = modal.clone();
            let lock_box_w = lock_box_c.clone();
            let paned_w = paned_c.clone();
            let pass_w = pass_store.clone();
            let entry_w = entry_clear.clone();
            let err_w = err_clear.clone();
            go_btn.connect_clicked(move |_| {
                let pw = pw_in.text().to_string();
                if pw.is_empty() {
                    msg_lbl.set_text("Enter a passphrase to lock.");
                    return;
                }
                *pass_w.borrow_mut() = Some(pw);
                entry_w.set_text("");
                err_w.set_text("");
                paned_w.set_visible(false);
                lock_box_w.set_visible(true);
                modal_c.close();
            });
            modal.present();
        });
    }

    {
        let lock_box_c = lock_box.clone();
        let paned_c = paned.clone();
        let pass_store = session_lock_pass.clone();
        let entry_u = lock_pass_entry.clone();
        let err_u = lock_err_lbl.clone();
        unlock_btn.connect_clicked(move |_| {
            let entered = entry_u.text().to_string();
            let matches = pass_store
                .borrow()
                .as_deref()
                .is_some_and(|expected| expected == entered);
            if matches {
                entry_u.set_text("");
                err_u.set_text("");
                lock_box_c.set_visible(false);
                paned_c.set_visible(true);
            } else {
                err_u.set_text("Wrong passphrase.");
            }
        });
    }

    // Wire Sidebar action buttons
    {
        let win_c = win.clone();
        let store_c = store.clone();
        let trig = trigger_refresh.clone();
        add_sec_btn.connect_clicked(move |_| {
            show_add_section_dialog(&win_c, store_c.clone(), trig.clone());
        });
    }

    {
        let win_c = win.clone();
        let store_c = store.clone();
        exec_btn.connect_clicked(move |_| {
            let txt = store_c.borrow().export_executive_summary_text();
            show_text_sheet_dialog(
                &win_c,
                "1-Page Executive Summary",
                "family-executive-summary.txt",
                txt,
            );
        });
    }

    {
        let win_c = win.clone();
        let store_c = store.clone();
        er_btn.connect_clicked(move |_| {
            let txt = store_c.borrow().export_er_grab_sheet_text();
            show_text_sheet_dialog(
                &win_c,
                "1-Page ER & Medical Grab Sheet",
                "er-medical-grab-sheet.txt",
                txt,
            );
        });
    }

    {
        let win_c = win.clone();
        let store_c = store.clone();
        let trig = trigger_refresh.clone();
        audit_btn.connect_clicked(move |_| {
            show_audit_dialog(&win_c, store_c.clone(), trig.clone());
        });
    }

    {
        let win_c = win.clone();
        let store_c = store.clone();
        let trig = trigger_refresh.clone();
        save_bk_btn.connect_clicked(move |_| {
            show_save_backup_dialog(&win_c, store_c.clone(), trig.clone());
        });
    }

    {
        let win_c = win.clone();
        let store_c = store.clone();
        let trig = trigger_refresh.clone();
        open_bk_btn.connect_clicked(move |_| {
            show_open_merge_dialog(&win_c, store_c.clone(), trig.clone());
        });
    }

    win.present();
}

fn render_block(
    parent: &GtkBox,
    b: &BlockDef,
    store: &SharedStore,
    read_mode: bool,
    trigger_refresh: &RefreshFn,
) {
    let card = GtkBox::new(Orientation::Vertical, 10);
    card.add_css_class(if b.block_type == "glance" {
        "ffg-glance-card"
    } else {
        "ffg-card"
    });

    if let Some(ref title) = b.title {
        let t = Label::new(Some(title));
        t.set_halign(Align::Start);
        t.add_css_class("ffg-section-title");
        card.append(&t);
    }

    match b.block_type.as_str() {
        "glance" => {
            if b.title.is_none() {
                let t = Label::new(Some("If you read nothing else"));
                t.set_halign(Align::Start);
                t.add_css_class("ffg-section-title");
                card.append(&t);
            }
            let glance_items = store.borrow().data.GLANCE.clone();
            let grid = Grid::builder().column_spacing(12).row_spacing(10).build();
            let mut idx = 0i32;
            for g in glance_items {
                let raw_f = FieldDef {
                    id: g.id.clone(),
                    label: g.label.clone(),
                    placeholder: g.placeholder.clone(),
                    wide: false,
                };
                let rf = store.borrow().localized_field(&raw_f);
                let val = store
                    .borrow()
                    .state
                    .f
                    .get(&rf.id)
                    .cloned()
                    .unwrap_or_default();
                if read_mode && val.trim().is_empty() {
                    continue;
                }
                let cell = make_field_widget(&rf, &val, read_mode, store);
                grid.attach(&cell, idx % 2, idx / 2, 1, 1);
                idx += 1;
            }
            if idx == 0 && read_mode {
                let empty = Label::new(Some("No quick-glance answers filled yet."));
                empty.add_css_class("ffg-field-label");
                empty.set_halign(Align::Start);
                card.append(&empty);
            } else {
                card.append(&grid);
            }
        }
        "playbook" => {
            render_playbook(&card, store, trigger_refresh);
        }
        "fields" => {
            let raw_fields = b.fields.clone().unwrap_or_default();
            let mut shown = 0usize;
            for raw_f in raw_fields {
                let rf = store.borrow().localized_field(&raw_f);
                let val = store
                    .borrow()
                    .state
                    .f
                    .get(&rf.id)
                    .cloned()
                    .unwrap_or_default();
                if read_mode && val.trim().is_empty() {
                    continue;
                }
                card.append(&make_field_widget(&rf, &val, read_mode, store));
                shown += 1;
            }
            if shown == 0 && read_mode {
                return;
            }
        }
        "list" => {
            let bid = b.id.clone().unwrap_or_else(|| b.stable_id());
            let (hint, sugs, cols) = store.borrow().localized_list(b);
            render_list_block(
                &card,
                &bid,
                hint.as_deref(),
                &sugs,
                &cols,
                b.suggest_col.as_deref(),
                store,
                read_mode,
                trigger_refresh,
            );
        }
        "money_guide" => {
            let (mg_cards, region_label, reg_mg) = {
                let st = store.borrow();
                (
                    st.data.MONEY_GUIDE.clone(),
                    st.current_region().label.clone(),
                    st.current_region().money_guide.clone(),
                )
            };
            if let Some(rmg) = reg_mg {
                let reg_box = GtkBox::new(Orientation::Vertical, 4);
                reg_box.add_css_class("ffg-banner-ok");
                let cap = rmg.deposit_cap.as_deref().unwrap_or("");
                let tax = rmg.tax_note.as_deref().unwrap_or("");
                let stitle = rmg.sample_title.as_deref().unwrap_or(&region_label);
                let hdr = Label::new(Some(&format!("{region_label} — {stitle}")));
                hdr.set_halign(Align::Start);
                hdr.add_css_class("ffg-section-title");
                let sub = Label::new(Some(&format!("Deposit insurance: {cap}\nTax note: {tax}")));
                sub.set_halign(Align::Start);
                sub.set_wrap(true);
                reg_box.append(&hdr);
                reg_box.append(&sub);
                if let Some(lines) = rmg.sample_lines {
                    for l in lines {
                        let ln = Label::new(Some(&format!("• {l}")));
                        ln.set_halign(Align::Start);
                        ln.set_wrap(true);
                        reg_box.append(&ln);
                    }
                }
                card.append(&reg_box);
            }
            for gc in mg_cards {
                render_guide_card(&card, &gc);
            }
        }
        "pro_finder" => {
            let (pf_cards, region_label, reg_pf) = {
                let st = store.borrow();
                (
                    st.data.PRO_FINDER.clone(),
                    st.current_region().label.clone(),
                    st.current_region().pro_finder.clone(),
                )
            };
            if let Some(rpf) = reg_pf {
                let reg_box = GtkBox::new(Orientation::Vertical, 4);
                reg_box.add_css_class("ffg-banner-ok");
                let hdr = Label::new(Some(&format!("Official Directories ({region_label})")));
                hdr.set_halign(Align::Start);
                hdr.add_css_class("ffg-section-title");
                reg_box.append(&hdr);
                for (lbl, v) in [
                    ("Legal", rpf.legal.as_deref()),
                    ("Immigration", rpf.visa.as_deref()),
                    ("Fee-Only Money", rpf.money.as_deref()),
                    ("Free Tax Help", rpf.tax.as_deref()),
                ] {
                    if let Some(text) = v {
                        let ln = Label::new(Some(&format!("• {lbl}: {text}")));
                        ln.set_halign(Align::Start);
                        ln.set_wrap(true);
                        reg_box.append(&ln);
                    }
                }
                card.append(&reg_box);
            }
            for pc in pf_cards {
                render_guide_card(&card, &pc);
            }
        }
        "scripts" => {
            let scripts = store.borrow().data.SCRIPTS.clone();
            for sc in scripts {
                let sc_box = Frame::new(None);
                let inner = GtkBox::new(Orientation::Vertical, 6);
                inner.set_margin_top(8);
                inner.set_margin_bottom(8);
                inner.set_margin_start(8);
                inner.set_margin_end(8);
                let t = Label::new(Some(&sc.title.to_uppercase()));
                t.set_halign(Align::Start);
                t.add_css_class("ffg-field-label");
                let b_lbl = Label::new(Some(&sc.body));
                b_lbl.set_halign(Align::Start);
                b_lbl.set_wrap(true);
                b_lbl.add_css_class("ffg-script-body");
                let cp = Button::with_label("Copy Script");
                cp.set_halign(Align::Start);
                let body_c = sc.body.clone();
                cp.connect_clicked(move |_| copy_to_clipboard(&body_c));
                inner.append(&t);
                inner.append(&b_lbl);
                inner.append(&cp);
                sc_box.set_child(Some(&inner));
                card.append(&sc_box);
            }
        }
        "letter" => {
            let val = store
                .borrow()
                .state
                .f
                .get("letter")
                .cloned()
                .unwrap_or_default();
            let rf = FieldDef {
                id: "letter".to_string(),
                label: "Personal Letter to Your Family".to_string(),
                placeholder: "Write anything you'd want your spouse or kids to hear directly from you...".to_string(),
                wide: true,
            };
            card.append(&make_field_widget(&rf, &val, read_mode, store));
        }
        "kids" => {
            let kids = store.borrow().data.KIDS.clone();
            for k in kids {
                let val = store
                    .borrow()
                    .state
                    .f
                    .get(&k.id)
                    .cloned()
                    .unwrap_or_default();
                if read_mode && val.trim().is_empty() {
                    continue;
                }
                let rf = FieldDef {
                    id: k.id,
                    label: format!("{} {}", k.emoji, k.label),
                    placeholder: k.placeholder,
                    wide: true,
                };
                card.append(&make_field_widget(&rf, &val, read_mode, store));
            }
        }
        _ => {}
    }

    parent.append(&card);
}

fn render_playbook(card: &GtkBox, store: &SharedStore, trigger_refresh: &RefreshFn) {
    let track_bar = GtkBox::new(Orientation::Horizontal, 6);
    let current_track = store.borrow().state.track.clone();
    let pb_map = store.borrow().data.PLAYBOOK.clone();

    for key in playbook_order() {
        if let Some(pb) = pb_map.get(key) {
            let btn = Button::with_label(&pb.label);
            if key == current_track {
                btn.add_css_class("ffg-track-active");
            }
            let k = key.to_string();
            let store_c = store.clone();
            let trig = trigger_refresh.clone();
            btn.connect_clicked(move |_| {
                {
                    let mut st = store_c.borrow_mut();
                    st.state.track = k.clone();
                    st.save(false);
                }
                trig();
            });
            track_bar.append(&btn);
        }
    }
    let track_scroll = ScrolledWindow::builder()
        .vscrollbar_policy(gtk4::PolicyType::Never)
        .child(&track_bar)
        .build();
    card.append(&track_scroll);

    if let Some(pb) = pb_map.get(&current_track) {
        for phase in &pb.phases {
            let ph_lbl = Label::new(Some(&phase.when));
            ph_lbl.set_halign(Align::Start);
            ph_lbl.add_css_class("ffg-phase-title");
            ph_lbl.set_margin_top(6);
            card.append(&ph_lbl);

            for raw_step in &phase.steps {
                let step = store.borrow().localized_step(raw_step);
                let row = GtkBox::new(Orientation::Vertical, 2);
                let top = GtkBox::new(Orientation::Horizontal, 8);
                let checked = *store.borrow().state.checks.get(&step.id).unwrap_or(&false);
                let cb = CheckButton::with_label(&step.t);
                cb.set_active(checked);
                cb.set_hexpand(true);
                let sid = step.id.clone();
                let store_cb = store.clone();
                cb.connect_toggled(move |b| {
                    let mut st = store_cb.borrow_mut();
                    st.state.checks.insert(sid.clone(), b.is_active());
                    st.save(true);
                });
                top.append(&cb);

                if let (Some(rlbl), Some(rtab)) = (step.ref_label.clone(), step.ref_tab.clone()) {
                    let jump = Button::with_label(&format!("↳ {rlbl}"));
                    jump.add_css_class("flat");
                    let store_j = store.clone();
                    let trig_j = trigger_refresh.clone();
                    jump.connect_clicked(move |_| {
                        {
                            let mut st = store_j.borrow_mut();
                            st.state.tab = rtab.clone();
                            st.save(false);
                        }
                        trig_j();
                    });
                    top.append(&jump);
                }

                let det = Label::new(Some(&step.d));
                det.set_halign(Align::Start);
                det.set_wrap(true);
                det.set_margin_start(26);
                det.add_css_class("ffg-muted");
                row.append(&top);
                row.append(&det);
                card.append(&row);
            }
        }
    }
}

fn render_guide_card(parent: &GtkBox, gc: &GuideCard) {
    let box_card = Frame::new(None);
    let inner = GtkBox::new(Orientation::Vertical, 4);
    inner.set_margin_top(8);
    inner.set_margin_bottom(8);
    inner.set_margin_start(10);
    inner.set_margin_end(10);

    let title = Label::new(Some(&format!("[{}] {}", gc.badge, gc.title)));
    title.set_halign(Align::Start);
    title.set_wrap(true);
    title.add_css_class("ffg-section-title");
    inner.append(&title);

    let sum = Label::new(Some(&gc.summary));
    sum.set_halign(Align::Start);
    sum.set_wrap(true);
    inner.append(&sum);

    for b in &gc.bullets {
        let bl = Label::new(Some(&format!("• {b}")));
        bl.set_halign(Align::Start);
        bl.set_wrap(true);
        bl.add_css_class("ffg-muted");
        inner.append(&bl);
    }
    if let Some(ref note) = gc.note {
        let nl = Label::new(Some(&format!("Note: {note}")));
        nl.set_halign(Align::Start);
        nl.set_wrap(true);
        nl.add_css_class("ffg-muted");
        inner.append(&nl);
    }

    box_card.set_child(Some(&inner));
    parent.append(&box_card);
}

fn make_field_widget(
    rf: &FieldDef,
    val: &str,
    read_mode: bool,
    store: &SharedStore,
) -> GtkBox {
    let vbox = GtkBox::new(Orientation::Vertical, 4);
    vbox.set_hexpand(true);
    let lbl = Label::new(Some(&rf.label.to_uppercase()));
    lbl.set_halign(Align::Start);
    lbl.set_wrap(true);
    lbl.add_css_class("ffg-field-label");
    vbox.append(&lbl);

    if read_mode {
        let v = Label::new(Some(val));
        v.set_halign(Align::Start);
        v.set_wrap(true);
        v.set_selectable(true);
        vbox.append(&v);
        return vbox;
    }

    let fid = rf.id.clone();
    let store_c = store.clone();
    if rf.wide {
        let tv = TextView::builder()
            .wrap_mode(WrapMode::WordChar)
            .hexpand(true)
            .build();
        tv.set_size_request(-1, 74);
        tv.buffer().set_text(val);
        tv.buffer().connect_changed(move |buf| {
            let (s, e) = buf.bounds();
            let text = buf.text(&s, &e, false).to_string();
            let mut st = store_c.borrow_mut();
            st.state.f.insert(fid.clone(), text);
            st.save(true);
        });
        let frame = Frame::new(None);
        frame.set_child(Some(&tv));
        vbox.append(&frame);
    } else {
        let entry = Entry::builder()
            .placeholder_text(&rf.placeholder)
            .hexpand(true)
            .build();
        entry.set_text(val);
        entry.connect_changed(move |e| {
            let mut st = store_c.borrow_mut();
            st.state.f.insert(fid.clone(), e.text().to_string());
            st.save(true);
        });
        vbox.append(&entry);
    }
    vbox
}

fn render_list_block(
    card: &GtkBox,
    bid: &str,
    hint: Option<&str>,
    sugs: &[String],
    cols: &[ColDef],
    suggest_col: Option<&str>,
    store: &SharedStore,
    read_mode: bool,
    trigger_refresh: &RefreshFn,
) {
    if let Some(h) = hint {
        let hl = Label::new(Some(h));
        hl.set_halign(Align::Start);
        hl.set_wrap(true);
        hl.add_css_class("ffg-muted");
        card.append(&hl);
    }

    if !read_mode && !sugs.is_empty() {
        let sug_bar = GtkBox::new(Orientation::Horizontal, 6);
        let scol = suggest_col
            .map(str::to_string)
            .or_else(|| cols.first().map(|c| c.key.clone()))
            .unwrap_or_default();
        for s in sugs {
            let chip = Button::with_label(&format!("+ {s}"));
            chip.add_css_class("ffg-pill");
            let bid_c = bid.to_string();
            let scol_c = scol.clone();
            let s_val = s.clone();
            let store_c = store.clone();
            let trig = trigger_refresh.clone();
            chip.connect_clicked(move |_| {
                {
                    let mut st = store_c.borrow_mut();
                    let rows = st.state.lists.entry(bid_c.clone()).or_default();
                    let mut nr = HashMap::new();
                    nr.insert(scol_c.clone(), s_val.clone());
                    rows.push(nr);
                    st.save(true);
                }
                trig();
            });
            sug_bar.append(&chip);
        }
        let sug_scroll = ScrolledWindow::builder()
            .vscrollbar_policy(gtk4::PolicyType::Never)
            .child(&sug_bar)
            .build();
        card.append(&sug_scroll);
    }

    let rows = store
        .borrow()
        .state
        .lists
        .get(bid)
        .cloned()
        .unwrap_or_else(|| vec![HashMap::new()]);

    for (r_idx, row) in rows.iter().enumerate() {
        if read_mode && !store.borrow().is_row_user_edited(bid, row) {
            continue;
        }
        let row_box = GtkBox::new(Orientation::Horizontal, 6);
        for col in cols {
            let val = row.get(&col.key).map(|s| s.as_str()).unwrap_or("");
            if read_mode {
                let col_box = GtkBox::new(Orientation::Vertical, 1);
                col_box.set_hexpand(true);
                let cl = Label::new(Some(&col.label.to_uppercase()));
                cl.add_css_class("ffg-field-label");
                cl.set_halign(Align::Start);
                let vl = Label::new(Some(if val.is_empty() { "—" } else { val }));
                vl.set_halign(Align::Start);
                vl.set_wrap(true);
                col_box.append(&cl);
                col_box.append(&vl);
                row_box.append(&col_box);
            } else {
                let entry = Entry::builder()
                    .placeholder_text(&col.label)
                    .hexpand(true)
                    .build();
                entry.set_text(val);
                let store_c = store.clone();
                let bid_c = bid.to_string();
                let ck = col.key.clone();
                entry.connect_changed(move |e| {
                    let mut st = store_c.borrow_mut();
                    let list = st.state.lists.entry(bid_c.clone()).or_default();
                    while list.len() <= r_idx {
                        list.push(HashMap::new());
                    }
                    list[r_idx].insert(ck.clone(), e.text().to_string());
                    st.save(true);
                });
                row_box.append(&entry);
            }
        }
        if !read_mode && rows.len() > 1 {
            let del = Button::with_label("×");
            let store_d = store.clone();
            let bid_d = bid.to_string();
            let trig_d = trigger_refresh.clone();
            del.connect_clicked(move |_| {
                {
                    let mut st = store_d.borrow_mut();
                    if let Some(list) = st.state.lists.get_mut(&bid_d) {
                        if r_idx < list.len() {
                            list.remove(r_idx);
                        }
                        if list.is_empty() {
                            list.push(HashMap::new());
                        }
                    }
                    st.save(true);
                }
                trig_d();
            });
            row_box.append(&del);
        }
        card.append(&row_box);
    }

    if !read_mode {
        let add_btn = Button::with_label("+ Add Row");
        add_btn.set_halign(Align::Start);
        let store_a = store.clone();
        let bid_a = bid.to_string();
        let trig_a = trigger_refresh.clone();
        add_btn.connect_clicked(move |_| {
            {
                let mut st = store_a.borrow_mut();
                st.state
                    .lists
                    .entry(bid_a.clone())
                    .or_default()
                    .push(HashMap::new());
                st.save(true);
            }
            trig_a();
        });
        card.append(&add_btn);
    }
}

fn render_extras_for_tab(
    parent: &GtkBox,
    tab_id: &str,
    store: &SharedStore,
    read_mode: bool,
    trigger_refresh: &RefreshFn,
) {
    let extras = store
        .borrow()
        .state
        .extra
        .get(tab_id)
        .cloned()
        .unwrap_or_default();
    if extras.is_empty() {
        return;
    }
    let card = GtkBox::new(Orientation::Vertical, 10);
    card.add_css_class("ffg-card");
    for x in extras {
        if x.item_type == "field" {
            let rf = FieldDef {
                id: x.id.clone(),
                label: x.label.clone().unwrap_or_else(|| "Note".to_string()),
                placeholder: String::new(),
                wide: x.wide.unwrap_or(false),
            };
            let val = store
                .borrow()
                .state
                .f
                .get(&rf.id)
                .cloned()
                .unwrap_or_default();
            if read_mode && val.trim().is_empty() {
                continue;
            }
            card.append(&make_field_widget(&rf, &val, read_mode, store));
        } else {
            let t = Label::new(Some(x.title.as_deref().unwrap_or("Custom Table")));
            t.set_halign(Align::Start);
            t.add_css_class("ffg-section-title");
            card.append(&t);
            let cols = x.cols.unwrap_or_default();
            render_list_block(
                &card,
                &x.id,
                None,
                &[],
                &cols,
                None,
                store,
                read_mode,
                trigger_refresh,
            );
        }
    }
    parent.append(&card);
}

fn main() {
    let app = Application::builder().application_id(APP_ID).build();
    app.connect_activate(build_ui);
    app.run();
}
