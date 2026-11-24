/* Dual Node.js + JavaScriptCore (jsc) automated test suite for Our Family Field Guide Web App */
const isNode = typeof process !== "undefined" && !!(process.versions && process.versions.node);
const outPrint = typeof print === "function" ? print : console.log;

const els = {};
function makeEl(id) {
  return {
    id, value: "", textContent: "", innerHTML: "", className: "", hidden: false,
    style: {}, dataset: {}, scrollHeight: 80,
    classList: {
      _s: new Set(),
      add(c) { this._s.add(c); },
      remove(c) { this._s.delete(c); },
      toggle(c, f) { if (f === undefined) f = !this._s.has(c); f ? this._s.add(c) : this._s.delete(c); return f; },
      contains(c) { return this._s.has(c); }
    },
    querySelectorAll() { return []; }, querySelector() { return null; }, closest() { return null; },
    addEventListener() {}, showModal() {}, close() {}, focus() {}, scrollIntoView() {}, click() {}
  };
}
[
  "lockScreen", "mainWrap", "pct", "barfill", "rev", "demoBanner", "tabs",
  "searchbar", "searchIn", "searchRes", "regionSel", "modeBanner", "panels",
  "printSheet", "dlg", "dlgForm", "fileIn", "photoIn", "toast"
].forEach(id => { els[id] = makeEl(id); });

globalThis.window = globalThis;
globalThis.setTimeout = () => 1;
globalThis.clearTimeout = () => {};
globalThis.location = { protocol: "https:", hostname: "example.github.io" };
globalThis.scrollTo = () => {};
globalThis.CSS = { escape: s => String(s) };
globalThis.localStorage = {
  _m: {},
  getItem(k) { return this._m[k] || null; },
  setItem(k, v) { this._m[k] = String(v); },
  removeItem(k) { delete this._m[k]; }
};
globalThis.document = {
  body: makeEl("body"),
  activeElement: null,
  querySelector: s => s.startsWith("#") ? (els[s.slice(1)] || makeEl(s.slice(1))) : null,
  querySelectorAll: () => [],
  addEventListener: () => {},
  createElement: tag => makeEl(tag)
};
if (typeof TextEncoder === "undefined") {
  globalThis.TextEncoder = function() {
    this.encode = s => new Uint8Array(Array.from(String(s)).map(c => c.charCodeAt(0)));
  };
}
if (typeof TextDecoder === "undefined") {
  globalThis.TextDecoder = function() {
    this.decode = b => Array.from(b).map(x => String.fromCharCode(x)).join("");
  };
}

if (isNode) {
  const fs = require("fs");
  const path = require("path");
  const vm = require("vm");
  const root = path.resolve(__dirname, "..");
  // Expose const/let bindings cleanly inside current global context
  for (const fname of ["schema.js", "regions.js", "app.js"]) {
    const code = fs.readFileSync(path.join(root, fname), "utf8");
    vm.runInThisContext(code, { filename: fname });
  }
} else {
  load("schema.js");
  load("regions.js");
  load("app.js");
}

function assert(cond, msg) {
  if (!cond) throw new Error("ASSERT FAILED: " + msg);
}

// 1. Existing IDs + uniqueness checks
const seenIds = new Set();
TABS.forEach(t => t.blocks.forEach(b => {
  if (b.type === "fields") b.fields.forEach(f => { assert(!seenIds.has(f[0]), "dup field " + f[0]); seenIds.add(f[0]); });
  if (b.type === "list") { assert(!seenIds.has(b.id), "dup list " + b.id); seenIds.add(b.id); }
}));
GLANCE.forEach(g => { assert(!seenIds.has(g[0]), "dup glance " + g[0]); seenIds.add(g[0]); });
KIDS.forEach(k => { assert(!seenIds.has(k[0]), "dup kids " + k[0]); seenIds.add(k[0]); });
["q_first","m_monthly","accounts","invest","insurance","bills","debts","d_will","d_meds","fam_health","doclocs","kids_info"].forEach(id => assert(seenIds.has(id), "missing legacy id " + id));
["m_payout_first","crypto","h_diag","h_triage","h_redflag","h_devices","h_rescue","gov_ids","d_keepsakes","d_caregiver"].forEach(id => assert(seenIds.has(id), "missing new id " + id));

// 2. Playbooks, Scripts & Templates
assert(TABS.length === 6, "6 core tabs");
assert(Object.keys(PLAYBOOK).length === 7, "7 playbooks");
assert(PLAYBOOK.illness && PLAYBOOK.illness.phases.length === 3, "illness playbook");
assert(PLAYBOOK.windfall && PLAYBOOK.windfall.phases.length === 4, "windfall playbook");
assert(SCRIPTS.length === 10, "10 scripts");
assert(MONEY_GUIDE.length === 6, "6 money guide sections");
assert(PRO_FINDER.length === 5, "5 pro finder sections");
assert(SECTION_TEMPLATES[0].name.includes("Chronic & Critical Illness"), "illness template first");
const validTabs = new Set(TABS.map(t => t.id));
Object.values(PLAYBOOK).forEach(p => p.phases.forEach(ph => ph.steps.forEach(st => {
  if (st.refTab) assert(validTabs.has(st.refTab), "bad refTab " + st.refTab);
})));

// 3. Regions localization
assert(Object.keys(REGIONS).length === 9, "9 regions");
Object.entries(REGIONS).forEach(([k, r]) => {
  assert(r.moneyGuide && r.moneyGuide.depositCap && r.moneyGuide.taxNote && r.moneyGuide.fiduciaryName, "region moneyGuide " + k);
  assert(r.proFinder && r.proFinder.legal && r.proFinder.visa && r.proFinder.money && r.proFinder.tax, "region proFinder " + k);
});
S.region = "us"; norm();
const mgUs = renderMoneyGuideHtml(false);
assert(mgUs.includes("FDIC $250,000") && mgUs.includes("$1,000,000"), "US money guide text");
S.region = "in"; norm();
const mgIn = renderMoneyGuideHtml(true);
assert(mgIn.includes("₹5 lakh") && mgIn.includes("SEBI-Registered") && mgIn.includes("Sample ₹2 Crore"), "India money guide print text");

// 4. Seed & empty row hiding
S.region = "us"; S.lists = {}; S.f = {}; norm();
assert(isRowUserEdited("gov_ids", { idtype: "SSN / National ID (Me)" }) === false, "seed gov_ids untouched");
assert(isRowUserEdited("gov_ids", { who: "Alex", idtype: "SSN / National ID (Me)", last4: "1234" }) === true, "edited gov_ids");
assert(isRowUserEdited("crypto", {}) === false, "empty crypto");

// 5. Privacy & payout audits
S.f = { q_first: "Sam", q_binder: "Safe", d_phone: "Safe", d_2fa: "Keys", d_pm: "1P", d_will: "Safe", d_hcd: "Safe", d_fpoa: "Safe", q_life: "$1M" };
S.lists = {
  accounts: [{ inst: "Chase", type: "Checking", own: "Joint", last4: "1111" }],
  invest: [{ inst: "Vanguard", type: "401k", benef: "Spouse" }],
  insurance: [{ type: "Life", benef: "Spouse" }],
  crypto: [{ platform: "Ledger", assets: "1 BTC", access: "alpha bravo charlie delta echo foxtrot golf hotel india juliet kilo lima", helper: "" }],
  gov_ids: [{ who: "Me", idtype: "SSN", last4: "123-45-6789", where: "Safe" }]
};
let audit = computeAudit();
assert(audit.find(x => x.id === "crypto_safety")?.sev === "high", "catch 12-word crypto seed");
assert(audit.find(x => x.id === "gov_id_privacy")?.sev === "high", "catch full SSN");
assert(audit.find(x => x.id === "payout_plan")?.sev === "med", "flag missing payout guide when life insurance present");

S.lists.gov_ids = [{ who: "Me", idtype: "Aadhaar", last4: "1234 5678 9012", where: "Locker" }];
audit = computeAudit();
assert(audit.find(x => x.id === "gov_id_privacy")?.sev === "high", "catch full 12-digit Aadhaar");

S.f.m_payout_first = "Put in FDIC HYSAs and pause 6 months";
S.lists.crypto = [{ platform: "Ledger", assets: "0.5 BTC", access: "Metal plate in safe", helper: "Sam (555-0100)" }];
S.lists.gov_ids = [{ who: "Me", idtype: "SSN", last4: "4812", where: "Safe" }];
audit = computeAudit();
assert(audit.find(x => x.id === "crypto_safety")?.sev === "ok", "crypto ok");
assert(audit.find(x => x.id === "gov_id_privacy")?.sev === "ok", "gov_id ok");
assert(audit.find(x => x.id === "payout_plan")?.sev === "ok", "payout ok");

// 6. ER Grab Sheet & Executive Summary
S.f.h_diag = "Stage II Breast Cancer — TCHP";
S.f.h_triage = "Oncology Triage 206-555-0199";
S.f.h_redflag = "Fever >= 100.4F call BEFORE Tylenol";
S.f.h_devices = "Right chest port; NO BP/IV left arm";
S.f.h_rescue = "Zofran 4mg";
renderErGrabSheet();
assert(els.printSheet.innerHTML.includes("er-alert") && els.printSheet.innerHTML.includes("100.4F") && els.printSheet.innerHTML.includes("NO BP/IV left arm"), "ER sheet content");
const execHtml = renderExecutiveSummaryHtml(false);
assert(execHtml.includes("Active Illness / ER Alert") && execHtml.includes("Ledger") && execHtml.includes("*4812"), "Executive summary content");

// 7. Search coverage
["$1M", "fiduciary", "crypto", "SSN", "pacemaker", "fever", "AILA", "VITA", "notario", "EAP", "Dollar For"].forEach(q => {
  els.searchRes.innerHTML = "";
  runSearch(q);
  assert(!els.searchRes.hidden && els.searchRes._hits.length > 0, "search missed: " + q);
});

S.region = "us"; norm();
const pfUs = renderProFinderHtml(false);
assert(pfUs.includes("AILA") && pfUs.includes("VITA") && pfUs.includes("Dollar For"), "US proFinder text");
S.region = "in"; norm();
const pfIn = renderProFinderHtml(true);
assert(pfIn.includes("NALSA") && pfIn.includes("SEBI") && pfIn.includes("ICAI"), "India proFinder print text");
runSearch("NALSA");
assert(!els.searchRes.hidden && els.searchRes._hits.length === 1 && els.searchRes._hits[0].blockKey === "pro_finder", "India search NALSA single hit");

// 8. Shamir 2-of-3 cross-platform vector
const vec1 = "FFG-1-39F9-5E0D-03F8-66D0-86D0-D9C2-0FA9-4188-E876-6689-C6CF-BF9E-BAB4-368E-BEAC-AF";
const vec2 = "FFG-2-D15E-1AB5-909C-6914-BB18-3FE8-AAEA-3097-647A-7E7E-2613-C39C-F304-FABC-FDEC-D3";
const vec3 = "FFG-3-89CA-26DD-E149-6CA1-59A9-9407-C922-1F6B-E97E-76DA-8FAE-1E6B-3D9D-BE5B-3525-0E";
assert(sssCombine2of3(vec1, vec2) === "amber-cedar-lantern-orbit-river", "Shamir 1+2 vector");
assert(sssCombine2of3(vec2, vec3) === "amber-cedar-lantern-orbit-river", "Shamir 2+3 vector");
assert(sssCombine2of3(vec1, vec3) === "amber-cedar-lantern-orbit-river", "Shamir 1+3 vector");

// 9. Accessibility toggles & Standalone HTML syntax check
S.largeText = true; S.highContrast = true; render();
assert(document.body.classList.contains("large-text") && document.body.classList.contains("high-contrast"), "A+ and Contrast body classes applied");

const saHtml = buildStandaloneHtml({ app: "family-field-guide", v: 1, salt: "AA==", iv: "AA==", data: "AA==" });
const scripts = Array.from(saHtml.matchAll(/<script(?:[^>]*)>([\s\S]*?)<\/script>/gi));
assert(scripts.length === 3, "expected 3 script tags in standalone html");
new Function(scripts[2][1]);
assert(saHtml.includes("MONEY_GUIDE") && saHtml.includes("PRO_FINDER") && saHtml.includes("saMed"), "standalone exports new features");

// 10. Demo families & PWA helpers
S.region = "us_in"; loadDemo();
assert(S.lists.crypto.length >= 1 && S.lists.gov_ids.length >= 1 && S.f.m_payout_first, "us_in demo populated");
S.region = "us"; loadDemo();
assert(S.lists.crypto.length >= 1 && S.lists.gov_ids.length >= 1 && S.f.m_payout_first, "default demo populated");

assert(PROJECT_FILES.includes("icon-192.png") && PROJECT_FILES.includes("icon-512.png") && PROJECT_FILES.includes("apple-touch-icon.png"), "PROJECT_FILES includes PNG icons");
assert(isStandaloneApp() === false, "not standalone in mock");
deferredInstallPrompt = null;
installAppDialog();
assert(els.dlgForm.innerHTML.includes("iPhone / iPad") && !els.dlgForm.innerHTML.includes("doInstall"), "install guide without prompt");
deferredInstallPrompt = { prompt: () => Promise.resolve(), userChoice: Promise.resolve({ outcome: "accepted" }) };
installAppDialog();
assert(els.dlgForm.innerHTML.includes("doInstall"), "install guide shows prompt button");
window.navigator = { standalone: true };
assert(isStandaloneApp() === true, "PWA standalone mode counts as standalone app");
delete window.navigator;

assert(safeImgUrl("javascript:alert(1)") === "", "reject javascript URI in photo");
assert(safeImgUrl("data:text/html;base64,PHNjcmlwdD4=") === "", "reject html data URI in photo");
assert(safeImgUrl("data:image/jpeg;base64,/9j/4AAQ") === "data:image/jpeg;base64,/9j/4AAQ", "accept valid image data URI");

outPrint("ALL_WEB_TESTS_PASSED");
