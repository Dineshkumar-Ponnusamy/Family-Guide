<div align="center">

<img src="icon.svg" alt="Our Family Field Guide Logo" width="96" height="96" />

# Our Family Field Guide

**A private, 100% offline emergency, medical care & digital legacy guide for the people you love.**

[![CI](https://github.com/Dineshkumar-Ponnusamy/Family-Guide/actions/workflows/ci.yml/badge.svg)](https://github.com/Dineshkumar-Ponnusamy/Family-Guide/actions/workflows/ci.yml)
[![Apple Build](https://github.com/Dineshkumar-Ponnusamy/Family-Guide/actions/workflows/apple.yml/badge.svg)](https://github.com/Dineshkumar-Ponnusamy/Family-Guide/actions/workflows/apple.yml)
[![Android Build](https://github.com/Dineshkumar-Ponnusamy/Family-Guide/actions/workflows/android.yml/badge.svg)](https://github.com/Dineshkumar-Ponnusamy/Family-Guide/actions/workflows/android.yml)
[![Windows Build](https://github.com/Dineshkumar-Ponnusamy/Family-Guide/actions/workflows/windows.yml/badge.svg)](https://github.com/Dineshkumar-Ponnusamy/Family-Guide/actions/workflows/windows.yml)
[![Linux Build](https://github.com/Dineshkumar-Ponnusamy/Family-Guide/actions/workflows/linux.yml/badge.svg)](https://github.com/Dineshkumar-Ponnusamy/Family-Guide/actions/workflows/linux.yml)
[![Release](https://img.shields.io/github/v/release/Dineshkumar-Ponnusamy/Family-Guide?color=D2512F&label=Release)](https://github.com/Dineshkumar-Ponnusamy/Family-Guide/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-1F3A2E.svg)](LICENSE)
[![Offline First](https://img.shields.io/badge/Offline-100%25%20Zero%20Network-2E6F5E.svg)](SECURITY.md)

[Live Web App](https://dineshkumar-ponnusamy.github.io/Family-Guide/) · [Download Latest Release](https://github.com/Dineshkumar-Ponnusamy/Family-Guide/releases/latest) · [Security & Crypto](SECURITY.md) · [Backup Interop Spec](shared/BACKUP_FORMAT.md) · [Contributing](CONTRIBUTING.md)

</div>

---

If something happens and you can't be there—an accident, a sudden 2 AM ER visit, chronic/critical illness treatment, job loss, or passing away—your spouse or caregiver opens **one guide** and finds what to do first, who to call, where accounts, IDs, insurance, and papers live, how to handle a large payout safely, and a page written for the kids.

- **Web PWA + 5 Pure Native Apps** (macOS, iOS, Android, Windows, Linux) sharing one single-source-of-truth schema and one byte-for-byte **AES-256-GCM** encrypted backup format.
- **Zero servers · Zero accounts · Zero tracking · Zero third-party CDNs.**

---

## Screenshots

<div align="center">
  <img src="docs/screenshots/01-start-here-playbook.png" alt="Our Family Field Guide — Start Here & Playbook (Sample Family Demo)" width="100%" />
  <br />
  <sub><em>Warm paper editorial UI, completion & readiness meter, dark Quick Glance card, and 7 Emergency Playbooks (shown with built-in Sample Family demo data).</em></sub>
</div>

<br />

<table>
  <tr>
    <td width="50%" valign="top">
      <img src="docs/screenshots/02-executive-summary.png" alt="Read Mode & 1-Page Family Executive Summary" width="100%" />
      <p align="center"><b>Calm Read Mode &amp; 1-Page Executive Summary</b><br /><sub>Tappable contacts, accounts, policies, IDs, and active ER alerts on one printable screen.</sub></p>
    </td>
    <td width="50%" valign="top">
      <img src="docs/screenshots/03-money-guide.png" alt="Beginner's Guide to Handling Big Money & Insurance Payouts" width="100%" />
      <p align="center"><b>Beginner's Guide to Big Money &amp; Payouts</b><br /><sub>Localized 6-part survivor guide covering deposit caps, fee-only fiduciaries, and the 4-Bucket Plan.</sub></p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <img src="docs/screenshots/04-health-er-care.png" alt="Chronic & Critical Illness Care and 1-Page ER Grab Sheet" width="100%" />
      <p align="center"><b>Chronic Illness &amp; 1-Page ER Grab Sheet</b><br /><sub>Red-flag rules, 24/7 specialist triage, ports/arm restrictions, rescue meds &amp; portal proxy.</sub></p>
    </td>
    <td width="50%" align="center" valign="top">
      <img src="docs/screenshots/05-mobile-view.png" alt="Mobile Responsive Read Mode" width="240" />
      <p align="center"><b>Mobile Calm Read Mode</b><br /><sub>Responsive phone layout alongside pure native iOS &amp; Android apps.</sub></p>
    </td>
  </tr>
</table>

---

## Download & Install (All 6 Platforms)

All native builds and offline web packages are built and published from source by GitHub Actions on every release tag (`SHA256SUMS.txt` included on every release).

| Platform | Tech Stack | Release Package | Install / Notes |
|---|---|---|---|
| **Web / PWA** | Vanilla HTML, CSS, JS *(zero deps)* | [Live Web App](https://dineshkumar-ponnusamy.github.io/Family-Guide/) or `Our-Family-Field-Guide-Web-Offline.zip` | Works offline from `index.html` or install via browser **Install App** / Safari **Add to Home Screen** |
| **macOS (14+)** | Pure Swift + SwiftUI + CryptoKit | `Our-Family-Field-Guide-macOS-arm64.dmg` | Drag **Our Family Field Guide.app** to Applications; supports Touch ID lock |
| **iOS (17+)** | Pure Swift + SwiftUI + CryptoKit | `Our-Family-Field-Guide-iOS-Xcode-Source.zip` | Local Swift Package + Face ID `@main` entry (`native/apple/`) for Xcode |
| **Android (8.0+)** | Pure Kotlin + Jetpack Compose (M3) | `Our-Family-Field-Guide-Android.apk` | **Zero `INTERNET` permission** in `AndroidManifest.xml`; supports BiometricPrompt lock |
| **Windows (x64)** | Pure C# + .NET 8 + WPF | `Our-Family-Field-Guide-Windows-x64.exe` | Single-file portable `.exe` with native Windows `PrintDialog` |
| **Linux (GTK4)** | Pure Rust + `gtk4-rs` *(zero WebView)* | `Our-Family-Field-Guide-Linux-x86_64.tar.gz` | Extract & run `./install.sh` (installs binary, SVG icon & `.desktop` entry) |

> **Latest Downloads:** [Releases Page](https://github.com/Dineshkumar-Ponnusamy/Family-Guide/releases/latest)

---

## 30-Second Privacy & Security Audit

1. **Zero network traffic & zero external dependencies:** Root Web PWA has zero CDNs/analytics; pure native apps have zero telemetry; Android declares **zero `<uses-permission>`** tags.
2. **Client-side / device-local storage only:** Web stores locally in `localStorage` (with optional AES-GCM lock + 15-min idle timeout); macOS/iOS store in Application Support (with Touch ID / Face ID); Android in internal `filesDir` (with BiometricPrompt); Windows in `%AppData%`; Linux in `$XDG_DATA_HOME/family-field-guide/state.json` (`0600`).
3. **Byte-for-byte cross-platform AES-256-GCM backups:** Every app reads and writes the exact same `familyFieldGuide.v1` JSON & standalone self-contained `.html` backups (`PBKDF2-HMAC-SHA256`, 250,000 iterations, 16-byte random salt, 12-byte random IV). See [shared/BACKUP_FORMAT.md](shared/BACKUP_FORMAT.md).
4. **2-of-3 Shamir Split Recovery Cards + Diceware:** Split your passphrase over `GF(256)` into 3 recovery cards (`FFG-1-...` · Spouse · Safe · Trusted Person) where any 2 unlock any device.
5. **Readiness & privacy audits:** Automatically warns if a 12+ word crypto seed phrase or full national ID (SSN / Aadhaar) is accidentally entered instead of physical location + last 4 digits. See [SECURITY.md](SECURITY.md).

---

## What's Included

- **7 Actionable Emergency Playbooks + Calm Read Mode:** Hospital/incapacitation, Chronic/critical illness, Passing away, Handling big money, Money emergency, Both parents unreachable (Caregiver guide), and Work-visa/cross-border emergency—with deep-links (`↳ Money → Insurance`), Call & claim log, `A+` large text, High Contrast mode, `/` instant search, and 1-page Executive Summary.
- **Chronic & Critical Illness Care + 1-Page ER Grab Sheet:** Diagnosis/protocol, 24/7 triage line, red-flag fever rules, ports/implants & arm restrictions, rescue meds, portal proxy/HIPAA, plus 1-click **+ Section** templates.
- **Beginner's Guide to Big Money & Insurance Payouts:** 6-part plain-English survivor guide (decision freeze, deposit caps, 4-Bucket `$1M` / `₹2 Cr` / `£500k` / `€500k` allocation, fee-only fiduciaries, scam scripts, monthly routine).
- **9 Country & Cross-Border Presets:** United States, US + India (H-1B / Visa / NRI), India, Cross-Border / Work Visa (Any 2 Countries), United Kingdom, Canada, Australia, European Union, and International / Generic.
- **Crypto, Key IDs & Finding Vetted / Free Help:** Safe hardware-wallet/seed location mapping, last-4 ID mapping, and localized directories for Bar-referred lawyers, AILA/IAA/CICC/OMARA immigration counsel, fee-only fiduciaries, IRS VITA / CVITP / ATO / NALSA legal aid, EAP, and Dollar For.
- **Two-Spouse Smart Merge & Family Fire Drill:** Merge updates from two devices with conflict preview, attach up to 10 encrypted compressed reference photos, run the 10-minute annual fire drill, and export 6-month `.ics` calendar reminders.

---

## Architecture & Building From Source

All 6 platforms share one canonical schema ([schema.js](schema.js) + [regions.js](regions.js) → [shared/guide-data.json](shared/guide-data.json)) and one design token spec ([shared/design-tokens.json](shared/design-tokens.json)), continuously verified by [tests/test_design_parity.py](tests/test_design_parity.py) and [tests/web_tests.js](tests/web_tests.js).

| Path | Purpose |
|---|---|
| `index.html`, `styles.css`, `schema.js`, `regions.js`, `app.js`, `sw.js`, `manifest.json` | Zero-build, zero-dependency Web / Offline PWA |
| `shared/` | Schema exporter (`sync_schema.py`), `guide-data.json`, `design-tokens.json`, & `BACKUP_FORMAT.md` |
| `native/apple/` | Pure Swift + SwiftUI macOS & iOS package + `FamilyGuideCoreTests` & `FamilyGuideUITests` |
| `native/android/` | Pure Kotlin + Jetpack Compose + Material 3 Android app (`minSdk 26`, JUnit suite) |
| `native/windows/` | Pure C# + .NET 8 WPF app + `FamilyGuide.Core.Tests` (xUnit) |
| `native/linux/` | Pure Rust + GTK4 app & `family-guide-core` crate + Rust unit tests |
| `tests/` | `web_tests.js` & `test_design_parity.py` (hex colors, fonts, logos, icons, canonical ordering, schema sync) |
| `.github/workflows/` | Automated CI (`ci.yml`), per-platform builds, and multi-platform release workflow (`release.yml`) |

```bash
# Sync shared schema from JS source of truth & run cross-platform parity + Web tests
python3 shared/sync_schema.py
python3 tests/test_design_parity.py
node tests/web_tests.js

# Build / test native targets
swift test --package-path native/apple && swift run --package-path native/apple FamilyGuideMac
cd native/android && gradle testDebugUnitTest assembleDebug
dotnet test native/windows/FamilyGuide.Core.Tests/FamilyGuide.Core.Tests.csproj
cargo test --manifest-path native/linux/Cargo.toml -p family-guide-core
```

---

## Extending & License

- **Add custom sections in the UI:** Click **+ Section** (choose from 8 ready-made templates or build custom fields & tables).
- **Contribute a country preset or improvement:** See [CONTRIBUTING.md](CONTRIBUTING.md).
- **License:** [MIT License](LICENSE). General educational organization guidance only—not legal, tax, medical, or financial advice.
