#!/usr/bin/env python3
"""
Exports schema.js and regions.js into shared/guide-data.json and copies it
into native app resource bundles so Web and all Pure Native apps share one
single source of truth. Uses only Python's standard library (zero external
runtime or system library dependencies).
"""
import json
import os
import shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_MAIN = os.path.join(ROOT, "shared", "guide-data.json")
TARGETS = [
    os.path.join(ROOT, "native", "apple", "Sources", "FamilyGuideCore", "Resources", "guide-data.json"),
    os.path.join(ROOT, "native", "android", "app", "src", "main", "assets", "guide-data.json"),
    os.path.join(ROOT, "native", "windows", "FamilyGuide.Core", "Resources", "guide-data.json"),
    os.path.join(ROOT, "native", "linux", "crates", "core", "assets", "guide-data.json"),
]
EXPORT_KEYS = [
    "TABS", "PLAYBOOK", "SCRIPTS", "MONEY_GUIDE", "PRO_FINDER", "GLANCE", "KIDS",
    "ESSENTIALS", "SECTION_TEMPLATES", "FIRE_DRILL", "REGIONS", "DEMO_FAMILIES", "DICE_WORDS",
]


class _JsStaticParser:
    """Minimal parser for top-level static `const NAME = <literal>;` JS data files."""

    def __init__(self, text: str):
        self.s = text
        self.n = len(text)
        self.i = 0

    def _skip_ws_and_comments(self) -> None:
        s, n = self.s, self.n
        while self.i < n:
            ch = s[self.i]
            if ch in " \t\r\n":
                self.i += 1
            elif s.startswith("//", self.i):
                end = s.find("\n", self.i + 2)
                self.i = n if end == -1 else end + 1
            elif s.startswith("/*", self.i):
                end = s.find("*/", self.i + 2)
                if end == -1:
                    raise ValueError(f"Unterminated block comment at {self.i}")
                self.i = end + 2
            else:
                break

    def _read_ident(self) -> str:
        start = self.i
        s, n = self.s, self.n
        if start < n and (s[start].isalpha() or s[start] in "_$"):
            self.i += 1
            while self.i < n and (s[self.i].isalnum() or s[self.i] in "_$"):
                self.i += 1
            return s[start:self.i]
        raise ValueError(f"Expected identifier at offset {self.i}: {s[self.i:self.i+24]!r}")

    def _read_string(self) -> str:
        s, n = self.s, self.n
        quote = s[self.i]
        self.i += 1
        out = []
        escapes = {"n": "\n", "r": "\r", "t": "\t", "b": "\b", "f": "\f", "\\": "\\", "/": "/", "'": "'", '"': '"'}
        while self.i < n:
            ch = s[self.i]
            if ch == quote:
                self.i += 1
                return "".join(out)
            if ch == "\\":
                self.i += 1
                esc = s[self.i]
                self.i += 1
                if esc in escapes:
                    out.append(escapes[esc])
                elif esc == "u":
                    if s[self.i:self.i+1] == "{":
                        end = s.index("}", self.i + 1)
                        out.append(chr(int(s[self.i + 1:end], 16)))
                        self.i = end + 1
                    else:
                        out.append(chr(int(s[self.i:self.i + 4], 16)))
                        self.i += 4
                elif esc == "x":
                    out.append(chr(int(s[self.i:self.i + 2], 16)))
                    self.i += 2
                else:
                    out.append(esc)
            else:
                out.append(ch)
                self.i += 1
        raise ValueError("Unterminated string literal")

    def _read_number(self):
        start = self.i
        s, n = self.s, self.n
        if s[self.i] == "-":
            self.i += 1
        is_float = False
        while self.i < n and s[self.i].isdigit():
            self.i += 1
        if self.i < n and s[self.i] == ".":
            is_float = True
            self.i += 1
            while self.i < n and s[self.i].isdigit():
                self.i += 1
        if self.i < n and s[self.i] in "eE":
            is_float = True
            self.i += 1
            if self.i < n and s[self.i] in "+-":
                self.i += 1
            while self.i < n and s[self.i].isdigit():
                self.i += 1
        token = s[start:self.i]
        return float(token) if is_float else int(token)

    def _read_value(self):
        self._skip_ws_and_comments()
        ch = self.s[self.i]
        if ch == "{":
            return self._read_object()
        if ch == "[":
            return self._read_array()
        if ch in ('"', "'"):
            return self._read_string()
        if ch == "-" or ch.isdigit():
            return self._read_number()
        ident = self._read_ident()
        if ident == "true":
            return True
        if ident == "false":
            return False
        if ident == "null":
            return None
        raise ValueError(f"Unsupported JS literal identifier {ident!r} at offset {self.i}")

    def _read_array(self):
        self.i += 1  # '['
        items = []
        while True:
            self._skip_ws_and_comments()
            if self.s[self.i] == "]":
                self.i += 1
                return items
            items.append(self._read_value())
            self._skip_ws_and_comments()
            if self.s[self.i] == ",":
                self.i += 1
            elif self.s[self.i] == "]":
                self.i += 1
                return items
            else:
                raise ValueError(f"Expected ',' or ']' at offset {self.i}: {self.s[self.i:self.i+24]!r}")

    def _read_object(self):
        self.i += 1  # '{'
        obj = {}
        while True:
            self._skip_ws_and_comments()
            if self.s[self.i] == "}":
                self.i += 1
                return obj
            if self.s[self.i] in ('"', "'"):
                key = self._read_string()
            else:
                key = self._read_ident()
            self._skip_ws_and_comments()
            if self.s[self.i] != ":":
                raise ValueError(f"Expected ':' after key {key!r} at offset {self.i}")
            self.i += 1
            obj[key] = self._read_value()
            self._skip_ws_and_comments()
            if self.s[self.i] == ",":
                self.i += 1
            elif self.s[self.i] == "}":
                self.i += 1
                return obj
            else:
                raise ValueError(f"Expected ',' or '}}' at offset {self.i}: {self.s[self.i:self.i+24]!r}")

    def parse_top_level(self) -> dict:
        env = {}
        while True:
            self._skip_ws_and_comments()
            if self.i >= self.n:
                return env
            kw = self._read_ident()
            if kw not in ("const", "let", "var"):
                raise ValueError(f"Expected const/let/var at offset {self.i}, got {kw!r}")
            self._skip_ws_and_comments()
            name = self._read_ident()
            self._skip_ws_and_comments()
            if self.s[self.i] != "=":
                raise ValueError(f"Expected '=' after {name!r} at offset {self.i}")
            self.i += 1
            env[name] = self._read_value()
            self._skip_ws_and_comments()
            if self.i < self.n and self.s[self.i] == ";":
                self.i += 1


def run_export():
    parsed = {}
    for fname in ("schema.js", "regions.js"):
        with open(os.path.join(ROOT, fname), "r", encoding="utf-8") as f:
            parsed.update(_JsStaticParser(f.read()).parse_top_level())

    data = {k: parsed[k] for k in EXPORT_KEYS}
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
