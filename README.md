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

- **Edit & Read modes:** Switch to **Read mode** so a stressed reader can tap phone numbers/links, check off playbook steps, and log calls without accidentally editing or seeing empty boxes. Includes **A+** large text and **Contrast** toggles for 3 AM reading.
- **Standalone Offline Copy & Smart Merge:** Export a self-contained `.html` locked copy that includes search, clickable playbook links, editable Call & claim log, Caregiver sheet printing, and **Save updated copy (.html)** so progress persists offline. **Open backup** supports **Smart Merge** to combine edits from both spouses without overwriting.
- **Playbooks & Call Log:** Step-by-step action plans for hospital/incapacitation, death, money emergencies, and unreachable parents (caregiver), with clickable cross-links and a built-in **Call & claim log**.
- **15-Minute Essentials & Search:** Jump straight to the 10 highest-impact items, or press `/` (with `↑`/`↓`/`Enter` navigation) to search across every field, table, and playbook step.
- **Readiness Audit & 10-Minute Fire Drill:** Spots real-world gaps (solo-only bank accounts, missing retirement/life-insurance beneficiaries, missing phone/2FA unlock info, stale backups) and tracks a 5-step spouse dry-run.
- **Modular Section Templates:** One-click templates under **+ Section** for Smart Home & Wi‑Fi, Crypto/Domains/Homelab, Small Business, Traveling/Caregiver, International/Expat Assets, and Aging Parents.
- **Flexible Printing:** Print the full guide (with or without empty blanks), a **1-page Caregiver / Fridge Sheet**, or a **1-page Break-Glass Cover Sheet** for your safe.
- **Check-Up Reminders:** Export a recurring 6-month `.ics` calendar reminder next to **Mark reviewed**.

## Run it

Open `index.html` in a browser. That's all.

To use it from any device, turn on **Settings → Pages** (deploy from the `main` branch) in your GitHub repo. Each device keeps its own answers, so use **Open backup** on a new device to load the same details.

## Files

| File | What it is |
|---|---|
| `index.html` | Page shell |
| `styles.css` | Look and print layout |
| `schema.js` | **All content**: checklists, scripts, sections, fields. Edit this to extend the guide. |
| `app.js` | Saving, rendering, added sections, backups, export |

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
