use std::f64::consts::PI;

use gtk4::cairo;
use gtk4::gdk;
use gtk4::gdk::prelude::DisplayExt;
use gtk4::prelude::{DrawingAreaExtManual, WidgetExt};
use gtk4::{CssProvider, DrawingArea, Widget};

pub const WARM_PAPER_CSS: &str = r#"
window, .ffg-root {
    background-color: #F6F1E6;
    color: #1F3A2E;
    font-family: "Avenir Next", "Gill Sans", "Trebuchet MS", Ubuntu, Cantarell, sans-serif;
}

.ffg-sidebar {
    background-color: #EFE7D6;
    border-right: 1px solid #D9CFB9;
}

.ffg-card {
    background-color: #FFFDF8;
    border: 1px solid #D9CFB9;
    border-radius: 8px;
    padding: 16px;
}

.ffg-glance-card {
    background-color: #1F3A2E;
    color: #F6F1E6;
    border: 2px solid #D2512F;
    border-radius: 8px;
    padding: 18px;
}

.ffg-glance-card .ffg-section-title {
    color: #F6F1E6;
}

.ffg-glance-card .ffg-field-label {
    color: #D9CFB9;
}

.ffg-glance-card entry {
    background-color: #294A3B;
    color: #F6F1E6;
    border-color: #4A6458;
}

.ffg-banner-demo {
    background-color: #EEF5EE;
    border-left: 4px solid #2E6F5E;
    border-radius: 6px;
    padding: 12px;
}

.ffg-banner-demo-active {
    background-color: #FFF3DD;
    border-left: 4px solid #D2512F;
    border-radius: 6px;
    padding: 12px;
}

.ffg-banner-read {
    background-color: #E7F0F2;
    border-left: 4px solid #4F7C8A;
    border-radius: 6px;
    padding: 12px;
}

.ffg-banner-alert {
    background-color: #FFF5F2;
    border: 2px solid #D2512F;
    border-radius: 8px;
    padding: 12px;
}

.ffg-banner-ok {
    background-color: #FBF3DF;
    border-left: 4px solid #E9B44C;
    border-radius: 6px;
    padding: 12px;
}

.ffg-eyebrow {
    font-family: ui-monospace, "SF Mono", "Ubuntu Mono", "DejaVu Sans Mono", monospace;
    font-size: 10px;
    letter-spacing: 0.1em;
    color: #D2512F;
    font-weight: 700;
}

.ffg-title {
    font-family: "Iowan Old Style", "Palatino Linotype", "URW Bookman", Georgia, serif;
    font-size: 24px;
    font-weight: 700;
    color: #1F3A2E;
}

.ffg-section-title {
    font-family: "Iowan Old Style", "Palatino Linotype", "URW Bookman", Georgia, serif;
    font-size: 18px;
    font-weight: 700;
    color: #1F3A2E;
}

.ffg-phase-title {
    font-family: "Iowan Old Style", "Palatino Linotype", "URW Bookman", Georgia, serif;
    font-style: italic;
    font-size: 18px;
    font-weight: 600;
    color: #D2512F;
}

.ffg-script-body {
    font-family: "Iowan Old Style", "Palatino Linotype", "URW Bookman", Georgia, serif;
    font-style: italic;
    font-size: 14px;
    color: #1F3A2E;
}

.ffg-field-label {
    font-family: ui-monospace, "SF Mono", "Ubuntu Mono", "DejaVu Sans Mono", monospace;
    font-size: 10px;
    letter-spacing: 0.06em;
    color: #4B5F55;
    font-weight: 700;
}

.ffg-muted {
    color: #4B5F55;
    font-size: 12px;
}

.ffg-subtle {
    color: #8A8F84;
    font-size: 11.5px;
}

.ffg-badge-high {
    background-color: #D2512F;
    color: #FFFFFF;
    border-radius: 6px;
    padding: 2px 8px;
    font-family: ui-monospace, monospace;
    font-size: 11px;
    font-weight: 700;
}

.ffg-badge-med {
    background-color: #E9B44C;
    color: #1F3A2E;
    border-radius: 6px;
    padding: 2px 8px;
    font-family: ui-monospace, monospace;
    font-size: 11px;
    font-weight: 700;
}

.ffg-badge-ok {
    background-color: #2E6F5E;
    color: #FFFFFF;
    border-radius: 6px;
    padding: 2px 8px;
    font-family: ui-monospace, monospace;
    font-size: 11px;
    font-weight: 700;
}

.ffg-nav-active {
    background-color: #1F3A2E;
    color: #F6F1E6;
    font-weight: 600;
}

.ffg-track-active {
    background-color: #D2512F;
    color: #FFFFFF;
    font-weight: 700;
}

.ffg-pill {
    border-radius: 999px;
    padding: 4px 10px;
    font-size: 12px;
    border: 1px dashed #D9CFB9;
}

.large-text * {
    font-size: 114%;
}

.high-contrast,
.high-contrast .ffg-card,
.high-contrast .ffg-sidebar {
    background-color: #FFFFFF;
    color: #0B1410;
    border-color: #333333;
}

.high-contrast .ffg-muted,
.high-contrast .ffg-field-label {
    color: #1C2822;
}
"#;

pub fn install_css() {
    let provider = CssProvider::new();
    provider.load_from_string(WARM_PAPER_CSS);
    if let Some(display) = gdk::Display::default() {
        gtk4::style_context_add_provider_for_display(
            &display,
            &provider,
            gtk4::STYLE_PROVIDER_PRIORITY_APPLICATION,
        );
    }
}

pub fn copy_to_clipboard(text: &str) {
    if let Some(display) = gdk::Display::default() {
        display.clipboard().set_text(text);
    }
}

pub fn apply_accessibility_classes(root: &impl gtk4::prelude::IsA<Widget>, large: bool, hc: bool) {
    if large {
        root.add_css_class("large-text");
    } else {
        root.remove_css_class("large-text");
    }
    if hc {
        root.add_css_class("high-contrast");
    } else {
        root.remove_css_class("high-contrast");
    }
}

fn rounded_rect(cr: &cairo::Context, x: f64, y: f64, w: f64, h: f64, r: f64) {
    cr.new_sub_path();
    cr.arc(x + w - r, y + r, r, -PI / 2.0, 0.0);
    cr.arc(x + w - r, y + h - r, r, 0.0, PI / 2.0);
    cr.arc(x + r, y + h - r, r, PI / 2.0, PI);
    cr.arc(x + r, y + r, r, PI, 3.0 * PI / 2.0);
    cr.close_path();
}

/// Renders the canonical `icon.svg` house-with-heart badge via Cairo.
pub fn brand_logo_widget(size: i32) -> DrawingArea {
    let area = DrawingArea::builder()
        .content_width(size)
        .content_height(size)
        .build();
    area.set_draw_func(move |_area, cr, width, height| {
        let s = (width.min(height) as f64) / 128.0;
        cr.scale(s, s);

        // #F6F1E6 rounded paper badge
        rounded_rect(cr, 0.0, 0.0, 128.0, 128.0, 28.0);
        cr.set_source_rgb(0xF6 as f64 / 255.0, 0xF1 as f64 / 255.0, 0xE6 as f64 / 255.0);
        let _ = cr.fill();

        // #1F3A2E border
        rounded_rect(cr, 8.0, 8.0, 112.0, 112.0, 22.0);
        cr.set_source_rgb(0x1F as f64 / 255.0, 0x3A as f64 / 255.0, 0x2E as f64 / 255.0);
        cr.set_line_width(6.0);
        let _ = cr.stroke();

        // #FFFDF8 house with #1F3A2E stroke
        cr.move_to(64.0, 26.0);
        cr.line_to(28.0, 54.0);
        cr.line_to(28.0, 98.0);
        cr.line_to(100.0, 98.0);
        cr.line_to(100.0, 54.0);
        cr.close_path();
        cr.set_source_rgb(1.0, 0xFD as f64 / 255.0, 0xF8 as f64 / 255.0);
        let _ = cr.fill_preserve();
        cr.set_source_rgb(0x1F as f64 / 255.0, 0x3A as f64 / 255.0, 0x2E as f64 / 255.0);
        cr.set_line_width(5.0);
        cr.set_line_join(cairo::LineJoin::Round);
        let _ = cr.stroke();

        // #D2512F heart
        cr.move_to(64.0, 84.0);
        cr.curve_to(53.0, 76.5, 46.0, 70.0, 46.0, 62.0);
        cr.arc(55.0, 62.0, 9.0, PI, 0.0);
        cr.arc(73.0, 62.0, 9.0, PI, 0.0);
        cr.curve_to(82.0, 70.0, 75.0, 76.5, 64.0, 84.0);
        cr.close_path();
        cr.set_source_rgb(0xD2 as f64 / 255.0, 0x51 as f64 / 255.0, 0x2F as f64 / 255.0);
        let _ = cr.fill();
    });
    area
}
