# Desktop App Wrapper (Tauri v2 — Mac, Windows & Linux)

This optional wrapper packages the **exact same offline HTML/CSS/JS app** from the repository root into lightweight native desktop installers (`.dmg`, `.msi`/`.exe`, `.AppImage`/`.deb`) using **Tauri v2**, while keeping the root web app 100% dependency-free.

## Prerequisites

- **Node.js 20+** and **Rust (stable)**
- **macOS:** Xcode Command Line Tools (`xcode-select --install`)
- **Windows:** Microsoft C++ Build Tools + WebView2 (preinstalled on Windows 10/11)
- **Linux (Debian/Ubuntu):** `sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf`

## Run or Build Locally

```bash
cd desktop
npm install
npm run icons   # Generates .icns, .ico, and PNG bundle icons from ../icon-512.png
npm run dev     # Launches the desktop window
```

To build native installers on your current OS:

```bash
cd desktop
npm run build
```

Built installers appear under `desktop/src-tauri/target/release/bundle/`.

## Automated GitHub Actions Builds

You do **not** need Windows or Linux machines locally to build all three platforms:

- **Test build anytime:** Go to GitHub **Actions → Build Desktop App (Tauri) → Run workflow** to compile macOS Universal (`.dmg`), Windows (`.msi`/`.exe`), and Linux (`.AppImage`/`.deb`) and download them as workflow artifacts.
- **Publish a GitHub Release:** Push a version tag (for example `git tag v1.0.0 && git push origin v1.0.0`) to create a draft GitHub Release with installers attached for all 3 platforms.

## Note on Unsigned Installers

Unless you configure Apple Developer / Windows Authenticode signing secrets in GitHub, open-source community builds are unsigned:
- **macOS:** Right-click the app → **Open** (or allow under *System Settings → Privacy & Security*).
- **Windows:** Click **More info → Run anyway** on the SmartScreen prompt.
- Or skip desktop installers completely and use the **PWA / standalone `.html`** in the repository root with zero warnings.
