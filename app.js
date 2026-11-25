/* FAMILY FIELD GUIDE · APP
   Renders the content in schema.js, saves answers to localStorage,
   handles Read/Edit modes, search, essentials, templates, print sheets,
   locked JSON + standalone HTML backups, and project export. */
const KEY = "familyFieldGuide.v1";
const LOCK_KEY = "familyFieldGuide.locked.v1";
const PROJECT_FILES = ["index.html", "styles.css", "schema.js", "regions.js", "app.js", "manifest.json", "sw.js", "icon.svg", "icon-192.png", "icon-512.png", "apple-touch-icon.png", "README.md", "LICENSE"];
const GITIGNORE = "# Never commit your family's details\nfamily-field-guide-*.json\nfamily-field-guide-*.html\nfamily-guide-*.json\n*.backup.json\n.DS_Store\n";
let S = load();
let browserLockPass = null, browserLockKey = null, browserLockSalt = null, lockDebounceT = null, pendingLockSnap = null;
let idleTimer = null, deferredInstallPrompt = null;
const isStandaloneApp = () => Boolean(window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator?.standalone);
const $ = s => document.querySelector(s);
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const safeImgUrl = u => /^data:image\/(?:jpeg|jpg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(String(u || "").trim()) ? String(u).trim() : "";
const safeJson = v => JSON.stringify(v).replace(/<\/script/gi, "<\\/script");
const uid = p => p + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const hasCrypto = () => Boolean(window.crypto && crypto.subtle && crypto.getRandomValues);

function stripUnsafeKeys(val) {
  if (Array.isArray(val)) return val.map(stripUnsafeKeys);
  if (val && typeof val === "object") {
    const out = {};
    for (const [k, v] of Object.entries(val)) {
      if (k === "__proto__" || k === "constructor" || k === "prototype") continue;
      out[k] = stripUnsafeKeys(v);
    }
    return out;
  }
  return val;
}

function sanitizeState(raw) {
  const clean = stripUnsafeKeys(raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {});
  clean.stateVersion = 1;
  clean.f = (clean.f && typeof clean.f === "object" && !Array.isArray(clean.f)) ? clean.f : {};
  clean.lists = (clean.lists && typeof clean.lists === "object" && !Array.isArray(clean.lists)) ? clean.lists : {};
  clean.checks = (clean.checks && typeof clean.checks === "object" && !Array.isArray(clean.checks)) ? clean.checks : {};
  clean.extra = (clean.extra && typeof clean.extra === "object" && !Array.isArray(clean.extra)) ? clean.extra : {};
  clean.customTabs = Array.isArray(clean.customTabs) ? clean.customTabs.filter(t => t && typeof t.id === "string") : [];
  clean.fireDrill = (clean.fireDrill && typeof clean.fireDrill === "object" && !Array.isArray(clean.fireDrill)) ? clean.fireDrill : {};
  clean.photos = Array.isArray(clean.photos)
    ? clean.photos.filter(p => p && typeof p.id === "string" && safeImgUrl(p.dataUrl)).slice(0, 10)
    : [];
  return clean;
}

function load() {
  try { return sanitizeState(JSON.parse(localStorage.getItem(KEY)) || {}); } catch { return {}; }
}
function norm() {
  S.stateVersion = 1;
  S.f ??= {}; S.lists ??= {}; S.checks ??= {}; S.track ??= "hurt"; S.tab ??= "start";
  S.extra ??= {}; S.customTabs ??= [];
  S.fireDrill ??= {}; S.lastDryRun ??= null;
  S.photos = Array.isArray(S.photos) ? S.photos.filter(p => p && safeImgUrl(p.dataUrl)).slice(0, 10) : [];
  S.region ??= "us";
  if (typeof REGIONS !== "undefined" && !REGIONS[S.region]) S.region = "us";
  S.isDemo = Boolean(S.isDemo);
  S.dismissDemo = Boolean(S.dismissDemo);
  S.readMode = Boolean(S.readMode);
  S.hideEssentials = Boolean(S.hideEssentials);
  S.largeText = Boolean(S.largeText);
  S.highContrast = Boolean(S.highContrast);
  S.lastBackup ??= null;
  if (S.track && !PLAYBOOK[S.track]) S.track = "hurt";
  TABS.forEach(t => t.blocks.forEach(b => {
    if (b.type === "list" && !S.lists[b.id]) S.lists[b.id] = b.seed.map(r => ({ ...r }));
  }));
  Object.values(S.extra).flat().forEach(x => { if (x.type === "list") S.lists[x.id] ??= [{}]; });
  if (!allTabs().some(t => t.id === S.tab)) S.tab = "start";
}
function getRegion() {
  const defMg = {
    depositCap: "Keep cash split within national bank deposit-insurance limits (e.g. FDIC $250,000 / bank in US).",
    taxNote: "Consult a CPA/tax advisor before selling inherited property or moving large payouts across borders.",
    fiduciaryName: "Fee-Only Fiduciary Advisor (zero commissions)",
    safeCash: "Insured High-Yield Savings Accounts or short-term government Treasury bills.",
    sampleTitle: "Sample $1,000,000 Allocation",
    sampleLines: []
  };
  const defPf = {
    legal: "National or Regional Bar Association Referral Service & Legal Aid",
    visa: "Licensed Independent Immigration Attorney + Home-Country Embassy",
    money: "Hourly or Flat-Fee Fiduciary Financial Advisor (zero commissions)",
    tax: "Licensed CPA / Chartered Accountant · Employer EAP & Hospital Social Worker (free)"
  };
  const r = (typeof REGIONS !== "undefined" && REGIONS[S.region]) ? REGIONS[S.region] : { label: "United States", emergency: "911", currency: "$", crossBorder: false, indiaNotes: false, fieldOverrides: {}, listOverrides: {}, stepOverrides: {} };
  return { ...r, moneyGuide: r.moneyGuide || defMg, proFinder: r.proFinder || defPf };
}
function rField(f) {
  const ov = getRegion().fieldOverrides?.[f[0]];
  if (!ov) return f;
  return [f[0], ov.label ?? f[1], ov.ph ?? f[2], f[3]];
}
function rList(b) {
  const ov = getRegion().listOverrides?.[b.id];
  const baseSug = b.suggestions || [];
  const extraSug = ov?.extraSuggestions || [];
  const mergedSug = [...baseSug, ...extraSug.filter(s => !baseSug.includes(s))];
  if (!ov && !mergedSug.length) return b;
  return {
    ...b,
    hint: ov?.hint ?? b.hint,
    cols: ov?.colLabels ? b.cols.map(([k, l]) => [k, ov.colLabels[k] || l]) : b.cols,
    suggestions: mergedSug
  };
}
const collapsedCards = new Set();
function cardHeadHtml(title, badgeText, collapseKey) {
  const isCol = collapsedCards.has(collapseKey);
  return `<div class="card-head"><h3>${esc(title)}</h3><div class="card-meta">${badgeText ? `<span class="card-badge">${esc(badgeText)}</span>` : ""}${!S.readMode ? `<button type="button" class="card-tog" data-togcard="${esc(collapseKey)}" aria-expanded="${isCol ? "false" : "true"}" title="Collapse or expand">${isCol ? "▸" : "▾"}</button>` : ""}</div></div>`;
}
function rStep(s) {
  const ov = getRegion().stepOverrides?.[s.id];
  if (!ov) return s;
  return { ...s, t: ov.t ?? s.t, d: ov.d ?? s.d };
}
function autoGrow(ta) {
  if (!ta || !ta.style) return;
  ta.style.height = "auto";
  const h = ta.scrollHeight || 0;
  if (h > 0) ta.style.height = Math.max(h + 4, 68) + "px";
}
const allTabs = () => [...TABS, ...S.customTabs.map(c => ({ ...c, custom: true, blocks: [], lede: "Your own section. Add fields or tables below." }))];

let saveT, lockQueue = Promise.resolve();
function flushLockSave() {
  clearTimeout(lockDebounceT);
  lockDebounceT = null;
  if (!pendingLockSnap || !browserLockKey || !browserLockSalt || !hasCrypto()) return lockQueue;
  const snap = pendingLockSnap;
  pendingLockSnap = null;
  const key = browserLockKey;
  const salt = browserLockSalt;
  lockQueue = lockQueue.then(async () => {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(snap));
    localStorage.setItem(LOCK_KEY, JSON.stringify({ app: "family-field-guide", v: 1, salt: b64(salt), iv: b64(iv), data: b64(ct) }));
    localStorage.removeItem(KEY);
  }).catch(() => {
    toast("Storage full — remove a photo or save a backup now");
  });
  return lockQueue;
}
function save(quiet, touch = true) {
  if (touch) S.updated = new Date().toISOString();
  if (browserLockPass && browserLockKey && browserLockSalt && hasCrypto()) {
    pendingLockSnap = JSON.stringify(S);
    clearTimeout(lockDebounceT);
    lockDebounceT = setTimeout(() => { flushLockSave(); }, 250);
    resetIdleLockTimer();
  } else {
    try {
      localStorage.setItem(KEY, JSON.stringify(S));
    } catch {
      toast("Device storage full — remove a photo or save a backup now");
    }
  }
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
  const rawDef = findBlockDef(blockId);
  const b = rawDef ? rList(rawDef) : null;
  if (b?.seed?.length) {
    const matchesSeed = b.seed.some(seedRow => {
      const seedEntries = Object.entries(seedRow).filter(([, val]) => String(val ?? "").trim() !== "");
      if (seedEntries.length !== nonEmptyEntries.length) return false;
      return seedEntries.every(([k, val]) => String(row[k] ?? "").trim() === String(val ?? "").trim());
    });
    if (matchesSeed) return false;
  }
  if (b?.suggestions?.length && nonEmptyEntries.length === 1) {
    const scol = b.suggestCol || b.cols?.[0]?.[0];
    const [k, v] = nonEmptyEntries[0];
    if (k === scol && b.suggestions.some(s => s.toLowerCase() === String(v).trim().toLowerCase())) return false;
  }
  return true;
}

function rowHasFilledValue(id, row) {
  return isRowUserEdited(id, row);
}

function hasAnyContent() {
  if (Object.values(S.f).some(v => String(v ?? "").trim() !== "")) return true;
  if (Object.keys(S.lists).some(id => (S.lists[id] || []).some(r => rowHasFilledValue(id, r)))) return true;
  if ((S.photos || []).length) return true;
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

function qchipsHtml(id, b) {
  const sugs = b?.suggestions || [];
  if (S.readMode || !sugs.length) return "";
  const scol = b.suggestCol || b.cols?.[0]?.[0];
  const rows = S.lists[id] || [];
  const used = new Set(rows.map(r => String(r[scol] || "").trim().toLowerCase()).filter(Boolean));
  return `<div class="qchips" id="qchips-${esc(id)}"><span class="qchips-lbl">Quick-add:</span>${sugs.map(lbl => {
    const isUsed = used.has(lbl.toLowerCase());
    return `<button type="button" class="qchip${isUsed ? " used" : ""}" data-qadd="${esc(id)}::${esc(lbl)}">${isUsed ? "✓ " : "+ "}${esc(lbl)}</button>`;
  }).join("")}</div>`;
}

function listCard(id, title, hint, cols, extra = "", opts = {}) {
  const editable = !S.readMode || opts.crisisEditable;
  const rows = S.lists[id] || [];
  const filledCount = rows.filter(r => rowHasFilledValue(id, r)).length;
  const hasAny = filledCount > 0;
  if (S.readMode && !hasAny && !opts.crisisEditable) return "";
  const crisisAdd = opts.crisisEditable ? " crisis-add" : "";
  const rawDef = opts.block || findBlockDef(id);
  const b = rawDef ? rList(rawDef) : null;
  const colKey = "l:" + id;
  const isCol = !S.readMode && collapsedCards.has(colKey);
  const badge = filledCount ? `${filledCount} filled` : "";
  return `<div class="card${hasAny ? "" : " is-empty"}${isCol ? " collapsed" : ""}" data-block-id="${esc(id)}" data-block-title="${esc(title)}" data-ckey="${esc(colKey)}">${extra}${cardHeadHtml(title, badge, colKey)}<div class="card-body">${hint ? `<p class="hint">${esc(hint)}</p>` : ""}<div class="rows" id="rows-${esc(id)}">${listRows(id, cols, editable)}</div>${editable ? `<button type="button" class="add${crisisAdd}" data-add="${esc(id)}">+ Add a row</button>` : ""}${qchipsHtml(id, b)}</div></div>`;
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
        <button type="button" data-act="readiness">Readiness &amp; Fire Drill</button>
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

function photosBlockHtml(b) {
  const photos = S.photos || [];
  if (S.readMode && !photos.length) return "";
  return `<div class="card${photos.length ? "" : " is-empty"}" data-block-id="${esc(b.id)}" data-block-title="${esc(b.title)}">
    <h3>${esc(b.title)}</h3>
    ${b.hint ? `<p class="hint">${esc(b.hint)}</p>` : ""}
    ${photos.length ? `<div class="photo-grid">${photos.filter(p => safeImgUrl(p.dataUrl)).map(p => `<div class="photo-card">
      ${S.readMode ? "" : `<button type="button" class="cx" style="top:4px;right:6px" title="Remove photo" data-delphoto="${esc(p.id)}">✕</button>`}
      <img src="${esc(safeImgUrl(p.dataUrl))}" alt="${esc(p.label)}" data-zoom="${esc(p.id)}">
      <div class="photo-cap">${esc(p.label)}</div>
    </div>`).join("")}</div>` : `<p class="hint" style="margin:4px 0 0">No photos added yet.</p>`}
    ${S.readMode ? "" : `<div class="photo-bar">
      <button type="button" class="add blue" data-act="addPhoto"${photos.length >= 10 ? " disabled" : ""}>+ Add photo</button>
      <span style="font-family:var(--mono);font-size:11.5px;color:var(--mute)">${photos.length} / 10 photos</span>
    </div>`}
  </div>`;
}

function renderMoneyGuideHtml(forPrint = false) {
  const mg = getRegion().moneyGuide || {};
  const guides = (typeof MONEY_GUIDE !== "undefined" && Array.isArray(MONEY_GUIDE)) ? MONEY_GUIDE : [];
  const f = id => String(S.f[id] || "").trim();
  const val = txt => forPrint ? esc(txt) : linkify(txt);
  const personal = [
    ["First thing to do", f("m_payout_first")],
    ["Debts to pay vs. hold", f("m_payout_payoff")],
    ["Who to trust (and avoid)", f("m_payout_advisor")],
    ["Monthly 'paycheck' setup", f("m_payout_monthly")],
    ["Usual monthly spending", f("m_monthly")]
  ].filter(([, v]) => v);

  const inner = `<div class="mguide">
    ${forPrint && personal.length ? `<div class="mg-ex"><h4>My Specific Instructions For This Family</h4><ul>${personal.map(([k, v]) => `<li><b>${esc(k)}:</b> ${val(v)}</li>`).join("")}</ul></div>` : ""}
    <div class="mg-banner">
      ${mg.depositCap ? `<p><b>Deposit insurance safety cap (${esc(getRegion().label)}):</b> ${esc(mg.depositCap)}</p>` : ""}
      ${mg.safeCash ? `<p><b>Safe temporary parking:</b> ${esc(mg.safeCash)}</p>` : ""}
      ${mg.fiduciaryName ? `<p><b>Who to hire:</b> ${esc(mg.fiduciaryName)}</p>` : ""}
      ${mg.taxNote ? `<p><b>Tax &amp; legal note:</b> ${esc(mg.taxNote)}</p>` : ""}
    </div>
    ${mg.sampleLines?.length ? `<div class="mg-ex"><h4>${esc(mg.sampleTitle || "Sample Allocation")}</h4><ul>${mg.sampleLines.map(l => `<li>${esc(l)}</li>`).join("")}</ul></div>` : ""}
    <div class="mg-grid">${guides.map(g => `<div class="mg-sec">
      <div class="mg-sec-h"><h4>${esc(g.title)}</h4><span class="mg-badge">${esc(g.badge || "")}</span></div>
      <p>${esc(g.summary)}</p>
      <ul>${(g.bullets || []).map(x => `<li>${esc(x)}</li>`).join("")}</ul>
      ${g.note ? `<div class="mg-note">${esc(g.note)}</div>` : ""}
    </div>`).join("")}</div>
    ${!forPrint ? `<div class="mg-acts"><button type="button" class="btn" data-act="printMoneyGuide">Print Survivor's Money Guide</button></div>` : ""}
  </div>`;
  if (!forPrint) return inner;
  return `<div class="sheet">
    <h1>Survivor's Guide to Handling Big Money &amp; Payouts</h1>
    <p class="sheet-sub">${esc(getRegion().label)}${getRegion().lastVerified ? ` · Verified ${esc(getRegion().lastVerified)}` : ""} · Updated ${new Date().toLocaleDateString()} · General educational guidance, not personal legal, tax, or investment advice.</p>
    ${inner}
  </div>`;
}

function renderProFinderHtml(forPrint = false) {
  const pf = getRegion().proFinder || {};
  const cards = (typeof PRO_FINDER !== "undefined" && Array.isArray(PRO_FINDER)) ? PRO_FINDER : [];
  const inner = `<div class="mguide">
    <div class="mg-banner">
      <p><b>Quick directories (${esc(getRegion().label)}):</b></p>
      ${pf.legal ? `<p><b>Legal / Estate:</b> ${esc(pf.legal)}</p>` : ""}
      ${pf.visa ? `<p><b>Immigration / Visa:</b> ${esc(pf.visa)}</p>` : ""}
      ${pf.money ? `<p><b>Financial Advisor:</b> ${esc(pf.money)}</p>` : ""}
      ${pf.tax ? `<p><b>Taxes &amp; Free Aid:</b> ${esc(pf.tax)}</p>` : ""}
    </div>
    <div class="mg-grid">${cards.map(c => `<div class="mg-sec">
      <div class="mg-sec-h"><h4>${esc(c.title)}</h4><span class="mg-badge">${esc(c.badge || "")}</span></div>
      <p>${esc(c.summary)}</p>
      <ul>${(c.bullets || []).map(x => `<li>${esc(x)}</li>`).join("")}</ul>
      ${c.note ? `<div class="mg-note">${esc(c.note)}</div>` : ""}
    </div>`).join("")}</div>
    ${!forPrint ? `<div class="mg-acts"><button type="button" class="btn" data-act="printProFinder">Print Finding Help Guide</button></div>` : ""}
  </div>`;
  if (!forPrint) return inner;
  return `<div class="sheet">
    <h1>How to Find Vetted &amp; Low-Cost Professional Help</h1>
    <p class="sheet-sub">${esc(getRegion().label)}${getRegion().lastVerified ? ` · Verified ${esc(getRegion().lastVerified)}` : ""} · Updated ${new Date().toLocaleDateString()} · General directory guidance, not legal, tax, or financial advice.</p>
    ${inner}
  </div>`;
}

function block(b) {
  switch (b.type) {
    case "fields": {
      const filledN = b.fields.filter(f => String(S.f[f[0]] || "").trim() !== "").length;
      const anyFilled = filledN > 0;
      if (S.readMode && !anyFilled) return "";
      const colKey = "f:" + b.title;
      const isCol = !S.readMode && collapsedCards.has(colKey);
      const badge = filledN ? `${filledN}/${b.fields.length}` : "";
      return `<div class="card${anyFilled ? "" : " is-empty"}${isCol ? " collapsed" : ""}" data-block-title="${esc(b.title)}" data-ckey="${esc(colKey)}">${cardHeadHtml(b.title, badge, colKey)}<div class="card-body">${b.hint ? `<p class="hint">${esc(b.hint)}</p>` : ""}<div class="grid2">${
        b.fields.map(f => rField(f)).map(rf => {
          const empty = !String(S.f[rf[0]] || "").trim();
          if (S.readMode && empty) return "";
          return `<div class="${empty ? "is-empty" : ""}" style="${rf[3] ? "grid-column:1/-1" : ""}">${field(...rf)}</div>`;
        }).join("")}</div></div></div>`;
    }
    case "list": {
      const lb = rList(b);
      return listCard(lb.id, lb.title, lb.hint, lb.cols, "", { crisisEditable: lb.crisisEditable, block: lb });
    }
    case "money_guide": {
      const colKey = "mg:" + b.id;
      const isCol = !S.readMode && collapsedCards.has(colKey);
      return `<div class="card${isCol ? " collapsed" : ""}" data-block-id="${esc(b.id)}" data-block-title="${esc(b.title)}" data-ckey="${esc(colKey)}">${cardHeadHtml(b.title, "6-step guide", colKey)}<div class="card-body"><p class="hint">Plain-English instructions for someone who has never managed large savings or insurance payouts before. Covers what to do in Month 1, how to avoid bad salespeople, and how to turn $1M into steady income.</p>${renderMoneyGuideHtml(false)}</div></div>`;
    }
    case "pro_finder": {
      const colKey = "pf:" + b.id;
      const isCol = !S.readMode && collapsedCards.has(colKey);
      return `<div class="card${isCol ? " collapsed" : ""}" data-block-id="${esc(b.id)}" data-block-title="${esc(b.title)}" data-ckey="${esc(colKey)}">${cardHeadHtml(b.title, "5 guides", colKey)}<div class="card-body"><p class="hint">Starting from scratch or on a tight budget? Where to find Bar-referred lawyers, independent immigration attorneys, hourly fee-only financial advisors, free tax clinics, and free hospital/employer advocates.</p>${renderProFinderHtml(false)}</div></div>`;
    }
    case "photos": return photosBlockHtml(b);
    case "glance": {
      const anyFilled = GLANCE.some(g => String(S.f[g[0]] || "").trim() !== "");
      const body = S.readMode && !anyFilled
        ? `<p class="hint" style="color:#c9d3cc;margin:0">Nothing filled in here yet.</p>`
        : `<div class="g">${GLANCE.map(g => rField(g)).map(rg => (S.readMode && !String(S.f[rg[0]] || "").trim()) ? "" : field(...rg)).join("")}</div>`;
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
        const rf = rField([id, t, ph]);
        const raw = S.f[id] ?? "";
        const empty = !String(raw).trim();
        if (S.readMode && empty) return "";
        return `<div class="k${empty ? " is-empty" : ""}" data-fwrap="${esc(id)}"><div class="emoji">${e}</div><h4>${esc(rf[1])}</h4>${
          S.readMode
            ? `<div class="ro-val area">${linkify(raw)}</div>`
            : `<textarea data-f="${esc(id)}" placeholder="${esc(rf[2])}">${esc(raw)}</textarea><div class="print-val" data-pv="${esc(id)}">${esc(raw)}</div>`
        }</div>`;
      }).join("")}</div></div>`;
    }
  }
}

function playbook() {
  return Object.entries(PLAYBOOK).map(([k, p]) => `<div class="${S.track === k ? "" : "phase-hidden"}" data-label="${esc(p.label)}" style="${S.track === k ? "" : "display:none"}">
    ${p.phases.map(ph => `<div class="phase"><div class="when">${esc(ph.when)}</div><div class="steps">${ph.steps.map(rawS => {
      const s = rStep(rawS);
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

function loadDemo() {
  if (typeof DEMO_FAMILIES === "undefined") return;
  const src = DEMO_FAMILIES[S.region] || DEMO_FAMILIES.default;
  const keepRegion = S.region;
  const keepLarge = S.largeText, keepHc = S.highContrast;
  S = {
    region: keepRegion,
    largeText: keepLarge,
    highContrast: keepHc,
    isDemo: true,
    track: src.track || "hurt",
    tab: "start",
    f: { ...(src.f || {}), ...(src.f_extra_patch || {}) },
    lists: JSON.parse(JSON.stringify(src.lists || {})),
    checks: {},
    fireDrill: {},
    photos: [],
    customTabs: JSON.parse(JSON.stringify(src.customTabs || [])),
    extra: JSON.parse(JSON.stringify(src.extra || {}))
  };
  norm(); save(true, false); render();
  toast("Sample family loaded — explore freely!");
}

function clearDemo() {
  const keepRegion = S.region, keepLarge = S.largeText, keepHc = S.highContrast;
  S = { region: keepRegion, largeText: keepLarge, highContrast: keepHc, tab: "start" };
  norm(); save(true, false); render();
  toast("Cleared sample — ready for your family");
}

function render() {
  document.body.classList.toggle("read-mode", !!S.readMode);
  document.body.classList.toggle("large-text", !!S.largeText);
  document.body.classList.toggle("high-contrast", !!S.highContrast);
  const largeBtn = document.querySelector('[data-act="toggleLarge"]');
  if (largeBtn) { largeBtn.classList.toggle("on", !!S.largeText); largeBtn.setAttribute?.("aria-pressed", String(!!S.largeText)); }
  const hcBtn = document.querySelector('[data-act="toggleContrast"]');
  if (hcBtn) { hcBtn.classList.toggle("on", !!S.highContrast); hcBtn.setAttribute?.("aria-pressed", String(!!S.highContrast)); }
  const lockBtn = document.querySelector('[data-act="lockBrowser"]');
  if (lockBtn) {
    lockBtn.classList.toggle("on", !!browserLockPass);
    lockBtn.setAttribute?.("aria-pressed", String(!!browserLockPass));
    lockBtn.textContent = browserLockPass ? "Locked ✓" : "Lock";
  }
  const rSel = $("#regionSel");
  if (rSel && typeof REGIONS !== "undefined") {
    rSel.innerHTML = Object.entries(REGIONS).map(([k, v]) => `<option value="${esc(k)}"${S.region === k ? " selected" : ""}>${esc(v.label)}</option>`).join("");
  }
  const db = $("#demoBanner");
  if (db) {
    if (S.isDemo) {
      db.innerHTML = `<div class="demo-banner active"><span><b>Sample family preview (${esc(getRegion().label)})</b> — explore Read mode, Search, Readiness Audit, or Caregiver Sheet. Nothing here is saved as yours.</span><div class="db-acts"><button type="button" class="primary" data-act="clearDemo">Clear sample &amp; start my guide</button></div></div>`;
    } else if (!hasAnyContent() && !S.readMode && !S.dismissDemo && typeof DEMO_FAMILIES !== "undefined") {
      db.innerHTML = `<div class="demo-banner"><span><b>New here?</b> Take a 5-minute guided setup, preview how the guide looks filled out, or start typing below.</span><div class="db-acts"><button type="button" class="primary" data-act="quickStart">5-minute guided setup</button><button type="button" data-act="loadDemo">Load sample family</button><button type="button" data-act="dismissDemo">Dismiss</button></div></div>`;
    } else {
      db.innerHTML = "";
    }
  }

  const tabs = allTabs();
  $("#tabs").innerHTML = tabs.map(t => `<button type="button" role="tab" id="tab-${esc(t.id)}" aria-selected="${S.tab === t.id ? "true" : "false"}" aria-controls="p-${esc(t.id)}" data-tab="${esc(t.id)}" class="${S.tab === t.id ? "on" : ""} ${t.custom ? "custom" : ""}">${esc(t.label)}</button>`).join("")
    + `<button type="button" class="newtab" data-act="newtab">+ Section</button><span class="spacer"></span>`
    + `<button type="button" class="tool${S.readMode ? " on" : ""}" aria-pressed="${S.readMode ? "true" : "false"}" data-act="toggleRead">${S.readMode ? "Edit mode" : "Read mode"}</button>`
    + `<button type="button" class="tool" data-act="summary">1-page Summary</button>`
    + `<button type="button" class="tool" data-act="backup">Save backup</button>`
    + `<button type="button" class="tool" data-act="restore">Open backup</button>`
    + `<button type="button" class="tool" data-act="print">Print</button>`
    + `<button type="button" class="tool" data-act="project">GitHub</button>`;

  $("#modeBanner").innerHTML = S.readMode
    ? `<div class="mode-banner"><span><b>Read mode</b> — showing filled details only so nothing gets edited by accident. Playbook checks and the Call &amp; claim log stay interactive.</span><div style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" data-act="summary">1-page Summary</button><button type="button" data-act="toggleRead">Switch to Edit mode</button></div></div>`
    : "";

  $("#panels").innerHTML = tabs.map(t => {
    const inner = t.blocks.map(block).join("") + extras(t);
    const body = (S.readMode && !inner.trim())
      ? `<div class="ro-empty-tab">Nothing filled in this section yet. <a href="#" data-act="toggleReadLink" style="color:var(--sky)">Switch to Edit mode</a> to add details.</div>`
      : inner;
    return `<section class="panel ${S.tab === t.id ? "on" : ""}" role="tabpanel" aria-labelledby="tab-${esc(t.id)}" id="p-${esc(t.id)}"><h2>${esc(t.title)}</h2><p class="lede">${esc(t.lede)}</p>${body}</section>`;
  }).join("");
  document.querySelectorAll("textarea[data-f]").forEach(autoGrow);
  meter(); trackProgress(); syncInstallBtn(); syncActiveTabScroll();
}

function syncActiveTabScroll() {
  const nav = $("#tabs");
  const active = nav?.querySelector?.("button.on");
  if (nav && active && typeof nav.scrollTo === "function" && nav.scrollWidth > nav.clientWidth) {
    const targetLeft = Math.max(0, active.offsetLeft - Math.round((nav.clientWidth - active.offsetWidth) / 2));
    nav.scrollTo({ left: targetLeft, behavior: "smooth" });
  }
}

function scrollToActivePanel() {
  const isMobile = typeof window !== "undefined" && Number(window.innerWidth) > 0 && window.innerWidth <= 720;
  const nav = $("#tabs"), panels = $("#panels");
  if (isMobile && panels && typeof panels.getBoundingClientRect === "function") {
    const navH = nav && typeof nav.getBoundingClientRect === "function" ? nav.getBoundingClientRect().height : 44;
    const y = (window.scrollY || 0) + panels.getBoundingClientRect().top - navH - 6;
    scrollTo({ top: Math.max(0, Math.round(y)), behavior: "smooth" });
  } else {
    scrollTo({ top: 0, behavior: "smooth" });
  }
}

function syncInstallBtn() {
  const btn = document.querySelector('[data-act="installApp"]');
  if (!btn) return;
  const installed = isStandaloneApp();
  btn.hidden = installed;
  btn.classList.toggle("on", Boolean(deferredInstallPrompt));
}

function installAppDialog() {
  const isFile = location.protocol === "file:";
  const canPrompt = Boolean(deferredInstallPrompt);
  openDlg(`<h3>Install as an offline app</h3>
    <p class="hint">Keep <b>Our Family Field Guide</b> on your home screen or desktop for offline use—no App Store, no account, no cost.</p>
    ${isFile ? `<p class="hint" style="color:var(--tomato)"><b>Opening from a local file:</b> browsers require HTTPS (such as your free <b>GitHub Pages</b> URL) to install as an app icon. You can still use this local file or save a standalone <code>.html</code> backup offline anytime.</p>` : ""}
    ${canPrompt ? `<div style="margin:10px 0 12px"><button type="button" class="btn primary" id="doInstall">Install now on this device</button></div>` : ""}
    <div class="opt-list">
      <div class="opt-card"><div><b>iPhone / iPad (Safari)</b><small>Tap <b>Share</b> (↑) → <b>Add to Home Screen</b> → <b>Add</b>. Tip: Safari can clear browser storage if unused for long periods, so also save a locked standalone <code>.html</code> copy in Apple Files / iCloud Drive.</small></div></div>
      <div class="opt-card"><div><b>Android (Chrome / Edge / Brave)</b><small>${canPrompt ? "Tap <b>Install now on this device</b> above, or open browser menu (⋮) → <b>Install app</b>." : "Open the browser menu (⋮) → <b>Install app</b> (or <b>Add to Home screen</b>)."}</small></div></div>
      <div class="opt-card"><div><b>Windows / Mac / Linux (Desktop)</b><small>${canPrompt ? "Click <b>Install now on this device</b> above, or click the install icon in your browser address bar." : "In Chrome, Edge, or Brave click the install icon in the address bar. In macOS Safari choose <b>File → Add to Dock</b>."}</small></div></div>
    </div>
    <div class="btns"><button type="button" class="btn primary" id="cancelDlg">Close</button></div>`, true);
  $("#cancelDlg").onclick = () => $("#dlg").close();
  const di = $("#doInstall");
  if (di) {
    di.onclick = async () => {
      if (!deferredInstallPrompt) return;
      try {
        await deferredInstallPrompt.prompt();
        const ch = await deferredInstallPrompt.userChoice;
        if (ch?.outcome === "accepted") toast("Installing app…");
      } catch {}
      deferredInstallPrompt = null;
      syncInstallBtn();
      $("#dlg").close();
    };
  }
}

function computeAudit() {
  const f = id => String(S.f[id] || "").trim();
  const rowsOf = id => (S.lists[id] || []).filter(r => rowHasFilledValue(id, r));
  const items = [];
  const reg = getRegion();

  const missCore = [!f("q_first") && "First person to call", !f("q_binder") && "Where papers live"].filter(Boolean);
  items.push(missCore.length
    ? { id: "start_core", sev: "high", title: "Start-here essentials incomplete", detail: `Missing: ${missCore.join(", ")}.`, tab: "start", block: "If you read nothing else", field: !f("q_first") ? "q_first" : "q_binder" }
    : { id: "start_core", sev: "ok", title: "First-call & paper locations set", detail: "Your spouse knows who to call and where originals live." });

  if (!f("d_phone")) {
    items.push({ id: "phone_2fa", sev: "high", title: "No phone unlock instructions", detail: "Banks and email send 2FA login codes to your phone—without unlock notes, your spouse can get locked out.", tab: "docs", block: "Getting into things", field: "d_phone" });
  } else if (!f("d_2fa") && !f("d_sim")) {
    items.push({ id: "phone_2fa", sev: "med", title: "Add 2FA recovery or carrier SIM PIN", detail: "Phone unlock is noted, but 2FA recovery codes or SIM PIN instructions will prevent lockouts.", tab: "docs", block: "Getting into things", field: "d_2fa" });
  } else {
    items.push({ id: "phone_2fa", sev: "ok", title: "Phone & 2FA access documented", detail: "Unlock and 2FA/SIM instructions are covered." });
  }

  const accts = rowsOf("accounts");
  const hasJoint = accts.some(r => /joint|both|shared|either|survivor|&|\band\b/i.test(String(r.own || "")));
  if (!accts.length) {
    items.push({ id: "joint_bank", sev: "med", title: "No bank accounts listed yet", detail: "List checking/savings (last 4 digits) and mark which ones are Joint.", tab: "money", block: "accounts" });
  } else if (!hasJoint) {
    items.push({ id: "joint_bank", sev: "high", title: "No bank account marked Joint", detail: "Solo accounts often freeze upon death, stranding household bills until probate.", tab: "money", block: "accounts" });
  } else {
    items.push({ id: "joint_bank", sev: "ok", title: "Joint bank access listed", detail: "At least one account is marked joint/shared." });
  }

  const invRows = rowsOf("invest");
  const lifeRows = rowsOf("insurance").filter(r => /life|term/i.test(String(r.type || "")));
  const invMiss = invRows.filter(r => !String(r.benef || "").trim()).length;
  const lifeMiss = lifeRows.filter(r => !String(r.benef || "").trim()).length;
  const totalBenefMiss = invMiss + lifeMiss;
  const indiaNote = reg.indiaNotes ? " In India, bank/demat nominees are custodians—ensure your will/legal heirs match." : "";
  if (totalBenefMiss > 0) {
    items.push({ id: "beneficiaries", sev: "high", title: `${totalBenefMiss} retirement/life-insurance entry missing a Beneficiary`, detail: "Named beneficiaries override your will—record who is named on each." + indiaNote, tab: "money", block: invMiss > 0 ? "invest" : "insurance" });
  } else if (!invRows.length && !lifeRows.length) {
    items.push({ id: "beneficiaries", sev: "med", title: "No life insurance or retirement accounts listed", detail: "Record policies and retirement accounts along with named beneficiaries." + indiaNote, tab: "money", block: "insurance" });
  } else {
    items.push({ id: "beneficiaries", sev: "ok", title: "Beneficiaries recorded", detail: "Listed life insurance & retirement entries name a beneficiary." + indiaNote });
  }

  const missLegal = [!f("d_will") && "Will / trust", !f("d_hcd") && "Healthcare directive", !f("d_fpoa") && "Financial POA"].filter(Boolean);
  if (missLegal.length) {
    const onlyMed = missLegal.length === 1 && !f("d_hcd");
    items.push({ id: "legal_med", sev: "high", title: `Missing legal/medical papers (${missLegal.length})`, detail: `Not recorded: ${missLegal.join(", ")}.`, tab: onlyMed ? "health" : "docs", block: onlyMed ? "My medical info" : "Legal papers", field: !f("d_will") ? "d_will" : (!f("d_fpoa") ? "d_fpoa" : "d_hcd") });
  } else {
    items.push({ id: "legal_med", sev: "ok", title: "Core legal & medical directives mapped", detail: "Will/trust, healthcare directive, and financial POA locations are recorded." });
  }

  items.push((!f("d_pm") && !f("d_legacy"))
    ? { id: "digital_legacy", sev: "med", title: "No password manager or legacy contact noted", detail: "Set up Password Manager emergency access or Apple/Google Legacy Contacts.", tab: "docs", block: "Getting into things", field: "d_pm" }
    : { id: "digital_legacy", sev: "ok", title: "Digital legacy / password access set", detail: "Password manager or platform legacy contacts are documented." });

  const cryptoRows = rowsOf("crypto");
  const seedRe = /\b([a-z]{3,}\s+){11,}[a-z]{3,}\b/i;
  const sensitiveFieldKeys = ["d_pm", "d_2fa", "d_phone", "d_keys", "d_safe", "d_sim", "d_email"];
  const sensitiveFieldHit = sensitiveFieldKeys.find(k => seedRe.test(f(k)));
  const customCryptoSeed = Object.values(S.extra || {}).flat().some(x => {
    if (!/crypto|wallet|seed|key|password/i.test(`${x.label || ""} ${x.title || ""}`)) return false;
    if (x.type === "field") return seedRe.test(f(x.id));
    return rowsOf(x.id).some(r => Object.values(r).some(v => seedRe.test(String(v || ""))));
  });
  const hasCryptoSeed = cryptoRows.some(r => Object.values(r).some(v => seedRe.test(String(v || "")))) || Boolean(sensitiveFieldHit) || customCryptoSeed;
  if (hasCryptoSeed || cryptoRows.length) {
    const missCrypto = cryptoRows.some(r => !String(r.access || "").trim() || !String(r.helper || "").trim());
    if (hasCryptoSeed) {
      items.push({ id: "crypto_safety", sev: "high", title: "Possible crypto seed phrase detected!", detail: "Never store 12/24-word recovery seeds in this guide—write ONLY where the physical backup lives.", tab: sensitiveFieldHit ? "docs" : "money", block: sensitiveFieldHit ? "Getting into things" : "crypto", field: sensitiveFieldHit || "" });
    } else if (missCrypto) {
      items.push({ id: "crypto_safety", sev: "med", title: "Crypto entry missing recovery location or helper", detail: "Record where the seed/hardware wallet is stored and a trusted helper who can assist safely.", tab: "money", block: "crypto" });
    } else {
      items.push({ id: "crypto_safety", sev: "ok", title: "Crypto recovery map documented (no raw seeds)", detail: "Holdings, storage locations, and trusted helper instructions are recorded." });
    }
  }

  const govRows = rowsOf("gov_ids");
  const strictIdRe = /\b\d{3}-\d{2}-\d{4}\b|\b\d{4}[\s-]\d{4}[\s-]\d{4}\b/;
  const fieldIdHit = Object.entries(S.f || {}).find(([, v]) => strictIdRe.test(String(v || "")));
  const listIdHit = Object.entries(S.lists || {}).some(([lid, rows]) =>
    (rows || []).some(r => {
      if (!rowHasFilledValue(lid, r)) return false;
      if (Object.values(r).some(v => strictIdRe.test(String(v || "")))) return true;
      return lid === "gov_ids" && /\b\d{9,}\b/.test(String(r.last4 || ""));
    })
  );
  if (govRows.length || fieldIdHit || listIdHit) {
    items.push((fieldIdHit || listIdHit)
      ? { id: "gov_id_privacy", sev: "high", title: "Possible full SSN / National ID detected!", detail: "Safety rule: enter ONLY the last 4 digits and where the original card lives—remove full ID numbers.", tab: fieldIdHit ? "start" : "docs", block: fieldIdHit ? "" : "gov_ids", field: fieldIdHit ? fieldIdHit[0] : "" }
      : { id: "gov_id_privacy", sev: "ok", title: "Key IDs mapped safely (last 4 only)", detail: "Government IDs record only last 4 digits and physical locations." });
  }

  if (f("q_life") || lifeRows.length) {
    const hasPayoutGuide = Boolean(f("m_payout_first") || f("m_payout_payoff") || f("m_payout_advisor") || f("m_payout_monthly"));
    items.push(hasPayoutGuide
      ? { id: "payout_plan", sev: "ok", title: "Survivor big-money instructions documented", detail: "Plain-English instructions for handling insurance payouts are filled in." }
      : { id: "payout_plan", sev: "med", title: "Add personal instructions for life insurance / big money", detail: "Tell your spouse what to do first with payouts, which debts to leave alone, and who to trust.", tab: "money", block: "My instructions for big money / insurance payouts", field: "m_payout_first" });
  }

  if (reg.crossBorder) {
    const hasVisaInfo = S.customTabs.some(t => /visa|immig|cross|india|nri/i.test(t.label + " " + t.title))
      || /i-797|i-140|h-1b|h-4|oci|visa/i.test(JSON.stringify(S.f) + JSON.stringify(S.lists.doclocs || []));
    const hasImmigPro = (S.lists.pros || []).some(r => /immig|visa|cross/i.test(JSON.stringify(r)));
    items.push((hasVisaInfo && hasImmigPro)
      ? { id: "cross_border", sev: "ok", title: "Cross-border & visa readiness covered", detail: "Visa papers, separate country planning, and immigration counsel are noted." }
      : { id: "cross_border", sev: "high", title: "Cross-border / Visa readiness incomplete", detail: "Record visa filings (I-797/I-94/I-140), immigration attorney, local temporary guardian, and separate country wills.", tab: "docs", block: "doclocs" });
  }

  const backupAgeDays = S.lastBackup ? (Date.now() - new Date(S.lastBackup)) / 864e5 : Infinity;
  if (hasAnyContent() && !S.lastBackup) {
    items.push({ id: "backup_fresh", sev: "high", title: "No locked backup saved yet", detail: "Browser storage can be evicted—save a standalone locked .html copy now.", act: "backup" });
  } else if (hasAnyContent() && S.updated && S.updated > S.lastBackup) {
    items.push({ id: "backup_fresh", sev: "med", title: "Recent changes aren't in your latest backup", detail: "Save a fresh locked backup so your spouse's copy matches.", act: "backup" });
  } else if (S.lastBackup && backupAgeDays > 180) {
    items.push({ id: "backup_fresh", sev: "med", title: "Last locked backup is over 6 months old", detail: "Export a fresh copy after checking your details.", act: "backup" });
  } else {
    items.push({ id: "backup_fresh", sev: "ok", title: "Locked backup is current", detail: S.lastBackup ? `Saved ${new Date(S.lastBackup).toLocaleDateString()}.` : "No entries to back up yet." });
  }

  const drillAgeDays = S.lastDryRun ? (Date.now() - new Date(S.lastDryRun)) / 864e5 : Infinity;
  items.push((!S.lastDryRun || drillAgeDays > 365)
    ? { id: "fire_drill", sev: "med", title: "Run a 10-minute Family Fire Drill", detail: "Verify your spouse can unlock the guide and physically locate papers and phone access." }
    : { id: "fire_drill", sev: "ok", title: "Family Fire Drill completed", detail: `Last dry-run: ${new Date(S.lastDryRun).toLocaleDateString()}.` });

  return items;
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
  const audit = computeAudit();
  const okCount = audit.filter(x => x.sev === "ok").length;
  const highCount = audit.filter(x => x.sev === "high").length;
  const gapCount = audit.length - okCount;
  const pillCls = highCount ? " warn" : (gapCount === 0 ? " ok" : "");
  $("#rev").innerHTML = (r ? `Last reviewed ${r.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}${days > 180 ? " · time for a check‑up" : ""}` : "Not reviewed yet")
    + `<button type="button" data-act="reviewed">Mark reviewed</button><button type="button" data-act="ics" title="Add 6-month reminder to calendar">Remind me</button>`
    + `<div><button type="button" class="audit-pill${pillCls}" data-act="readiness">Readiness: ${okCount}/${audit.length}${gapCount ? ` · ${gapCount} gap${gapCount === 1 ? "" : "s"}` : " · ready"}</button></div>`
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
    if (card.classList.contains("collapsed") && card.dataset.ckey) {
      card.classList.remove("collapsed");
      collapsedCards.delete(card.dataset.ckey);
    }
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
    scrollToActivePanel();
  }
}

function runSearch(q) {
  const res = $("#searchRes");
  const term = q.trim().toLowerCase();
  if (!term) { res.hidden = true; res.innerHTML = ""; return; }
  const hits = [];
  const push = (tabId, tabLabel, title, sub, blockKey = "", fieldId = "", trackKey = "") => {
    if (hits.length >= 15) return;
    hits.push({ tabId, tabLabel, title, sub, blockKey, fieldId, trackKey });
  };

  GLANCE.forEach(rawG => {
    const [id, label] = rField(rawG);
    const val = String(S.f[id] || "");
    if (label.toLowerCase().includes(term) || val.toLowerCase().includes(term)) {
      push("start", "Start here", label, val || "Quick glance", "If you read nothing else", id);
    }
  });

  allTabs().forEach(t => {
    (t.blocks || []).forEach(b => {
      if (b.type === "fields") {
        b.fields.forEach(rawF => {
          const [id, label] = rField(rawF);
          const val = String(S.f[id] || "");
          if (label.toLowerCase().includes(term) || val.toLowerCase().includes(term) || b.title.toLowerCase().includes(term)) {
            push(t.id, t.label, label, val || b.title, b.title, id);
          }
        });
      }
      if (b.type === "list") {
        const lb = rList(b);
        const rows = S.lists[lb.id] || [];
        const matchedRow = rows.find(r => Object.values(r).some(v => String(v || "").toLowerCase().includes(term)));
        const matchedSug = (lb.suggestions || []).find(s => s.toLowerCase().includes(term));
        const hintMatch = (lb.hint || "").toLowerCase().includes(term);
        if (lb.title.toLowerCase().includes(term) || matchedRow || matchedSug || hintMatch) {
          const preview = matchedRow
            ? Object.values(matchedRow).filter(Boolean).join(" · ")
            : (matchedSug ? `Quick-add option: ${matchedSug}` : (lb.hint || "Table"));
          push(t.id, t.label, lb.title, preview, lb.id);
        }
      }
      if (b.type === "photos") {
        const mp = (S.photos || []).find(p => p.label.toLowerCase().includes(term));
        if (b.title.toLowerCase().includes(term) || mp) {
          push(t.id, t.label, b.title, mp ? mp.label : (b.hint || "Reference photos"), b.id);
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

  KIDS.forEach(([id, , t, ph]) => {
    const [, label] = rField([id, t, ph]);
    const val = String(S.f[id] || "");
    if (label.toLowerCase().includes(term) || val.toLowerCase().includes(term)) {
      push("kids", "For the kids", label, val || "Kids page", "For the kids", id);
    }
  });
  if ("a note to you letter from me".includes(term) || String(S.f.letter || "").toLowerCase().includes(term)) {
    push("start", "Start here", "A note to you", String(S.f.letter || "").slice(0, 80) || "Personal letter", "A note to you", "letter");
  }
  Object.entries(PLAYBOOK).forEach(([tk, p]) => {
    p.phases.forEach(ph => ph.steps.forEach(rawS => {
      const s = rStep(rawS);
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
  if (typeof MONEY_GUIDE !== "undefined") {
    MONEY_GUIDE.forEach(g => {
      const txt = `${g.title} ${g.summary} ${(g.bullets || []).join(" ")} ${g.note || ""}`.toLowerCase();
      if (txt.includes(term)) {
        push("money", "Money Guide", g.title, g.summary, "money_guide");
      }
    });
  }
  if (typeof PRO_FINDER !== "undefined") {
    const pfMap = getRegion().proFinder || {};
    const pfEntry = Object.entries(pfMap).find(([, v]) => String(v || "").toLowerCase().includes(term));
    if (pfEntry) {
      push("contacts", "Finding Help", `Local directories (${getRegion().label})`, pfEntry[1], "pro_finder");
    }
    PRO_FINDER.forEach(c => {
      const txt = `${c.title} ${c.summary} ${(c.bullets || []).join(" ")} ${c.note || ""}`.toLowerCase();
      if (txt.includes(term)) {
        push("contacts", "Finding Help", c.title, c.summary, "pro_finder");
      }
    });
  }

  res.innerHTML = hits.length
    ? hits.map((h, i) => `<button type="button" class="sr-item" data-sr="${i}"><span class="sr-tab">${esc(h.tabLabel)}</span><span class="sr-txt"><b>${esc(h.title)}</b>${h.sub ? ` — ${esc(h.sub)}` : ""}</span></button>`).join("")
    : `<div class="sr-empty">No matches for "${esc(q.trim())}"</div>`;
  res._hits = hits;
  res._idx = -1;
  res.hidden = false;
}

function setSearchActive(idx) {
  const res = $("#searchRes");
  const items = Array.from(res.querySelectorAll(".sr-item"));
  if (!items.length) return;
  const next = ((idx % items.length) + items.length) % items.length;
  res._idx = next;
  items.forEach((el, i) => el.classList.toggle("active", i === next));
  items[next].scrollIntoView({ block: "nearest" });
}

/* ---------- events ---------- */
document.addEventListener("input", e => {
  const el = e.target;
  if (el.id === "searchIn") { runSearch(el.value); return; }
  if (el.tagName === "TEXTAREA" && el.dataset.f) autoGrow(el);
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
  const res = $("#searchRes"), sin = $("#searchIn");
  if (document.activeElement === sin && !res.hidden && res._hits?.length) {
    if (e.key === "ArrowDown") { e.preventDefault(); setSearchActive((res._idx ?? -1) + 1); return; }
    if (e.key === "ArrowUp") { e.preventDefault(); setSearchActive((res._idx ?? 0) - 1); return; }
    if (e.key === "Enter") {
      e.preventDefault();
      const pick = res._hits[res._idx >= 0 ? res._idx : 0];
      res.hidden = true; sin.value = "";
      if (pick) jumpTo(pick.tabId, pick.blockKey, pick.fieldId, pick.trackKey);
      return;
    }
  }
  if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
    const tag = (document.activeElement?.tagName || "").toLowerCase();
    if (!["input", "textarea", "select"].includes(tag) && !$("#dlg").open) {
      e.preventDefault();
      sin.focus();
    }
  } else if (e.key === "Escape") {
    if (!res.hidden) {
      res.hidden = true;
      sin.blur();
    }
  }
});

document.addEventListener("focusin", e => {
  const tag = e.target?.tagName || "";
  if (e.target?.closest?.("#panels") && ["INPUT", "TEXTAREA", "SELECT"].includes(tag)) {
    document.body.classList.add("mobile-editing");
  }
});
document.addEventListener("focusout", () => {
  setTimeout(() => {
    const ae = document.activeElement;
    const tag = ae?.tagName || "";
    if (!ae?.closest?.("#panels") || !["INPUT", "TEXTAREA", "SELECT"].includes(tag)) {
      document.body.classList.remove("mobile-editing");
    }
  }, 80);
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
  if (e.target.tagName === "IMG" && e.target.dataset.zoom) {
    const ph = (S.photos || []).find(p => p.id === e.target.dataset.zoom);
    const safeSrc = ph ? safeImgUrl(ph.dataUrl) : "";
    if (ph && safeSrc) {
      openDlg(`<h3>${esc(ph.label)}</h3><img src="${esc(safeSrc)}" alt="${esc(ph.label)}" style="width:100%;max-height:70vh;object-fit:contain;border-radius:4px;border:1px solid var(--rule)"><div class="btns"><button type="button" class="btn primary" id="cancelDlg">Close</button></div>`, true);
      $("#cancelDlg").onclick = () => $("#dlg").close();
    }
    return;
  }

  const d = e.target.closest("button")?.dataset; if (!d) return;
  if (d.tab) { S.tab = d.tab; save(true, false); render(); scrollToActivePanel(); }
  if (d.track) { S.track = d.track; save(true, false); document.querySelectorAll("[data-track]").forEach(b => b.classList.toggle("on", b.dataset.track === d.track)); $("#pb").innerHTML = playbook(); trackProgress(); }
  if (d.add) { S.lists[d.add].push({}); save(true); relist(d.add); }
  if (d.qadd) {
    const [id, lbl] = d.qadd.split("::");
    const rawDef = findBlockDef(id);
    const b = rawDef ? rList(rawDef) : null;
    const colKey = b?.suggestCol || b?.cols?.[0]?.[0] || "name";
    S.lists[id] ??= [];
    S.lists[id].push({ [colKey]: lbl });
    save(true, false);
    relist(id);
    const rowsWrap = $("#rows-" + CSS.escape(id));
    const lastRow = rowsWrap?.lastElementChild;
    const targetInp = lastRow ? Array.from(lastRow.querySelectorAll("input")).find(x => !x.value.trim()) || lastRow.querySelector("input") : null;
    if (targetInp && typeof targetInp.focus === "function") targetInp.focus();
  }
  if (d.togcard) {
    const key = d.togcard;
    if (collapsedCards.has(key)) collapsedCards.delete(key);
    else collapsedCards.add(key);
    const card = e.target.closest(".card");
    if (card) {
      const isCol = collapsedCards.has(key);
      card.classList.toggle("collapsed", isCol);
      e.target.textContent = isCol ? "▸" : "▾";
      e.target.setAttribute("aria-expanded", isCol ? "false" : "true");
    }
  }
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
  if (d.act === "summary") summaryDialog();
  if (d.act === "toggleLarge") { S.largeText = !S.largeText; save(true, false); render(); }
  if (d.act === "toggleContrast") { S.highContrast = !S.highContrast; save(true, false); render(); }
  if (d.act === "lockBrowser") lockBrowserDialog();
  if (d.act === "installApp") installAppDialog();
  if (d.act === "loadDemo") loadDemo();
  if (d.act === "clearDemo") clearDemo();
  if (d.act === "dismissDemo") { S.dismissDemo = true; save(true, false); render(); }
  if (d.act === "quickStart") quickStartWizard();
  if (d.act === "addPhoto") addPhotoDialog();
  if (d.delphoto) {
    const pid = d.delphoto;
    confirmDlg("Remove this photo from the guide?", () => { S.photos = (S.photos || []).filter(p => p.id !== pid); save(true); render(); });
  }
  if (d.act === "hideEss") { S.hideEssentials = true; save(true, false); render(); }
  if (d.act === "showEss") { S.hideEssentials = false; save(true, false); render(); }
  if (d.act === "reviewed") { S.reviewed = new Date().toISOString(); save(true); toast("Marked as reviewed"); }
  if (d.act === "readiness") readinessDialog();
  if (d.act === "ics") downloadIcs();
  if (d.act === "printMoneyGuide") { $("#printSheet").innerHTML = renderMoneyGuideHtml(true); printWithClass("print-sheet-only"); }
  if (d.act === "printProFinder") { $("#printSheet").innerHTML = renderProFinderHtml(true); printWithClass("print-sheet-only"); }
  if (d.act === "printErSheet") { renderErGrabSheet(); printWithClass("print-sheet-only"); }
  if (d.act === "print") printDialog();
  if (d.act === "backup") backupDialog();
  if (d.act === "restore") restoreDialog();
  if (d.act === "project") projectDialog();
});

document.addEventListener("change", e => {
  if (e.target.id === "regionSel") {
    S.region = e.target.value;
    save(true, false);
    render();
    toast("Region: " + getRegion().label);
  }
});

function relist(id) {
  const rawDef = findBlockDef(id);
  const b = rawDef ? rList(rawDef) : null;
  const rowsEl = $("#rows-" + CSS.escape(id));
  if (rowsEl && b) rowsEl.innerHTML = listRows(id, b.cols, !S.readMode || b.crisisEditable);
  const card = rowsEl?.closest(".card");
  if (card) {
    const filled = (S.lists[id] || []).filter(r => rowHasFilledValue(id, r)).length;
    card.classList.toggle("is-empty", !filled);
    const badge = card.querySelector(".card-badge");
    if (badge) badge.textContent = filled ? `${filled} filled` : "";
    const qc = card.querySelector("#qchips-" + CSS.escape(id));
    if (qc && b) qc.outerHTML = qchipsHtml(id, b);
  }
}

/* ---------- dialogs ---------- */
function openDlg(html, wide = false) {
  $("#dlg").classList.toggle("wide", !!wide);
  $("#dlgForm").innerHTML = html;
  $("#dlg").showModal();
}
function readinessDialog() {
  const rank = { high: 0, med: 1, ok: 2 };
  const audit = computeAudit().sort((a, b) => rank[a.sev] - rank[b.sev]);
  const okCount = audit.filter(x => x.sev === "ok").length;
  const drillDone = FIRE_DRILL.filter(x => S.fireDrill[x.id]).length;
  const dryTxt = S.lastDryRun ? `Last completed ${new Date(S.lastDryRun).toLocaleDateString()}` : "Not completed yet";

  openDlg(`<h3>Readiness &amp; Family Fire Drill</h3>
    <p class="hint"><b>${okCount} of ${audit.length}</b> readiness checks passed. Fix the top gaps first so your spouse never hits a locked phone, frozen solo account, or missing beneficiary.</p>
    <div class="audit-list">${audit.map((a, idx) => `<div class="audit-item">
      <div class="audit-left"><span class="adot ${a.sev}"></span><div><b>${esc(a.title)}</b><small>${esc(a.detail)}</small></div></div>
      ${(a.sev !== "ok" && (a.tab || a.act)) ? `<button type="button" class="audit-fix" data-afix="${idx}">Fix →</button>` : ""}
    </div>`).join("")}</div>
    <h3 style="margin-top:14px">10-Minute Family Fire Drill</h3>
    <p class="hint">Sit down together once a year and test these 5 real-world checks.</p>
    <div class="drill-list">${FIRE_DRILL.map(f => `<label class="drill-item${S.fireDrill[f.id] ? " done" : ""}">
      <input type="checkbox" data-fd="${esc(f.id)}" ${S.fireDrill[f.id] ? "checked" : ""}>
      <div><b>${esc(f.t)}</b><small>${esc(f.d)}</small></div>
    </label>`).join("")}</div>
    <div class="drill-foot">
      <span>${drillDone} of ${FIRE_DRILL.length} checked · ${esc(dryTxt)}</span>
      <button type="button" class="btn" id="markDrill">Mark fire drill done</button>
    </div>
    <div class="btns"><button type="button" class="btn primary" id="closeReady">Done</button></div>`, true);

  $("#closeReady").onclick = () => $("#dlg").close();
  $("#dlgForm").querySelectorAll("[data-afix]").forEach(btn => {
    btn.onclick = () => {
      const a = audit[+btn.dataset.afix];
      $("#dlg").close();
      if (a.act === "backup") backupDialog();
      else if (a.tab) jumpTo(a.tab, a.block || "", a.field || "");
    };
  });
  $("#dlgForm").querySelectorAll("[data-fd]").forEach(cb => {
    cb.onchange = () => {
      S.fireDrill[cb.dataset.fd] = cb.checked;
      cb.closest(".drill-item").classList.toggle("done", cb.checked);
      save(true);
      const count = FIRE_DRILL.filter(x => S.fireDrill[x.id]).length;
      const footSpan = $("#dlgForm").querySelector(".drill-foot span");
      if (footSpan) footSpan.textContent = `${count} of ${FIRE_DRILL.length} checked · ${S.lastDryRun ? `Last completed ${new Date(S.lastDryRun).toLocaleDateString()}` : "Not completed yet"}`;
    };
  });
  $("#markDrill").onclick = () => {
    S.lastDryRun = new Date().toISOString();
    save(true);
    toast("Family fire drill recorded");
    readinessDialog();
  };
}
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
function download(name, data, type = "text/plain") {
  const blob = data instanceof Blob ? data : new Blob([data], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = name; a.click();
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
        try {
          const r = await fetch(f);
          if (!r.ok) throw 0;
          if (/\.png$/i.test(f)) download(f, await r.blob());
          else download(f, await r.text());
          ok++;
          await new Promise(z => setTimeout(z, 250));
        } catch {}
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
        <h3>Home Address (read this to ${esc(getRegion().emergency)})</h3>
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

function renderErGrabSheet() {
  const f = id => String(S.f[id] || "").trim();
  const rowsOf = id => (S.lists[id] || []).filter(r => rowHasFilledValue(id, r));
  const first = rowsOf("first");
  const famHealth = rowsOf("fam_health");
  const item = (lbl, val) => val ? `<p><b>${esc(lbl)}:</b> ${esc(val)}</p>` : "";

  $("#printSheet").innerHTML = `<div class="sheet">
    <h1>1-Page ER &amp; Medical Treatment Grab Sheet</h1>
    <p class="sheet-sub">Keep folded in wallet, bag, or on the fridge for sudden ER trips. Emergency #: <b>${esc(getRegion().emergency)}</b> · Updated ${new Date().toLocaleDateString()}</p>
    <div class="sheet-grid">
      <div class="sheet-box full er-alert">
        <h3>Red-Flag Rules &amp; 24/7 Specialist Triage</h3>
        <div class="sheet-giant">${esc(f("h_triage") || "Add 24/7 specialist triage line & preferred ER under Health")}</div>
        ${item("Red-flag rule", f("h_redflag") || "Check fever / blood pressure / breathing rule and call specialist triage BEFORE giving fever-reducers.")}
      </div>
      <div class="sheet-box">
        <h3>Diagnosis, Protocol &amp; Warnings</h3>
        ${item("Diagnosis / treatment", f("h_diag"))}
        ${item("Ports / implants / NO-arm limits", f("h_devices"))}
        ${item("Food / drug / visitor boundaries", f("h_comfort"))}
        ${item("Life support wishes", f("h_wishes"))}
        ${!f("h_diag") && !f("h_devices") && !f("h_comfort") ? `<p>Fill under Health → Chronic / critical illness &amp; ER care.</p>` : ""}
      </div>
      <div class="sheet-box">
        <h3>Medications, Rescue Kit &amp; Allergies</h3>
        ${item("Daily meds &amp; allergies", f("d_meds"))}
        ${item("Rescue / just-in-case meds", f("h_rescue"))}
        ${item("Pharmacy", f("h_pharm"))}
      </div>
      <div class="sheet-box">
        <h3>Proxy, Portal &amp; Insurance</h3>
        ${item("Medical POA / Advocate", f("d_mpoa"))}
        ${item("Healthcare directive", f("d_hcd"))}
        ${item("Patient portal proxy &amp; HIPAA", f("h_portal"))}
        ${item("Health insurance &amp; ID", f("d_ins"))}
      </div>
      <div class="sheet-box">
        <h3>Emergency Contacts &amp; Family Meds</h3>
        ${item("Call first", f("q_first"))}
        ${first.length ? `<ul>${first.map(r => `<li><b>${esc(r.name || r.rel || "Contact")}</b>: ${esc(r.phone || "")}</li>`).join("")}</ul>` : ""}
        ${famHealth.length ? `<ul>${famHealth.map(r => `<li><b>${esc(r.name || "Person")}</b>${r.allergy ? ` · Allergy: ${esc(r.allergy)}` : ""}${r.meds ? ` · Meds: ${esc(r.meds)}` : ""}</li>`).join("")}</ul>` : ""}
      </div>
    </div>
    <p class="sheet-foot">Full medication doses, EOB logs, and directives live in Our Family Field Guide (${esc(f("q_binder") || "see Home Safe / Guide")}).</p>
  </div>`;
}

function renderExecutiveSummaryHtml(forPrint = false) {
  const f = id => String(S.f[id] || "").trim();
  const rowsOf = id => (S.lists[id] || []).filter(r => rowHasFilledValue(id, r));
  const val = txt => forPrint ? esc(txt) : linkify(txt);
  const jmpBtn = (tab, block) => forPrint ? "" : `<button type="button" data-ej="${esc(tab)}::${esc(block)}">Details →</button>`;

  const first = rowsOf("first");
  const pros = rowsOf("pros");
  const accts = rowsOf("accounts");
  const invest = rowsOf("invest");
  const crypto = rowsOf("crypto");
  const ins = rowsOf("insurance");
  const bills = rowsOf("bills");
  const debts = rowsOf("debts");
  const prop = rowsOf("property");
  const docs = rowsOf("doclocs");
  const govIds = rowsOf("gov_ids");
  const kidsInfo = rowsOf("kids_info");
  const pets = rowsOf("pets");
  const hasIllness = Boolean(f("h_diag") || f("h_triage") || f("h_redflag") || f("h_devices") || f("h_rescue"));

  const line = (label, v) => v ? `<p><b>${esc(label)}:</b> ${val(v)}</p>` : "";
  const shutoffs = [["Water", f("hk_water")], ["Gas", f("hk_gas")], ["Breaker", f("hk_breaker")], ["Spare keys", f("hk_spare")]].filter(([, v]) => v);

  return `<div class="${forPrint ? "sheet" : ""}">
    ${forPrint ? `<h1>Our Family Field Guide — 1-Page Summary</h1><p class="sheet-sub">${esc(getRegion().label)} · Updated ${new Date().toLocaleDateString()} · Search or open the digital guide for full notes, scripts &amp; photos.</p>` : ""}
    <div class="exec-grid">
      <div class="exec-box">
        <div class="exec-h"><h4>1. Call First &amp; Key Pros</h4>${jmpBtn("contacts", "first")}</div>
        ${line("Call first", f("q_first"))}
        ${first.length ? `<ul>${first.map(r => `<li><b>${esc(r.name || r.rel || "Contact")}</b>${r.rel ? ` (${esc(r.rel)})` : ""}: ${val(r.phone || "")}</li>`).join("")}</ul>` : ""}
        ${pros.length ? `<ul>${pros.slice(0, 6).map(r => `<li><b>${esc(r.role || "Pro")}:</b> ${esc(r.name || "")} ${val(r.phone || r.email || "")}</li>`).join("")}</ul>` : ""}
        ${!f("q_first") && !first.length && !pros.length ? `<p style="color:var(--mute)">No contacts filled yet.</p>` : ""}
      </div>

      <div class="exec-box">
        <div class="exec-h"><h4>2. Money, Accounts &amp; Payout Plan</h4>${jmpBtn("money", "accounts")}</div>
        ${line("Monthly spend", f("m_monthly"))}
        ${line("Runway / cash", [f("q_runway") || f("m_runway"), f("m_cash")].filter(Boolean).join(" · "))}
        ${line("Payout first step", f("m_payout_first"))}
        ${accts.length ? `<ul>${accts.map(r => `<li><b>${esc(r.inst || r.type || "Account")}</b> (${esc(r.type || "")}${r.own ? `, ${esc(r.own)}` : ""}${r.last4 ? ` · *${esc(r.last4)}` : ""})</li>`).join("")}</ul>` : ""}
        ${crypto.length ? `<p style="margin-top:4px"><b>Crypto / Digital:</b> ${crypto.map(r => `${esc(r.platform || "Wallet")}${r.access ? ` (${esc(r.access)})` : ""}`).join(" · ")}</p>` : ""}
        ${debts.length ? `<p style="margin-top:4px"><b>Loans / Debts:</b> ${debts.map(r => `${esc(r.type || r.name)}${r.bal ? ` (${esc(r.bal)})` : ""}`).join(" · ")}</p>` : ""}
        ${bills.length ? `<p><b>Key Bills:</b> ${bills.slice(0, 6).map(r => `${esc(r.name)}${r.amt ? ` ${esc(r.amt)}` : ""}`).join(" · ")}</p>` : ""}
      </div>

      <div class="exec-box full">
        <div class="exec-h"><h4>3. Insurance &amp; Retirement Coverage</h4>${jmpBtn("money", "insurance")}</div>
        ${line("Total life cover", f("q_life"))}
        ${ins.length ? `<ul>${ins.map(r => `<li><b>${esc(r.type || "Policy")}:</b> ${[r.co, r.amt, r.benef ? `Benef: ${r.benef}` : "", r.pol ? `*${r.pol}` : "", r.phone].filter(Boolean).map(x => val(x)).join(" · ")}</li>`).join("")}</ul>` : `<p style="color:var(--mute)">No insurance policies filled yet.</p>`}
        ${invest.length ? `<p style="margin-top:4px"><b>Retirement / Investments:</b> ${invest.map(r => `${esc(r.inst || "")} ${esc(r.type || "")}${r.benef ? ` (Benef: ${esc(r.benef)})` : ""}`).join(" · ")}</p>` : ""}
      </div>

      <div class="exec-box">
        <div class="exec-h"><h4>4. Papers, IDs, Phone &amp; Property</h4>${jmpBtn("docs", "Legal papers")}</div>
        ${line("Papers location", f("q_binder"))}
        ${line("Will / trust", f("d_will"))}
        ${line("Directive / POA", [f("d_hcd"), f("d_fpoa")].filter(Boolean).join(" · "))}
        ${line("Phone / Vault", [f("d_phone"), f("d_pm")].filter(Boolean).join(" · "))}
        ${govIds.length ? `<p><b>Key IDs:</b> ${govIds.slice(0, 5).map(r => `${esc(r.idtype || "ID")}${r.last4 ? ` *${esc(r.last4)}` : ""}${r.where ? ` (${esc(r.where)})` : ""}`).join(" · ")}</p>` : ""}
        ${prop.length ? `<p><b>Property / Titles:</b> ${prop.map(r => `${esc(r.what)}${r.where ? ` (${esc(r.where)})` : ""}`).join(" · ")}</p>` : ""}
        ${docs.length ? `<p><b>Docs:</b> ${docs.slice(0, 5).map(r => `${esc(r.doc)} → ${esc(r.where)}`).join(" · ")}</p>` : ""}
      </div>

      <div class="exec-box">
        <div class="exec-h"><h4>5. Home, Kids &amp; Pets</h4>${jmpBtn("kids", "")}</div>
        ${line("Address", f("k_home"))}
        ${line("Safe word", f("k_safe"))}
        ${kidsInfo.length ? `<ul>${kidsInfo.map(r => `<li><b>${esc(r.child || "Child")}:</b> ${[r.school, r.pickup].filter(Boolean).map(esc).join(" · ")}</li>`).join("")}</ul>` : ""}
        ${pets.length ? `<ul>${pets.map(r => `<li><b>${esc(r.name || "Pet")}:</b> ${[r.food, r.vet].filter(Boolean).map(esc).join(" · ")}</li>`).join("")}</ul>` : ""}
        ${shutoffs.length ? `<p><b>Shut-offs:</b> ${shutoffs.map(([k, v]) => `${esc(k)}: ${esc(v)}`).join(" · ")}</p>` : ""}
      </div>

      ${hasIllness ? `<div class="exec-box full er-alert">
        <div class="exec-h"><h4>6. Active Illness / ER Alert</h4>${jmpBtn("health", "Chronic / critical illness & ER care")}</div>
        ${line("Diagnosis / protocol", f("h_diag"))}
        ${line("24/7 triage & preferred ER", f("h_triage"))}
        ${line("Red-flag rule", f("h_redflag"))}
        ${line("Ports / arm limits / rescue meds", [f("h_devices"), f("h_rescue")].filter(Boolean).join(" · "))}
      </div>` : ""}
    </div>
  </div>`;
}

function summaryDialog() {
  openDlg(`<h3>1-Page Family Executive Summary</h3>
    <p class="hint">Everything critical on one screen. Click <b>Details →</b> on any box to open that section, or search for anything.</p>
    ${renderExecutiveSummaryHtml(false)}
    <div class="btns">
      <button type="button" class="btn" id="sumSearch">Search full guide</button>
      <button type="button" class="btn" id="sumPrint">Print 1-page summary</button>
      <button type="button" class="btn primary" id="cancelDlg">Close</button>
    </div>`, true);
  $("#cancelDlg").onclick = () => $("#dlg").close();
  $("#sumSearch").onclick = () => { $("#dlg").close(); $("#searchIn").focus(); };
  $("#sumPrint").onclick = () => {
    $("#dlg").close();
    $("#printSheet").innerHTML = renderExecutiveSummaryHtml(true);
    printWithClass("print-sheet-only");
  };
  $("#dlgForm").querySelectorAll("[data-ej]").forEach(btn => {
    btn.onclick = () => {
      const [tab, blk] = btn.dataset.ej.split("::");
      $("#dlg").close();
      jumpTo(tab, blk);
    };
  });
}

function printDialog() {
  openDlg(`<h3>Print options</h3>
    <div class="opt-list">
      <label class="opt-card"><input type="radio" name="pmode" value="summary" checked><div><b>1-page Family Executive Summary</b><small>High-signal overview of contacts, money, insurance, IDs, papers, titles, kids &amp; shut-offs.</small></div></label>
      <label class="opt-card"><input type="radio" name="pmode" value="er"><div><b>1-page ER &amp; Medical Grab Sheet</b><small>Diagnosis, red-flag fever/ER rule, 24/7 specialist triage, ports/arm limits, rescue meds &amp; portal proxy.</small></div></label>
      <label class="opt-card"><input type="radio" name="pmode" value="moneyguide"><div><b>Survivor's Money &amp; Payout Guide</b><small>Your payout instructions plus the 6-part plain-English guide for handling large insurance payouts.</small></div></label>
      <label class="opt-card"><input type="radio" name="pmode" value="profinder"><div><b>How to Find Vetted &amp; Low-Cost Help</b><small>Directories &amp; free resources for finding estate, immigration, tax, and fee-only financial help.</small></div></label>
      <label class="opt-card"><input type="radio" name="pmode" value="filled"><div><b>Full guide — filled details only</b><small>Omits empty fields and blank rows so your binder stays clean.</small></div></label>
      <label class="opt-card"><input type="radio" name="pmode" value="all"><div><b>Full guide — include blanks</b><small>Great if you want space to fill things in by hand.</small></div></label>
      <label class="opt-card"><input type="radio" name="pmode" value="caregiver"><div><b>1-page Caregiver / Fridge Sheet</b><small>Home address for ${esc(getRegion().emergency)}, first contacts, kids' pickup/allergies, pets, and shut-offs.</small></div></label>
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
    if (mode === "summary") { $("#printSheet").innerHTML = renderExecutiveSummaryHtml(true); printWithClass("print-sheet-only"); }
    else if (mode === "er") { renderErGrabSheet(); printWithClass("print-sheet-only"); }
    else if (mode === "moneyguide") { $("#printSheet").innerHTML = renderMoneyGuideHtml(true); printWithClass("print-sheet-only"); }
    else if (mode === "profinder") { $("#printSheet").innerHTML = renderProFinderHtml(true); printWithClass("print-sheet-only"); }
    else if (mode === "filled") printWithClass("print-hide-empty");
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

/* ---------- Diceware passphrase & GF(256) Shamir 2-of-3 split ---------- */
function randomIndex(max) {
  if (!window.crypto?.getRandomValues) throw new Error("Secure random generator (crypto.getRandomValues) is unavailable");
  const buf = new Uint32Array(1);
  const limit = Math.floor(0x100000000 / max) * max;
  let r;
  do {
    crypto.getRandomValues(buf);
    r = buf[0];
  } while (r >= limit);
  return r % max;
}
function generatePassphrase(wordCount = 6) {
  const words = (typeof DICE_WORDS !== "undefined" && DICE_WORDS.length) ? DICE_WORDS : ["maple", "river", "lantern", "cedar", "orbit"];
  const picks = [];
  for (let i = 0; i < wordCount; i++) picks.push(words[randomIndex(words.length)]);
  return picks.join("-");
}
function gfMul(a, b) {
  let p = 0;
  for (let i = 0; i < 8; i++) {
    if (b & 1) p ^= a;
    const hi = a & 0x80;
    a = (a << 1) & 0xff;
    if (hi) a ^= 0x1b;
    b >>= 1;
  }
  return p;
}
function gfPow(a, e) {
  let res = 1, base = a;
  while (e > 0) {
    if (e & 1) res = gfMul(res, base);
    base = gfMul(base, base);
    e >>= 1;
  }
  return res;
}
const gfDiv = (a, b) => {
  if (!b) throw new Error("Division by zero in GF(256)");
  return a ? gfMul(a, gfPow(b, 254)) : 0;
};
function sssSplit2of3(secretStr) {
  const bytes = enc.encode(secretStr);
  if (!bytes.length) throw new Error("Empty secret");
  if (!window.crypto?.getRandomValues) throw new Error("Secure random generator (crypto.getRandomValues) is unavailable");
  const rand = new Uint8Array(bytes.length);
  crypto.getRandomValues(rand);
  return [1, 2, 3].map(x => {
    let hex = "";
    for (let i = 0; i < bytes.length; i++) {
      const y = bytes[i] ^ gfMul(rand[i], x);
      hex += y.toString(16).padStart(2, "0").toUpperCase();
    }
    return `FFG-${x}-${hex.replace(/(.{4})/g, "$1-").replace(/-$/, "")}`;
  });
}
function parseSssShare(str) {
  const m = String(str || "").trim().toUpperCase().match(/^FFG-([123])-(.+)$/);
  if (!m) throw new Error("Invalid recovery card format (expected FFG-1-...)");
  const hex = m[2].replace(/[^0-9A-F]/g, "");
  if (!hex.length || hex.length % 2 !== 0) throw new Error("Invalid recovery card hex");
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return { x: Number(m[1]), bytes };
}
function sssCombine2of3(shareA, shareB) {
  const a = parseSssShare(shareA), b = parseSssShare(shareB);
  if (a.x === b.x) throw new Error("Use two different cards (e.g. Card 1 and Card 2)");
  if (a.bytes.length !== b.bytes.length) throw new Error("Recovery cards don't match");
  const out = new Uint8Array(a.bytes.length);
  const dx = a.x ^ b.x;
  const l1 = gfDiv(b.x, dx), l2 = gfDiv(a.x, dx);
  for (let i = 0; i < out.length; i++) {
    out[i] = gfMul(a.bytes[i], l1) ^ gfMul(b.bytes[i], l2);
  }
  return dec.decode(out);
}
function renderRecoveryCards(shares) {
  const holders = ["Card 1 of 3 — Spouse / Partner", "Card 2 of 3 — Home Fireproof Safe", "Card 3 of 3 — Trusted Sibling or Attorney"];
  $("#printSheet").innerHTML = `<div class="sheet">
    <h1>2-of-3 Recovery Cards — Our Family Field Guide</h1>
    <p class="sheet-sub">Cut apart and store in 3 separate places. Any <b>2 cards together</b> unlock your backup; 1 card alone reveals nothing. Created ${new Date().toLocaleDateString()}.</p>
    <div class="sss-cards">${shares.map((sh, i) => `<div class="sss-card">
      <h3>${holders[i]}</h3>
      <p style="font-size:12.5px;margin:2px 0">Pair this card with any other card to unlock <code>family-field-guide-*.html</code>.</p>
      <code>${esc(sh)}</code>
    </div>`).join("")}</div>
  </div>`;
}

/* ---------- Photo snippets (compressed locally & encrypted with S) ---------- */
let pendingPhotoLabel = "";
function addPhotoDialog() {
  if ((S.photos || []).length >= 10) return toast("Maximum 10 photos per guide");
  const chips = ["Water shut-off", "Gas shut-off", "Breaker panel", "Health insurance card", "Safe / keys"];
  openDlg(`<h3>Add reference photo</h3>
    <p class="hint">Compressed locally in your browser (~80–120 KB) and encrypted inside your backups.</p>
    <label class="f"><span>Label</span><input id="phLbl" placeholder="e.g. Water shut-off valve"></label>
    <div class="photo-chips">${chips.map(c => `<button type="button" class="pchip" data-pc="${esc(c)}">${esc(c)}</button>`).join("")}</div>
    ${btns("Choose image")}`);
  $("#dlgForm").querySelectorAll("[data-pc]").forEach(b => { b.onclick = () => { $("#phLbl").value = b.dataset.pc; }; });
  onGo(() => {
    const lbl = $("#phLbl").value.trim();
    if (!lbl) return toast("Give the photo a label");
    pendingPhotoLabel = lbl;
    $("#dlg").close();
    $("#photoIn").click();
  });
}
function compressPhoto(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const max = 1000;
        let w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
        if (w > max || h > max) {
          if (w >= h) { h = Math.round(h * max / w); w = max; }
          else { w = Math.round(w * max / h); h = max; }
        }
        const cv = document.createElement("canvas");
        cv.width = w; cv.height = h;
        cv.getContext("2d").drawImage(img, 0, 0, w, h);
        const dataUrl = cv.toDataURL("image/jpeg", 0.72);
        URL.revokeObjectURL(url);
        resolve(dataUrl);
      } catch (err) { URL.revokeObjectURL(url); reject(err); }
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not read image")); };
    img.src = url;
  });
}
$("#photoIn").onchange = async e => {
  const file = e.target.files[0]; e.target.value = "";
  if (!file) return;
  try {
    const dataUrl = await compressPhoto(file);
    S.photos ??= [];
    S.photos.push({ id: uid("ph"), label: pendingPhotoLabel || "Reference photo", dataUrl });
    save(true); render(); toast("Photo added");
  } catch { toast("Could not process image"); }
};

function buildStandaloneHtml(pkg) {
  const schemaData = { TABS, PLAYBOOK, SCRIPTS, GLANCE, KIDS, MONEY_GUIDE: typeof MONEY_GUIDE !== "undefined" ? MONEY_GUIDE : [], PRO_FINDER: typeof PRO_FINDER !== "undefined" ? PRO_FINDER : [], REGIONS: typeof REGIONS !== "undefined" ? REGIONS : {} };
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Our Family Field Guide (Locked Copy)</title>
<style>
:root{--paper:#f6f1e6;--paper2:#efe7d6;--card:#fffdf8;--ink:#1f3a2e;--ink2:#4b5f55;--mute:#8a8f84;--rule:#d9cfb9;--tomato:#d2512f;--sun:#e9b44c;--sky:#4f7c8a;--serif:Georgia,Palatino,serif;--sans:system-ui,-apple-system,sans-serif;--mono:ui-monospace,Menlo,monospace}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:15px/1.5 var(--sans);padding:24px 16px 64px}
body.large-text{font-size:18px;line-height:1.55}body.large-text .val,body.large-text input{font-size:17px}
body.high-contrast{--paper:#ffffff;--paper2:#f0f0f0;--card:#ffffff;--ink:#0b1410;--ink2:#1c2822;--mute:#3a4440;--rule:#333333;--tomato:#b32d0f;--sun:#c97b00;--sky:#0b4f6c}
body.high-contrast .card{border-width:2px;box-shadow:none}
.wrap{max-width:980px;margin:0 auto}.lock{max-width:480px;margin:6vh auto;background:var(--card);border:2px solid var(--ink);border-radius:8px;padding:24px;box-shadow:6px 6px 0 var(--ink)}
h1,h2,h3{font-family:var(--serif);margin-top:0}h1 em{color:var(--tomato)}
input[type=password],.cardin{width:100%;font:15px var(--sans);padding:9px 10px;border:1.5px solid var(--ink);border-radius:4px;margin:6px 0 10px}
.btn{font:600 12.5px var(--sans);padding:7px 13px;border-radius:999px;border:1.5px solid var(--ink);background:var(--card);color:var(--ink);cursor:pointer}
.btn.primary{background:var(--ink);color:var(--paper)}.btn.on{background:var(--sky);border-color:var(--sky);color:#fff}
.linkbtn{background:none;border:none;color:var(--sky);font:600 13px var(--sans);text-decoration:underline;cursor:pointer;padding:0;margin-top:8px}
.err{color:var(--tomato);font-size:13px;min-height:18px;margin:4px 0}.status{font-size:12.5px;color:var(--sky);font-weight:600}
.bar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;border-bottom:2px solid var(--ink);padding-bottom:14px;margin-bottom:14px}
.sbox{position:relative;margin-bottom:14px}.sbox input{width:100%;background:var(--card);border:1.5px solid var(--rule);border-radius:999px;padding:8px 15px;font:14px var(--sans);color:var(--ink)}
.sres{position:absolute;left:0;right:0;top:calc(100% + 4px);background:var(--card);border:1.5px solid var(--ink);border-radius:6px;box-shadow:5px 5px 0 var(--paper2);z-index:15;max-height:280px;overflow-y:auto}
.sri{display:flex;gap:10px;width:100%;text-align:left;background:none;border:none;border-bottom:1px solid var(--rule);padding:8px 12px;cursor:pointer;font:13.5px var(--sans);color:var(--ink)}
.sri:hover,.sri.active{background:var(--paper2)}.sri.active{box-shadow:inset 3px 0 0 var(--tomato)}
.srt{font-family:var(--mono);font-size:11px;text-transform:uppercase;color:var(--sky);min-width:90px;flex-shrink:0}
.tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:18px}.tabs button{font:600 13px var(--sans);border:1.5px solid var(--ink);background:transparent;color:var(--ink);padding:6px 13px;border-radius:999px;cursor:pointer}
.tabs button.on{background:var(--ink);color:var(--paper)}.panel{display:none}.panel.on{display:block}
.card{background:var(--card);border:1px solid var(--rule);border-radius:4px;padding:16px 18px;margin-bottom:14px;box-shadow:3px 3px 0 var(--paper2)}
@keyframes flash{0%{box-shadow:0 0 0 3px var(--tomato)}100%{box-shadow:3px 3px 0 var(--paper2)}}.flash{animation:flash 1.6s ease}
.grid2{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px 18px}.lbl{font-family:var(--mono);font-size:10.5px;text-transform:uppercase;color:var(--ink2);display:block}
.val{padding:4px 0;border-bottom:1px dashed var(--rule);white-space:pre-wrap;word-break:break-word}.val a{color:var(--sky);font-weight:600}
.glance{background:var(--ink);color:var(--paper);border-radius:6px;padding:16px 18px;margin-bottom:16px;box-shadow:5px 5px 0 var(--tomato)}.glance .lbl{color:#c9d3cc}.glance .val{border-color:#4a6458}.glance .val a{color:var(--sun)}
.row{border:1px dashed var(--rule);border-radius:4px;padding:10px 12px;margin-bottom:8px;background:#fffef9;position:relative}
.row input{width:100%;font:14px var(--sans);color:var(--ink);background:transparent;border:none;border-bottom:1.5px solid var(--rule);padding:4px 2px;outline:none}
.row input:focus{border-color:var(--tomato)}.rx{position:absolute;top:5px;right:7px;border:none;background:none;color:var(--mute);cursor:pointer;font-size:15px}
.track{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}
.track button{font:600 13px var(--sans);padding:8px 12px;border:2px solid var(--ink);background:var(--card);border-radius:4px;cursor:pointer}.track button.on{background:var(--tomato);border-color:var(--tomato);color:#fff}
.step{display:flex;gap:10px;padding:9px 0;border-bottom:1px solid var(--rule)}.step.done .st{text-decoration:line-through;color:var(--mute)}
.rlink{font-family:var(--mono);font-size:12px;color:var(--sky);background:none;border:none;padding:3px 0 0;cursor:pointer;text-align:left;display:block}
.rlink:hover{text-decoration:underline}
.script{border-left:3px solid var(--sun);padding:6px 12px;background:#fffaf0;margin-bottom:8px}
.mg-banner{background:#fbf3df;border-left:4px solid var(--sun);padding:9px 12px;font-size:13px;margin-bottom:10px;border-radius:4px}.mg-banner p{margin:3px 0}
.mg-ex{border:1.5px solid var(--ink);padding:9px 12px;background:#fffaf0;margin-bottom:10px;border-radius:4px}.mg-ex h4{margin:0 0 5px;font-family:var(--serif)}
.mg-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:10px}.mg-sec{border:1px solid var(--rule);padding:10px 12px;background:var(--paper);border-radius:4px;break-inside:avoid}
.mg-sec h4{margin:0 0 4px;font-family:var(--serif);font-size:15.5px}.mg-sec p,.mg-sec li,.mg-ex li{font-size:13px;line-height:1.45}.mg-note{margin-top:6px;padding:7px 9px;border-left:3px solid var(--sky);background:#e7f0f2;font-size:12.5px}
.er-alert{border:2px solid var(--tomato)!important;background:#fff5f2!important}
.pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px}.pcard{border:1px solid var(--rule);padding:7px;border-radius:4px;background:var(--paper)}
.pcard img{width:100%;height:120px;object-fit:cover;border-radius:3px;cursor:zoom-in}
#sheetOnly{display:none;max-width:780px;margin:0 auto}.sgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.sboxc{border:1px solid #bbb;border-radius:4px;padding:10px 12px}.sboxc.full{grid-column:1/-1}.sboxc h3{margin:0 0 6px;font-size:16px;border-bottom:1px solid #ddd;padding-bottom:3px}
@media (max-width:720px){body{padding:14px 12px 48px}.bar{gap:6px;padding-bottom:10px;margin-bottom:10px}.bar h1{font-size:24px;margin-bottom:2px}.bar .acts{width:100%;flex-wrap:nowrap;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding-bottom:2px}.bar .acts::-webkit-scrollbar,.tabs::-webkit-scrollbar{display:none}.bar .acts .btn,.tabs button{flex:0 0 auto;white-space:nowrap;padding:5px 11px;font-size:12px}.tabs{flex-wrap:nowrap;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;margin:0 -12px 12px;padding:6px 12px;position:sticky;top:0;background:var(--paper);z-index:5;border-bottom:1px dashed var(--rule)}.sgrid{grid-template-columns:minmax(0,1fr)}}
@media print{.tabs,.bar .acts,.track,.sbox,.rx,.addbtn{display:none!important}.panel{display:block!important;break-before:page}.panel:first-of-type{break-before:auto}
body.sheet-mode #app{display:none!important}body.sheet-mode #sheetOnly{display:block!important}}
</style>
</head>
<body>
<div id="gate" class="lock">
  <h1>Our Family <em>Field Guide</em></h1>
  <p style="color:var(--ink2);font-size:14px">This standalone offline copy is locked with a passphrase. Nothing is sent anywhere.</p>
  <form id="uform">
    <div id="pwMode">
      <label class="lbl">Passphrase</label>
      <input type="password" id="upw" autofocus>
    </div>
    <div id="sssMode" hidden>
      <label class="lbl">Recovery Card A (FFG-1-…)</label>
      <input class="cardin" id="sc1" placeholder="FFG-1-...">
      <label class="lbl">Recovery Card B (FFG-2-… or FFG-3-…)</label>
      <input class="cardin" id="sc2" placeholder="FFG-2-...">
    </div>
    <div class="err" id="uerr"></div>
    <button class="btn primary" type="submit">Unlock guide</button>
    <div><button type="button" class="linkbtn" id="togSss">Unlock with 2 recovery cards instead</button></div>
  </form>
</div>
<div id="app" class="wrap" hidden></div>
<div id="sheetOnly"></div>
<script id="ffg-pkg" type="application/json">${safeJson(pkg)}<\/script>
<script id="ffg-schema" type="application/json">${safeJson(schemaData)}<\/script>
<script>
const TEMPLATE_HTML = "<!DOCTYPE html>\\n" + document.documentElement.outerHTML;
let pkg = JSON.parse(document.getElementById("ffg-pkg").textContent);
const SC = JSON.parse(document.getElementById("ffg-schema").textContent);
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const safeImgUrl = u => /^data:image\\/(?:jpeg|jpg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(String(u || "").trim()) ? String(u).trim() : "";
const safeJson = v => JSON.stringify(v).replace(/<\\/script/gi, "<\\\\/script");
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
function b64(buf) {
  const bytes = new Uint8Array(buf); let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
function gfMul(a,b){let p=0;for(let i=0;i<8;i++){if(b&1)p^=a;const h=a&0x80;a=(a<<1)&0xff;if(h)a^=0x1b;b>>=1;}return p;}
function gfPow(a,e){let r=1,b=a;while(e>0){if(e&1)r=gfMul(r,b);b=gfMul(b,b);e>>=1;}return r;}
const gfDiv = (a,b) => a ? gfMul(a, gfPow(b, 254)) : 0;
function parseShare(s){const m=String(s||"").trim().toUpperCase().match(/^FFG-([123])-(.+)$/);if(!m)throw 0;const h=m[2].replace(/[^0-9A-F]/g,"");if(!h.length||h.length%2)throw 0;const b=new Uint8Array(h.length/2);for(let i=0;i<b.length;i++)b[i]=parseInt(h.slice(i*2,i*2+2),16);return{x:+m[1],bytes:b};}
function combine2of3(sa,sb){const a=parseShare(sa),b=parseShare(sb);if(a.x===b.x||a.bytes.length!==b.bytes.length)throw 0;const out=new Uint8Array(a.bytes.length),dx=a.x^b.x,l1=gfDiv(b.x,dx),l2=gfDiv(a.x,dx);for(let i=0;i<out.length;i++)out[i]=gfMul(a.bytes[i],l1)^gfMul(b.bytes[i],l2);return new TextDecoder().decode(out);}
const linkify = v => esc(v).replace(/(https?:\\/\\/[^\\s<>"]+)|([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})|(\\+?\\d[\\d\\s().-]{6,}\\d)/g, (m,u,e,p) => {
  if (u) { let c = u, tr = ""; const tm = c.match(/[.,;:!?)]+$/); if (tm) { c = c.slice(0,-tm[0].length); tr = tm[0]; } return '<a href="'+c+'" target="_blank" rel="noopener noreferrer">'+c+'</a>'+tr; }
  if (e) return '<a href="mailto:'+e+'">'+e+'</a>';
  if (p) { const d = p.replace(/[^\\d+]/g,""); return d.replace(/\\D/g,"").length >= 7 ? '<a href="tel:'+d+'">'+p+'</a>' : m; }
  return m;
});
function isRowFilled(id, r) {
  if (!r) return false;
  const ne = Object.entries(r).filter(([,v]) => String(v ?? "").trim() !== "");
  if (!ne.length) return false;
  const blk = SC.TABS.flatMap(t => t.blocks).find(b => b.id === id);
  if (blk && blk.seed && blk.seed.length) {
    const isSeed = blk.seed.some(sr => {
      const se = Object.entries(sr).filter(([,v]) => String(v ?? "").trim() !== "");
      return se.length === ne.length && se.every(([k,v]) => String(r[k]??"").trim() === String(v??"").trim());
    });
    if (isSeed) return false;
  }
  if (blk && blk.suggestions && ne.length === 1) {
    const scol = blk.suggestCol || blk.cols?.[0]?.[0];
    if (ne[0][0] === scol && blk.suggestions.some(s => s.toLowerCase() === String(ne[0][1]).trim().toLowerCase())) return false;
  }
  return true;
}
let unlockedPass = "", useSss = false;
document.getElementById("togSss").onclick = () => {
  useSss = !useSss;
  document.getElementById("pwMode").hidden = useSss;
  document.getElementById("sssMode").hidden = !useSss;
  document.getElementById("togSss").textContent = useSss ? "Use passphrase instead" : "Unlock with 2 recovery cards instead";
};
document.getElementById("uform").onsubmit = async ev => {
  ev.preventDefault();
  const err = document.getElementById("uerr"); err.textContent = "";
  let pass = "";
  try {
    pass = useSss ? combine2of3(document.getElementById("sc1").value, document.getElementById("sc2").value) : document.getElementById("upw").value;
    if (!pass) throw 0;
  } catch { err.textContent = "Check that both recovery cards are valid and different."; return; }
  try {
    const enc = new TextEncoder(), dec = new TextDecoder();
    const base = await crypto.subtle.importKey("raw", enc.encode(pass), "PBKDF2", false, ["deriveKey"]);
    const key = await crypto.subtle.deriveKey({ name:"PBKDF2", salt:unb64(pkg.salt), iterations:250000, hash:"SHA-256" }, base, { name:"AES-GCM", length:256 }, false, ["decrypt"]);
    const pt = await crypto.subtle.decrypt({ name:"AES-GCM", iv:unb64(pkg.iv) }, key, unb64(pkg.data));
    const S = JSON.parse(dec.decode(pt));
    unlockedPass = pass;
    document.getElementById("upw").value = "";
    document.getElementById("gate").hidden = true;
    const app = document.getElementById("app"); app.hidden = false;
    renderAll(app, S);
  } catch { err.textContent = "Wrong passphrase/cards or unsupported browser context."; }
};
function renderAll(root, S) {
  S.f = S.f || {}; S.lists = S.lists || {}; S.checks = S.checks || {}; S.extra = S.extra || {}; S.customTabs = S.customTabs || []; S.photos = S.photos || [];
  if (!S.lists.call_log) S.lists.call_log = [{}];
  const reg = (SC.REGIONS && SC.REGIONS[S.region]) || { emergency:"911", label:"United States", fieldOverrides:{}, stepOverrides:{}, moneyGuide:{} };
  const rf = f => { const ov = reg.fieldOverrides?.[f[0]]; return ov ? [f[0], ov.label ?? f[1], ov.ph ?? f[2], f[3]] : f; };
  const rs = s => { const ov = reg.stepOverrides?.[s.id]; return ov ? { ...s, t: ov.t ?? s.t, d: ov.d ?? s.d } : s; };
  let activeTab = "start", activeTrack = S.track && SC.PLAYBOOK[S.track] ? S.track : "hurt", dirty = false, statusMsg = "";
  const tabs = [...SC.TABS, ...S.customTabs.map(c => ({ ...c, blocks: [] }))];
  const fv = (label, id) => String(S.f[id] || "").trim() ? '<div><span class="lbl">'+esc(label)+'</span><div class="val">'+linkify(S.f[id])+'</div></div>' : "";
  const listHtml = (title, id, cols) => {
    const rows = (S.lists[id] || []).filter(r => isRowFilled(id, r));
    if (!rows.length) return "";
    return '<div class="card" data-bid="'+esc(id)+'" data-btitle="'+esc(title)+'"><h3>'+esc(title)+'</h3>'+rows.map(r => '<div class="row"><div class="grid2">'+cols.map(([k,l]) => String(r[k]||"").trim() ? '<div><span class="lbl">'+esc(l)+'</span><div class="val">'+linkify(r[k])+'</div></div>' : "").join("")+'</div></div>').join("")+'</div>';
  };
  const moneyGuideHtml = (b) => {
    const mg = reg.moneyGuide || {}, gs = SC.MONEY_GUIDE || [];
    if (!gs.length) return "";
    return '<div class="card" data-bid="'+esc(b.id)+'" data-btitle="'+esc(b.title)+'"><h3>'+esc(b.title)+'</h3>'
      + '<div class="mg-banner">'+(mg.depositCap?'<p><b>Deposit cap ('+esc(reg.label||"")+'):</b> '+esc(mg.depositCap)+'</p>':"")+(mg.fiduciaryName?'<p><b>Who to hire:</b> '+esc(mg.fiduciaryName)+'</p>':"")+(mg.taxNote?'<p><b>Tax note:</b> '+esc(mg.taxNote)+'</p>':"")+'</div>'
      + (mg.sampleLines?.length?'<div class="mg-ex"><h4>'+esc(mg.sampleTitle||"Sample Allocation")+'</h4><ul>'+mg.sampleLines.map(l=>'<li>'+esc(l)+'</li>').join("")+'</ul></div>':"")
      + '<div class="mg-grid">'+gs.map(g=>'<div class="mg-sec"><h4>'+esc(g.title)+'</h4><p>'+esc(g.summary)+'</p><ul>'+(g.bullets||[]).map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul>'+(g.note?'<div class="mg-note">'+esc(g.note)+'</div>':"")+'</div>').join("")+'</div></div>';
  };
  const proFinderHtml = (b) => {
    const pf = reg.proFinder || {}, cs = SC.PRO_FINDER || [];
    if (!cs.length) return "";
    return '<div class="card" data-bid="'+esc(b.id)+'" data-btitle="'+esc(b.title)+'"><h3>'+esc(b.title)+'</h3>'
      + '<div class="mg-banner"><p><b>Quick directories ('+esc(reg.label||"")+'):</b></p>'+(pf.legal?'<p><b>Legal / Estate:</b> '+esc(pf.legal)+'</p>':"")+(pf.visa?'<p><b>Immigration / Visa:</b> '+esc(pf.visa)+'</p>':"")+(pf.money?'<p><b>Financial Advisor:</b> '+esc(pf.money)+'</p>':"")+(pf.tax?'<p><b>Taxes &amp; Free Aid:</b> '+esc(pf.tax)+'</p>':"")+'</div>'
      + '<div class="mg-grid">'+cs.map(c=>'<div class="mg-sec"><h4>'+esc(c.title)+'</h4><p>'+esc(c.summary)+'</p><ul>'+(c.bullets||[]).map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul>'+(c.note?'<div class="mg-note">'+esc(c.note)+'</div>':"")+'</div>').join("")+'</div></div>';
  };
  const callLogHtml = () => {
    const b = SC.TABS[0].blocks.find(x => x.id === "call_log");
    const rows = S.lists.call_log || [{}];
    return '<div class="card" data-bid="call_log" data-btitle="Call & claim log"><h3>Call &amp; claim log</h3><p style="font-size:13px;color:var(--ink2);margin:0 0 10px">Log calls &amp; reference numbers here, then click <b>Save updated copy</b>.</p>'
      + rows.map((r,i) => '<div class="row"><button type="button" class="rx" data-cdel="'+i+'">✕</button><div class="grid2">'
        + b.cols.map(([k,l]) => '<div><span class="lbl">'+esc(l)+'</span><input data-cl="'+i+':'+esc(k)+'" value="'+esc(r[k]||"")+'"></div>').join("")
        + '</div></div>').join("")
      + '<button type="button" class="btn addbtn" id="addCall">+ Add a row</button></div>';
  };
  function jump(tabId, bkey, sid, tk) {
    if (tabs.some(t => t.id === tabId)) activeTab = tabId;
    if (tk && SC.PLAYBOOK[tk]) activeTrack = tk;
    draw();
    const p = root.querySelector('[data-panel="'+CSS.escape(activeTab)+'"]');
    if (!p) return;
    let el = bkey ? (p.querySelector('[data-bid="'+CSS.escape(bkey)+'"]') || p.querySelector('[data-btitle="'+CSS.escape(bkey)+'"]') || p.querySelector('[data-sid="'+CSS.escape(bkey)+'"]')) : null;
    if (el) {
      const card = el.closest(".card,.glance,.step") || el;
      card.scrollIntoView({ behavior:"smooth", block:"center" });
      card.classList.remove("flash"); void card.offsetWidth; card.classList.add("flash");
    } else window.scrollTo({ top:0, behavior:"smooth" });
  }
  function searchHits(q) {
    const term = q.trim().toLowerCase(), out = [];
    if (!term) return out;
    const add = (tabId, tabLbl, title, sub, bk="", tk="") => { if (out.length < 12) out.push({ tabId, tabLbl, title, sub, bk, tk }); };
    SC.GLANCE.forEach(([id,l]) => { const v = String(S.f[id]||""); if (l.toLowerCase().includes(term)||v.toLowerCase().includes(term)) add("start","Start here",l,v,"glance"); });
    tabs.forEach(t => {
      (t.blocks||[]).forEach(b => {
        if (b.type === "fields") b.fields.forEach(f => { const x = rf(f); const v = String(S.f[x[0]]||""); if (x[1].toLowerCase().includes(term)||v.toLowerCase().includes(term)||b.title.toLowerCase().includes(term)) add(t.id,t.label,x[1],v||b.title,b.title); });
        if (b.type === "list") {
          const mr = (S.lists[b.id]||[]).find(r => isRowFilled(b.id,r) && Object.values(r).some(v => String(v||"").toLowerCase().includes(term)));
          if (b.title.toLowerCase().includes(term)||mr) add(t.id,t.label,b.title,mr?Object.values(mr).filter(Boolean).join(" · "):"Table",b.id);
        }
      });
      (S.extra[t.id]||[]).forEach(x => {
        if (x.type==="field") { const v = String(S.f[x.id]||""); if (x.label.toLowerCase().includes(term)||v.toLowerCase().includes(term)) add(t.id,t.label,x.label,v,"More details"); }
        else { const mr = (S.lists[x.id]||[]).find(r => Object.values(r).some(v => String(v||"").toLowerCase().includes(term))); if (x.title.toLowerCase().includes(term)||mr) add(t.id,t.label,x.title,mr?Object.values(mr).filter(Boolean).join(" · "):"Table",x.id); }
      });
    });
    (SC.MONEY_GUIDE || []).forEach(g => {
      const txt = (g.title+" "+g.summary+" "+(g.bullets||[]).join(" ")+" "+(g.note||"")).toLowerCase();
      if (txt.includes(term)) add("money","Money Guide",g.title,g.summary,"money_guide");
    });
    const pfEntry = reg.proFinder ? Object.entries(reg.proFinder).find(([,v]) => String(v||"").toLowerCase().includes(term)) : null;
    if (pfEntry) add("contacts","Finding Help","Local directories ("+(reg.label||"")+")",pfEntry[1],"pro_finder");
    (SC.PRO_FINDER || []).forEach(c => {
      const txt = (c.title+" "+c.summary+" "+(c.bullets||[]).join(" ")+" "+(c.note||"")).toLowerCase();
      if (txt.includes(term)) add("contacts","Finding Help",c.title,c.summary,"pro_finder");
    });
    SC.KIDS.forEach(([id,,l]) => { const v = String(S.f[id]||""); if (l.toLowerCase().includes(term)||v.toLowerCase().includes(term)) add("kids","For the kids",l,v,"kids_card"); });
    Object.entries(SC.PLAYBOOK).forEach(([tk,p]) => p.phases.forEach(ph => ph.steps.forEach(raw => { const s = rs(raw); if (s.t.toLowerCase().includes(term)||s.d.toLowerCase().includes(term)) add("start","Playbook",s.t,s.d,s.id,tk); })));
    return out;
  }
  function draw() {
    document.body.classList.toggle("large-text", !!S.largeText);
    document.body.classList.toggle("high-contrast", !!S.highContrast);
    root.innerHTML = '<div class="bar"><div style="flex:1"><h1>Our Family <em>Field Guide</em></h1><small style="color:var(--ink2)">Unlocked offline copy · Updated '+esc((S.updated||"").slice(0,10))+(dirty?' · <span style="color:var(--tomato)">Unsaved changes</span>':"")+'</small>'+(statusMsg?'<div class="status">'+esc(statusMsg)+'</div>':"")+'</div>'
      + '<div class="acts" style="display:flex;gap:6px;flex-wrap:wrap">'
      + '<button type="button" class="btn'+(S.largeText?" on":"")+'" id="saLg">A+</button>'
      + '<button type="button" class="btn'+(S.highContrast?" on":"")+'" id="saHc">Contrast</button>'
      + '<button type="button" class="btn" id="saSum">1-page Summary</button>'
      + '<button type="button" class="btn" id="saMed">ER Grab Sheet</button>'
      + '<button type="button" class="btn" id="saCare">Caregiver sheet</button>'
      + '<button type="button" class="btn" id="dlJson">Download .json</button>'
      + '<button type="button" class="btn primary" id="saveHtml">Save updated copy (.html)</button>'
      + '<button type="button" class="btn" id="saLock">Lock</button>'
      + '<button type="button" class="btn" id="saPrint">Print</button></div></div>'
      + '<div id="saLightbox" hidden style="position:fixed;inset:0;background:rgba(31,58,46,.75);display:none;place-items:center;padding:20px;z-index:30">'
      + '<div style="background:var(--card);border:2px solid var(--ink);border-radius:8px;padding:16px;max-width:90vw;max-height:90vh;display:flex;flex-direction:column;gap:10px">'
      + '<b id="saLbCap"></b><img id="saLbImg" alt="" style="max-width:82vw;max-height:72vh;object-fit:contain;border-radius:4px">'
      + '<button type="button" class="btn primary" id="saLbClose" style="align-self:flex-end">Close</button></div></div>'
      + '<div class="sbox"><input type="search" id="saSearch" placeholder="Search guide… (press /)" autocomplete="off"><div class="sres" id="saRes" hidden></div></div>'
      + '<div class="tabs">'+tabs.map(t => '<button type="button" data-t="'+esc(t.id)+'" class="'+(activeTab===t.id?"on":"")+'">'+esc(t.label)+'</button>').join("")+'</div>'
      + tabs.map(t => {
        let html = "";
        if (t.id === "start") {
          const g = SC.GLANCE.map(x => rf(x)).map(([id,l]) => fv(l, id)).join("");
          if (g) html += '<div class="glance" data-bid="glance"><h3>If you read nothing else</h3><div class="grid2">'+g+'</div></div>';
          const p = SC.PLAYBOOK[activeTrack];
          html += '<div class="card"><h3>What\\'s happening?</h3><div class="track">'+Object.entries(SC.PLAYBOOK).map(([k,v]) => '<button type="button" data-tr="'+esc(k)+'" class="'+(activeTrack===k?"on":"")+'">'+esc(v.label)+'</button>').join("")+'</div>'
            + p.phases.map(ph => '<h4>'+esc(ph.when)+'</h4>'+ph.steps.map(raw => { const s = rs(raw); return '<div class="step '+(S.checks[s.id]?"done":"")+'" data-sid="'+esc(s.id)+'"><input type="checkbox" data-ck="'+esc(s.id)+'" '+(S.checks[s.id]?"checked":"")+'><div><div class="st"><b>'+esc(s.t)+'</b></div><div style="font-size:13.5px;color:var(--ink2)">'+esc(s.d)+'</div>'+(s.refTab?'<button type="button" class="rlink" data-jt="'+esc(s.refTab)+'" data-jb="'+esc(s.refBlock||"")+'">↳ '+esc(s.ref)+'</button>':"")+'</div></div>'; }).join("")).join("")+'</div>';
          html += callLogHtml();
        }
        (t.blocks || []).forEach(b => {
          if (b.type === "fields") { const fs = b.fields.map(f => rf(f)).map(([id,l]) => fv(l, id)).join(""); if (fs) html += '<div class="card" data-btitle="'+esc(b.title)+'"><h3>'+esc(b.title)+'</h3><div class="grid2">'+fs+'</div></div>'; }
          if (b.type === "list" && b.id !== "call_log") html += listHtml(b.title, b.id, b.cols);
          if (b.type === "money_guide") html += moneyGuideHtml(b);
          if (b.type === "pro_finder") html += proFinderHtml(b);
          if (b.type === "photos" && S.photos.length) html += '<div class="card" data-bid="visual_refs" data-btitle="Visual reference photos"><h3>'+esc(b.title)+'</h3><div class="pgrid">'+S.photos.filter(ph => safeImgUrl(ph.dataUrl)).map((ph,pi) => '<div class="pcard"><img src="'+esc(safeImgUrl(ph.dataUrl))+'" alt="'+esc(ph.label)+'" data-sazoom="'+pi+'"><div style="font-size:12.5px;font-weight:600;margin-top:4px">'+esc(ph.label)+'</div></div>').join("")+'</div></div>';
          if (b.type === "scripts") html += '<div class="card" data-btitle="What to say"><h3>What to say</h3>'+SC.SCRIPTS.map(([st,sb]) => '<div class="script"><b>'+esc(st)+'</b><div><i>'+esc(sb)+'</i></div></div>').join("")+'</div>';
          if (b.type === "letter" && String(S.f.letter||"").trim()) html += '<div class="card" data-btitle="A note to you"><h3>A note to you</h3><div class="val" style="font-family:var(--serif);font-size:17px">'+linkify(S.f.letter)+'</div></div>';
          if (b.type === "kids") { const ks = SC.KIDS.map(([id,em,l]) => fv(em+" "+l, id)).join(""); if (ks) html += '<div class="card" data-bid="kids_card"><div class="grid2">'+ks+'</div></div>'; }
        });
        const ex = S.extra[t.id] || [];
        const exf = ex.filter(x => x.type === "field").map(x => fv(x.label, x.id)).join("");
        if (exf) html += '<div class="card" data-btitle="More details"><h3>More details</h3><div class="grid2">'+exf+'</div></div>';
        ex.filter(x => x.type === "list").forEach(x => { html += listHtml(x.title, x.id, x.cols); });
        return '<section class="panel '+(activeTab===t.id?"on":"")+'" data-panel="'+esc(t.id)+'"><h2>'+esc(t.title)+'</h2>'+(html || '<p style="color:var(--mute)">No filled entries in this section.</p>')+'</section>';
      }).join("");
    root.querySelectorAll("[data-t]").forEach(b => b.onclick = () => { activeTab = b.dataset.t; draw(); });
    root.querySelectorAll("[data-tr]").forEach(b => b.onclick = () => { activeTrack = b.dataset.tr; draw(); });
    root.querySelectorAll("[data-jt]").forEach(b => b.onclick = () => jump(b.dataset.jt, b.dataset.jb));
    root.querySelectorAll("[data-ck]").forEach(c => c.onchange = () => { S.checks[c.dataset.ck] = c.checked; dirty = true; c.closest(".step").classList.toggle("done", c.checked); });
    root.querySelectorAll("[data-cl]").forEach(inp => inp.oninput = () => { const [i,k] = inp.dataset.cl.split(":"); S.lists.call_log[+i][k] = inp.value; dirty = true; });
    root.querySelectorAll("[data-cdel]").forEach(btn => btn.onclick = () => { S.lists.call_log.splice(+btn.dataset.cdel, 1); if (!S.lists.call_log.length) S.lists.call_log.push({}); dirty = true; draw(); });
    const addCall = root.querySelector("#addCall");
    if (addCall) addCall.onclick = () => { S.lists.call_log.push({}); dirty = true; draw(); };
    root.querySelector("#saLg").onclick = () => { S.largeText = !S.largeText; draw(); };
    root.querySelector("#saHc").onclick = () => { S.highContrast = !S.highContrast; draw(); };
    const showPrintSheet = html => {
      document.getElementById("sheetOnly").innerHTML = html;
      document.body.classList.add("sheet-mode");
      const donePrint = () => document.body.classList.remove("sheet-mode");
      window.addEventListener("afterprint", donePrint, { once:true });
      setTimeout(() => { window.print(); setTimeout(donePrint, 1200); }, 40);
    };
    root.querySelector("#saSum").onclick = () => {
      const f = id => String(S.f[id]||"").trim();
      const rowsOf = id => (S.lists[id]||[]).filter(r => isRowFilled(id,r));
      const hasIll = Boolean(f("h_diag")||f("h_triage")||f("h_redflag")||f("h_devices")||f("h_rescue"));
      showPrintSheet('<h1>Our Family Field Guide — 1-Page Summary</h1><p style="font-size:13px;color:#444">Updated '+new Date().toLocaleDateString()+'</p><div class="sgrid">'
        + '<div class="sboxc"><h3>1. Call First &amp; Pros</h3>'+(f("q_first")?'<p><b>Call first:</b> '+esc(f("q_first"))+'</p>':"")+'<ul>'+rowsOf("first").map(r=>'<li><b>'+esc(r.name||r.rel||"Contact")+'</b>: '+esc(r.phone||"")+'</li>').join("")+rowsOf("pros").slice(0,5).map(r=>'<li><b>'+esc(r.role||"Pro")+':</b> '+esc(r.name||"")+' '+esc(r.phone||"")+'</li>').join("")+'</ul></div>'
        + '<div class="sboxc"><h3>2. Money &amp; Debts</h3>'+(f("m_monthly")?'<p><b>Monthly:</b> '+esc(f("m_monthly"))+'</p>':"")+(f("q_runway")?'<p><b>Runway:</b> '+esc(f("q_runway"))+'</p>':"")+(f("m_payout_first")?'<p><b>Payout first step:</b> '+esc(f("m_payout_first"))+'</p>':"")+'<ul>'+rowsOf("accounts").map(r=>'<li><b>'+esc(r.inst||r.type)+'</b> ('+esc(r.own||"")+' *'+esc(r.last4||"")+')</li>').join("")+'</ul>'+(rowsOf("crypto").length?'<p><b>Crypto:</b> '+rowsOf("crypto").map(r=>esc(r.platform||"Wallet")).join(" · ")+'</p>':"")+(rowsOf("debts").length?'<p><b>Debts:</b> '+rowsOf("debts").map(r=>esc(r.type||r.name)+' '+esc(r.bal||"")).join(" · ")+'</p>':"")+'</div>'
        + '<div class="sboxc full"><h3>3. Insurance &amp; Retirement</h3><ul>'+rowsOf("insurance").map(r=>'<li><b>'+esc(r.type)+':</b> '+[r.co,r.amt,r.benef?"Benef: "+r.benef:"",r.phone].filter(Boolean).map(esc).join(" · ")+'</li>').join("")+'</ul>'+(rowsOf("invest").length?'<p><b>Investments:</b> '+rowsOf("invest").map(r=>esc(r.inst||"")+' '+esc(r.type||"")+(r.benef?' ('+esc(r.benef)+')':"")).join(" · ")+'</p>':"")+'</div>'
        + '<div class="sboxc"><h3>4. Papers, IDs, Phone &amp; Property</h3>'+(f("q_binder")?'<p><b>Papers:</b> '+esc(f("q_binder"))+'</p>':"")+(f("d_will")?'<p><b>Will:</b> '+esc(f("d_will"))+'</p>':"")+(f("d_phone")?'<p><b>Phone:</b> '+esc(f("d_phone"))+'</p>':"")+(rowsOf("gov_ids").length?'<p><b>Key IDs:</b> '+rowsOf("gov_ids").slice(0,4).map(r=>esc(r.idtype)+(r.last4?" *"+esc(r.last4):"")).join(" · ")+'</p>':"")+(rowsOf("property").length?'<p><b>Property:</b> '+rowsOf("property").map(r=>esc(r.what)+(r.where?" ("+esc(r.where)+")":"")).join(" · ")+'</p>':"")+'</div>'
        + '<div class="sboxc"><h3>5. Home, Kids &amp; Pets</h3>'+(f("k_home")?'<p><b>Address:</b> '+esc(f("k_home"))+'</p>':"")+(f("k_safe")?'<p><b>Safe word:</b> '+esc(f("k_safe"))+'</p>':"")+'<ul>'+rowsOf("kids_info").map(r=>'<li><b>'+esc(r.child)+'</b> '+esc(r.pickup||"")+'</li>').join("")+rowsOf("pets").map(r=>'<li><b>'+esc(r.name)+'</b> '+esc(r.vet||"")+'</li>').join("")+'</ul></div>'
        + (hasIll?'<div class="sboxc full er-alert"><h3>6. Active Illness / ER Alert</h3>'+(f("h_diag")?'<p><b>Diagnosis:</b> '+esc(f("h_diag"))+'</p>':"")+(f("h_triage")?'<p><b>Triage / ER:</b> '+esc(f("h_triage"))+'</p>':"")+(f("h_redflag")?'<p><b>Red-flag rule:</b> '+esc(f("h_redflag"))+'</p>':"")+(f("h_devices")?'<p><b>Ports / arm limits:</b> '+esc(f("h_devices"))+'</p>':"")+'</div>':"")
        + '</div>');
    };
    root.querySelector("#saMed").onclick = () => {
      const f = id => String(S.f[id]||"").trim();
      const rowsOf = id => (S.lists[id]||[]).filter(r => isRowFilled(id,r));
      showPrintSheet('<h1>1-Page ER &amp; Medical Treatment Grab Sheet</h1><p style="font-size:13px;color:#444">Emergency #: '+esc(reg.emergency||"911")+' · Updated '+new Date().toLocaleDateString()+'</p><div class="sgrid">'
        + '<div class="sboxc full er-alert"><h3>Red-Flag Rules &amp; 24/7 Triage</h3><div style="font-size:17px;font-weight:700">'+esc(f("h_triage")||"See specialist phone in Contacts")+'</div>'+(f("h_redflag")?'<p><b>Red-flag rule:</b> '+esc(f("h_redflag"))+'</p>':"")+'</div>'
        + '<div class="sboxc"><h3>Diagnosis, Protocol &amp; Warnings</h3>'+(f("h_diag")?'<p><b>Diagnosis:</b> '+esc(f("h_diag"))+'</p>':"")+(f("h_devices")?'<p><b>Ports/Implants/Limits:</b> '+esc(f("h_devices"))+'</p>':"")+(f("h_comfort")?'<p><b>Boundaries/Comfort:</b> '+esc(f("h_comfort"))+'</p>':"")+'</div>'
        + '<div class="sboxc"><h3>Medications &amp; Rescue Kit</h3>'+(f("d_meds")?'<p><b>Meds &amp; allergies:</b> '+esc(f("d_meds"))+'</p>':"")+(f("h_rescue")?'<p><b>Rescue meds:</b> '+esc(f("h_rescue"))+'</p>':"")+(f("h_pharm")?'<p><b>Pharmacy:</b> '+esc(f("h_pharm"))+'</p>':"")+'</div>'
        + '<div class="sboxc"><h3>Proxy, Portal &amp; Insurance</h3>'+(f("d_mpoa")?'<p><b>Medical POA:</b> '+esc(f("d_mpoa"))+'</p>':"")+(f("h_portal")?'<p><b>Portal proxy:</b> '+esc(f("h_portal"))+'</p>':"")+(f("d_ins")?'<p><b>Insurance:</b> '+esc(f("d_ins"))+'</p>':"")+'</div>'
        + '<div class="sboxc"><h3>Emergency Contacts</h3><ul>'+rowsOf("first").map(r=>'<li><b>'+esc(r.name||r.rel||"Contact")+'</b>: '+esc(r.phone||"")+'</li>').join("")+'</ul>'+(f("q_first")?'<p>'+esc(f("q_first"))+'</p>':"")+'</div></div>');
    };
    root.querySelector("#saCare").onclick = () => {
      const f = id => String(S.f[id]||"").trim();
      const rowsOf = id => (S.lists[id]||[]).filter(r => isRowFilled(id,r));
      showPrintSheet('<h1>Emergency Caregiver &amp; Fridge Sheet</h1><p style="font-size:13px;color:#444">Updated '+new Date().toLocaleDateString()+'</p><div class="sgrid">'
        + '<div class="sboxc full"><h3>Home Address (read this to '+esc(reg.emergency||"911")+')</h3><div style="font-size:18px;font-weight:700">'+esc(f("k_home")||"Not filled")+'</div>'+(f("k_safe")?'<p><b>Safe word:</b> '+esc(f("k_safe"))+'</p>':"")+'</div>'
        + '<div class="sboxc"><h3>Who to Call First</h3><ul>'+rowsOf("first").map(r=>'<li><b>'+esc(r.name||r.rel||"Contact")+'</b>: '+esc(r.phone||"")+'</li>').join("")+'</ul>'+(f("q_first")?'<p>'+esc(f("q_first"))+'</p>':"")+'</div>'
        + '<div class="sboxc"><h3>Kids &amp; Health</h3><ul>'+rowsOf("kids_info").map(r=>'<li><b>'+esc(r.child||"Child")+'</b> '+esc(r.pickup||"")+' '+esc(r.comfort||"")+'</li>').join("")+rowsOf("fam_health").map(r=>'<li><b>'+esc(r.name||"")+'</b> '+esc(r.allergy||"")+' '+esc(r.meds||"")+'</li>').join("")+'</ul></div>'
        + '<div class="sboxc"><h3>House Shut-offs</h3><ul>'+[["Water",f("hk_water")],["Gas",f("hk_gas")],["Breaker",f("hk_breaker")],["Keys",f("hk_spare")]].filter(([,v])=>v).map(([k,v])=>'<li><b>'+k+':</b> '+esc(v)+'</li>').join("")+'</ul></div>'
        + '<div class="sboxc"><h3>Pets</h3><ul>'+rowsOf("pets").map(r=>'<li><b>'+esc(r.name||"Pet")+'</b> '+esc(r.food||"")+' '+esc(r.vet||"")+'</li>').join("")+'</ul></div></div>');
    };
    root.querySelector("#dlJson").onclick = () => { const u = URL.createObjectURL(new Blob([JSON.stringify(pkg)], { type:"application/json" })); const a = document.createElement("a"); a.href = u; a.download = "family-field-guide-backup.json"; a.click(); setTimeout(() => URL.revokeObjectURL(u), 4000); };
    root.querySelector("#saveHtml").onclick = async () => {
      if (!unlockedPass) return;
      const now = new Date().toISOString(); S.updated = now; S.lastBackup = now;
      const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
      const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(unlockedPass), "PBKDF2", false, ["deriveKey"]);
      const key = await crypto.subtle.deriveKey({ name:"PBKDF2", salt, iterations:250000, hash:"SHA-256" }, base, { name:"AES-GCM", length:256 }, false, ["encrypt"]);
      const ct = await crypto.subtle.encrypt({ name:"AES-GCM", iv }, key, new TextEncoder().encode(JSON.stringify(S)));
      pkg = { app:"family-field-guide", v:1, salt:b64(salt), iv:b64(iv), data:b64(ct) };
      const nextHtml = TEMPLATE_HTML.replace(/<script id="ffg-pkg" type="application\\/json">[\\s\\S]*?<\\/script>/i, () => '<script id="ffg-pkg" type="application/json">'+safeJson(pkg)+'<\\/script>');
      const u = URL.createObjectURL(new Blob([nextHtml], { type:"text/html" })); const a = document.createElement("a"); a.href = u; a.download = "family-field-guide-"+now.slice(0,10)+".html"; a.click(); setTimeout(() => URL.revokeObjectURL(u), 4000);
      dirty = false; statusMsg = "Saved updated copy ("+now.slice(0,10)+")"; draw();
    };
    root.querySelector("#saPrint").onclick = () => window.print();
    const lockNow = () => {
      unlockedPass = "";
      clearTimeout(saIdle);
      for (const k of Object.keys(S)) delete S[k];
      root.innerHTML = "";
      root.hidden = true;
      document.getElementById("gate").hidden = false;
      document.getElementById("uerr").textContent = "Locked due to inactivity or manual lock.";
    };
    root.querySelector("#saLock").onclick = lockNow;
    let saIdle = null;
    const bumpSaIdle = () => { clearTimeout(saIdle); if (unlockedPass) saIdle = setTimeout(lockNow, 15 * 60 * 1000); };
    bumpSaIdle();
    ["pointerdown","keydown"].forEach(ev => root.addEventListener(ev, bumpSaIdle, { passive: true }));
    const lb = root.querySelector("#saLightbox"), lbImg = root.querySelector("#saLbImg"), lbCap = root.querySelector("#saLbCap"), lbClose = root.querySelector("#saLbClose");
    if (lb && lbClose) {
      lbClose.onclick = () => { lb.hidden = true; lb.style.display = "none"; lbImg.src = ""; };
      lb.onclick = ev => { if (ev.target === lb) lbClose.onclick(); };
      root.querySelectorAll("[data-sazoom]").forEach(im => {
        im.onclick = () => {
          const ph = S.photos.filter(p => safeImgUrl(p.dataUrl))[+im.dataset.sazoom];
          if (ph) { lbImg.src = safeImgUrl(ph.dataUrl); lbCap.textContent = ph.label; lb.hidden = false; lb.style.display = "grid"; }
        };
      });
    }
    const sin = root.querySelector("#saSearch"), sres = root.querySelector("#saRes");
    let sidx = -1, hits = [];
    sin.oninput = () => {
      hits = searchHits(sin.value); sidx = -1;
      if (!sin.value.trim()) { sres.hidden = true; return; }
      sres.innerHTML = hits.length ? hits.map((h,i) => '<button type="button" class="sri" data-si="'+i+'"><span class="srt">'+esc(h.tabLbl)+'</span><span><b>'+esc(h.title)+'</b>'+(h.sub?' — '+esc(h.sub):"")+'</span></button>').join("") : '<div style="padding:10px;color:var(--mute);font-size:13px">No matches</div>';
      sres.hidden = false;
      sres.querySelectorAll("[data-si]").forEach(btn => btn.onclick = () => { const h = hits[+btn.dataset.si]; sres.hidden = true; sin.value = ""; jump(h.tabId, h.bk, "", h.tk); });
    };
    sin.onkeydown = e => {
      const items = Array.from(sres.querySelectorAll(".sri"));
      if (e.key === "ArrowDown" && items.length) { e.preventDefault(); sidx = (sidx + 1) % items.length; items.forEach((el,i)=>el.classList.toggle("active",i===sidx)); }
      else if (e.key === "ArrowUp" && items.length) { e.preventDefault(); sidx = (sidx - 1 + items.length) % items.length; items.forEach((el,i)=>el.classList.toggle("active",i===sidx)); }
      else if (e.key === "Enter" && hits.length) { e.preventDefault(); const h = hits[sidx >= 0 ? sidx : 0]; sres.hidden = true; sin.value = ""; jump(h.tabId, h.bk, "", h.tk); }
      else if (e.key === "Escape") { sres.hidden = true; sin.blur(); }
    };
  }
  draw();
  document.addEventListener("keydown", e => {
    if (e.key === "/" && !["input","textarea"].includes((document.activeElement?.tagName||"").toLowerCase())) {
      const si = document.getElementById("saSearch"); if (si) { e.preventDefault(); si.focus(); }
    }
  });
}
<\/script>
</body>
</html>`;
}

function quickStartWizard() {
  const regOpts = (typeof REGIONS !== "undefined")
    ? Object.entries(REGIONS).map(([k, v]) => `<option value="${esc(k)}"${S.region === k ? " selected" : ""}>${esc(v.label)}</option>`).join("")
    : "";
  openDlg(`<h3>5-Minute Guided Setup</h3>
    <p class="hint">Fill in just the 4 essentials that matter most at 2 AM, then save your first locked backup.</p>
    <label class="f"><span>1. Country / Region preset</span><select id="qsReg">${regOpts}</select></label>
    <label class="f" style="margin-top:8px"><span>2. First person to call</span><input id="qsFirst" value="${esc(S.f?.q_first || "")}" placeholder="Name &amp; phone"></label>
    <label class="f" style="margin-top:8px"><span>3. Where original papers live</span><input id="qsBinder" value="${esc(S.f?.q_binder || "")}" placeholder="e.g. fireproof box, hall closet"></label>
    <label class="f" style="margin-top:8px"><span>4. How to unlock my phone &amp; password manager</span><input id="qsPhone" value="${esc(S.f?.d_phone || "")}" placeholder="e.g. code in sealed envelope in safe"></label>
    <label class="f" style="margin-top:8px"><span>Password manager emergency access</span><input id="qsPm" value="${esc(S.f?.d_pm || "")}" placeholder="e.g. Bitwarden / 1Password Emergency Kit in safe"></label>
    <div class="btns">
      <button type="button" class="btn" id="cancelDlg">Skip</button>
      <button type="button" class="btn" id="qsSaveOnly">Save &amp; explore</button>
      <button type="submit" class="btn primary" id="go">Save &amp; lock backup →</button>
    </div>`, true);
  const applyQs = () => {
    const r = $("#qsReg")?.value;
    if (r && typeof REGIONS !== "undefined" && REGIONS[r]) S.region = r;
    const setIf = (k, v) => { if (v.trim()) S.f[k] = v.trim(); };
    setIf("q_first", $("#qsFirst").value);
    setIf("q_binder", $("#qsBinder").value);
    setIf("d_phone", $("#qsPhone").value);
    setIf("d_pm", $("#qsPm").value);
    S.dismissDemo = true;
    save(true, true);
    render();
  };
  $("#cancelDlg").onclick = () => $("#dlg").close();
  $("#qsSaveOnly").onclick = () => { applyQs(); $("#dlg").close(); toast("Essentials saved"); };
  $("#dlgForm").onsubmit = ev => {
    ev.preventDefault();
    applyQs();
    $("#dlg").close();
    if (hasCrypto()) backupDialog();
  };
}

function buildCaregiverSubset(src) {
  const keepFields = new Set([
    "q_first", "q_binder", "d_hcd", "d_mpoa", "d_ins", "d_meds",
    "h_pharm", "h_wishes", "h_diag", "h_triage", "h_redflag", "h_devices",
    "h_rescue", "h_portal", "h_comfort", "hk_water", "hk_gas", "hk_breaker",
    "hk_spare", "hk_trash", "hk_quirks", "k_call", "k_home", "k_911",
    "k_school", "k_safe", "k_routine", "k_note"
  ]);
  const keepLists = new Set(["first", "kids_info", "fam_health", "pets"]);
  const f = {};
  for (const [k, v] of Object.entries(src.f || {})) {
    if (keepFields.has(k)) f[k] = v;
  }
  const lists = {};
  for (const [k, v] of Object.entries(src.lists || {})) {
    if (keepLists.has(k)) lists[k] = v;
  }
  return {
    stateVersion: 1,
    region: src.region || "us",
    track: "caregiver",
    tab: "kids",
    readMode: true,
    f,
    lists,
    checks: {},
    customTabs: [],
    extra: {},
    fireDrill: {},
    photos: (src.photos || []).filter(p => p && safeImgUrl(p.dataUrl) && !/card|bank|ssn|passport|crypto|seed/i.test(p.label || "")).slice(0, 10),
    updated: src.updated || new Date().toISOString()
  };
}

function backupDialog() {
  if (!hasCrypto()) return toast("Locked backups require HTTPS, localhost, or Web Crypto support");
  openDlg(`<h3>Save a locked backup</h3>
    <p class="hint">Choose a passphrase your spouse knows (or keep it with your will). Without it, the file can't be opened. Don't upload backups to GitHub.</p>
    <label class="f"><span>Passphrase (at least 8 characters)</span><input type="password" id="pw1" required></label>
    <div class="pass-tools">
      <button type="button" id="genPw">Generate 6-word passphrase</button>
      <button type="button" id="togPw">Show</button>
    </div>
    <label class="f" style="margin-top:8px"><span>Type it again</span><input type="password" id="pw2" required></label>
    <label style="display:flex;gap:8px;align-items:flex-start;margin-top:10px;font-size:13.5px;cursor:pointer">
      <input type="checkbox" id="mkSss" style="width:auto;margin-top:3px">
      <span>Also create <b>2-of-3 Split Recovery Cards</b> (Spouse · Safe · Trusted Person). Any 2 cards unlock this backup.</span>
    </label>
    <div class="opt-list" style="margin-top:12px">
      <label class="opt-card"><input type="radio" name="bscope" value="full" checked><div><b>Full Family Guide (for Spouse / Executor)</b><small>Includes finances, insurance, crypto map, legal papers, health &amp; kids.</small></div></label>
      <label class="opt-card"><input type="radio" name="bscope" value="caregiver"><div><b>Caregiver &amp; ER Packet Only (Least-Privilege)</b><small>Includes kids, address, safe word, pets, house shut-offs &amp; ER medical notes—omits all finances, IDs &amp; passwords.</small></div></label>
    </div>
    <div class="opt-list" style="margin-top:8px">
      <label class="opt-card"><input type="radio" name="bfmt" value="html" checked><div><b>Standalone locked HTML (.html) — Recommended</b><small>One self-contained offline file your spouse can double-click in any browser, even years from now.</small></div></label>
      <label class="opt-card"><input type="radio" name="bfmt" value="json"><div><b>Encrypted JSON (.json)</b><small>Compact data file to re-open inside this app.</small></div></label>
    </div>
    ${btns("Save file")}`);
  $("#genPw").onclick = () => {
    const pw = generatePassphrase(6);
    $("#pw1").value = $("#pw2").value = pw;
    $("#pw1").type = $("#pw2").type = "text";
    $("#togPw").textContent = "Hide";
  };
  $("#togPw").onclick = () => {
    const show = $("#pw1").type === "password";
    $("#pw1").type = $("#pw2").type = show ? "text" : "password";
    $("#togPw").textContent = show ? "Hide" : "Show";
  };
  onGo(async () => {
    const p = $("#pw1").value;
    if (p.length < 8) return toast("Use at least 8 characters");
    if (p !== $("#pw2").value) return toast("Passphrases don't match");
    const fmt = $("#dlgForm").querySelector('input[name="bfmt"]:checked').value;
    const scope = $("#dlgForm").querySelector('input[name="bscope"]:checked').value;
    const makeCards = $("#mkSss").checked;
    const now = new Date().toISOString();
    if (scope === "full") {
      S.lastBackup = now;
      if (!S.updated) S.updated = now;
    }
    const payloadObj = scope === "caregiver" ? buildCaregiverSubset(S) : S;
    const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await keyFrom(p, salt), enc.encode(JSON.stringify(payloadObj)));
    const pkg = { app: "family-field-guide", v: 1, salt: b64(salt), iv: b64(iv), data: b64(ct) };
    const out = JSON.stringify(pkg);
    const stamp = now.slice(0, 10);
    const prefix = scope === "caregiver" ? "family-caregiver-packet" : "family-field-guide";
    if (fmt === "html") download(`${prefix}-${stamp}.html`, buildStandaloneHtml(pkg), "text/html");
    else download(`${prefix}-${stamp}.json`, out, "application/json");
    if (scope === "full") save(true, false);
    const shares = makeCards ? sssSplit2of3(p) : null;
    openDlg(`<h3>Backup ready</h3>
      <p>Your ${fmt === "html" ? "standalone locked HTML" : "encrypted JSON"} download has started. Keep the passphrase separate from the file.</p>
      ${shares ? `<div class="sss-list">
        <p class="hint" style="margin:0"><b>2-of-3 Split Recovery Cards:</b> store each in a different place. Any 2 unlock your backup.</p>
        ${shares.map((sh, i) => `<div class="sss-box"><b>Card ${i + 1}:</b> ${esc(sh)}</div>`).join("")}
        <div><button type="button" class="btn" id="prtCards">Print 3 recovery cards</button></div>
      </div>` : ""}
      <p class="hint">If the download didn't start, copy this locked backup text into a file instead:</p>
      <textarea readonly style="min-height:95px;font:11px var(--mono)">${esc(out)}</textarea>
      <div class="btns"><button type="button" class="btn primary" id="doneDlg">Done</button></div>`, !!shares);
    if (shares) $("#prtCards").onclick = () => { renderRecoveryCards(shares); printWithClass("print-sheet-only"); };
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

function rowSig(row) {
  return Object.entries(row || {})
    .map(([k, v]) => [k, String(v ?? "").trim().toLowerCase()])
    .filter(([, v]) => v !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("|");
}

function fieldLabelById(id, incExtra = {}) {
  if (id === "letter") return "A note to you";
  const g = GLANCE.find(x => x[0] === id); if (g) return g[1];
  const k = KIDS.find(x => x[0] === id); if (k) return k[2];
  for (const t of TABS) {
    for (const b of t.blocks) {
      if (b.type === "fields") {
        const f = b.fields.find(x => x[0] === id);
        if (f) return f[1];
      }
    }
  }
  const ex = [...Object.values(S.extra).flat(), ...Object.values(incExtra || {}).flat()].find(x => x.id === id);
  return ex ? ex.label : id;
}

function isRowEditedWithExtra(blockId, row, incExtra = {}) {
  if (!row) return false;
  const nonEmptyEntries = Object.entries(row).filter(([, val]) => String(val ?? "").trim() !== "");
  if (!nonEmptyEntries.length) return false;
  const rawDef = findBlockDef(blockId) || Object.values(incExtra || {}).flat().find(x => x.id === blockId);
  const b = rawDef ? rList(rawDef) : null;
  if (b?.seed?.length) {
    const matchesSeed = b.seed.some(seedRow => {
      const seedEntries = Object.entries(seedRow).filter(([, val]) => String(val ?? "").trim() !== "");
      if (seedEntries.length !== nonEmptyEntries.length) return false;
      return seedEntries.every(([k, val]) => String(row[k] ?? "").trim() === String(val ?? "").trim());
    });
    if (matchesSeed) return false;
  }
  if (b?.suggestions?.length && nonEmptyEntries.length === 1) {
    const scol = b.suggestCol || b.cols?.[0]?.[0];
    const [k, v] = nonEmptyEntries[0];
    if (k === scol && b.suggestions.some(s => s.toLowerCase() === String(v).trim().toLowerCase())) return false;
  }
  return true;
}

function computeMergePlan(cur, inc) {
  const curF = cur.f || {}, incF = inc.f || {};
  const newFields = [], conflictFields = [];
  Object.entries(incF).forEach(([id, val]) => {
    const iv = String(val ?? "").trim();
    if (!iv) return;
    const cv = String(curF[id] ?? "").trim();
    if (!cv) newFields.push(id);
    else if (cv !== iv) conflictFields.push({ id, label: fieldLabelById(id, inc.extra) });
  });
  const curTabs = new Set((cur.customTabs || []).map(t => t.id));
  const newTabs = (inc.customTabs || []).filter(t => !curTabs.has(t.id)).length;
  let newExtras = 0;
  Object.entries(inc.extra || {}).forEach(([tabId, arr]) => {
    const existing = new Set((cur.extra?.[tabId] || []).map(x => x.id));
    (arr || []).forEach(x => { if (!existing.has(x.id)) newExtras++; });
  });
  let newRows = 0;
  Object.entries(inc.lists || {}).forEach(([id, rows]) => {
    const sigs = new Set((cur.lists?.[id] || []).map(rowSig).filter(Boolean));
    (rows || []).forEach(r => {
      if (isRowEditedWithExtra(id, r, inc.extra)) {
        const sig = rowSig(r);
        if (sig && !sigs.has(sig)) { newRows++; sigs.add(sig); }
      }
    });
  });
  const newChecks = Object.entries(inc.checks || {}).filter(([k, v]) => v && !cur.checks?.[k]).length;
  return { newFields: newFields.length, conflictFields, newTabs, newExtras, newRows, newChecks };
}

function applyMerge(cur, inc, overwriteConflicts = false) {
  cur.f ??= {}; cur.lists ??= {}; cur.checks ??= {}; cur.extra ??= {}; cur.customTabs ??= []; cur.photos ??= [];
  let addedFields = 0, updatedFields = 0, addedRows = 0, addedChecks = 0, addedSections = 0, addedPhotos = 0;

  const curTabIds = new Set(cur.customTabs.map(t => t.id));
  (inc.customTabs || []).forEach(t => {
    if (!curTabIds.has(t.id)) { cur.customTabs.push({ ...t }); curTabIds.add(t.id); addedSections++; }
  });
  Object.entries(inc.extra || {}).forEach(([tabId, arr]) => {
    cur.extra[tabId] ??= [];
    const existing = new Set(cur.extra[tabId].map(x => x.id));
    (arr || []).forEach(x => {
      if (!existing.has(x.id)) { cur.extra[tabId].push({ ...x }); existing.add(x.id); }
    });
  });
  Object.entries(inc.f || {}).forEach(([id, val]) => {
    const iv = String(val ?? "").trim();
    if (!iv) return;
    const cv = String(cur.f[id] ?? "").trim();
    if (!cv) { cur.f[id] = val; addedFields++; }
    else if (cv !== iv && overwriteConflicts) { cur.f[id] = val; updatedFields++; }
  });
  Object.entries(inc.lists || {}).forEach(([id, rows]) => {
    cur.lists[id] ??= [];
    const sigs = new Set(cur.lists[id].map(rowSig).filter(Boolean));
    let addedHere = 0;
    (rows || []).forEach(r => {
      if (isRowEditedWithExtra(id, r, inc.extra)) {
        const sig = rowSig(r);
        if (sig && !sigs.has(sig)) {
          cur.lists[id].push({ ...r });
          sigs.add(sig);
          addedRows++;
          addedHere++;
        }
      }
    });
    if (addedHere) {
      cur.lists[id] = cur.lists[id].filter(r => Object.values(r).some(v => String(v ?? "").trim() !== ""));
      if (!cur.lists[id].length) cur.lists[id] = [{}];
    }
  });
  const photoKeys = new Set(cur.photos.map(p => p.label + "::" + String(p.dataUrl || "").slice(0, 64)));
  (inc.photos || []).forEach(p => {
    const safeUrl = p ? safeImgUrl(p.dataUrl) : "";
    if (!safeUrl) return;
    const pk = p.label + "::" + safeUrl.slice(0, 64);
    if (cur.photos.length < 10 && !photoKeys.has(pk)) {
      cur.photos.push({ id: String(p.id || uid("ph")), label: String(p.label || "Photo"), dataUrl: safeUrl });
      photoKeys.add(pk);
      addedPhotos++;
    }
  });
  Object.entries(inc.checks || {}).forEach(([k, v]) => {
    if (v && !cur.checks[k]) { cur.checks[k] = true; addedChecks++; }
  });
  cur.fireDrill ??= {};
  Object.entries(inc.fireDrill || {}).forEach(([k, v]) => {
    if (v) cur.fireDrill[k] = true;
  });
  if (inc.lastDryRun && (!cur.lastDryRun || inc.lastDryRun > cur.lastDryRun)) cur.lastDryRun = inc.lastDryRun;
  if (inc.reviewed && (!cur.reviewed || inc.reviewed > cur.reviewed)) cur.reviewed = inc.reviewed;

  const parts = [];
  if (addedFields) parts.push(`+${addedFields} fields`);
  if (updatedFields) parts.push(`${updatedFields} updated`);
  if (addedRows) parts.push(`+${addedRows} rows`);
  if (addedSections) parts.push(`+${addedSections} sections`);
  if (addedPhotos) parts.push(`+${addedPhotos} photos`);
  if (addedChecks) parts.push(`+${addedChecks} checks`);
  return parts.length ? `Merged (${parts.join(", ")})` : "Already up to date";
}

function promptUnlockPkg(pkg) {
  if (!hasCrypto()) return toast("Opening locked backups requires HTTPS, localhost, or Web Crypto support");
  let useCards = false;
  openDlg(`<h3>Unlock backup</h3><p class="hint">You can merge with this device or replace what's here.</p>
    <div id="pwBox"><label class="f"><span>Passphrase</span><input type="password" id="pw"></label></div>
    <div id="sssBox" hidden>
      <label class="f"><span>Recovery Card A</span><input id="cA" placeholder="FFG-1-..."></label>
      <label class="f" style="margin-top:8px"><span>Recovery Card B</span><input id="cB" placeholder="FFG-2-..."></label>
    </div>
    <div style="margin-top:6px"><button type="button" class="linkbtn" id="togCards">Unlock with 2 recovery cards instead</button></div>
    ${btns("Unlock")}`);
  $("#togCards").onclick = () => {
    useCards = !useCards;
    $("#pwBox").hidden = useCards;
    $("#sssBox").hidden = !useCards;
    $("#togCards").textContent = useCards ? "Use passphrase instead" : "Unlock with 2 recovery cards instead";
  };
  onGo(async () => {
    let pass = "";
    try {
      pass = useCards ? sssCombine2of3($("#cA").value, $("#cB").value) : $("#pw").value;
      if (!pass) return toast("Enter your passphrase");
    } catch (err) { return toast(err.message || "Invalid recovery cards"); }
    let incoming;
    try {
      const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(pkg.iv) }, await keyFrom(pass, unb64(pkg.salt)), unb64(pkg.data));
      incoming = sanitizeState(JSON.parse(dec.decode(pt)));
    } catch { return toast("Wrong passphrase"); }

    if (!hasAnyContent()) {
      S = incoming;
      const now = new Date().toISOString();
      S.lastBackup = now;
      if (!S.updated || S.updated > now) S.updated = now;
      norm(); save(true, false); render(); $("#dlg").close(); toast("Backup opened");
      return;
    }

    const plan = computeMergePlan(S, incoming);
    const conflictPreview = plan.conflictFields.slice(0, 5).map(c => esc(c.label)).join(", ")
      + (plan.conflictFields.length > 5 ? ` +${plan.conflictFields.length - 5} more` : "");
    openDlg(`<h3>Backup unlocked</h3>
      <div class="merge-summary">
        <b>What's new in this backup:</b>
        +${plan.newFields} empty fields filled · +${plan.newRows} table rows · +${plan.newTabs} sections · +${plan.newChecks} playbook checks
        ${plan.conflictFields.length ? `<div class="merge-conflicts"><b>${plan.conflictFields.length} field(s) edited on both devices:</b> ${conflictPreview}</div>` : `<div style="margin-top:4px;color:var(--ink2)">No conflicting field edits.</div>`}
      </div>
      <div class="opt-list">
        <label class="opt-card"><input type="radio" name="mact" value="merge-keep" checked><div><b>Smart merge (keep my edits on conflicts)</b><small>Adds missing answers, tables, and sections without overwriting what you already wrote here.</small></div></label>
        <label class="opt-card"><input type="radio" name="mact" value="merge-inc"><div><b>Smart merge (prefer backup on conflicts)</b><small>Adds missing items and lets the backup win where both devices differ.</small></div></label>
        <label class="opt-card"><input type="radio" name="mact" value="replace"><div><b>Replace everything on this device</b><small>Discards local answers and loads the backup as-is.</small></div></label>
      </div>
      ${btns("Apply")}`);
    onGo(() => {
      const choice = $("#dlgForm").querySelector('input[name="mact"]:checked').value;
      if (choice === "replace") {
        S = incoming;
        const now = new Date().toISOString();
        S.lastBackup = now;
        if (!S.updated || S.updated > now) S.updated = now;
        norm(); save(true, false); render(); $("#dlg").close(); toast("Backup replaced device data");
      } else {
        const msg = applyMerge(S, incoming, choice === "merge-inc");
        norm(); save(true, true); render(); $("#dlg").close(); toast(msg);
      }
    });
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

/* ---------- Optional In-Browser Lock + 15-min idle auto-lock ---------- */
function wipeVisibleGuideDom() {
  const clearIds = ["panels", "printSheet", "modeBanner", "demoBanner", "searchRes"];
  clearIds.forEach(id => { const el = document.querySelector("#" + id); if (el) el.innerHTML = ""; });
  const si = $("#searchIn");
  if (si) si.value = "";
}
function engageBrowserLockScreen() {
  browserLockPass = null;
  browserLockKey = null;
  browserLockSalt = null;
  pendingLockSnap = null;
  clearTimeout(lockDebounceT);
  clearTimeout(idleTimer);
  S = {};
  wipeVisibleGuideDom();
  $("#mainWrap").hidden = true;
  const ls = $("#lockScreen");
  ls.hidden = false;
  let useCards = false;
  ls.innerHTML = `<div class="lock-box">
    <h1>Our Family <em>Field Guide</em></h1>
    <p class="hint">This device's browser storage is locked. Enter your browser-lock passphrase or 2 recovery cards to continue.</p>
    <form id="lsForm">
      <div id="lsPwBox"><label class="f"><span>Passphrase</span><input type="password" id="lsPw" autofocus></label></div>
      <div id="lsSssBox" hidden>
        <label class="f"><span>Recovery Card A</span><input id="lsC1" placeholder="FFG-1-..."></label>
        <label class="f" style="margin-top:8px"><span>Recovery Card B</span><input id="lsC2" placeholder="FFG-2-..."></label>
      </div>
      <div style="margin-top:6px"><button type="button" class="linkbtn" id="lsTogCards">Unlock with 2 recovery cards instead</button></div>
      <div style="color:var(--tomato-ink);font-size:13px;min-height:18px;margin-top:4px" id="lsErr"></div>
      <div class="btns" style="justify-content:space-between;align-items:center">
        <button type="button" class="linkbtn" id="lsReset" style="color:var(--tomato-ink)">Forgot passphrase? Reset</button>
        <button type="submit" class="btn primary">Unlock</button>
      </div>
    </form>
  </div>`;
  $("#lsTogCards").onclick = () => {
    useCards = !useCards;
    $("#lsPwBox").hidden = useCards;
    $("#lsSssBox").hidden = !useCards;
    $("#lsTogCards").textContent = useCards ? "Use passphrase instead" : "Unlock with 2 recovery cards instead";
  };
  $("#lsReset").onclick = () => {
    confirmDlg("Reset locked browser storage on this device? Only do this if you have a backup copy saved elsewhere.", () => {
      localStorage.removeItem(LOCK_KEY);
      localStorage.removeItem(KEY);
      browserLockPass = null; browserLockKey = null; browserLockSalt = null;
      S = {};
      ls.hidden = true;
      $("#mainWrap").hidden = false;
      norm(); render();
      toast("Browser storage reset");
    });
  };
  $("#lsForm").onsubmit = async ev => {
    ev.preventDefault();
    const err = $("#lsErr"); err.textContent = "";
    try {
      const pkg = JSON.parse(localStorage.getItem(LOCK_KEY) || "null");
      if (!pkg) throw new Error("No locked data found");
      const pass = useCards ? sssCombine2of3($("#lsC1").value, $("#lsC2").value) : $("#lsPw").value;
      if (!pass) throw new Error("Enter passphrase");
      const salt = unb64(pkg.salt);
      const key = await keyFrom(pass, salt);
      const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(pkg.iv) }, key, unb64(pkg.data));
      S = sanitizeState(JSON.parse(dec.decode(pt)));
      browserLockPass = pass;
      browserLockKey = key;
      browserLockSalt = salt;
      ls.hidden = true;
      $("#mainWrap").hidden = false;
      norm(); render(); startIdleLockTimer();
    } catch { err.textContent = "Wrong passphrase or recovery cards"; }
  };
}
function resetIdleLockTimer() {
  clearTimeout(idleTimer);
  if (browserLockPass) idleTimer = setTimeout(engageBrowserLockScreen, 15 * 60 * 1000);
}
let idleListenersBound = false;
function startIdleLockTimer() {
  if (!idleListenersBound) {
    ["pointerdown", "keydown"].forEach(ev => document.addEventListener(ev, resetIdleLockTimer, { passive: true }));
    idleListenersBound = true;
  }
  resetIdleLockTimer();
}
function lockBrowserDialog() {
  if (!hasCrypto()) return toast("Browser lock requires HTTPS, localhost, or Web Crypto support");
  if (browserLockPass) {
    openDlg(`<h3>Browser lock is active</h3>
      <p class="hint">Your data is encrypted in this browser and auto-locks after 15 minutes idle.</p>
      <div class="btns">
        <button type="button" class="btn" id="cancelDlg">Cancel</button>
        <button type="button" class="btn" id="unlockForever">Turn off lock</button>
        <button type="submit" class="btn primary" id="go">Lock now</button>
      </div>`);
    $("#cancelDlg").onclick = () => $("#dlg").close();
    $("#unlockForever").onclick = () => {
      clearTimeout(lockDebounceT);
      pendingLockSnap = null;
      browserLockPass = null;
      browserLockKey = null;
      browserLockSalt = null;
      clearTimeout(idleTimer);
      try { localStorage.setItem(KEY, JSON.stringify(S)); localStorage.removeItem(LOCK_KEY); } catch { toast("Storage full"); }
      $("#dlg").close(); render(); toast("Browser lock turned off");
    };
    $("#dlgForm").onsubmit = async ev => {
      ev.preventDefault();
      await flushLockSave();
      $("#dlg").close();
      engageBrowserLockScreen();
    };
    return;
  }
  openDlg(`<h3>Lock guide on this device</h3>
    <p class="hint">Encrypts what's stored in this browser (<code>localStorage</code>) and auto-locks after 15 minutes idle. Great for shared family laptops.</p>
    <label class="f"><span>Passphrase (at least 8 characters)</span><input type="password" id="lpw1" required></label>
    <div class="pass-tools"><button type="button" id="genLPw">Generate 6-word passphrase</button></div>
    <label class="f" style="margin-top:8px"><span>Type it again</span><input type="password" id="lpw2" required></label>
    ${btns("Enable lock")}`);
  $("#genLPw").onclick = () => {
    const pw = generatePassphrase(6);
    $("#lpw1").value = $("#lpw2").value = pw;
    $("#lpw1").type = $("#lpw2").type = "text";
  };
  onGo(async () => {
    const p = $("#lpw1").value;
    if (p.length < 8) return toast("Use at least 8 characters");
    if (p !== $("#lpw2").value) return toast("Passphrases don't match");
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await keyFrom(p, salt);
    browserLockPass = p;
    browserLockKey = key;
    browserLockSalt = salt;
    save(true, false);
    await flushLockSave();
    $("#dlg").close();
    startIdleLockTimer();
    render();
    toast("Browser lock enabled");
  });
}

function boot() {
  window.addEventListener?.("beforeinstallprompt", e => { e.preventDefault(); deferredInstallPrompt = e; syncInstallBtn(); });
  window.addEventListener?.("appinstalled", () => { deferredInstallPrompt = null; syncInstallBtn(); toast("Installed as an app"); });
  window.addEventListener?.("beforeunload", () => { flushLockSave(); });
  document.addEventListener?.("visibilitychange", () => { if (document.visibilityState === "hidden") flushLockSave(); });
  if (localStorage.getItem(LOCK_KEY) && !localStorage.getItem(KEY)) {
    engageBrowserLockScreen();
  } else {
    norm(); render();
  }
  if (typeof navigator !== "undefined" && "serviceWorker" in navigator && (location.protocol === "https:" || ["localhost", "127.0.0.1"].includes(location.hostname))) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
}

boot();
