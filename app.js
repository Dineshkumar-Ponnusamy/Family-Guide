/* FAMILY FIELD GUIDE · APP
   Renders the content in schema.js, saves answers to localStorage,
   handles your own added sections, locked backups, and project export. */
const KEY = "familyFieldGuide.v1";
const PROJECT_FILES = ["index.html", "styles.css", "schema.js", "app.js", "README.md", "LICENSE"];
const GITIGNORE = "# Never commit your family's details\nfamily-field-guide-*.json\n*.backup.json\n.DS_Store\n";
let S = load();
const $ = s => document.querySelector(s);
const esc = v => String(v ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const uid = p => p + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}
function norm() {
  S.f ??= {}; S.lists ??= {}; S.checks ??= {}; S.track ??= "hurt"; S.tab ??= "start";
  S.extra ??= {}; S.customTabs ??= [];
  if (S.track && !PLAYBOOK[S.track]) S.track = "hurt";
  TABS.forEach(t => t.blocks.forEach(b => {
    if (b.type === "list" && !S.lists[b.id]) S.lists[b.id] = b.seed.map(r => ({ ...r }));
  }));
  Object.values(S.extra).flat().forEach(x => { if (x.type === "list") S.lists[x.id] ??= [{}]; });
  if (!allTabs().some(t => t.id === S.tab)) S.tab = "start";
}
const allTabs = () => [...TABS, ...S.customTabs.map(c => ({ ...c, custom: true, blocks: [], lede: "Your own section. Add fields or tables below." }))];
let saveT;
function save(quiet) {
  S.updated = new Date().toISOString();
  localStorage.setItem(KEY, JSON.stringify(S));
  meter();
  if (!quiet) { clearTimeout(saveT); saveT = setTimeout(() => toast("Saved on this device"), 500); }
}
function toast(m) {
  const t = $("#toast"); t.textContent = m; t.classList.add("show");
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("show"), 2000);
}

/* ---------- rendering ---------- */
function field(id, label, ph = "", area = false) {
  const v = esc(S.f[id]);
  return `<label class="f"><span>${esc(label)}</span>${area
    ? `<textarea data-f="${id}" placeholder="${esc(ph)}">${v}</textarea>`
    : `<input data-f="${id}" value="${v}" placeholder="${esc(ph)}">`}</label>`;
}
function listRows(id, cols) {
  return S.lists[id].map((r, i) => `<div class="row"><button class="x" title="Remove row" data-del="${id}:${i}">✕</button><div class="grid">${
    cols.map(([k, l]) => `<label class="f"><span>${esc(l)}</span><input data-l="${id}:${i}:${k}" value="${esc(r[k])}"></label>`).join("")
  }</div></div>`).join("");
}
const listCard = (id, title, hint, cols, extra = "") =>
  `<div class="card">${extra}<h3>${esc(title)}</h3>${hint ? `<p class="hint">${esc(hint)}</p>` : ""}<div class="rows" id="rows-${id}">${listRows(id, cols)}</div><button class="add" data-add="${id}">+ Add a row</button></div>`;

function block(b) {
  switch (b.type) {
    case "fields": return `<div class="card"><h3>${b.title}</h3>${b.hint ? `<p class="hint">${b.hint}</p>` : ""}<div class="grid2">${
      b.fields.map(f => `<div style="${f[3] ? "grid-column:1/-1" : ""}">${field(...f)}</div>`).join("")}</div></div>`;
    case "list": return listCard(b.id, b.title, b.hint, b.cols);
    case "glance": return `<div class="glance"><h3>If you read nothing else</h3><div class="g">${GLANCE.map(g => field(...g)).join("")}</div></div>`;
    case "playbook": return `<h3 style="font-family:var(--serif);font-size:22px;margin:6px 0 10px">What's happening?</h3><div class="track">${Object.entries(PLAYBOOK).map(([k, p]) =>
      `<button data-track="${k}" class="${S.track === k ? "on" : ""}">${p.label}</button>`).join("")}</div><div class="tprog" id="tprog"></div><div id="pb">${playbook()}</div>`;
    case "scripts": return `<div class="card" style="margin-top:22px"><h3>What to say</h3><p class="hint">Hard calls are easier with words ready.</p><div class="scripts">${
      SCRIPTS.map(([t, s]) => `<div class="script"><b>${t}</b><p>${s}</p></div>`).join("")}</div></div>`;
    case "letter": return `<div class="card letter"><h3>A note to you</h3><p class="hint">Write this whenever you're ready. It's the first thing they'll want to read.</p>${field("letter", "From me", "I love you. You can do this. Here's what I want you to know…", true)}</div>`;
    case "kids": return `<div class="kids"><div class="big">${KIDS.map(([id, e, t, ph]) =>
      `<div class="k"><div class="emoji">${e}</div><h4>${t}</h4><textarea data-f="${id}" placeholder="${esc(ph)}">${esc(S.f[id])}</textarea></div>`).join("")}</div></div>`;
  }
}
function playbook() {
  return Object.entries(PLAYBOOK).map(([k, p]) => `<div class="${S.track === k ? "" : "phase-hidden"}" data-label="${esc(p.label)}" style="${S.track === k ? "" : "display:none"}">
    ${p.phases.map(ph => `<div class="phase"><div class="when">${ph.when}</div><div class="steps">${ph.steps.map(s => `
      <div class="step ${S.checks[s.id] ? "done" : ""}"><input type="checkbox" data-c="${s.id}" ${S.checks[s.id] ? "checked" : ""}>
      <div><div class="t">${s.t}</div><div class="d">${s.d}</div>${s.ref ? `<div class="ref">↳ ${s.ref}</div>` : ""}</div></div>`).join("")}</div></div>`).join("")}
  </div>`).join("");
}
function trackProgress() {
  const steps = PLAYBOOK[S.track].phases.flatMap(p => p.steps);
  const done = steps.filter(s => S.checks[s.id]).length;
  const el = $("#tprog"); if (el) el.innerHTML = `${done} of ${steps.length} steps done${done ? ` · <a href="#" data-reset="1" style="color:var(--sky)">clear checks</a>` : ""}`;
}
function extras(tab) {
  const items = S.extra[tab.id] || [];
  const del = (x) => `<button class="cx" data-rmx="${tab.id}:${x.id}" title="Remove">remove ✕</button>`;
  const fieldsHtml = items.filter(x => x.type === "field");
  let html = fieldsHtml.length ? `<div class="card"><h3>${tab.custom ? "Details" : "More details"}</h3><div class="grid2">${
    fieldsHtml.map(x => `<div style="position:relative;${x.wide ? "grid-column:1/-1" : ""}">${field(x.id, x.label, "", x.wide)}<button class="cx" style="top:0;right:0" data-rmx="${tab.id}:${x.id}">✕</button></div>`).join("")}</div></div>` : "";
  html += items.filter(x => x.type === "list").map(x => listCard(x.id, x.title, "", x.cols, del(x))).join("");
  html += `<div class="extend"><p><b>Make it yours.</b> Add anything this section is missing.</p>
    <button class="add blue" data-newfield="${tab.id}">+ Add a field</button><button class="add blue" data-newlist="${tab.id}">+ Add a table</button>
    ${tab.custom ? `<button class="add" data-renametab="${tab.id}">Rename section</button><button class="add" data-deltab="${tab.id}">Delete section</button>` : ""}</div>`;
  return html;
}
function render() {
  const tabs = allTabs();
  $("#tabs").innerHTML = tabs.map(t => `<button data-tab="${t.id}" class="${S.tab === t.id ? "on" : ""} ${t.custom ? "custom" : ""}">${esc(t.label)}</button>`).join("")
    + `<button class="newtab" data-act="newtab">+ Section</button><span class="spacer"></span>`
    + `<button class="tool" data-act="backup">Save backup</button><button class="tool" data-act="restore">Open backup</button><button class="tool" data-act="print">Print</button><button class="tool" data-act="project">GitHub</button>`;
  $("#panels").innerHTML = tabs.map(t => `<section class="panel ${S.tab === t.id ? "on" : ""}" id="p-${t.id}"><h2>${esc(t.title)}</h2><p class="lede">${t.lede}</p>${t.blocks.map(block).join("")}${extras(t)}</section>`).join("");
  meter(); trackProgress();
}
function meter() {
  let total = 0, got = 0;
  const has = id => (S.f[id] || "").trim() ? 1 : 0;
  const listFilled = (id, cols) => Math.min(2, S.lists[id].filter(r => cols.slice(cols.length > 1 ? 1 : 0).some(([k]) => (r[k] || "").trim())).length);
  TABS.flatMap(t => t.blocks).forEach(b => {
    if (b.type === "fields") b.fields.forEach(f => { total++; got += has(f[0]); });
    if (b.type === "list") { total += 2; got += listFilled(b.id, b.cols); }
  });
  Object.values(S.extra).flat().forEach(x => {
    if (x.type === "field") { total++; got += has(x.id); } else { total += 2; got += listFilled(x.id, x.cols); }
  });
  [...KIDS, ...GLANCE].forEach(k => { total++; got += has(k[0]); });
  total++; got += has("letter");
  const p = Math.round(got / total * 100);
  $("#pct").textContent = p + "%"; $("#barfill").style.width = p + "%";
  const r = S.reviewed ? new Date(S.reviewed) : null, days = r ? (Date.now() - r) / 864e5 : Infinity;
  $("#rev").className = "rev" + (days > 180 ? " stale" : "");
  $("#rev").innerHTML = (r ? `Last reviewed ${r.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}${days > 180 ? " · time for a check‑up" : ""}` : "Not reviewed yet")
    + `<button data-act="reviewed">Mark reviewed</button>`;
}

/* ---------- events ---------- */
document.addEventListener("input", e => {
  const el = e.target;
  if (el.dataset.f) { S.f[el.dataset.f] = el.value; save(); }
  if (el.dataset.l) { const [id, i, k] = el.dataset.l.split(":"); S.lists[id][i][k] = el.value; save(); }
});
document.addEventListener("change", e => {
  const c = e.target.dataset.c;
  if (c) { S.checks[c] = e.target.checked; e.target.closest(".step").classList.toggle("done", e.target.checked); save(true); trackProgress(); }
});
document.addEventListener("click", e => {
  const a = e.target.closest("[data-reset]");
  if (a) { e.preventDefault(); PLAYBOOK[S.track].phases.flatMap(p => p.steps).forEach(s => delete S.checks[s.id]); save(true); $("#pb").innerHTML = playbook(); trackProgress(); return; }
  const d = e.target.closest("button")?.dataset; if (!d) return;
  if (d.tab) { S.tab = d.tab; save(true); render(); scrollTo({ top: 0, behavior: "smooth" }); }
  if (d.track) { S.track = d.track; save(true); document.querySelectorAll("[data-track]").forEach(b => b.classList.toggle("on", b.dataset.track === d.track)); $("#pb").innerHTML = playbook(); trackProgress(); }
  if (d.add) { S.lists[d.add].push({}); save(true); relist(d.add); }
  if (d.del) { const [id, i] = d.del.split(":"); S.lists[id].splice(+i, 1); save(true); relist(id); }
  if (d.newfield) newFieldDialog(d.newfield);
  if (d.newlist) newListDialog(d.newlist);
  if (d.rmx) { const [t, id] = d.rmx.split(":"); confirmDlg("Remove this and what you typed in it?", () => { S.extra[t] = S.extra[t].filter(x => x.id !== id); delete S.f[id]; delete S.lists[id]; save(true); render(); }); }
  if (d.renametab) textDialog("Rename section", "Section name", S.customTabs.find(t => t.id === d.renametab).label, v => { const t = S.customTabs.find(t => t.id === d.renametab); t.label = t.title = v; save(true); render(); });
  if (d.deltab) confirmDlg("Delete this whole section and everything in it?", () => { (S.extra[d.deltab] || []).forEach(x => { delete S.f[x.id]; delete S.lists[x.id]; }); delete S.extra[d.deltab]; S.customTabs = S.customTabs.filter(t => t.id !== d.deltab); S.tab = "start"; save(true); render(); });
  if (d.act === "newtab") textDialog("Add a section", "Section name", "", v => { const id = uid("tab"); S.customTabs.push({ id, label: v, title: v }); S.tab = id; save(true); render(); }, "e.g. Aging parents, Our business, Rental property");
  if (d.act === "reviewed") { S.reviewed = new Date().toISOString(); save(true); toast("Marked as reviewed"); }
  if (d.act === "print") window.print();
  if (d.act === "backup") backupDialog();
  if (d.act === "restore") $("#fileIn").click();
  if (d.act === "project") projectDialog();
});
function relist(id) {
  const b = TABS.flatMap(t => t.blocks).find(x => x.id === id) || Object.values(S.extra).flat().find(x => x.id === id);
  $("#rows-" + id).innerHTML = listRows(id, b.cols);
}

/* ---------- dialogs ---------- */
function openDlg(html) { $("#dlgForm").innerHTML = html; $("#dlg").showModal(); }
const btns = (go = "Save") => `<div class="btns"><button class="btn" value="cancel" formnovalidate>Cancel</button><button class="btn primary" id="go">${go}</button></div>`;
function onGo(fn) { $("#go").onclick = ev => { ev.preventDefault(); fn(); }; }
function textDialog(title, label, val, cb, ph = "") {
  openDlg(`<h3>${title}</h3><label class="f"><span>${label}</span><input id="tx" value="${esc(val)}" placeholder="${esc(ph)}"></label>${btns()}`);
  onGo(() => { const v = $("#tx").value.trim(); if (!v) return toast("Give it a name"); $("#dlg").close(); cb(v); });
}
function confirmDlg(msg, cb) { openDlg(`<h3>Are you sure?</h3><p>${msg}</p>${btns("Yes, remove")}`); onGo(() => { $("#dlg").close(); cb(); }); }
function newFieldDialog(tab) {
  openDlg(`<h3>Add a field</h3><label class="f"><span>What should it ask?</span><input id="tx" placeholder="e.g. Storage unit location & code holder"></label>
    <label style="display:flex;gap:8px;align-items:center;margin-top:10px;font-size:14px"><input type="checkbox" id="wide" style="width:auto"> Needs room for a longer answer</label>${btns("Add")}`);
  onGo(() => { const v = $("#tx").value.trim(); if (!v) return toast("Type a label");
    (S.extra[tab] ??= []).push({ type: "field", id: uid("x"), label: v, wide: $("#wide").checked }); $("#dlg").close(); save(true); render(); });
}
function newListDialog(tab) {
  openDlg(`<h3>Add a table</h3><p class="hint">For things with several entries, like rental properties or online accounts.</p>
    <label class="f"><span>Table name</span><input id="tx" placeholder="e.g. Rental properties"></label>
    <label class="f" style="margin-top:8px"><span>Columns, separated by commas</span><input id="cols" placeholder="e.g. Address, Tenant, Rent, Manager phone"></label>${btns("Add")}`);
  onGo(() => {
    const v = $("#tx").value.trim(), cols = $("#cols").value.split(",").map(s => s.trim()).filter(Boolean);
    if (!v || !cols.length) return toast("Add a name and at least one column");
    const id = uid("l"); (S.extra[tab] ??= []).push({ type: "list", id, title: v, cols: cols.map((c, i) => ["c" + i, c]) });
    S.lists[id] = [{}]; $("#dlg").close(); save(true); render();
  });
}

/* ---------- GitHub project export ---------- */
function structureOnly() {
  // Your added sections, labels only: no answers. Safe to commit.
  return JSON.stringify({ customTabs: S.customTabs, extra: S.extra }, null, 2);
}
function download(name, text, type = "text/plain") {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
function projectDialog() {
  openDlg(`<h3>Save this project to GitHub</h3>
    <p class="hint">The code is safe to share. Your family's answers live only in this browser and in locked backups, which are never included.</p>
    <ol><li>Download the project files below.</li>
    <li>On GitHub, create a new <b>private</b> repository (e.g. <code>family-field-guide</code>).</li>
    <li>Choose <b>Add file → Upload files</b>, drag the files in, and commit. Rename <code>gitignore.txt</code> to <code>.gitignore</code>.</li>
    <li>Optional: turn on <b>Settings → Pages</b> to open the guide from any device.</li></ol>
    <p class="hint">README.md explains how to add new sections in code.</p>
    ${S.customTabs.length || Object.keys(S.extra).length ? `<label class="f"><span>Your added sections (labels only, no answers)</span><textarea readonly style="min-height:90px;font:11px var(--mono)">${esc(structureOnly())}</textarea></label>` : ""}
    <div class="btns"><button class="btn" value="cancel" formnovalidate>Close</button><button class="btn primary" id="go">Download project files</button></div>`);
  onGo(async () => {
    let ok = 0;
    for (const f of PROJECT_FILES) {
      try { const r = await fetch(f); if (!r.ok) throw 0; download(f, await r.text()); ok++; await new Promise(z => setTimeout(z, 250)); } catch {}
    }
    download("gitignore.txt", GITIGNORE);
    if (S.customTabs.length || Object.keys(S.extra).length) download("my-sections.json", structureOnly(), "application/json");
    toast(ok === PROJECT_FILES.length ? "Project files downloaded" : `Downloaded ${ok} of ${PROJECT_FILES.length}. Your browser may have blocked some`);
  });
}

/* ---------- passphrase-locked backup ---------- */
const enc = new TextEncoder(), dec = new TextDecoder();
const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function keyFrom(pass, salt) {
  const base = await crypto.subtle.importKey("raw", enc.encode(pass), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 250000, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}
function backupDialog() {
  openDlg(`<h3>Save a locked backup</h3><p class="hint">Choose a passphrase your spouse knows (or keep it with your will). Without it, the file can't be opened. Don't upload backups to GitHub.</p>
    <label class="f"><span>Passphrase</span><input type="password" id="pw1" required></label>
    <label class="f" style="margin-top:8px"><span>Type it again</span><input type="password" id="pw2" required></label>${btns("Save file")}`);
  onGo(async () => {
    const p = $("#pw1").value;
    if (p.length < 8) return toast("Use at least 8 characters");
    if (p !== $("#pw2").value) return toast("Passphrases don't match");
    const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await keyFrom(p, salt), enc.encode(JSON.stringify(S)));
    const out = JSON.stringify({ app: "family-field-guide", v: 1, salt: b64(salt), iv: b64(iv), data: b64(ct) });
    download(`family-field-guide-${new Date().toISOString().slice(0, 10)}.json`, out, "application/json");
    openDlg(`<h3>Backup ready</h3><p>If the download didn't start, copy this locked text into a file instead. It's unreadable without the passphrase.</p>
      <textarea readonly style="min-height:120px;font:11px var(--mono)">${out}</textarea><div class="btns"><button class="btn primary">Done</button></div>`);
  });
}
$("#fileIn").onchange = async e => {
  const file = e.target.files[0]; e.target.value = ""; if (!file) return;
  let pkg; try { pkg = JSON.parse(await file.text()); } catch { return toast("That file isn't a guide backup"); }
  if (pkg.app !== "family-field-guide") return toast("That file isn't a guide backup");
  openDlg(`<h3>Open backup</h3><p class="hint">This replaces what's on this device.</p>
    <label class="f"><span>Passphrase</span><input type="password" id="pw" required></label>${btns("Unlock")}`);
  onGo(async () => {
    try {
      const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(pkg.iv) }, await keyFrom($("#pw").value, unb64(pkg.salt)), unb64(pkg.data));
      S = JSON.parse(dec.decode(pt)); norm(); save(true); render(); $("#dlg").close(); toast("Backup opened");
    } catch { toast("Wrong passphrase"); }
  });
};

norm(); render();
