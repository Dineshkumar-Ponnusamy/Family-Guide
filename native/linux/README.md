# Pure Native Linux App (Rust + GTK4)

A **100% native Linux desktop app** written in pure **Rust + GTK4** (`gtk4-rs`) with **zero WebView, zero Node.js runtime, and zero network requests**.

## Architecture

- **`crates/core` (`family-guide-core`)**: Pure Rust library (zero GTK dependencies) providing:
  - Embedded single-source-of-truth schema & 9 region presets from [`shared/guide-data.json`](../../shared/guide-data.json)
  - Exact byte-for-byte backup & recovery interop (`PBKDF2-HMAC-SHA256` 250,000 rounds + `AES-256-GCM` + standalone `.html` `<script id="ffg-pkg">` extraction + `GF(256)` 2-of-3 Shamir Split `FFG-1-...`)
  - Local XDG persistence (`$XDG_DATA_HOME/family-field-guide/state.json` with `0600` file permissions)
  - Readiness & Privacy Audits (flagging raw crypto seed phrases, full SSNs, and 12-digit Aadhaar numbers)
  - Full search, **Two-Spouse Smart Merge**, and plain-text **1-Page Executive Summary** / **1-Page ER Grab Sheet** exports
- **`crates/gtk-app` (`family-field-guide`)**: Pure native GTK4 desktop interface (`gtk4` 4.12+):
  - Warm paper editorial CSS theme, `Read Mode`, `A+` large text, high-contrast mode, and instant lock screen
  - Interactive 7-track playbooks, localized **Money Guide** & **Finding Help** directories, **+ Section** templates, **Save/Open/Merge Backup** via native `gtk4::FileDialog`

## Build & Run Locally (Ubuntu / Debian / Fedora / Arch)

### Ubuntu 24.04+ / Debian
```bash
sudo apt-get update && sudo apt-get install -y libgtk-4-dev pkg-config build-essential
```

### Fedora
```bash
sudo dnf install gtk4-devel pkg-config gcc
```

### Arch Linux
```bash
sudo pacman -S gtk4 pkgconf base-devel
```

### Test Core Logic & Launch App
```bash
python3 ../../shared/sync_schema.py
cargo test -p family-guide-core
cargo run -p family-guide-gtk
```

Automated release builds and unit tests also run via GitHub Actions on `ubuntu-24.04` in [`.github/workflows/linux.yml`](../../.github/workflows/linux.yml).
