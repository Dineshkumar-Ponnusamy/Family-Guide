/* Headless Chromium E2E test suite for Our Family Field Guide Web PWA */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};

function assert(cond, msg) {
  if (!cond) throw new Error("E2E ASSERT FAILED: " + msg);
}

const server = http.createServer((req, res) => {
  const cleanUrl = (req.url || "/").split("?")[0];
  const rel = cleanUrl === "/" ? "index.html" : cleanUrl.replace(/^\/+/, "");
  const fp = path.resolve(ROOT, rel);
  if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }
  const ext = path.extname(fp).toLowerCase();
  res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
  fs.createReadStream(fp).pipe(res);
});

await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const { port } = server.address();
const baseUrl = `http://127.0.0.1:${port}`;

let browser;
try {
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
  const errors = [];
  page.on("pageerror", err => errors.push(err.message));

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  assert((await page.title()).includes("Our Family Field Guide"), "page title");

  // 1. Load Sample Family demo & toggle Read mode
  await page.click('[data-act="loadDemo"]');
  await page.waitForSelector(".demo-banner.active");
  await page.click('[data-act="toggleRead"]');
  assert(await page.evaluate(() => document.body.classList.contains("read-mode")), "read mode toggled");
  await page.click('[data-act="toggleRead"]');

  // 2. WAI-ARIA tab keyboard navigation (ArrowRight)
  await page.focus('#tab-start');
  await page.keyboard.press("ArrowRight");
  const activeTabId = await page.evaluate(() => document.activeElement?.id || "");
  assert(activeTabId && activeTabId !== "tab-start", "ArrowRight moved focus to next tab");

  // 3. Search combobox & Escape
  await page.fill("#searchIn", "fiduciary");
  await page.waitForSelector("#searchRes .sr-item");
  assert((await page.getAttribute("#searchIn", "aria-expanded")) === "true", "search aria-expanded=true");
  await page.keyboard.press("Escape");
  assert((await page.getAttribute("#searchIn", "aria-expanded")) === "false", "Escape closes search");

  // 4. Real Web Crypto Browser Lock -> Lock Now -> DOM wipe -> Unlock
  await page.click('[data-act="lockBrowser"]');
  await page.fill("#lpw1", "amber-cedar-lantern-orbit");
  await page.fill("#lpw2", "amber-cedar-lantern-orbit");
  await page.click('#dlgForm button[type="submit"]');
  await page.waitForFunction(() => document.querySelector('[data-act="lockBrowser"]')?.textContent?.includes("Locked"));

  await page.click('[data-act="lockBrowser"]');
  await page.click('#dlgForm button[type="submit"]');
  await page.waitForSelector("#lockScreen:not([hidden])");
  assert((await page.evaluate(() => document.getElementById("panels").innerHTML)) === "", "panels wiped on lock");

  await page.fill("#lsPw", "amber-cedar-lantern-orbit");
  await page.click('#lsForm button[type="submit"]');
  await page.waitForSelector("#mainWrap:not([hidden])");
  assert((await page.evaluate(() => document.getElementById("panels").innerHTML.length)) > 100, "panels restored on unlock");

  // 5. Mobile viewport: single-row slim tab bar & unstick while editing
  await page.setViewportSize({ width: 390, height: 844 });
  const navH = await page.evaluate(() => Math.round(document.getElementById("tabs").getBoundingClientRect().height));
  assert(navH > 24 && navH <= 60, `mobile nav.tabs should be single-row (got ${navH}px)`);
  await page.focus('#panels input[data-f]');
  assert(await page.evaluate(() => document.body.classList.contains("mobile-editing")), "mobile-editing class active on input focus");

  assert(errors.length === 0, "Zero page errors expected, got: " + errors.join("; "));
  console.log("ALL_PLAYWRIGHT_E2E_CHECKS_PASSED");
} finally {
  if (browser) await browser.close();
  server.close();
}
