#!/usr/bin/env python3
"""
Exports schema.js and regions.js into shared/guide-data.json and copies it
into native app resource bundles so Web and all Pure Native apps share one
single source of truth.
"""
import json, os, shutil, subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JSC = "/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc"
OUT_MAIN = os.path.join(ROOT, "shared", "guide-data.json")
TARGETS = [
    os.path.join(ROOT, "native", "apple", "Sources", "FamilyGuideCore", "Resources", "guide-data.json"),
    os.path.join(ROOT, "native", "android", "app", "src", "main", "assets", "guide-data.json"),
    os.path.join(ROOT, "native", "windows", "FamilyGuide.Core", "Resources", "guide-data.json"),
    os.path.join(ROOT, "native", "linux", "crates", "core", "assets", "guide-data.json"),
]

JS_DUMP = r'''
load(SCHEMA_PATH);
load(REGIONS_PATH);
const payload = {
  TABS, PLAYBOOK, SCRIPTS, MONEY_GUIDE, PRO_FINDER, GLANCE, KIDS,
  ESSENTIALS, SECTION_TEMPLATES, FIRE_DRILL, REGIONS, DEMO_FAMILIES, DICE_WORDS
};
print(JSON.stringify(payload, null, 2));
'''

NODE_DUMP = r'''
const fs = require("fs");
const vm = require("vm");
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(process.argv[1], "utf8") + "\n" + fs.readFileSync(process.argv[2], "utf8"), ctx);
console.log(vm.runInContext("JSON.stringify({ TABS, PLAYBOOK, SCRIPTS, MONEY_GUIDE, PRO_FINDER, GLANCE, KIDS, ESSENTIALS, SECTION_TEMPLATES, FIRE_DRILL, REGIONS, DEMO_FAMILIES, DICE_WORDS }, null, 2)", ctx));
'''

def run_export():
    schema_js = os.path.join(ROOT, "schema.js")
    regions_js = os.path.join(ROOT, "regions.js")
    if os.path.exists(JSC):
        script = f'const SCHEMA_PATH = {json.dumps(schema_js)}; const REGIONS_PATH = {json.dumps(regions_js)};\n' + JS_DUMP
        res = subprocess.run([JSC, "-e", script], capture_output=True, text=True, encoding="utf-8", check=True)
        raw = res.stdout
    else:
        res = subprocess.run(["node", "-e", NODE_DUMP, schema_js, regions_js], capture_output=True, text=True, encoding="utf-8", check=True)
        raw = res.stdout

    data = json.loads(raw)
    formatted = json.dumps(data, indent=2, ensure_ascii=False) + "\n"
    os.makedirs(os.path.dirname(OUT_MAIN), exist_ok=True)
    with open(OUT_MAIN, "w", encoding="utf-8") as f:
        f.write(formatted)
    for dst in TARGETS:
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy2(OUT_MAIN, dst)
        print("Synced:", os.path.relpath(dst, ROOT))
    print(f"Exported {len(data['TABS'])} tabs, {len(data['PLAYBOOK'])} playbooks, {len(data['REGIONS'])} regions -> shared/guide-data.json")

if __name__ == "__main__":
    run_export()
