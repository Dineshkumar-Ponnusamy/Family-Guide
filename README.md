# Family Guide

A private, offline emergency guide for your family. If something happens and you can't be there, your spouse opens one page and finds what to do first, who to call, where the money and papers are, and a page written for the kids.

It's plain HTML, CSS and JavaScript: no build step, no server, no accounts, no tracking.

## Your data never goes in this repo

- Answers save only in the browser you type them in (`localStorage`).
- **Save backup** makes a file locked with a passphrase (AES‑256‑GCM, key derived with PBKDF2 using 250,000 rounds). Share the file and passphrase with your spouse separately.
- `.gitignore` blocks backup files (`family-guide-*.json`) so they can't be committed by accident.
- Never type passwords or full account numbers. Write where to find them, plus the last 4 digits.

Use a **private** repository anyway. Your section names alone can reveal things about your family.

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
