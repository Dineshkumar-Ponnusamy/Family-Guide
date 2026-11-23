# Contributing to Family Field Guide

Contributions—especially new country/region presets, bug fixes, accessibility improvements, and translations—are very welcome! Because this project has **zero build steps and zero dependencies**, you can edit files and test directly in a browser.

## Golden Rules

1. **Zero external dependencies:** No npm packages, CDNs, trackers, analytics, or build tools. Keep everything working 100% offline from `index.html` and inside standalone exported `.html` backups.
2. **Never rename existing field or list IDs:** User backups (`familyFieldGuide.v1`) store answers by field/list `id` (e.g., `q_first`, `accounts`, `insurance`). Always add new IDs rather than renaming or deleting old ones.
3. **Never commit personal data:** Never include personal details, screenshots with real family data, or `family-field-guide-*` backup files in a PR. Use **Load sample family** when taking screenshots.

## Local Development & Checks

1. Edit `schema.js`, `regions.js`, `app.js`, or `styles.css`.
2. Open `index.html` directly in Chrome, Firefox, or Safari (or serve locally with `python3 -m http.server`) and test:
   - Edit mode, Read mode, `/` Search, and 1-page Summary
   - Readiness Audit & Fire Drill
   - Print previews (Executive Summary, ER Grab Sheet, Caregiver Sheet)
   - Standalone `.html` export + unlock + `Save updated copy (.html)`
3. Bump the `CACHE` version string in `sw.js` if you modified cached assets.

## Adding a New Country / Region Preset

Open `regions.js` and add a new key inside `REGIONS` (using `fieldOverrides`, `listOverrides`, and `stepOverrides` so saved `id`s stay identical across countries):

```js
  xx: {
    label: "Country Name",
    emergency: "112",
    currency: "¤",
    crossBorder: false,
    indiaNotes: false,
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

Include clear plain-English notes and avoid giving jurisdiction-specific legal/tax promises.
