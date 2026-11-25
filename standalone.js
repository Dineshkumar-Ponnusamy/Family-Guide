/* FAMILY FIELD GUIDE · STANDALONE HTML BACKUP BUILDER
   Generates self-contained offline encrypted .html backups with network-blocking CSP. */
function buildStandaloneHtml(pkg) {
  const schemaData = { TABS, PLAYBOOK, SCRIPTS, GLANCE, KIDS, MONEY_GUIDE: typeof MONEY_GUIDE !== "undefined" ? MONEY_GUIDE : [], PRO_FINDER: typeof PRO_FINDER !== "undefined" ? PRO_FINDER : [], REGIONS: typeof REGIONS !== "undefined" ? REGIONS : {} };
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; form-action 'none'; base-uri 'none';">
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

