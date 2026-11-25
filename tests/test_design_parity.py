#!/usr/bin/env python3
"""
Cross-platform design, branding, typography, UX parity, and resource-sync
audit across all 6 Our Family Field Guide apps (Web, macOS, iOS, Android,
Windows, Linux). Zero external dependencies.
"""
import json
import os
import re
import struct
import sys
import tomllib
import xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "shared"))
import sync_schema  # noqa: E402


def rel_lum(hex_color):
    h = hex_color.lstrip("#")
    rgb = [int(h[i : i + 2], 16) / 255.0 for i in (0, 2, 4)]
    lin = [c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4 for c in rgb]
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]


def contrast_ratio(fg, bg):
    l1, l2 = rel_lum(fg), rel_lum(bg)
    return (max(l1, l2) + 0.05) / (min(l1, l2) + 0.05)


def read(rel):
    with open(os.path.join(ROOT, rel), "r", encoding="utf-8") as f:
        return f.read()


def read_bytes(rel):
    with open(os.path.join(ROOT, rel), "rb") as f:
        return f.read()


def main():
    tokens = json.loads(read("shared/design-tokens.json"))
    colors = tokens["colors"]
    core_hex = ["paper", "paper2", "card", "ink", "ink2", "mute", "rule", "tomato", "sun", "sky"]

    # 1. Byte-identical shared schema across Web export + all 4 native platforms
    schema_paths = [
        "shared/guide-data.json",
        "native/apple/Sources/FamilyGuideCore/Resources/guide-data.json",
        "native/android/app/src/main/assets/guide-data.json",
        "native/windows/FamilyGuide.Core/Resources/guide-data.json",
        "native/linux/crates/core/assets/guide-data.json",
    ]
    ref_bytes = read_bytes(schema_paths[0])
    for sp in schema_paths:
        assert read_bytes(sp) == ref_bytes, f"guide-data.json out of sync: {sp}"
    gd = json.loads(ref_bytes)
    live_parsed = {}
    for js_rel in ["schema.js", "regions.js"]:
        live_parsed.update(sync_schema._JsStaticParser(read(js_rel)).parse_top_level())
    live_payload = {k: live_parsed[k] for k in sync_schema.EXPORT_KEYS}
    assert live_payload == gd, "shared/guide-data.json has drifted from schema.js / regions.js! Run python3 shared/sync_schema.py"
    assert len(gd["DICE_WORDS"]) >= 2048 and len(set(gd["DICE_WORDS"])) == len(gd["DICE_WORDS"]), "DICE_WORDS must have >=2048 unique words"
    for rk, rv in gd["REGIONS"].items():
        assert rv.get("lastVerified"), f"Region {rk} missing lastVerified date"
    assert set(tokens["ordering"]["regions"]) == set(gd["REGIONS"].keys()), "region ordering mismatch"
    assert set(tokens["ordering"]["playbooks"]) == set(gd["PLAYBOOK"].keys()), "playbook ordering mismatch"
    for rk in tokens["ordering"]["regions"]:
        assert f'"{rk}"' in read("native/apple/Sources/FamilyGuideUI/Theme.swift"), f"Apple missing region {rk}"
        assert f'"{rk}"' in read("native/android/app/src/main/java/io/github/dineshkumarponnusamy/familyfieldguide/ui/Theme.kt"), f"Android missing region {rk}"
        assert f'"{rk}"' in read("native/windows/FamilyGuide.Windows/MainWindow.xaml.cs"), f"Windows missing region {rk}"
        assert f'"{rk}"' in read("native/linux/crates/gtk-app/src/main.rs"), f"Linux missing region {rk}"
    for pk in tokens["ordering"]["playbooks"]:
        assert f'"{pk}"' in read("native/apple/Sources/FamilyGuideUI/Theme.swift"), f"Apple missing playbook {pk}"
        assert f'"{pk}"' in read("native/android/app/src/main/java/io/github/dineshkumarponnusamy/familyfieldguide/ui/Theme.kt"), f"Android missing playbook {pk}"
        assert f'"{pk}"' in read("native/windows/FamilyGuide.Windows/MainWindow.xaml.cs"), f"Windows missing playbook {pk}"
        assert f'"{pk}"' in read("native/linux/crates/gtk-app/src/main.rs"), f"Linux missing playbook {pk}"

    # 2. Web app palette, fonts, masthead logo, and UX controls
    web_css = read("styles.css").lower()
    web_html = read("index.html")
    for k in core_hex:
        assert colors[k].lower() in web_css, f"Web CSS missing canonical color {k}: {colors[k]}"
    assert "--serif" in web_css and "--sans" in web_css and "--mono" in web_css
    assert "icon.svg" in web_html and "mast-logo" in web_html
    assert "toggleLarge" in web_html and "toggleContrast" in web_html
    assert "Content-Security-Policy" in web_html and 'role="tablist"' in web_html and 'aria-live="polite"' in web_html

    # WCAG 2.1 AA contrast checks on default web tokens & styles.css
    assert contrast_ratio(colors["ink"], colors["paper"]) >= 4.5
    assert contrast_ratio(colors["ink2"], colors["paper"]) >= 4.5
    assert contrast_ratio(colors["mute"], colors["paper"]) >= 4.5
    assert contrast_ratio(colors["mute"], colors["card"]) >= 4.5
    assert contrast_ratio(colors["tomatoInk"], colors["paper"]) >= 4.5
    assert contrast_ratio("#FFFFFF", colors["tomatoInk"]) >= 4.5
    m_ph = re.search(r"input::placeholder[^{]*\{[^}]*color:\s*(#[0-9a-f]{6})", web_css)
    assert m_ph and contrast_ratio(m_ph.group(1), colors["card"]) >= 4.5, "Placeholder fails WCAG AA"
    m_gl_ph = re.search(r"\.glance input::placeholder[^{]*\{[^}]*color:\s*(#[0-9a-f]{6})", web_css)
    assert m_gl_ph and contrast_ratio(m_gl_ph.group(1), colors["ink"]) >= 4.5, "Glance placeholder fails WCAG AA"
    assert ":focus-visible" in web_css.split("body.high-contrast")[0], "Missing default :focus-visible outline"
    assert "flex-wrap:nowrap;overflow-x:auto" in web_css and "body.mobile-editing nav.tabs" in web_css, "Mobile tab bar must stay single-row scrollable and unstick while editing"

    # 3. Apple (macOS + iOS) palette, serif/mono fonts, BrandLogoView, UX parity
    apple_theme = read("native/apple/Sources/FamilyGuideUI/Theme.swift")
    apple_root = read("native/apple/Sources/FamilyGuideUI/RootView.swift")
    apple_tab = read("native/apple/Sources/FamilyGuideUI/TabContentView.swift")
    apple_store = read("native/apple/Sources/FamilyGuideCore/GuideStore.swift")
    for hex_byte in ["0xF6", "0x1F", "0xD2", "0x4F", "0xE9"]:
        assert hex_byte in apple_theme, f"Apple Theme missing canonical hex byte {hex_byte}"
    assert "design: .serif" in apple_theme and "design: .monospaced" in apple_theme
    assert "BrandLogoView" in apple_theme and "BrandLogoView" in apple_root
    assert "readModeBanner" in apple_root and "largeText" in apple_root and "highContrast" in apple_root
    assert "Theme.regionOrder" in apple_root and "Theme.playbookOrder" in apple_tab
    assert "deleteCustomSection" in apple_store

    # 4. Android palette, serif/mono typography, FfgBrandLogo vector + XML, UX parity
    and_theme = read("native/android/app/src/main/java/io/github/dineshkumarponnusamy/familyfieldguide/ui/Theme.kt")
    and_screen = read("native/android/app/src/main/java/io/github/dineshkumarponnusamy/familyfieldguide/ui/FamilyGuideScreen.kt")
    and_main = read("native/android/app/src/main/java/io/github/dineshkumarponnusamy/familyfieldguide/MainActivity.kt")
    and_store = read("native/android/app/src/main/java/io/github/dineshkumarponnusamy/familyfieldguide/core/GuideStore.kt")
    and_manifest = read("native/android/app/src/main/AndroidManifest.xml")
    and_icon = read("native/android/app/src/main/res/drawable/ic_launcher_foreground.xml")
    for k in core_hex:
        h = colors[k].lstrip("#").upper()
        assert f"0XFF{h}" in and_theme.upper(), f"Android Theme missing 0xFF{h} ({k})"
    assert "FontFamily.Serif" in and_theme and "FontFamily.Monospace" in and_theme
    assert "FfgBrandLogo" in and_theme and "FfgBrandLogo" in and_screen
    assert "#1F3A2E" in and_icon and "#D2512F" in and_icon
    assert "Read Mode" in and_screen and "largeText" in and_main and "highContrast" in and_main
    assert "REGION_ORDER" in and_screen and "PLAYBOOK_ORDER" in and_screen
    assert "<uses-permission" not in and_manifest, "Android must stay zero-permission offline!"
    assert "deleteCustomSection" in and_store
    for xml_rel in [
        "native/android/app/src/main/AndroidManifest.xml",
        "native/android/app/src/main/res/drawable/ic_launcher_foreground.xml",
        "native/android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml",
        "native/android/app/src/main/res/values/colors.xml",
        "native/android/app/src/main/res/values/strings.xml",
        "native/android/app/src/main/res/values/themes.xml",
    ]:
        ET.fromstring(read(xml_rel))

    # 5. Windows palette, fonts, WPF vector + multi-size ICO, UX parity
    win_app = read("native/windows/FamilyGuide.Windows/App.xaml")
    win_xaml = read("native/windows/FamilyGuide.Windows/MainWindow.xaml")
    win_cs = read("native/windows/FamilyGuide.Windows/MainWindow.xaml.cs")
    win_store = read("native/windows/FamilyGuide.Core/GuideStore.cs")
    win_csproj = read("native/windows/FamilyGuide.Windows/FamilyGuide.Windows.csproj")
    for k in core_hex:
        assert colors[k].upper() in win_app.upper(), f"Windows App.xaml missing {colors[k]} ({k})"
    assert "SerifFont" in win_app and "MonoFont" in win_app and "SansFont" in win_app
    assert "Resources/app.ico" in win_xaml and "Resources\\app.ico" in win_csproj
    assert "M64,26 L28,54" in win_xaml and "#D2512F" in win_xaml
    assert "AddReadModeBanner" in win_cs and "LargeTextToggle" in win_xaml and "ContrastToggle" in win_xaml
    assert "RegionOrder" in win_cs and "PlaybookOrder" in win_cs
    assert "DeleteCustomSection" in win_store
    ico_bytes = read_bytes("native/windows/FamilyGuide.Windows/Resources/app.ico")
    reserved, ico_type, img_count = struct.unpack("<HHH", ico_bytes[:6])
    assert reserved == 0 and ico_type == 1 and img_count == 4, f"Invalid app.ico header: {(reserved, ico_type, img_count)}"
    for xml_rel in [
        "native/windows/FamilyGuide.Core/FamilyGuide.Core.csproj",
        "native/windows/FamilyGuide.Core.Tests/FamilyGuide.Core.Tests.csproj",
        "native/windows/FamilyGuide.Windows/FamilyGuide.Windows.csproj",
        "native/windows/FamilyGuide.Windows/App.xaml",
        "native/windows/FamilyGuide.Windows/MainWindow.xaml",
    ]:
        ET.fromstring(read(xml_rel))

    # 6. Linux GTK4 palette, serif/mono typography, Cairo logo, UX parity
    lin_theme = read("native/linux/crates/gtk-app/src/theme.rs")
    lin_main = read("native/linux/crates/gtk-app/src/main.rs")
    lin_store = read("native/linux/crates/core/src/store.rs")
    for k in core_hex:
        assert colors[k].upper() in lin_theme.upper(), f"Linux theme.rs missing {colors[k]} ({k})"
    assert "Palatino Linotype" in lin_theme and "ui-monospace" in lin_theme
    assert "brand_logo_widget" in lin_theme and "brand_logo_widget" in lin_main
    assert "ffg-glance-card" in lin_theme and "ffg-banner-read" in lin_theme
    assert "large_toggle" in lin_main and "contrast_toggle" in lin_main and "Read Mode" in lin_main
    assert "region_order" in lin_main and "playbook_order" in lin_main
    assert "delete_custom_section" in lin_store
    for toml_rel in [
        "native/linux/Cargo.toml",
        "native/linux/crates/core/Cargo.toml",
        "native/linux/crates/gtk-app/Cargo.toml",
    ]:
        with open(os.path.join(ROOT, toml_rel), "rb") as f:
            tomllib.load(f)

    print("ALL_DESIGN_AND_UX_PARITY_CHECKS_PASSED")


if __name__ == "__main__":
    main()
