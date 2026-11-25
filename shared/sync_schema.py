#!/usr/bin/env python3
"""
Single source of truth: shared/guide-data.json.
Generates schema.js and regions.js for the zero-build Web PWA and copies
shared/guide-data.json into all 4 native app resource bundles.
Uses only Python's standard library (zero external dependencies).
"""
import json
import os
import shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE_JSON = os.path.join(ROOT, "shared", "guide-data.json")
SCHEMA_JS = os.path.join(ROOT, "schema.js")
REGIONS_JS = os.path.join(ROOT, "regions.js")

TARGETS = [
    os.path.join(ROOT, "native", "apple", "Sources", "FamilyGuideCore", "Resources", "guide-data.json"),
    os.path.join(ROOT, "native", "android", "app", "src", "main", "assets", "guide-data.json"),
    os.path.join(ROOT, "native", "windows", "FamilyGuide.Core", "Resources", "guide-data.json"),
    os.path.join(ROOT, "native", "linux", "crates", "core", "assets", "guide-data.json"),
]

SCHEMA_KEYS = [
    "PLAYBOOK", "SCRIPTS", "MONEY_GUIDE", "PRO_FINDER", "TABS",
    "GLANCE", "KIDS", "ESSENTIALS", "SECTION_TEMPLATES", "FIRE_DRILL",
]
REGION_KEYS = ["REGIONS", "DEMO_FAMILIES", "DICE_WORDS"]
EXPORT_KEYS = SCHEMA_KEYS + REGION_KEYS


def render_js_module(header: str, data: dict, keys: list) -> str:
    parts = [header.rstrip() + "\n"]
    for k in keys:
        if k not in data:
            raise KeyError(f"Missing required key {k!r} in shared/guide-data.json")
        payload = json.dumps(data[k], indent=2, ensure_ascii=False)
        parts.append(f"const {k} = {payload};\n")
    return "\n".join(parts)


def run_export():
    with open(SOURCE_JSON, "r", encoding="utf-8") as f:
        data = json.load(f)

    schema_header = (
        "/* AUTO-GENERATED from shared/guide-data.json — do not edit directly.\n"
        "   Edit shared/guide-data.json and run `python3 shared/sync_schema.py`. */"
    )
    regions_header = (
        "/* AUTO-GENERATED from shared/guide-data.json — do not edit directly.\n"
        "   Edit shared/guide-data.json and run `python3 shared/sync_schema.py`. */"
    )

    with open(SCHEMA_JS, "w", encoding="utf-8") as f:
        f.write(render_js_module(schema_header, data, SCHEMA_KEYS))
    with open(REGIONS_JS, "w", encoding="utf-8") as f:
        f.write(render_js_module(regions_header, data, REGION_KEYS))

    for dst in TARGETS:
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy2(SOURCE_JSON, dst)
        print("Synced:", os.path.relpath(dst, ROOT))
    print(
        f"Synced {len(data['TABS'])} tabs, {len(data['PLAYBOOK'])} playbooks, "
        f"{len(data['REGIONS'])} regions from shared/guide-data.json -> schema.js, regions.js, native/"
    )


if __name__ == "__main__":
    run_export()
