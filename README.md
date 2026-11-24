# Our Family Field Guide

**A private, 100% offline emergency, medical care & digital legacy guide for the people you love.**

If something happens and you can't be there—an accident, a sudden 2 AM ER visit, chronic/critical illness treatment, job loss, or passing away—your spouse or caregiver opens **one page** and finds what to do first, who to call, where the money, IDs, insurance, and papers are, how to handle a large payout safely, and a page written for the kids.

> **100% Offline** · **Zero Dependencies / Zero Build** · **Zero Tracking** · **AES-256-GCM Locked Exports** · **9 Country & Cross-Border Presets** · **MIT Licensed**

---

## Try It Live (Zero Data Leaves Your Browser)

- **Live Preview (GitHub Pages):** https://dineshkumar-ponnusamy.github.io/Family-Guide/ *(Click **"Load sample family"** in the banner to explore realistic US + India H-1B and standard examples instantly.)*
- **Run Completely Offline:** Download this repository and double-click `index.html` in any browser—no server, npm install, or internet connection needed.

---

## 30-Second Privacy & Security Audit

Families put sensitive maps in here (where papers live, last 4 digits of accounts, life insurance, kids' pickup lists), so trust matters:

1. **Zero network traffic & zero external scripts:** Plain HTML, CSS, and vanilla JavaScript (`index.html`, `styles.css`, `schema.js`, `regions.js`, `app.js`). Open DevTools → Network tab and see zero outbound requests, zero analytics, and zero CDNs.
2. **Stays strictly in your browser (`localStorage`):** Nothing you type is ever uploaded anywhere. Optional **In-Browser Lock** encrypts local browser storage too and auto-locks after 15 minutes idle.
3. **Client-side AES-256-GCM backups:** **Save backup** encrypts your data locally using the Web Crypto API (`PBKDF2-SHA-256`, 250,000 iterations, random 16-byte salt & 12-byte IV) into either a `.json` file or a **standalone self-contained `.html` file** that will still open offline in any browser 15 years from now.
4. **Never store raw secrets:** Built-in Readiness Audits actively warn you if a 12+ word crypto seed phrase or a full SSN / 12-digit Aadhaar appears anywhere in your tables. See [SECURITY.md](SECURITY.md) for the full cryptographic & threat model.
5. **Repo stays empty of personal data:** [`.gitignore`](.gitignore) blocks backup files, exported sections, and `.ics` reminders by default. *(Tip: use a **private** fork/repo anyway if your custom section titles could reveal personal details.)*

---

## What's Included

### 1. Emergency Playbooks, Calm Read Mode & 1-Page Executive Summary
- **7 Actionable Playbooks** with clickable deep-links (`↳ Money → Insurance`) and an interactive **Call & claim log**:
  1. Hospital / incapacitation
  2. Chronic or critical illness treatment
  3. Passing away
  4. Handling big money (e.g. $1M life insurance payout)
  5. Money emergency (job loss / big bill)
  6. Both parents unreachable (Caregiver guide)
  7. Work-visa & cross-border emergency (H-1B / NRI / Expat)
- **Read mode vs. Edit mode:** Switch to **Read mode** so a stressed spouse sees only filled answers with tappable `tel:` / `mailto:` / `https:` links and can't overwrite details by accident. Includes **A+** large text, **Contrast** mode, collapsible cards, Quick-Add chips, and `/` instant search (`↑` / `↓` / `Enter`).
- **1-Page Family Executive Summary:** One-screen (or 1-page printed) overview of contacts, accounts, payout instructions, crypto map, all insurance policies (with Beneficiaries), key IDs, titles, kids, pets, shut-offs, and active ER alerts.

### 2. Chronic & Critical Illness Care + 1-Page ER Grab Sheet
- Dedicated **Health → Chronic / critical illness & ER care** fields for active diagnosis/protocol, 24/7 specialist triage line & preferred ER, red-flag fever/symptom rules (*"call oncology before taking fever-reducers"*), implants/ports/lines & arm restrictions, rescue *"just-in-case"* meds, portal proxy/HIPAA access, and food/visitor boundaries.
- Prints as a wallet/fridge-ready **1-Page ER & Medical Grab Sheet** (available in `Print` and standalone `.html` backups), plus a 1-click **Chronic & Critical Illness Care Plan** section template under **+ Section** (Go-Bag, Communication Captain, Kids' Teachers, Social Worker/Copay Aid, Care Squad, Symptom/Question Log, EOB vs. Bill tracker) and *"Open When"* keepsakes + caregiver respite permission.

### 3. Beginner's Guide to Big Money & Insurance Payouts
- Designed for a surviving spouse who has never managed large savings or household finances before:
  - **My instructions for big money / insurance payouts** card under **Money**.
  - **6-Part Plain-English Guide** (readable on screen, searchable, and printable): (1) the 6–12 month decision freeze, (2) day-1 safe cash parking under deposit-insurance caps + automatic *"Monthly Paycheck"* transfers, (3) a concrete **4-Bucket Plan & 3.5%–4% Rule** localized for `$1,000,000` / `₹2 Crore` / `£500,000` / `€500,000`, (4) how to hire a **Fee-Only Fiduciary** and spot annuity/whole-life/ULIP sales traps, (5) bereavement scam & loan-request defense scripts, and (6) a 15-minute monthly money routine.

### 4. Global, India & Cross-Border (H-1B / NRI / Expat) Support
- Switch instantly between **United States**, **US + India (H-1B / Visa / NRI)**, **India**, **Cross-Border / Work Visa (Any 2 Countries)**, **United Kingdom**, **Canada**, **Australia**, **European Union**, and **International / Generic**.
- Adapts emergency numbers (`911`, `112`, `999`, `000`), retirement/tax terms (`401k`/`IRA`, `EPF`/`PPF`/`NPS`, `ISA`/`SIPP`, `RRSP`/`TFSA`, `Super`), nominee vs. legal heir warnings, non-citizen estate tax thresholds, grace periods, and a 1-click **Visa, Immigration & Cross-Border** section template.

### 5. Crypto, Key IDs & How to Find Vetted / Free Help
- **Crypto & digital assets** table (map hardware wallets/exchanges, physical seed locations, and a trusted tech helper—never raw seeds) + **Key IDs (SSN / PAN / Aadhaar / Passport)** table (last 4 digits + storage location only).
- **Finding Vetted & Free Help** guide directly under **Contacts → Professionals**: how families starting from scratch can find Bar-referred lawyers, independent immigration attorneys (AILA / IAA / CICC / OMARA), hourly/flat-fee fiduciaries, free tax clinics (IRS VITA / CVITP / ATO / TaxAid), Employer **EAP** perks, **Hospital Social Workers**, and **Dollar For** hospital charity-care advocates.

### 6. Resilient Backups, Two-Spouse Smart Merge & Family Fire Drill
- **Two-Spouse Smart Merge:** Opening a backup lets you merge answers from both spouses with conflict detection rather than blindly overwriting.
- **2-of-3 Shamir Split Recovery Cards + Diceware:** Generate typo-proof 5-word passphrases and printable 2-of-3 recovery cards (Spouse · Safe · Trusted Person) where any 2 cards unlock your backup.
- **Encrypted Photo Snippets:** Attach up to 10 compressed offline photos (~80–120 KB) of shut-off valves, breaker panels, or insurance cards inside your encrypted backup.
- **Readiness Audit, 10-Minute Fire Drill & 6-Month `.ics` Reminders:** Flags real-world gaps (missing joint bank account, missing beneficiaries, missing phone/2FA unlock, exposed seeds/IDs, stale backups) and exports recurring `.ics` calendar reminders.

---

## Quick Start & Install as an App

### 1. Run Online or via GitHub Pages (Recommended)
Fork this repository and turn on **Settings → Pages** (deploy from `main` branch, root `/`) to get your own HTTPS URL accessible from any phone or laptop.

### 2. Install as an Offline App (Android, iOS, Windows, Mac & Linux)
Once opened over HTTPS (such as GitHub Pages), you can install **Our Family Field Guide** like a native app with zero app-store accounts or fees:
- **Android (Chrome / Edge / Brave):** Click **Install App** in the top bar (or browser menu **⋮ → Install app**).
- **iPhone / iPad (Safari):** Tap **Share** (`↑`) → **Add to Home Screen** → **Add**. *(Important: Safari can evict unused web storage after prolonged inactivity, so also keep a locked standalone `.html` backup saved in Apple Files / iCloud Drive.)*
- **Windows / Mac / Linux (Desktop PWA or Native App):** Click **Install App** (or the install icon in Chrome/Edge/Brave's address bar; on macOS Safari, use **File → Add to Dock**). Prefer standalone desktop installers (`.dmg`, `.msi`, `.AppImage`, `.deb`)? See the optional zero-touch **Tauri v2 wrapper** in [`desktop/README.md`](desktop/README.md) (automated multi-OS builds via GitHub Actions).

### 3. Pure Native Apps (All 5 Platforms)
Want native OS apps with zero browser/WebView runtime? Every native app shares one single-source-of-truth schema ([`shared/guide-data.json`](shared/guide-data.json)) and one byte-for-byte `PBKDF2` + `AES-256-GCM` + `2-of-3 Shamir` backup format ([`shared/BACKUP_FORMAT.md`](shared/BACKUP_FORMAT.md)):
- **macOS & iOS:** Pure Swift + SwiftUI + CryptoKit (`native/apple/` — Face ID / Touch ID + Apple Files)
- **Android:** Pure Kotlin + Jetpack Compose (`native/android/` — BiometricPrompt + zero `INTERNET` permission)
- **Windows:** Pure C# + .NET 8 WPF (`native/windows/` — single-file `FamilyFieldGuide.exe`)
- **Linux:** Pure Rust + GTK4 (`native/linux/` — zero-WebView native desktop binary)

### 4. Share With Your Spouse
Use **Save backup → Standalone locked HTML (.html)**, store the file in two safe places (e.g. USB drive + shared family cloud), print the **1-page Break-Glass Cover Sheet** for your fireproof box, and run the **10-Minute Family Fire Drill** once a year.

---

## Files

| File | What it does |
|---|---|
| `index.html` | Page shell, iOS/PWA meta tags & manifest link |
| `styles.css` | Editorial paper UI, `A+`, high-contrast & print sheets |
| `schema.js` | **Core content**: playbooks, scripts, money guide, pro finder, sections, fire drill |
| `regions.js` | **9 country & cross-border presets**, localized directories, demo families, Diceware wordlist |
| `app.js` | Storage, rendering, readiness audit, smart merge, Shamir split, photo compression, AES-GCM backups |
| `manifest.json` / `sw.js` / `icon*` / `apple-touch-icon.png` | Offline PWA & iOS/Android/Desktop icons |
| `desktop/` & `.github/workflows/` | Optional Tauri v2 desktop app wrapper (Mac/Windows/Linux) & CI/Release workflows |
| `shared/` & `native/apple/` | Shared data/crypto interop spec + pure native SwiftUI apps for macOS & iOS |
| `native/android/` | Pure native Kotlin + Jetpack Compose Android app (zero `INTERNET` permission) |
| `native/windows/` | Pure native C# + .NET 8 WPF Windows desktop app |
| `native/linux/` | Pure native Rust + GTK4 Linux desktop app & core crate |
| `SECURITY.md` | Threat model, cryptographic details & safe-use rules |
| `CONTRIBUTING.md` | How to extend sections or add your country preset |

---

## Extending & Contributing

- **No code needed:** Click **+ Section** (choose from 8 templates including Illness Care, Visa/Cross-Border, Smart Home, Crypto/Homelab, Small Business, Aging Parents) or add fields/tables at the bottom of any section.
- **Contribute your country or improvements:** See [CONTRIBUTING.md](CONTRIBUTING.md) for the `regions.js` country template and schema rules (never rename existing IDs so older `familyFieldGuide.v1` backups stay 100% compatible).

## License & Disclaimer

Released under the [MIT License](LICENSE). General educational organization guidance only—not legal, tax, medical, or financial advice. Consult licensed local professionals for what applies where you live.
