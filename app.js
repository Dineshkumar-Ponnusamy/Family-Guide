/* FAMILY FIELD GUIDE · APP
   Renders the content in schema.js, saves answers to localStorage,
   handles Read/Edit modes, search, essentials, templates, print sheets,
   locked JSON + standalone HTML backups, and project export. */
const KEY = "familyFieldGuide.v1";
const PROJECT_FILES = ["index.html", "styles.css", "schema.js", "app.js", "README.md", "LICENSE"];
const GITIGNORE = "# Never commit your family's details\nfamily-field-guide-*.json\nfamily-field-guide-*.html\nfamily-guide-*.json\n*.backup.json\n.DS_Store\n";
let S = load();
const $ = s => document.querySelector(s);
const esc = v => String(v ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const safeJson = v => JSON.stringify(v).replace(/<\/script/gi, "<\\/script");
const uid = p => p + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const hasCrypto = () => Boolean(window.crypto && crypto.subtle && crypto.getRandomValues);

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}
function norm() {
  S.f ??= {}; S.lists ??= {}; S.checks ??= {}; S.track ??= "hurt"; S.tab ??= "start";
  S.extra ??= {}; S.customTabs ??= [];
  S.readMode = Boolean(S.readMode);
  S.hideEssentials = Boolean(S.hideEssentials);
  S.lastBackup ??= null;
  if (S.track && !PLAYBOOK[S.track]) S.track = "hurt";
  TABS.forEach(t => t.blocks.forEach(b => {
    if (b.type === "list" && !S.lists[b.id]) S.lists[b.id] = b.seed.map(r => ({ ...r }));
  }));
  Object.values(S.extra).flat().forEach(x => { if (x.type === "list") S.lists[x.id] ??= [{}]; });
  if (!allTabs().some(t => t.id === S.tab)) S.tab = "start";
}
const allTabs = () => [...TABS, ...S.customTabs.map(c => ({ ...c, custom: true, blocks: [], lede: "Your own section. Add fields or tables below." }))];

let saveT;
function save(quiet, touch = true) {
  if (touch) S.updated = new Date().toISOString();
  localStorage.setItem(KEY, JSON.stringify(S));
  meter();
  if (!quiet) { clearTimeout(saveT); saveT = setTimeout(() => toast("Saved on this device"), 500); }
}
function toast(m) {
  const t = $("#toast"); t.textContent = m; t.classList.add("show");
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("show"), 2200);
}

/* ---------- helpers: linkify, emptiness, seed detection ---------- */
function linkify(v) {
  const s = esc(v);
  const re = /(https?:\/\/[^\s<>"']+)|([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})|(\+?\d[\d\s().-]{6,}\d)/g;
  return s.replace(re, (m, url, email, phone) => {
    if (url) {
      let clean = url, trail = "";
      const tm = clean.match(/[.,;:!?)]+$/);
      if (tm) { clean = clean.slice(0, -tm[0].length); trail = tm[0]; }
      return `<a href="${clean}" target="_blank" rel="noopener noreferrer">${clean}</a>${trail}`;
    }
    if (email) return `<a href="mailto:${email}">${email}</a>`;
    if (phone) {
      const digits = phone.replace(/[^\d+]/g, "");
      if (digits.replace(/\D/g, "").length < 7) return m;
      return `<a href="tel:${digits}">${phone}</a>`;
    }
    return m;
  });
}

function findBlockDef(id) {
  return TABS.flatMap(t => t.blocks).find(x => x.id === id) || Object.values(S.extra).flat().find(x => x.id === id);
}

function isRowUserEdited(blockId, row) {
  if (!row) return false;
  const nonEmptyEntries = Object.entries(row).filter(([, val]) => String(val ?? "").trim() !== "");
  if (!nonEmptyEntries.length) return false;
  const b = findBlockDef(blockId);
  if (b?.seed?.length) {
    const matchesSeed = b.seed.some(seedRow => {
      const seedEntries = Object.entries(seedRow).filter(([, val]) => String(val ?? "").trim() !== "");
      if (seedEntries.length !== nonEmptyEntries.length) return false;
      return seedEntries.every(([k, val]) => String(row[k] ?? "").trim() === String(val ?? "").trim());
    });
    if (matchesSeed) return false;
  }
  return true;
}

function rowHasFilledValue(id, row) {
  return isRowUserEdited(id, row);
}

function hasAnyContent() {
  if (Object.values(S.f).some(v => String(v ?? "").trim() !== "")) return true;
  if (Object.keys(S.lists).some(id => (S.lists[id] || []).some(r => rowHasFilledValue(id, r)))) return true;
  if (S.customTabs.length || Object.keys(S.extra).length) return true;
  return false;
}

/* ---------- rendering ---------- */
function field(id, label, ph = "", area = false) {
  const raw = S.f[id] ?? "";
  const v = esc(raw);
  const empty = !String(raw).trim();
  if (S.readMode) {
    return `<div class="fwrap${empty ? " is-empty" : ""}" data-fwrap="${esc(id)}"><label class="f"><span>${esc(label)}</span><div class="ro-val${area ? " area" : ""}">${empty ? "" : linkify(raw)}</div></label></div>`;
  }
  return `<div class="fwrap${empty ? " is-empty" : ""}" data-fwrap="${esc(id)}"><label class="f"><span>${esc(label)}</span>${area
    ? `<textarea data-f="${esc(id)}" placeholder="${esc(ph)}">${v}</textarea><div class="print-val" data-pv="${esc(id)}">${v}</div>`
    : `<input data-f="${esc(id)}" value="${v}" placeholder="${esc(ph)}">`}</label></div>`;
}

function listRows(id, cols, editable = !S.readMode) {
  return (S.lists[id] || []).map((r, i) => {
    const hasData = rowHasFilledValue(id, r);
    const cls = `row${hasData ? "" : " is-empty"}`;
    if (!editable) {
      if (!hasData) return "";
      return `<div class="${cls}"><div class="grid">${
        cols.map(([k, l]) => {
          const val = String(r[k] ?? "");
          return `<div class="fwrap${val.trim() ? "" : " is-empty"}"><label class="f"><span>${esc(l)}</span><div class="ro-val">${val.trim() ? linkify(val) : ""}</div></label></div>`;
        }).join("")
      }</div></div>`;
    }
    const b = findBlockDef(id);
    const crisisCls = b?.crisisEditable ? " crisis-x" : "";
    return `<div class="${cls}"><button type="button" class="x${crisisCls}" title="Remove row" data-del="${esc(id)}:${i}">✕</button><div class="grid">${
      cols.map(([k, l]) => `<label class="f"><span>${esc(l)}</span><input data-l="${esc(id)}:${i}:${esc(k)}" value="${esc(r[k])}"></label>`).join("")
    }</div></div>`;
  }).join("");
}

function listCard(id, title, hint, cols, extra = "", opts = {}) {
  const editable = !S.readMode || opts.crisisEditable;
  const rows = S.lists[id] || [];
  const hasAny = rows.some(r => rowHasFilledValue(id, r));
  if (S.readMode && !hasAny && !opts.crisisEditable) return "";
  const crisisAdd = opts.crisisEditable ? " crisis-add" : "";
  return `<div class="card${hasAny ? "" : " is-empty"}" data-block-id="${esc(id)}" data-block-title="${esc(title)}">${extra}<h3>${esc(title)}</h3>${hint ? `<p class="hint">${esc(hint)}</p>` : ""}<div class="rows" id="rows-${esc(id)}">${listRows(id, cols, editable)}</div>${editable ? `<button type="button" class="add${crisisAdd}" data-add="${esc(id)}">+ Add a row</button>` : ""}</div>`;
}

function essentialsHtml() {
  if (S.readMode) return "";
  const doneCount = ESSENTIALS.filter(e => e.type === "field"
    ? Boolean(String(S.f[e.id] || "").trim())
    : (S.lists[e.id] || []).some(r => rowHasFilledValue(e.id, r))).length;
  if (S.hideEssentials) {
    return doneCount < ESSENTIALS.length
      ? `<div class="ess-show"><button type="button" data-act="showEss">Show 15-minute essentials (${doneCount}/${ESSENTIALS.length})</button></div>`
      : "";
  }
  return `<div class="essentials" id="essentials">
    <div class="ess-head">
      <h3>15-minute essentials</h3>
      <div class="ess-actions">
        <span>${doneCount} of ${ESSENTIALS.length} filled</span>
        <button type="button" data-act="hideEss">Hide</button>
      </div>
    </div>
    <div class="ess-grid">${ESSENTIALS.map(e => {
      const ok = e.type === "field"
        ? Boolean(String(S.f[e.id] || "").trim())
        : (S.lists[e.id] || []).some(r => rowHasFilledValue(e.id, r));
      return `<button type="button" class="ess-pill${ok ? " done" : ""}" data-jump-tab="${esc(e.tab)}" data-jump-block="${esc(e.block)}" data-jump-field="${e.type === "field" ? esc(e.id) : ""}">${ok ? "✓ " : ""}${esc(e.label)}</button>`;
    }).join("")}</div>
  </div>`;
}

function block(b) {
  switch (b.type) {
    case "fields": {
      const anyFilled = b.fields.some(f => String(S.f[f[0]] || "").trim() !== "");
      if (S.readMode && !anyFilled) return "";
      return `<div class="card${anyFilled ? "" : " is-empty"}" data-block-title="${esc(b.title)}"><h3>${esc(b.title)}</h3>${b.hint ? `<p class="hint">${esc(b.hint)}</p>` : ""}<div class="grid2">${
        b.fields.map(f => {
          const empty = !String(S.f[f[0]] || "").trim();
          if (S.readMode && empty) return "";
          return `<div class="${empty ? "is-empty" : ""}" style="${f[3] ? "grid-column:1/-1" : ""}">${field(...f)}</div>`;
        }).join("")}</div></div>`;
    }
    case "list": return listCard(b.id, b.title, b.hint, b.cols, "", { crisisEditable: b.crisisEditable });
    case "glance": {
      const anyFilled = GLANCE.some(g => String(S.f[g[0]] || "").trim() !== "");
      const body = S.readMode && !anyFilled
        ? `<p class="hint" style="color:#c9d3cc;margin:0">Nothing filled in here yet.</p>`
        : `<div class="g">${GLANCE.map(g => (S.readMode && !String(S.f[g[0]] || "").trim()) ? "" : field(...g)).join("")}</div>`;
      return `${essentialsHtml()}<div class="glance${anyFilled ? "" : " is-empty"}" data-block-title="If you read nothing else"><h3>If you read nothing else</h3>${body}</div>`;
    }
    case "playbook": return `<h3 style="font-family:var(--serif);font-size:22px;margin:6px 0 10px">What's happening?</h3><div class="track">${Object.entries(PLAYBOOK).map(([k, p]) =>
      `<button type="button" data-track="${esc(k)}" class="${S.track === k ? "on" : ""}">${esc(p.label)}</button>`).join("")}</div><div class="tprog" id="tprog"></div><div id="pb">${playbook()}</div>`;
    case "scripts": return `<div class="card" data-block-title="What to say" style="margin-top:22px"><h3>What to say</h3><p class="hint">Hard calls are easier with words ready.</p><div class="scripts">${
      SCRIPTS.map(([t, s]) => `<div class="script"><b>${esc(t)}</b><p>${esc(s)}</p></div>`).join("")}</div></div>`;
    case "letter": {
      const hasL = Boolean(String(S.f.letter || "").trim());
      if (S.readMode && !hasL) return "";
      return `<div class="card letter${hasL ? "" : " is-empty"}" data-block-title="A note to you"><h3>A note to you</h3><p class="hint">Write this whenever you're ready. It's the first thing they'll want to read.</p>${field("letter", "From me", "I love you. You can do this. Here's what I want you to know…", true)}</div>`;
    }
    case "kids": {
      const anyKids = KIDS.some(k => String(S.f[k[0]] || "").trim() !== "");
      if (S.readMode && !anyKids) return "";
      return `<div class="kids${anyKids ? "" : " is-empty"}" data-block-title="For the kids"><div class="big">${KIDS.map(([id, e, t, ph]) => {
        const raw = S.f[id] ?? "";
        const empty = !String(raw).trim();
        if (S.readMode && empty) return "";
        return `<div class="k${empty ? " is-empty" : ""}" data-fwrap="${esc(id)}"><div class="emoji">${e}</div><h4>${esc(t)}</h4>${
          S.readMode
            ? `<div class="ro-val area">${linkify(raw)}</div>`
            : `<textarea data-f="${esc(id)}" placeholder="${esc(ph)}">${esc(raw)}</textarea><div class="print-val" data-pv="${esc(id)}">${esc(raw)}</div>`
        }</div>`;
      }).join("")}</div></div>`;
    }
  }
}

function playbook() {
  return Object.entries(PLAYBOOK).map(([k, p]) => `<div class="${S.track === k ? "" : "phase-hidden"}" data-label="${esc(p.label)}" style="${S.track === k ? "" : "display:none"}">
    ${p.phases.map(ph => `<div class="phase"><div class="when">${esc(ph.when)}</div><div class="steps">${ph.steps.map(s => {
      const refHtml = s.ref
        ? (s.refTab
          ? `<button type="button" class="ref-link" data-jump-tab="${esc(s.refTab)}" data-jump-block="${esc(s.refBlock || "")}">↳ ${esc(s.ref)}</button>`
          : `<div class="ref">↳ ${esc(s.ref)}</div>`)
        : "";
      return `<div class="step ${S.checks[s.id] ? "done" : ""}" data-step-id="${esc(s.id)}"><input type="checkbox" data-c="${esc(s.id)}" ${S.checks[s.id] ? "checked" : ""}>
      <div><div class="t">${esc(s.t)}</div><div class="d">${esc(s.d)}</div>${refHtml}</div></div>`;
    }).join("")}</div></div>`).join("")}
  </div>`).join("");
}

function trackProgress() {
  const steps = PLAYBOOK[S.track].phases.flatMap(p => p.steps);
  const done = steps.filter(s => S.checks[s.id]).length;
  const el = $("#tprog"); if (el) el.innerHTML = `${done} of ${steps.length} steps done${done ? ` · <a href="#" data-reset="1" style="color:var(--sky)">clear checks</a>` : ""}`;
}

function extras(tab) {
  const items = S.extra[tab.id] || [];
  const del = (x) => S.readMode ? "" : `<button type="button" class="cx" data-rmx="${esc(tab.id)}:${esc(x.id)}" title="Remove">remove ✕</button>`;
  const fieldsHtml = items.filter(x => x.type === "field");
  const anyExtraField = fieldsHtml.some(x => String(S.f[x.id] || "").trim() !== "");
  let html = "";
  if (fieldsHtml.length && (!S.readMode || anyExtraField)) {
    html += `<div class="card${anyExtraField ? "" : " is-empty"}" data-block-title="${tab.custom ? "Details" : "More details"}"><h3>${tab.custom ? "Details" : "More details"}</h3><div class="grid2">${
      fieldsHtml.map(x => {
        const empty = !String(S.f[x.id] || "").trim();
        if (S.readMode && empty) return "";
        return `<div class="${empty ? "is-empty" : ""}" style="position:relative;${x.wide ? "grid-column:1/-1" : ""}">${field(x.id, x.label, "", x.wide)}${S.readMode ? "" : `<button type="button" class="cx" style="top:0;right:0" data-rmx="${esc(tab.id)}:${esc(x.id)}">✕</button>`}</div>`;
      }).join("")}</div></div>`;
  }
  html += items.filter(x => x.type === "list").map(x => listCard(x.id, x.title, "", x.cols, del(x))).join("");
  if (!S.readMode) {
    html += `<div class="extend"><p><b>Make it yours.</b> Add anything this section is missing.</p>
      <button type="button" class="add blue" data-newfield="${esc(tab.id)}">+ Add a field</button><button type="button" class="add blue" data-newlist="${esc(tab.id)}">+ Add a table</button>
      ${tab.custom ? `<button type="button" class="add" data-renametab="${esc(tab.id)}">Rename section</button><button type="button" class="add" data-deltab="${esc(tab.id)}">Delete section</button>` : ""}</div>`;
  }
  return html;
}

function render() {
  document.body.classList.toggle("read-mode", !!S.readMode);
  const tabs = allTabs();
  $("#tabs").innerHTML = tabs.map(t => `<button type="button" data-tab="${esc(t.id)}" class="${S.tab === t.id ? "on" : ""} ${t.custom ? "custom" : ""}">${esc(t.label)}</button>`).join("")
    + `<button type="button" class="newtab" data-act="newtab">+ Section</button><span class="spacer"></span>`
    + `<button type="button" class="tool${S.readMode ? " on" : ""}" data-act="toggleRead">${S.readMode ? "Edit mode" : "Read mode"}</button>`
    + `<button type="button" class="tool" data-act="backup">Save backup</button>`
    + `<button type="button" class="tool" data-act="restore">Open backup</button>`
    + `<button type="button" class="tool" data-act="print">Print</button>`
    + `<button type="button" class="tool" data-act="project">GitHub</button>`;

  $("#modeBanner").innerHTML = S.readMode
    ? `<div class="mode-banner"><span><b>Read mode</b> — showing filled details only so nothing gets edited by accident. Playbook checks and the Call &amp; claim log stay interactive.</span><button type="button" data-act="toggleRead">Switch to Edit mode</button></div>`
    : "";

  $("#panels").innerHTML = tabs.map(t => {
    const inner = t.blocks.map(block).join("") + extras(t);
    const body = (S.readMode && !inner.trim())
      ? `<div class="ro-empty-tab">Nothing filled in this section yet. <a href="#" data-act="toggleReadLink" style="color:var(--sky)">Switch to Edit mode</a> to add details.</div>`
      : inner;
    return `<section class="panel ${S.tab === t.id ? "on" : ""}" id="p-${esc(t.id)}"><h2>${esc(t.title)}</h2><p class="lede">${esc(t.lede)}</p>${body}</section>`;
  }).join("");
  meter(); trackProgress();
}

function meter() {
  let total = 0, got = 0;
  const has = id => (S.f[id] || "").trim() ? 1 : 0;
  const listFilled = (id) => Math.min(2, (S.lists[id] || []).filter(r => rowHasFilledValue(id, r)).length);
  TABS.flatMap(t => t.blocks).forEach(b => {
    if (b.type === "fields") b.fields.forEach(f => { total++; got += has(f[0]); });
    if (b.type === "list") { total += 2; got += listFilled(b.id); }
  });
  Object.values(S.extra).flat().forEach(x => {
    if (x.type === "field") { total++; got += has(x.id); } else { total += 2; got += listFilled(x.id); }
  });
  [...KIDS, ...GLANCE].forEach(k => { total++; got += has(k[0]); });
  total++; got += has("letter");
  const p = total ? Math.round(got / total * 100) : 0;
  $("#pct").textContent = p + "%"; $("#barfill").style.width = p + "%";
  const r = S.reviewed ? new Date(S.reviewed) : null, days = r ? (Date.now() - r) / 864e5 : Infinity;
  $("#rev").className = "rev" + (days > 180 ? " stale" : "");
  const unsaved = hasAnyContent() && (!S.lastBackup || (S.updated && S.updated > S.lastBackup));
  $("#rev").innerHTML = (r ? `Last reviewed ${r.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}${days > 180 ? " · time for a check‑up" : ""}` : "Not reviewed yet")
    + `<button type="button" data-act="reviewed">Mark reviewed</button><button type="button" data-act="ics" title="Add 6-month reminder to calendar">Remind me</button>`
    + (unsaved ? `<div class="backup-warn">Unsaved changes · <button type="button" data-act="backup">Save backup</button></div>` : "");
}

/* ---------- navigation, jumpTo, search ---------- */
function jumpTo(tabId, blockKey = "", fieldId = "", trackKey = "") {
  if (!allTabs().some(t => t.id === tabId)) return;
  S.tab = tabId;
  if (trackKey && PLAYBOOK[trackKey]) S.track = trackKey;
  save(true, false);
  render();
  const panel = $("#p-" + CSS.escape(tabId));
  if (!panel) return;
  let target = null;
  if (fieldId) target = panel.querySelector(`[data-f="${CSS.escape(fieldId)}"], [data-fwrap="${CSS.escape(fieldId)}"]`);
  if (!target && blockKey) {
    target = panel.querySelector(`[data-block-id="${CSS.escape(blockKey)}"]`)
      || panel.querySelector(`[data-block-title="${CSS.escape(blockKey)}"]`)
      || panel.querySelector(`[data-step-id="${CSS.escape(blockKey)}"]`);
  }
  if (target) {
    const card = target.closest(".card,.glance,.kids,.step") || target;
    card.scrollIntoView({ behavior: "smooth", block: "center" });
    card.classList.remove("flash");
    void card.offsetWidth;
    card.classList.add("flash");
    setTimeout(() => card.classList.remove("flash"), 1700);
    if (!S.readMode && fieldId) {
      const inp = panel.querySelector(`[data-f="${CSS.escape(fieldId)}"]`);
      if (inp && typeof inp.focus === "function") inp.focus({ preventScroll: true });
    }
  } else {
    scrollTo({ top: 0, behavior: "smooth" });
  }
}

function runSearch(q) {
  const res = $("#searchRes");
  const term = q.trim().toLowerCase();
  if (!term) { res.hidden = true; res.innerHTML = ""; return; }
  const hits = [];
  const push = (tabId, tabLabel, title, sub, blockKey = "", fieldId = "", trackKey = "") => {
    if (hits.length >= 12) return;
    hits.push({ tabId, tabLabel, title, sub, blockKey, fieldId, trackKey });
  };

  GLANCE.forEach(([id, label]) => {
    const val = String(S.f[id] || "");
    if (label.toLowerCase().includes(term) || val.toLowerCase().includes(term)) {
      push("start", "Start here", label, val || "Quick glance", "If you read nothing else", id);
    }
  });

  allTabs().forEach(t => {
    (t.blocks || []).forEach(b => {
      if (b.type === "fields") {
        b.fields.forEach(([id, label]) => {
          const val = String(S.f[id] || "");
          if (label.toLowerCase().includes(term) || val.toLowerCase().includes(term) || b.title.toLowerCase().includes(term)) {
            push(t.id, t.label, label, val || b.title, b.title, id);
          }
        });
      }
      if (b.type === "list") {
        const rows = S.lists[b.id] || [];
        const matchedRow = rows.find(r => Object.values(r).some(v => String(v || "").toLowerCase().includes(term)));
        if (b.title.toLowerCase().includes(term) || matchedRow) {
          const preview = matchedRow ? Object.values(matchedRow).filter(Boolean).join(" · ") : (b.hint || "Table");
          push(t.id, t.label, b.title, preview, b.id);
        }
      }
    });
    (S.extra[t.id] || []).forEach(x => {
      if (x.type === "field") {
        const val = String(S.f[x.id] || "");
        if (x.label.toLowerCase().includes(term) || val.toLowerCase().includes(term)) {
          push(t.id, t.label, x.label, val || "Custom field", t.custom ? "Details" : "More details", x.id);
        }
      } else {
        const matchedRow = (S.lists[x.id] || []).find(r => Object.values(r).some(v => String(v || "").toLowerCase().includes(term)));
        if (x.title.toLowerCase().includes(term) || matchedRow) {
          const preview = matchedRow ? Object.values(matchedRow).filter(Boolean).join(" · ") : "Custom table";
          push(t.id, t.label, x.title, preview, x.id);
        }
      }
    });
  });

  KIDS.forEach(([id, , label]) => {
    const val = String(S.f[id] || "");
    if (label.toLowerCase().includes(term) || val.toLowerCase().includes(term)) {
      push("kids", "For the kids", label, val || "Kids page", "For the kids", id);
    }
  });
  if ("a note to you letter from me".includes(term) || String(S.f.letter || "").toLowerCase().includes(term)) {
    push("start", "Start here", "A note to you", String(S.f.letter || "").slice(0, 80) || "Personal letter", "A note to you", "letter");
  }
  Object.entries(PLAYBOOK).forEach(([tk, p]) => {
    p.phases.forEach(ph => ph.steps.forEach(s => {
      if (s.t.toLowerCase().includes(term) || s.d.toLowerCase().includes(term)) {
        push("start", "Playbook", s.t, s.d, s.id, "", tk);
      }
    }));
  });
  SCRIPTS.forEach(([title, body]) => {
    if (title.toLowerCase().includes(term) || body.toLowerCase().includes(term)) {
      push("start", "Scripts", title, body, "What to say");
    }
  });

  res.innerHTML = hits.length
    ? hits.map((h, i) => `<button type="button" class="sr-item" data-sr="${i}"><span class="sr-tab">${esc(h.tabLabel)}</span><span class="sr-txt"><b>${esc(h.title)}</b>${h.sub ? ` — ${esc(h.sub)}` : ""}</span></button>`).join("")
    : `<div class="sr-empty">No matches for "${esc(q.trim())}"</div>`;
  res._hits = hits;
  res.hidden = false;
}

/* ---------- events ---------- */
document.addEventListener("input", e => {
  const el = e.target;
  if (el.id === "searchIn") { runSearch(el.value); return; }
  if (el.dataset.f) {
    const id = el.dataset.f;
    S.f[id] = el.value;
    const pv = document.querySelector(`[data-pv="${CSS.escape(id)}"]`);
    if (pv) pv.textContent = el.value;
    const wrap = el.closest("[data-fwrap]");
    if (wrap) wrap.classList.toggle("is-empty", !el.value.trim());
    const card = el.closest(".card,.glance,.kids");
    if (card) {
      const any = Array.from(card.querySelectorAll("[data-f]")).some(x => x.value.trim() !== "");
      card.classList.toggle("is-empty", !any);
    }
    save();
  }
  if (el.dataset.l) {
    const [id, i, k] = el.dataset.l.split(":");
    S.lists[id][i][k] = el.value;
    const rowEl = el.closest(".row");
    if (rowEl) rowEl.classList.toggle("is-empty", !rowHasFilledValue(id, S.lists[id][i]));
    const card = el.closest(".card");
    if (card) card.classList.toggle("is-empty", !(S.lists[id] || []).some(r => rowHasFilledValue(id, r)));
    save();
  }
});

document.addEventListener("change", e => {
  const c = e.target.dataset.c;
  if (c) { S.checks[c] = e.target.checked; e.target.closest(".step").classList.toggle("done", e.target.checked); save(true); trackProgress(); }
});

document.addEventListener("keydown", e => {
  if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
    const tag = (document.activeElement?.tagName || "").toLowerCase();
    if (!["input", "textarea", "select"].includes(tag) && !$("#dlg").open) {
      e.preventDefault();
      $("#searchIn").focus();
    }
  } else if (e.key === "Escape") {
    const res = $("#searchRes");
    if (!res.hidden) {
      res.hidden = true;
      $("#searchIn").blur();
    }
  }
});

document.addEventListener("click", e => {
  if (!e.target.closest("#searchbar")) {
    $("#searchRes").hidden = true;
  }
  const sr = e.target.closest("[data-sr]");
  if (sr) {
    const h = $("#searchRes")._hits?.[+sr.dataset.sr];
    $("#searchRes").hidden = true;
    $("#searchIn").value = "";
    if (h) jumpTo(h.tabId, h.blockKey, h.fieldId, h.trackKey);
    return;
  }
  const jmp = e.target.closest("[data-jump-tab]");
  if (jmp) {
    jumpTo(jmp.dataset.jumpTab, jmp.dataset.jumpBlock || "", jmp.dataset.jumpField || "");
    return;
  }
  const a = e.target.closest("[data-reset]");
  if (a) { e.preventDefault(); PLAYBOOK[S.track].phases.flatMap(p => p.steps).forEach(s => delete S.checks[s.id]); save(true); $("#pb").innerHTML = playbook(); trackProgress(); return; }
  const rtl = e.target.closest("[data-act='toggleReadLink']");
  if (rtl) { e.preventDefault(); S.readMode = !S.readMode; save(true, false); render(); return; }

  const d = e.target.closest("button")?.dataset; if (!d) return;
  if (d.tab) { S.tab = d.tab; save(true, false); render(); scrollTo({ top: 0, behavior: "smooth" }); }
  if (d.track) { S.track = d.track; save(true, false); document.querySelectorAll("[data-track]").forEach(b => b.classList.toggle("on", b.dataset.track === d.track)); $("#pb").innerHTML = playbook(); trackProgress(); }
  if (d.add) { S.lists[d.add].push({}); save(true); relist(d.add); }
  if (d.del) {
    const [id, i] = d.del.split(":");
    const row = S.lists[id]?.[+i];
    const removeRow = () => { S.lists[id].splice(+i, 1); save(true); relist(id); };
    if (isRowUserEdited(id, row)) confirmDlg("Remove this row and what you typed in it?", removeRow);
    else removeRow();
  }
  if (d.newfield) newFieldDialog(d.newfield);
  if (d.newlist) newListDialog(d.newlist);
  if (d.rmx) { const [t, id] = d.rmx.split(":"); confirmDlg("Remove this and what you typed in it?", () => { S.extra[t] = S.extra[t].filter(x => x.id !== id); delete S.f[id]; delete S.lists[id]; save(true); render(); }); }
  if (d.renametab) textDialog("Rename section", "Section name", S.customTabs.find(t => t.id === d.renametab).label, v => { const t = S.customTabs.find(t => t.id === d.renametab); t.label = t.title = v; save(true); render(); });
  if (d.deltab) confirmDlg("Delete this whole section and everything in it?", () => { (S.extra[d.deltab] || []).forEach(x => { delete S.f[x.id]; delete S.lists[x.id]; }); delete S.extra[d.deltab]; S.customTabs = S.customTabs.filter(t => t.id !== d.deltab); S.tab = "start"; save(true); render(); });
  if (d.act === "newtab") newTabDialog();
  if (d.act === "toggleRead") { S.readMode = !S.readMode; save(true, false); render(); }
  if (d.act === "hideEss") { S.hideEssentials = true; save(true, false); render(); }
  if (d.act === "showEss") { S.hideEssentials = false; save(true, false); render(); }
  if (d.act === "reviewed") { S.reviewed = new Date().toISOString(); save(true); toast("Marked as reviewed"); }
  if (d.act === "ics") downloadIcs();
  if (d.act === "print") printDialog();
  if (d.act === "backup") backupDialog();
  if (d.act === "restore") restoreDialog();
  if (d.act === "project") projectDialog();
});

function relist(id) {
  const b = findBlockDef(id);
  const rowsEl = $("#rows-" + CSS.escape(id));
  if (rowsEl && b) rowsEl.innerHTML = listRows(id, b.cols, !S.readMode || b.crisisEditable);
  const card = rowsEl?.closest(".card");
  if (card) card.classList.toggle("is-empty", !(S.lists[id] || []).some(r => rowHasFilledValue(id, r)));
}

/* ---------- dialogs ---------- */
function openDlg(html) { $("#dlgForm").innerHTML = html; $("#dlg").showModal(); }
const btns = (go = "Save") => `<div class="btns"><button type="button" class="btn" id="cancelDlg">Cancel</button><button type="submit" class="btn primary" id="go">${go}</button></div>`;
function onGo(fn) {
  $("#cancelDlg").onclick = () => $("#dlg").close();
  $("#dlgForm").onsubmit = ev => { ev.preventDefault(); fn(); };
}
function textDialog(title, label, val, cb, ph = "") {
  openDlg(`<h3>${esc(title)}</h3><label class="f"><span>${esc(label)}</span><input id="tx" value="${esc(val)}" placeholder="${esc(ph)}"></label>${btns()}`);
  onGo(() => { const v = $("#tx").value.trim(); if (!v) return toast("Give it a name"); $("#dlg").close(); cb(v); });
}
function confirmDlg(msg, cb) { openDlg(`<h3>Are you sure?</h3><p>${esc(msg)}</p>${btns("Yes, remove")}`); onGo(() => { $("#dlg").close(); cb(); }); }

function newTabDialog() {
  openDlg(`<h3>Add a section</h3>
    <label class="f"><span>Custom section name</span><input id="tx" placeholder="e.g. Boat, Hobby collection, Farm"></label>
    ${btns("Add blank section")}
    <div class="or-sep">or start from a template</div>
    <div class="tpl-grid">${SECTION_TEMPLATES.map((t, i) =>
      `<button type="button" class="tpl-btn" data-tpl="${i}"><b>${esc(t.name)}</b><small>${esc(t.desc)}</small></button>`).join("")}</div>`);
  onGo(() => {
    const v = $("#tx").value.trim();
    if (!v) return toast("Give it a name or pick a template");
    const id = uid("tab");
    S.customTabs.push({ id, label: v, title: v });
    S.tab = id;
    $("#dlg").close(); save(true); render();
  });
  $("#dlgForm").querySelectorAll("[data-tpl]").forEach(btn => {
    btn.onclick = () => {
      const tpl = SECTION_TEMPLATES[+btn.dataset.tpl];
      const tabId = uid("tab");
      S.customTabs.push({ id: tabId, label: tpl.name, title: tpl.name });
      S.extra[tabId] = [];
      tpl.fields.forEach(f => {
        S.extra[tabId].push({ type: "field", id: uid("x"), label: f.label, wide: Boolean(f.wide) });
      });
      tpl.lists.forEach(l => {
        const lid = uid("l");
        S.extra[tabId].push({ type: "list", id: lid, title: l.title, cols: l.cols.map((c, idx) => ["c" + idx, c]) });
        S.lists[lid] = [{}];
      });
      S.tab = tabId;
      $("#dlg").close(); save(true); render();
      toast(`Added "${tpl.name}"`);
    };
  });
}

function newFieldDialog(tab) {
  openDlg(`<h3>Add a field</h3><label class="f"><span>What should it ask?</span><input id="tx" placeholder="e.g. Storage unit location &amp; code holder"></label>
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

/* ---------- GitHub project export & calendar reminder ---------- */
function structureOnly() {
  return JSON.stringify({ customTabs: S.customTabs, extra: S.extra }, null, 2);
}
function download(name, text, type = "text/plain") {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
function projectDialog() {
  const isFile = location.protocol === "file:";
  openDlg(`<h3>Save this project to GitHub</h3>
    <p class="hint">The code is safe to share. Your family's answers live only in this browser and in locked backups, which are never included.</p>
    ${isFile ? `<p class="hint" style="color:var(--tomato)"><b>Running from a local file:</b> browsers block downloading sibling files from <code>file://</code>. Upload the files already in this folder (<code>${PROJECT_FILES.join(", ")}</code>) directly to GitHub, and use the button below to save <code>gitignore.txt</code>${(S.customTabs.length || Object.keys(S.extra).length) ? " and <code>my-sections.json</code>" : ""}.</p>` : ""}
    <ol><li>${isFile ? "Grab the project files from your local folder (and download <code>gitignore.txt</code> below)." : "Download the project files below."}</li>
    <li>On GitHub, create a new <b>private</b> repository (e.g. <code>family-field-guide</code>).</li>
    <li>Choose <b>Add file → Upload files</b>, drag the files in, and commit. Rename <code>gitignore.txt</code> to <code>.gitignore</code>.</li>
    <li>Optional: turn on <b>Settings → Pages</b> to open the guide from any device.</li></ol>
    <p class="hint">README.md explains how to add new sections in code.</p>
    ${S.customTabs.length || Object.keys(S.extra).length ? `<label class="f"><span>Your added sections (labels only, no answers)</span><textarea readonly style="min-height:90px;font:11px var(--mono)">${esc(structureOnly())}</textarea></label>` : ""}
    <div class="btns"><button type="button" class="btn" id="cancelDlg">Close</button><button type="submit" class="btn primary" id="go">${isFile ? "Download gitignore" + ((S.customTabs.length || Object.keys(S.extra).length) ? " & my-sections.json" : "") : "Download project files"}</button></div>`);
  onGo(async () => {
    let ok = 0;
    if (!isFile) {
      for (const f of PROJECT_FILES) {
        try { const r = await fetch(f); if (!r.ok) throw 0; download(f, await r.text()); ok++; await new Promise(z => setTimeout(z, 250)); } catch {}
      }
    }
    download("gitignore.txt", GITIGNORE);
    if (S.customTabs.length || Object.keys(S.extra).length) download("my-sections.json", structureOnly(), "application/json");
    toast(isFile ? "Saved gitignore" : (ok === PROJECT_FILES.length ? "Project files downloaded" : `Downloaded ${ok} of ${PROJECT_FILES.length}. Your browser may have blocked some`));
  });
}

function downloadIcs() {
  const dt = new Date();
  dt.setMonth(dt.getMonth() + 6);
  const pad = n => String(n).padStart(2, "0");
  const stamp = d => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
  const startLocal = `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T090000`;
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Family Field Guide//Checkup Reminder//EN",
    "BEGIN:VEVENT",
    `UID:ffg-checkup-${Date.now()}@local`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${startLocal}`,
    "DURATION:PT15M",
    "RRULE:FREQ=MONTHLY;INTERVAL=6",
    "SUMMARY:Review Our Family Field Guide",
    "DESCRIPTION:10-minute check-up: verify phone PINs\\, accounts\\, insurance\\, and save a fresh locked backup.",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
  download("family-guide-checkup.ics", ics, "text/calendar");
  toast("Calendar reminder downloaded");
}

/* ---------- Print / Binder sheets ---------- */
function printWithClass(cls) {
  const cleanup = () => document.body.classList.remove("print-hide-empty", "print-sheet-only");
  cleanup();
  if (cls) document.body.classList.add(cls);
  window.addEventListener("afterprint", cleanup, { once: true });
  setTimeout(() => { window.print(); setTimeout(cleanup, 1200); }, 50);
}

function renderCaregiverSheet() {
  const f = id => String(S.f[id] || "").trim();
  const rowsOf = id => (S.lists[id] || []).filter(r => rowHasFilledValue(id, r));
  const first = rowsOf("first");
  const kidsInfo = rowsOf("kids_info");
  const famHealth = rowsOf("fam_health");
  const pets = rowsOf("pets");
  const houseItems = [
    ["Water shut-off", f("hk_water")],
    ["Gas shut-off", f("hk_gas")],
    ["Breaker panel", f("hk_breaker")],
    ["Spare keys", f("hk_spare")],
    ["Alarm / smart lock / quirks", f("hk_quirks")]
  ].filter(([, v]) => v);

  $("#printSheet").innerHTML = `<div class="sheet">
    <h1>Emergency Caregiver &amp; Fridge Sheet</h1>
    <p class="sheet-sub">Keep on the fridge or hand to anyone watching the kids or house. Updated ${new Date().toLocaleDateString()}.</p>
    <div class="sheet-grid">
      <div class="sheet-box full">
        <h3>Home Address (read this to 911)</h3>
        <div class="sheet-giant">${esc(f("k_home") || "Not filled in yet — add under For the kids")}</div>
        ${f("k_safe") ? `<p><b>Family safe word:</b> ${esc(f("k_safe"))}</p>` : ""}
      </div>
      <div class="sheet-box">
        <h3>Who to Call First</h3>
        ${first.length ? `<ul>${first.map(r => `<li><b>${esc(r.name || r.rel || "Contact")}</b>${r.rel ? ` (${esc(r.rel)})` : ""}: ${esc(r.phone || "")}${r.why ? ` — ${esc(r.why)}` : ""}</li>`).join("")}</ul>` : `<p>${esc(f("q_first") || "Add under Contacts → First people to call")}</p>`}
        ${f("k_call") ? `<p><b>Kid-friendly numbers:</b> ${esc(f("k_call"))}</p>` : ""}
      </div>
      <div class="sheet-box">
        <h3>Kids: Pickup, Allergies &amp; Comfort</h3>
        ${kidsInfo.length ? `<ul>${kidsInfo.map(r => `<li><b>${esc(r.child || "Child")}</b>${r.school ? ` · ${esc(r.school)}` : ""}${r.pickup ? ` · Pickup: ${esc(r.pickup)}` : ""}${r.comfort ? ` · Helps: ${esc(r.comfort)}` : ""}</li>`).join("")}</ul>` : ""}
        ${famHealth.length ? `<ul>${famHealth.map(r => `<li><b>${esc(r.name || "Person")}</b>${r.allergy ? ` · Allergies: ${esc(r.allergy)}` : ""}${r.meds ? ` · Meds: ${esc(r.meds)}` : ""}${r.doc ? ` · Doctor: ${esc(r.doc)}` : ""}</li>`).join("")}</ul>` : ""}
        ${!kidsInfo.length && !famHealth.length ? `<p>Add under For the kids &amp; Health.</p>` : ""}
      </div>
      <div class="sheet-box">
        <h3>House Shut-offs &amp; Access</h3>
        ${houseItems.length ? `<ul>${houseItems.map(([k, v]) => `<li><b>${esc(k)}:</b> ${esc(v)}</li>`).join("")}</ul>` : `<p>Add under Documents &amp; home → House know-how.</p>`}
      </div>
      <div class="sheet-box">
        <h3>Pets</h3>
        ${pets.length ? `<ul>${pets.map(r => `<li><b>${esc(r.name || "Pet")}</b>${r.food ? ` · Food: ${esc(r.food)}` : ""}${r.meds ? ` · Meds: ${esc(r.meds)}` : ""}${r.vet ? ` · Vet: ${esc(r.vet)}` : ""}${r.sitter ? ` · Backup: ${esc(r.sitter)}` : ""}</li>`).join("")}</ul>` : `<p>None listed.</p>`}
      </div>
    </div>
    <p class="sheet-foot">Full emergency guide location: ${esc(f("q_binder") || "Ask primary emergency contact")}</p>
  </div>`;
}

function renderCoverSheet(passHint, fileLoc) {
  const f = id => String(S.f[id] || "").trim();
  const rev = S.reviewed ? new Date(S.reviewed).toLocaleDateString() : "Not reviewed yet";
  $("#printSheet").innerHTML = `<div class="sheet">
    <h1>In Case of Emergency — Open This First</h1>
    <p class="sheet-sub">Break-glass cover sheet for the safe or binder. Last updated: ${new Date().toLocaleDateString()} · Last reviewed: ${esc(rev)}</p>
    <div class="sheet-grid">
      <div class="sheet-box full">
        <h3>1. Who to Call First</h3>
        <div class="sheet-giant">${esc(f("q_first") || "Not filled in yet")}</div>
      </div>
      <div class="sheet-box">
        <h3>2. Where the Digital Guide Is</h3>
        <p>${esc(fileLoc || "Saved on our computer / USB / private cloud backup (family-field-guide-*.html)")}</p>
      </div>
      <div class="sheet-box">
        <h3>3. Where to Get the Passphrase</h3>
        <p>${esc(passHint || "Held by spouse / sealed envelope in safe / with estate attorney")}</p>
      </div>
      <div class="sheet-box">
        <h3>Where Original Papers Live</h3>
        <p>${esc(f("q_binder") || "Not filled in yet")}</p>
      </div>
      <div class="sheet-box">
        <h3>Our Estate Attorney</h3>
        <p>${esc(f("q_attorney") || "Not filled in yet")}</p>
      </div>
      <div class="sheet-box full">
        <h3>How to Open the Locked Guide</h3>
        <ol style="margin:6px 0;padding-left:20px;font-size:13.5px;line-height:1.5">
          <li>Keep my mobile phone charged and active (banks and email need it for login codes).</li>
          <li>Open the standalone <code>family-field-guide-*.html</code> file in any web browser (works offline).</li>
          <li>Enter the passphrase above to unlock everything, then turn on <b>Read mode</b> or follow the <b>Start here</b> checklist one step at a time.</li>
        </ol>
      </div>
    </div>
    <p class="sheet-foot">Never write actual passwords or full account numbers on this sheet.</p>
  </div>`;
}

function printDialog() {
  openDlg(`<h3>Print options</h3>
    <div class="opt-list">
      <label class="opt-card"><input type="radio" name="pmode" value="filled" checked><div><b>Full guide — filled details only</b><small>Omits empty fields and blank rows so your binder stays clean.</small></div></label>
      <label class="opt-card"><input type="radio" name="pmode" value="all"><div><b>Full guide — include blanks</b><small>Great if you want space to fill things in by hand.</small></div></label>
      <label class="opt-card"><input type="radio" name="pmode" value="caregiver"><div><b>1-page Caregiver / Fridge Sheet</b><small>Home address for 911, first contacts, kids' pickup/allergies, pets, and shut-offs.</small></div></label>
      <label class="opt-card"><input type="radio" name="pmode" value="cover"><div><b>1-page Break-Glass Cover Sheet</b><small>Instructions for your safe or filing box showing where the digital guide and passphrase live.</small></div></label>
    </div>
    <div id="coverOpts" hidden style="margin-top:8px">
      <label class="f"><span>Where is the guide file or URL?</span><input id="covLoc" placeholder="e.g. Desktop/Family-Guide or USB drive in top safe drawer"></label>
      <label class="f" style="margin-top:8px"><span>Where is the passphrase kept? (hint only, never the passphrase)</span><input id="covHint" placeholder="e.g. Sealed envelope in the fireproof box"></label>
    </div>
    ${btns("Print")}`);
  $("#dlgForm").querySelectorAll('input[name="pmode"]').forEach(r => {
    r.onchange = () => { $("#coverOpts").hidden = r.value !== "cover"; };
  });
  onGo(() => {
    const mode = $("#dlgForm").querySelector('input[name="pmode"]:checked').value;
    $("#dlg").close();
    if (mode === "filled") printWithClass("print-hide-empty");
    else if (mode === "all") printWithClass("");
    else if (mode === "caregiver") { renderCaregiverSheet(); printWithClass("print-sheet-only"); }
    else if (mode === "cover") { renderCoverSheet($("#covHint").value.trim(), $("#covLoc").value.trim()); printWithClass("print-sheet-only"); }
  });
}

/* ---------- passphrase-locked backup (JSON + standalone HTML) ---------- */
const enc = new TextEncoder(), dec = new TextDecoder();
function b64(buf) {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
}
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));

async function keyFrom(pass, salt) {
  const base = await crypto.subtle.importKey("raw", enc.encode(pass), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 250000, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}

function buildStandaloneHtml(pkg) {
  const schemaData = { TABS, PLAYBOOK, SCRIPTS, GLANCE, KIDS };
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Our Family Field Guide (Locked Copy)</title>
<style>
:root{--paper:#f6f1e6;--paper2:#efe7d6;--card:#fffdf8;--ink:#1f3a2e;--ink2:#4b5f55;--mute:#8a8f84;--rule:#d9cfb9;--tomato:#d2512f;--sun:#e9b44c;--sky:#4f7c8a;--serif:Georgia,Palatino,serif;--sans:system-ui,-apple-system,sans-serif;--mono:ui-monospace,Menlo,monospace}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:15px/1.5 var(--sans);padding:24px 16px 64px}
.wrap{max-width:980px;margin:0 auto}.lock{max-width:460px;margin:8vh auto;background:var(--card);border:2px solid var(--ink);border-radius:8px;padding:24px;box-shadow:6px 6px 0 var(--ink)}
h1,h2,h3{font-family:var(--serif);margin-top:0}h1 em{color:var(--tomato)}
input[type=password]{width:100%;font:16px var(--sans);padding:9px 10px;border:1.5px solid var(--ink);border-radius:4px;margin:6px 0 12px}
.btn{font:600 13px var(--sans);padding:8px 15px;border-radius:999px;border:1.5px solid var(--ink);background:var(--card);color:var(--ink);cursor:pointer}
.btn.primary{background:var(--ink);color:var(--paper)}.err{color:var(--tomato);font-size:13px;min-height:18px;margin:4px 0}
.bar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;border-bottom:2px solid var(--ink);padding-bottom:14px;margin-bottom:18px}
.tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:18px}.tabs button{font:600 13px var(--sans);border:1.5px solid var(--ink);background:transparent;color:var(--ink);padding:6px 13px;border-radius:999px;cursor:pointer}
.tabs button.on{background:var(--ink);color:var(--paper)}.panel{display:none}.panel.on{display:block}
.card{background:var(--card);border:1px solid var(--rule);border-radius:4px;padding:16px 18px;margin-bottom:14px;box-shadow:3px 3px 0 var(--paper2)}
.grid2{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px 18px}.lbl{font-family:var(--mono);font-size:10.5px;text-transform:uppercase;color:var(--ink2);display:block}
.val{padding:4px 0;border-bottom:1px dashed var(--rule);white-space:pre-wrap;word-break:break-word}.val a{color:var(--sky);font-weight:600}
.glance{background:var(--ink);color:var(--paper);border-radius:6px;padding:16px 18px;margin-bottom:16px;box-shadow:5px 5px 0 var(--tomato)}.glance .lbl{color:#c9d3cc}.glance .val{border-color:#4a6458}.glance .val a{color:var(--sun)}
.row{border:1px dashed var(--rule);border-radius:4px;padding:10px;margin-bottom:8px;background:#fffef9}.track{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}
.track button{font:600 13px var(--sans);padding:8px 12px;border:2px solid var(--ink);background:var(--card);border-radius:4px;cursor:pointer}.track button.on{background:var(--tomato);border-color:var(--tomato);color:#fff}
.step{display:flex;gap:10px;padding:9px 0;border-bottom:1px solid var(--rule)}.step.done .st{text-decoration:line-through;color:var(--mute)}
.script{border-left:3px solid var(--sun);padding:6px 12px;background:#fffaf0;margin-bottom:8px}
@media print{.tabs,.bar .acts,.track{display:none!important}.panel{display:block!important;break-before:page}.panel:first-of-type{break-before:auto}}
</style>
</head>
<body>
<div id="gate" class="lock">
  <h1>Our Family <em>Field Guide</em></h1>
  <p style="color:var(--ink2);font-size:14px">This standalone offline copy is locked with a passphrase. Nothing is sent anywhere.</p>
  <form id="uform">
    <label class="lbl">Passphrase</label>
    <input type="password" id="upw" autofocus required>
    <div class="err" id="uerr"></div>
    <button class="btn primary" type="submit">Unlock guide</button>
  </form>
</div>
<div id="app" class="wrap" hidden></div>
<script id="ffg-pkg" type="application/json">${safeJson(pkg)}<\/script>
<script id="ffg-schema" type="application/json">${safeJson(schemaData)}<\/script>
<script>
const pkg = JSON.parse(document.getElementById("ffg-pkg").textContent);
const SC = JSON.parse(document.getElementById("ffg-schema").textContent);
const esc = v => String(v ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const linkify = v => esc(v).replace(/(https?:\\/\\/[^\\s<>"]+)|([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})|(\\+?\\d[\\d\\s().-]{6,}\\d)/g, (m,u,e,p) => {
  if (u) return '<a href="'+u+'" target="_blank" rel="noopener noreferrer">'+u+'</a>';
  if (e) return '<a href="mailto:'+e+'">'+e+'</a>';
  if (p) { const d = p.replace(/[^\\d+]/g,""); return d.replace(/\\D/g,"").length >= 7 ? '<a href="tel:'+d+'">'+p+'</a>' : m; }
  return m;
});
document.getElementById("uform").onsubmit = async ev => {
  ev.preventDefault();
  const err = document.getElementById("uerr"); err.textContent = "";
  try {
    const enc = new TextEncoder(), dec = new TextDecoder();
    const base = await crypto.subtle.importKey("raw", enc.encode(document.getElementById("upw").value), "PBKDF2", false, ["deriveKey"]);
    const key = await crypto.subtle.deriveKey({ name:"PBKDF2", salt:unb64(pkg.salt), iterations:250000, hash:"SHA-256" }, base, { name:"AES-GCM", length:256 }, false, ["decrypt"]);
    const pt = await crypto.subtle.decrypt({ name:"AES-GCM", iv:unb64(pkg.iv) }, key, unb64(pkg.data));
    const S = JSON.parse(dec.decode(pt));
    document.getElementById("gate").hidden = true;
    const app = document.getElementById("app"); app.hidden = false;
    renderAll(app, S);
  } catch { err.textContent = "Wrong passphrase or unsupported browser context."; }
};
function renderAll(root, S) {
  S.f = S.f || {}; S.lists = S.lists || {}; S.checks = S.checks || {}; S.extra = S.extra || {}; S.customTabs = S.customTabs || [];
  let activeTab = "start", activeTrack = S.track && SC.PLAYBOOK[S.track] ? S.track : "hurt";
  const tabs = [...SC.TABS, ...S.customTabs.map(c => ({ ...c, blocks: [] }))];
  const fv = (label, id) => String(S.f[id] || "").trim() ? '<div><span class="lbl">'+esc(label)+'</span><div class="val">'+linkify(S.f[id])+'</div></div>' : "";
  const listHtml = (title, id, cols) => {
    const rows = (S.lists[id] || []).filter(r => Object.values(r).some(v => String(v||"").trim()));
    if (!rows.length) return "";
    return '<div class="card"><h3>'+esc(title)+'</h3>'+rows.map(r => '<div class="row"><div class="grid2">'+cols.map(([k,l]) => String(r[k]||"").trim() ? '<div><span class="lbl">'+esc(l)+'</span><div class="val">'+linkify(r[k])+'</div></div>' : "").join("")+'</div></div>').join("")+'</div>';
  };
  function draw() {
    root.innerHTML = '<div class="bar"><div style="flex:1"><h1>Our Family <em>Field Guide</em></h1><small style="color:var(--ink2)">Unlocked offline copy · Updated '+esc((S.updated||"").slice(0,10))+'</small></div><div class="acts" style="display:flex;gap:8px"><button class="btn" id="dlJson">Download .json</button><button class="btn primary" onclick="window.print()">Print</button></div></div>'
      + '<div class="tabs">'+tabs.map(t => '<button data-t="'+esc(t.id)+'" class="'+(activeTab===t.id?"on":"")+'">'+esc(t.label)+'</button>').join("")+'</div>'
      + tabs.map(t => {
        let html = "";
        if (t.id === "start") {
          const g = SC.GLANCE.map(([id,l]) => fv(l, id)).join("");
          if (g) html += '<div class="glance"><h3>If you read nothing else</h3><div class="grid2">'+g+'</div></div>';
          const p = SC.PLAYBOOK[activeTrack];
          html += '<div class="card"><h3>What\\'s happening?</h3><div class="track">'+Object.entries(SC.PLAYBOOK).map(([k,v]) => '<button data-tr="'+esc(k)+'" class="'+(activeTrack===k?"on":"")+'">'+esc(v.label)+'</button>').join("")+'</div>'
            + p.phases.map(ph => '<h4>'+esc(ph.when)+'</h4>'+ph.steps.map(s => '<label class="step '+(S.checks[s.id]?"done":"")+'"><input type="checkbox" data-ck="'+esc(s.id)+'" '+(S.checks[s.id]?"checked":"")+'><div><div class="st"><b>'+esc(s.t)+'</b></div><div style="font-size:13.5px;color:var(--ink2)">'+esc(s.d)+'</div></div></label>').join("")).join("")+'</div>';
        }
        (t.blocks || []).forEach(b => {
          if (b.type === "fields") { const fs = b.fields.map(([id,l]) => fv(l, id)).join(""); if (fs) html += '<div class="card"><h3>'+esc(b.title)+'</h3><div class="grid2">'+fs+'</div></div>'; }
          if (b.type === "list") html += listHtml(b.title, b.id, b.cols);
          if (b.type === "scripts") html += '<div class="card"><h3>What to say</h3>'+SC.SCRIPTS.map(([st,sb]) => '<div class="script"><b>'+esc(st)+'</b><div><i>'+esc(sb)+'</i></div></div>').join("")+'</div>';
          if (b.type === "letter" && String(S.f.letter||"").trim()) html += '<div class="card"><h3>A note to you</h3><div class="val" style="font-family:var(--serif);font-size:17px">'+linkify(S.f.letter)+'</div></div>';
          if (b.type === "kids") { const ks = SC.KIDS.map(([id,em,l]) => fv(em+" "+l, id)).join(""); if (ks) html += '<div class="card"><div class="grid2">'+ks+'</div></div>'; }
        });
        const ex = S.extra[t.id] || [];
        const exf = ex.filter(x => x.type === "field").map(x => fv(x.label, x.id)).join("");
        if (exf) html += '<div class="card"><h3>More details</h3><div class="grid2">'+exf+'</div></div>';
        ex.filter(x => x.type === "list").forEach(x => { html += listHtml(x.title, x.id, x.cols); });
        return '<section class="panel '+(activeTab===t.id?"on":"")+'"><h2>'+esc(t.title)+'</h2>'+(html || '<p style="color:var(--mute)">No filled entries in this section.</p>')+'</section>';
      }).join("");
    root.querySelectorAll("[data-t]").forEach(b => b.onclick = () => { activeTab = b.dataset.t; draw(); });
    root.querySelectorAll("[data-tr]").forEach(b => b.onclick = () => { activeTrack = b.dataset.tr; draw(); });
    root.querySelectorAll("[data-ck]").forEach(c => c.onchange = () => { S.checks[c.dataset.ck] = c.checked; c.closest(".step").classList.toggle("done", c.checked); });
    root.querySelector("#dlJson").onclick = () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(pkg)], { type:"application/json" })); a.download = "family-field-guide-backup.json"; a.click(); };
  }
  draw();
}
<\/script>
</body>
</html>`;
}

function backupDialog() {
  if (!hasCrypto()) return toast("Locked backups require HTTPS, localhost, or Web Crypto support");
  openDlg(`<h3>Save a locked backup</h3>
    <p class="hint">Choose a passphrase your spouse knows (or keep it with your will). Without it, the file can't be opened. Don't upload backups to GitHub.</p>
    <label class="f"><span>Passphrase (at least 8 characters)</span><input type="password" id="pw1" required></label>
    <label class="f" style="margin-top:8px"><span>Type it again</span><input type="password" id="pw2" required></label>
    <div class="opt-list" style="margin-top:12px">
      <label class="opt-card"><input type="radio" name="bfmt" value="html" checked><div><b>Standalone locked HTML (.html) — Recommended</b><small>One self-contained offline file your spouse can double-click in any browser, even years from now.</small></div></label>
      <label class="opt-card"><input type="radio" name="bfmt" value="json"><div><b>Encrypted JSON (.json)</b><small>Compact data file to re-open inside this app.</small></div></label>
    </div>
    ${btns("Save file")}`);
  onGo(async () => {
    const p = $("#pw1").value;
    if (p.length < 8) return toast("Use at least 8 characters");
    if (p !== $("#pw2").value) return toast("Passphrases don't match");
    const fmt = $("#dlgForm").querySelector('input[name="bfmt"]:checked').value;
    const now = new Date().toISOString();
    S.lastBackup = now;
    if (!S.updated) S.updated = now;
    const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await keyFrom(p, salt), enc.encode(JSON.stringify(S)));
    const pkg = { app: "family-field-guide", v: 1, salt: b64(salt), iv: b64(iv), data: b64(ct) };
    const out = JSON.stringify(pkg);
    const stamp = now.slice(0, 10);
    if (fmt === "html") download(`family-field-guide-${stamp}.html`, buildStandaloneHtml(pkg), "text/html");
    else download(`family-field-guide-${stamp}.json`, out, "application/json");
    save(true, false);
    openDlg(`<h3>Backup ready</h3>
      <p>Your ${fmt === "html" ? "standalone locked HTML" : "encrypted JSON"} download has started. Keep the passphrase separate from the file.</p>
      <p class="hint">If the download didn't start, copy this locked backup text into a file instead:</p>
      <textarea readonly style="min-height:110px;font:11px var(--mono)">${esc(out)}</textarea>
      <div class="btns"><button type="button" class="btn primary" id="doneDlg">Done</button></div>`);
    $("#doneDlg").onclick = () => $("#dlg").close();
  });
}

function parseBackupPayload(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("{")) {
    const obj = JSON.parse(trimmed);
    return obj && obj.app === "family-field-guide" ? obj : null;
  }
  const m = trimmed.match(/<script\s+id=["']ffg-pkg["'][^>]*>([\s\S]*?)<\/script>/i);
  if (m) {
    const rawJson = m[1].replace(/<\\\/script/gi, "</script");
    const obj = JSON.parse(rawJson);
    return obj && obj.app === "family-field-guide" ? obj : null;
  }
  return null;
}

function promptUnlockPkg(pkg) {
  if (!hasCrypto()) return toast("Opening locked backups requires HTTPS, localhost, or Web Crypto support");
  openDlg(`<h3>Unlock backup</h3><p class="hint">This replaces what's currently stored on this device.</p>
    <label class="f"><span>Passphrase</span><input type="password" id="pw" required></label>${btns("Unlock")}`);
  onGo(async () => {
    try {
      const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(pkg.iv) }, await keyFrom($("#pw").value, unb64(pkg.salt)), unb64(pkg.data));
      S = JSON.parse(dec.decode(pt));
      const now = new Date().toISOString();
      S.lastBackup = now;
      if (!S.updated || S.updated > now) S.updated = now;
      norm(); save(true, false); render(); $("#dlg").close(); toast("Backup opened");
    } catch { toast("Wrong passphrase"); }
  });
}

function restoreDialog() {
  openDlg(`<h3>Open backup</h3>
    <p class="hint">Choose a <code>.json</code> or standalone <code>.html</code> backup file, or paste locked backup text below.</p>
    <div style="margin:10px 0"><button type="button" class="btn primary" id="pickFile">Choose backup file (.json or .html)</button></div>
    <div class="or-sep">or paste locked text</div>
    <label class="f"><span>Encrypted backup text</span><textarea id="pastePkg" placeholder='{"app":"family-field-guide",...}' style="min-height:90px;font:11px var(--mono)"></textarea></label>
    ${btns("Unlock pasted text")}`);
  $("#pickFile").onclick = () => { $("#dlg").close(); $("#fileIn").click(); };
  onGo(() => {
    let pkg = null;
    try { pkg = parseBackupPayload($("#pastePkg").value); } catch {}
    if (!pkg) return toast("Paste a valid guide backup first");
    promptUnlockPkg(pkg);
  });
}

$("#fileIn").onchange = async e => {
  const file = e.target.files[0]; e.target.value = ""; if (!file) return;
  let pkg = null;
  try { pkg = parseBackupPayload(await file.text()); } catch {}
  if (!pkg) return toast("That file isn't a guide backup");
  promptUnlockPkg(pkg);
};

norm(); render();
