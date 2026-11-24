use gtk4::gdk;
use gtk4::{CssProvider, Widget};

pub const WARM_PAPER_CSS: &str = r#"
window, .ffg-root {
    background-color: #FAF8F3;
    color: #1F2421;
}

.ffg-sidebar {
    background-color: #F4EFE4;
    border-right: 1px solid #E5DFD3;
}

.ffg-card {
    background-color: #FFFFFF;
    border: 1px solid #E5DFD3;
    border-radius: 12px;
    padding: 16px;
}

.ffg-banner-demo {
    background-color: #EEF3FA;
    border: 1px solid #C6D5EC;
    border-radius: 10px;
    padding: 12px;
}

.ffg-banner-alert {
    background-color: #FDF1EE;
    border: 1px solid #E8BFB6;
    border-radius: 10px;
    padding: 12px;
}

.ffg-banner-ok {
    background-color: #EFF7F4;
    border: 1px solid #BCE0D3;
    border-radius: 10px;
    padding: 12px;
}

.ffg-title {
    font-size: 20px;
    font-weight: 700;
    color: #1F3A5F;
}

.ffg-section-title {
    font-size: 16px;
    font-weight: 700;
    color: #1F3A5F;
}

.ffg-muted {
    color: #6B655B;
    font-size: 12px;
}

.ffg-badge-high {
    background-color: #B84A39;
    color: #FFFFFF;
    border-radius: 6px;
    padding: 2px 8px;
    font-size: 11px;
    font-weight: 700;
}

.ffg-badge-med {
    background-color: #C77D22;
    color: #FFFFFF;
    border-radius: 6px;
    padding: 2px 8px;
    font-size: 11px;
    font-weight: 700;
}

.ffg-badge-ok {
    background-color: #2E6F5E;
    color: #FFFFFF;
    border-radius: 6px;
    padding: 2px 8px;
    font-size: 11px;
    font-weight: 700;
}

.ffg-nav-active {
    background-color: #1F3A5F;
    color: #FFFFFF;
    font-weight: 600;
}

.ffg-pill {
    border-radius: 999px;
    padding: 4px 10px;
    font-size: 12px;
}

.large-text * {
    font-size: 112%;
}

.high-contrast,
.high-contrast .ffg-card,
.high-contrast .ffg-sidebar {
    background-color: #FFFFFF;
    color: #000000;
    border-color: #000000;
}

.high-contrast .ffg-muted {
    color: #1F2421;
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
