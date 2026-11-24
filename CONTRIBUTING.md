# Contributing to Family Field Guide

Contributions—especially new country/region presets, bug fixes, accessibility improvements, and translations—are very welcome! Because the Web PWA has **zero build steps and zero dependencies**, you can edit files and test directly in a browser.

## Golden Rules

1. **Zero external dependencies:** No npm packages, CDNs, trackers, analytics, or external runtime dependencies. Keep the Web PWA working 100% offline from `index.html` and inside standalone exported `.html` backups.
2. **Never rename existing field or list IDs:** User backups (`familyFieldGuide.v1`) store answers by field/list `id` (e.g., `q_first`, `accounts`, `insurance`). Always add new IDs rather than renaming or deleting old ones.
3. **Never commit personal data:** Never include personal details, screenshots with real family data, or `family-field-guide-*` backup files in a PR or issue. Use **Load sample family** when taking screenshots.

## Local Development & Checks

1. Edit `schema.js`, `regions.js`, `app.js`, `styles.css`, or `index.html`.
2. Open `index.html` directly in Chrome, Firefox, or Safari (or serve locally with `python3 -m http.server`) and test:
   - Edit mode, Read mode, `/` Search, and 1-page Summary
   - Readiness Audit & Fire Drill
   - Print previews (Executive Summary, ER Grab Sheet, Caregiver Sheet)
   - Standalone `.html` export (full guide & Caregiver/ER packet) + unlock + `Save updated copy (.html)`
3. **Bump `CACHE` in `sw.js`** whenever you modify `app.js`, `styles.css`, `index.html`, `schema.js`, `regions.js`, or `manifest.json` (CI checks this on PRs).

## Cross-Platform Schema & Parity Checks

All 6 platforms (Web PWA, macOS, iOS, Android, Windows, Linux) share one canonical schema (`schema.js` + `regions.js` → `shared/guide-data.json`) and one design token spec (`shared/design-tokens.json`). Whenever you modify `schema.js`, `regions.js`, design tokens, or native code, run:

```bash
# 1. Regenerate shared/guide-data.json and sync into all 4 native resource bundles
python3 shared/sync_schema.py

# 2. Verify cross-platform schema sync, hex palette, fonts, logos, ordering & Android zero-permission manifest
python3 tests/test_design_parity.py

# 3. Syntax-check JS and run Web unit, crypto, Shamir, privacy-audit & merge tests
node tests/web_tests.js
```

CI runs `python3 shared/sync_schema.py` followed by `git diff --exit-code shared/guide-data.json native/`, so PRs will fail if `shared/guide-data.json` or native asset copies are out of sync with `schema.js` / `regions.js`.

### Native Platform Test Commands

```bash
# Apple (macOS & iOS Swift Package)
swift test --package-path native/apple

# Android (Kotlin + Jetpack Compose)
cd native/android && gradle testDebugUnitTest assembleDebug

# Windows (.NET 8 + WPF)
dotnet test native/windows/FamilyGuide.Core.Tests/FamilyGuide.Core.Tests.csproj -c Release

# Linux (Rust + GTK4)
cargo test --manifest-path native/linux/Cargo.toml -p family-guide-core
```

## Adding or Updating a Country / Region Preset

Open `regions.js` and add or update a key inside `REGIONS` (using `fieldOverrides`, `listOverrides`, and `stepOverrides` so saved `id`s stay identical across countries).

### `lastVerified` Date Policy (`regions.js`)

Every preset in `REGIONS` **must** include `lastVerified: "YYYY-MM-DD"` recording when deposit insurance caps, survivor tax/estate rules, and pro-finder directory links were verified against official government or regulator sources. Whenever you add a new preset or update regulatory numbers/links in an existing preset, update `lastVerified` to the date of verification and cite your official sources in the PR description.

```js
  xx: {
    label: "Country Name",
    emergency: "112",
    currency: "¤",
    crossBorder: false,
    indiaNotes: false,
    lastVerified: "YYYY-MM-DD",
    moneyGuide: {
      depositCap: "Local bank deposit-insurance cap per institution",
      taxNote: "Short note on life insurance tax & estate rules (general education only)",
      fiduciaryName: "Local fee-only fiduciary advisor credential",
      safeCash: "Safe liquid cash parking options locally",
      sampleTitle: "Sample Allocation (Country)",
      sampleLines: [
        "12-month emergency cash under local deposit cap",
        "High-interest joint debt rule",
        "Near-term 1–5 year bucket",
        "Long-term diversified portfolio (~3.5%–4% rule)"
      ]
    },
    proFinder: {
      legal: "Official bar referral / free legal aid",
      visa: "Official immigration regulator / consulate",
      money: "Fee-only advisor directory / free counseling",
      tax: "Licensed tax credential / free volunteer tax clinic"
    },
    fieldOverrides: {},
    listOverrides: {},
    stepOverrides: {}
  }
```

Include clear plain-English notes and avoid giving jurisdiction-specific legal/tax promises. After editing `regions.js`, run `python3 shared/sync_schema.py` and `python3 tests/test_design_parity.py`.
