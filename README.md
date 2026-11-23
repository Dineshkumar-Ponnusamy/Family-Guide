# Family Guide

A private, offline emergency guide for your family. If something happens and you can't be there, your spouse opens one page and finds what to do first, who to call, where the money and papers are, and a page written for the kids.

It's plain HTML, CSS and JavaScript: no build step, no server, no accounts, no tracking.

## Your data never goes in this repo

- Answers save only in the browser you type them in (`localStorage`).
- **Save backup** creates either a **standalone locked HTML file** (`.html`, opens offline in any browser with just your passphrase) or an **encrypted JSON file** (`.json`), locked with AES‑256‑GCM (PBKDF2, 250,000 rounds). Share the file and passphrase with your spouse separately.
- `.gitignore` blocks backup files (`family-field-guide-*.json`, `family-field-guide-*.html`, `family-guide-*.json`) so they can't be committed by accident.
- Never type passwords or full account numbers. Write where to find them, plus the last 4 digits.

Use a **private** repository anyway. Your section names alone can reveal things about your family.

## Features

- **Country & Cross-Border Presets:** Switch between **United States**, **India**, **US + India (H-1B / Visa / NRI)**, **Cross-Border / Work Visa**, **United Kingdom**, **Canada**, **Australia**, **European Union**, and **Generic** to adapt emergency numbers, retirement/tax terminology, and visa/consulate steps without losing your answers.
- **Edit & Read modes:** Switch to **Read mode** so a stressed reader can tap phone numbers/links, check off playbook steps, and log calls without accidentally editing or seeing empty boxes. Includes **A+** large text, **Contrast**, and optional **In-Browser Lock** with 15-minute idle auto-lock.
- **Standalone Offline Copy & Smart Merge:** Export a self-contained `.html` locked copy that includes search, clickable playbook links, editable Call & claim log, Caregiver sheet printing, photo snippets, and **Save updated copy (.html)**. **Open backup** supports **Smart Merge** to combine edits from both spouses without overwriting.
- **Memorable Passphrases & 2-of-3 Split Recovery Cards:** Generate typo-proof 5-word Diceware passphrases and optional 2-of-3 Shamir Split Recovery Cards (Spouse · Safe · Trusted Person) where any 2 cards unlock your backup.
- **Encrypted Photo Snippets:** Attach compressed offline photos (~80–120 KB) of shut-off valves, breaker panels, or insurance cards directly inside your encrypted guide.
- **Playbooks & Call Log:** Step-by-step action plans for hospital/incapacitation, **chronic or critical illness treatment**, **handling a large insurance payout**, death, money emergencies, unreachable parents (caregiver), and **work-visa/cross-border emergencies**, with clickable cross-links and a built-in **Call & claim log**.
- **How to Find Vetted & Low-Cost Help:** Built-in, country-localized guide under **Contacts → Professionals** showing families starting from scratch how to find Bar-referred lawyers, AILA/accredited immigration counsel, hourly/flat-fee fiduciary advisors, free tax clinics (VITA/CVITP/TaxAid), Employer EAP perks, and hospital charity-care advocates.
- **Chronic & Critical Illness Care + 1-Page ER Grab Sheet:** Dedicated fields for active diagnosis/protocol, 24/7 specialist triage line, red-flag fever/symptom rules, implants/ports/arm warnings, rescue meds, and patient portal proxy—printing onto a crisp 1-page ER & Medical Grab Sheet, plus an opt-in **Chronic & Critical Illness Care Plan** section template.
- **Beginner's Guide to Big Money & Payouts:** Plain-English 6-part guide (6–12 month decision freeze, deposit-insurance caps, 4-bucket allocation with a 3.5%–4% rule example for $1M / regional equivalents, fee-only fiduciary hiring, bereavement scam defense, and a 15-minute monthly routine) localized per country/region.
- **Crypto & Key Government IDs (Privacy-Safe Mapping):** Dedicated tables for **Crypto & digital assets** (map only, never raw seed words) and **Key IDs (SSN / PAN / Aadhaar / Passport)** (last 4 digits + physical location only)—with automatic Readiness Audit warnings if a seed phrase or full SSN/Aadhaar appears.
- **15-Minute Essentials, Demo Mode & Search:** Preview everything with 1-click **Load sample family**, jump to the 10 essentials, or press `/` (with `↑`/`↓`/`Enter` navigation) to search across every field, table, money-guide rule, and playbook step.
- **Readiness Audit & 10-Minute Fire Drill:** Spots real-world gaps (solo-only bank accounts, missing retirement/life-insurance beneficiaries, missing phone/2FA unlock info, exposed seeds or full IDs, missing payout guidance, cross-border visa gaps, stale backups) and tracks a 5-step spouse dry-run.
- **Modular Section Templates:** One-click templates under **+ Section** for Chronic & Critical Illness Care Plan, Visa/Immigration/Cross-Border, Smart Home & Wi‑Fi, Crypto/Domains/Homelab, Small Business, Traveling/Caregiver, International/Expat Assets, and Aging Parents.
- **Flexible Printing & PWA:** Print the full guide (with or without empty blanks), a **1-page Family Executive Summary**, a **1-page ER & Medical Grab Sheet**, the **Survivor's Money Guide**, a **1-page Caregiver / Fridge Sheet**, a **1-page Break-Glass Cover Sheet**, or install as an offline PWA (`manifest.json` + `sw.js`).
- **Check-Up Reminders:** Export a recurring 6-month `.ics` calendar reminder next to **Mark reviewed**.

## Run it

Open `index.html` in a browser. That's all.

To use it from any device (or install on your phone or computer as an offline app), turn on **Settings → Pages** (deploy from the `main` branch) in your GitHub repo. Each device keeps its own answers, so use **Open backup** on a new device to load or merge the same details.

### Install as an App (Android, iOS, Windows, Mac & Linux)
Once opened over HTTPS (such as your GitHub Pages link), you can install **Our Family Field Guide** like a native app with zero app-store fees:
- **Android (Chrome / Edge / Brave):** Click **Install App** in the top bar (or browser menu **⋮ → Install app**).
- **iPhone / iPad (Safari):** Tap **Share** (`↑`) → **Add to Home Screen** → **Add**. *(Tip: Safari can clear unused browser data after prolonged inactivity, so also keep a locked standalone `.html` backup saved in Apple Files / iCloud Drive.)*
- **Windows / Mac / Linux (Desktop):** Click **Install App** (or the install icon in Chrome/Edge/Brave's address bar; on macOS Safari, use **File → Add to Dock**).

## Files

| File | What it is |
|---|---|
| `index.html` | Page shell, iOS/PWA meta tags & manifest link |
| `styles.css` | Look, accessibility modes & print layout |
| `schema.js` | **Core content**: checklists, scripts, sections, guides, fire drill |
| `regions.js` | **Country & cross-border presets**, sample demo families, Diceware wordlist |
| `app.js` | Saving, rendering, readiness audit, smart merge, Shamir split, photo compression, backups |
| `manifest.json` / `sw.js` / `icon.svg` / `icon-*.png` / `apple-touch-icon.png` | Offline PWA & iOS/Android/Desktop app icons |

### Add your country
To contribute a new country preset, add an entry to `REGIONS` in `regions.js` with your local `emergency` number, `fieldOverrides`, `listOverrides`, and `stepOverrides`.

## Extending the guide

### Without code
In the app, use **+ Section** to add a whole new tab, or **+ Add a field** / **+ Add a table** at the bottom of any section. These save with your answers and travel inside your backups.

### In code (shared by everyone who uses your copy)
Edit `schema.js`.

**Add a section:** add an object to `TABS`:

```js
{ id: "business", label: "Our business", title: "The business",
  lede: "What happens to the business if I can't run it.",
  blocks: [
    { type: "fields", title: "Basics", fields: [
      ["b_partner", "Business partner & phone"],
      ["b_bank", "Business bank (last 4)"],
      ["b_plan", "Succession plan", "", true]   // true = wide text box
    ]},
    { type: "list", id: "b_clients", title: "Key clients",
      cols: [["name","Client"],["contact","Contact"],["note","Notes"]],
      seed: [{}] }
  ]}
```

**Add a checklist path:** add a key to `PLAYBOOK` with a `label` and `phases`, each with `steps` of `{ id, t, d, ref }`.

**Add a "what to say" script:** add `["Title", "Words to say"]` to `SCRIPTS`.

**Rules**
- Every `id` must be unique across the whole file.
- Don't rename an `id` after you've filled it in. Answers are stored by `id`, so a renamed field shows up empty (the old answer is still in your backup).
- Sections you added in the app can be copied into code: **GitHub → Download project files** also saves `my-sections.json` with labels only.

## Keep it current

Press **Mark reviewed** after each check‑up. The guide reminds you after 6 months. Good times to review: new job, new house, a new baby, renewing insurance, tax season.

---
General guidance only, not legal, tax or financial advice. Ask an estate attorney what applies where you live.
