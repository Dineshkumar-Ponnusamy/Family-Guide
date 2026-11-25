/* FAMILY FIELD GUIDE · CRYPTO & SHAMIR 2-OF-3
   Web Crypto AES-256-GCM / PBKDF2-HMAC-SHA256, 66-bit Diceware, and GF(256) Shamir Split. */
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
