import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(here, "..");
const distDir = path.join(here, "dist");

const RUNTIME_ASSETS = [
  "index.html",
  "styles.css",
  "schema.js",
  "regions.js",
  "app.js",
  "manifest.json",
  "sw.js",
  "icon.svg",
  "icon-192.png",
  "icon-512.png",
  "apple-touch-icon.png"
];

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });

for (const file of RUNTIME_ASSETS) {
  const src = path.join(rootDir, file);
  const dst = path.join(distDir, file);
  if (!fs.existsSync(src)) {
    console.error(`Missing required web asset: ${src}`);
    process.exit(1);
  }
  fs.copyFileSync(src, dst);
}

console.log(`Synced ${RUNTIME_ASSETS.length} runtime web assets into ${distDir}`);
