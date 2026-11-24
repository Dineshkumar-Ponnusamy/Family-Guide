# Expert Review Board: Our Family Field Guide

**Reviewed Repository:** `Dineshkumar-Ponnusamy/Family-Guide` (`main` @ `b63a283`, tagged `v1.0.0`)  
**Review Date:** 2026-11-24

---

## Phase 1: App Summary

- **Purpose:** *Our Family Field Guide* is a 100% offline, zero-server emergency, chronic/critical illness care, and digital legacy guide. It equips a spouse, partner, or caregiver with immediate action playbooks, emergency contacts, legal/financial/ID location pointers (last 4 digits only), phone/2FA unlock notes, a beginner's guide to handling large insurance payouts, and a dedicated kids/caregiver reference.
- **Target Users:** Households preparing for sudden emergencies, incapacitation, chronic/critical illness (2 AM ER trips), job loss, or bereavement—with standout specialization for cross-border / work-visa families (e.g., US + India H-1B/H-4/NRI), financially inexperienced surviving spouses, and privacy-conscious users who refuse cloud accounts.
- **Tech Stack (~16,928 LOC across 5 languages / 6 platforms):**
  - **Web / PWA (~4,188 LOC):** Zero-build, zero-dependency Vanilla HTML (`index.html`), CSS (`styles.css`), JS (`schema.js`, `regions.js`, `app.js`, `sw.js`, `manifest.json`) using Web Crypto (`PBKDF2-HMAC-SHA256`, 250k rounds + `AES-256-GCM`) and Service Worker caching (`ffg-v8`).
  - **Shared Single Source of Truth:** `schema.js` + `regions.js` exported via `shared/sync_schema.py` into `shared/guide-data.json` (copied into all 4 native resource bundles), plus `shared/design-tokens.json` and `shared/BACKUP_FORMAT.md`.
  - **Apple (macOS 14+ / iOS 17+, ~2,069 LOC):** Pure Swift + SwiftUI + CryptoKit + CommonCrypto + LocalAuthentication (`native/apple/`).
  - **Android (8.0+ / API 26+, ~2,416 LOC):** Kotlin 2.0 + Jetpack Compose + Material 3 + AndroidX Biometric + `kotlinx.serialization`, with zero `<uses-permission>` entries (`native/android/`).
  - **Windows (x64, ~2,135 LOC):** C# + .NET 8 + WPF (`native/windows/`).
  - **Linux (x86_64, ~4,750 LOC):** Rust + `gtk4-rs` (`family-guide-core` + `family-guide-gtk`, `native/linux/`).
- **Architecture Overview:** Local-first, serverless architecture. All 6 platforms embed the same canonical JSON schema (6 core tabs, 7 emergency playbooks, 9 country/cross-border presets, 6-part Money Guide, 5-part Pro Finder, 10 call scripts, 8 section templates, 256 Diceware words) and exchange state via a byte-for-byte `familyFieldGuide.v1` encrypted JSON envelope (plus Web-exported standalone self-contained `.html` files embedding `<script id="ffg-pkg">`) and `GF(256)` 2-of-3 Shamir Secret Sharing recovery cards (`FFG-1-...`), with two-spouse Smart Merge.
- **Current Maturity:** **Early v1.0.0 prototype / ambitious solo MVP.** Git history shows 21 commits over 2 days (`2026-11-23` to `2026-11-24`) by a single author (`Dineshkumar Ponnusamy`). The Web PWA is feature-rich and deeply thoughtful; the 4 native ports were built rapidly in parallel and carry major security, storage, release-packaging, and feature-parity gaps.
- **Local Verification Executed (Read-Only):**
  - `python3 tests/test_design_parity.py` → **PASS** (`ALL_DESIGN_AND_UX_PARITY_CHECKS_PASSED`)
  - `/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc tests/web_tests.js` → **PASS** (`ALL_WEB_TESTS_PASSED`)
  - WCAG 2.1 contrast audit via Python script against `styles.css` tokens → **6 default-theme contrast failures found** (`#b9b4a6` on `#fffdf8` = `2.04:1`; `--mute` on `--paper` = `2.94:1`; `--mute` on `--card` = `3.26:1`; `--tomato` on `--paper` = `3.76:1`; `#7f948a` on `--ink` = `3.82:1`; white on `--tomato` = `4.24:1`; High Contrast mode passes at `6.37:1`–`10.09:1`).
  - **Not verified locally (sandbox/environment limits):** `node` (`operation not permitted` in sandbox; JS suite ran via `jsc` instead), `swift test` (sandbox blocked writing Clang `ModuleCache` in `/var/folders/...`), `cargo test` (skipped to avoid creating untracked lockfile/network fetches), and `gradle` / `dotnet` (`operation not permitted`). Native findings relying on runtime test execution are marked accordingly.

---

## Phase 2: Persona Reviews

### 1. Software Architect

- **Verdict:** The single-source-of-truth JSON schema and cross-platform cryptographic wire spec are genuinely smart, but manually re-implementing 100% of business logic, UI, search, audit, and merge across 5 separate languages has already caused silent parity rot and cross-platform contract bugs.
- **Score:** 5/10 — Strong data-driven core design undermined by unsustainable 5x manual duplication and a 2,492-line monolithic `app.js`.

#### Strengths
- **Canonical schema export pipeline:** `schema.js` and `regions.js` compile cleanly into `shared/guide-data.json` via `shared/sync_schema.py:38-58`, keeping 6 tabs, 7 playbooks, and 9 region presets synchronized across platforms without renaming stable state IDs (`CONTRIBUTING.md:8`).
- **Clear cryptographic & backup wire specification:** `shared/BACKUP_FORMAT.md:5-54` specifies exact PBKDF2 rounds (`250,000`), salt/IV sizes, `ciphertext || tag` layout, and `GF(256)` polynomial (`0x1b`), enabling true cross-device encrypted file exchange.
- **Design token parity enforcement:** `shared/design-tokens.json:4-48` paired with `tests/test_design_parity.py:26-151` ensures consistent palette, typography, logo geometry, and canonical ordering across all 6 apps.

#### Issues
| Severity | Finding | Evidence | Recommendation |
|---|---|---|---|
| **Critical** | **5x manual re-implementation causes immediate parity & merge divergence:** None of the 4 native `applyMerge` implementations merge `photos`, `fireDrill`, `lastDryRun`, or `reviewed`, and none of the 4 native UIs render `photos` at all—silently dropping Web data on cross-device sync or UI display. | `app.js:2267-2285` merges `photos`, `fireDrill`, `lastDryRun`, `reviewed`; omitted in `GuideStore.swift:518-576`, `GuideStore.kt:491-547`, `GuideStore.cs:502-556`, `store.rs:1224-1328`. No `photos` block handler in `TabContentView.swift:31-55`, `FamilyGuideScreen.kt:278-498`, `MainWindow.xaml.cs`, or `main.rs:892`. | Consolidate native core logic (`CryptoEngine`, `GuideStore`, audit, search, merge, exports) into `family-guide-core` exposed via UniFFI/C-ABI, or focus exclusively on Web PWA + a single wrapped shell. |
| **High** | **Monolithic 2,492-line global-scope `app.js`:** Mixes DOM rendering, event delegation, state persistence, crypto, Shamir math, photo compression, merge, print sheets, and an embedded 365-line string-interpolated HTML mini-app in one file. | `app.js:1-2492`; `buildStandaloneHtml` at `app.js:1702-2066` duplicates `esc`, `linkify`, `isRowFilled`, `gfMul/Pow/Div`, search, and print sheets as template strings. | Split `app.js` into focused ES modules (bundled with a tiny offline build or clean `<script type="module">` / buildless IIFE concat) and extract a shared standalone viewer template. |
| **High** | **Cross-platform contract & doc drift:** Linux writes sentinel strings `"completed"` and `"saved"` into `lastDryRun` and `lastBackup` instead of ISO-8601 timestamps, breaking Web's date parsing and `S.updated > S.lastBackup` checks. Docs also claim all apps export standalone `.html` backups, but all 4 native apps export `.json` only. | `dialogs.rs:287, 438` vs. `app.js:674-685, 710` (`new Date(S.lastBackup)` and lexicographical `S.updated > S.lastBackup`). `README.md:26, 87` vs. `SheetsView.swift:206`, `MainActivity.kt:28, 74`, `Dialogs.cs:131`, `dialogs.rs:391`. | Enforce strict schema contracts (ISO-8601 timestamps, nullable types) with shared golden JSON fixtures, and align docs or implement `.html` export on native. |
| **Medium** | **`localStorage` architectural ceiling for photo blobs:** Storing up to 10 base64-encoded JPEGs (`~80–120 KB` each, ~1.3x base64 overhead) inside `localStorage` (`~5 MB` browser cap) creates an architectural ceiling with no binary storage separation. | `app.js:110, 1651, 1682` (`localStorage.setItem(KEY, JSON.stringify(S))` with `S.photos` data URLs). | Migrate Web persistence to IndexedDB (storing encrypted or structured state cleanly beyond 5 MB) with `localStorage` fallback. |
| **Medium** | **No state schema version or migration pipeline:** Only the encrypted envelope has `"v": 1` (`BACKUP_FORMAT.md:10`); the inner `GuideState` (`BACKUP_FORMAT.md:40-54`) has no `schemaVersion` or migration step for future structural changes. | `app.js:22-42`, `BACKUP_FORMAT.md:40-54`. | Add `stateVersion: 1` inside `GuideState` and explicit idempotent migrations inside `norm()` / native `normalize()`. |

#### Top 3 Actions
1. Consolidate core domain logic into one shared engine (e.g., Rust `family-guide-core` via UniFFI) or formally scope native ports down rather than maintaining 5 parallel implementations.
2. Refactor `app.js` into clean modules and eliminate the duplicated standalone HTML string-template logic.
3. Add a formal JSON Schema + golden cross-platform round-trip test suite covering timestamps, photos, merge, and state normalization.

#### Questions for the Creator
1. Why did you replace the earlier Tauri desktop wrapper (`f860356`) with 4 separate pure-native UI/Core implementations (`be8f66e`)?
2. Are you open to binding `native/linux/crates/core` via UniFFI for Apple/Android/Windows so business logic is written once?

---

### 2. Experienced Senior Software Engineer

- **Verdict:** Individual functions are clean and well-intentioned, but there are severe runtime reliability and data-loss hazards—most critically queuing 250,000-round PBKDF2 on every keystroke while deleting plaintext `localStorage` prematurely.
- **Score:** 5/10 — Pragmatic, readable domain code let down by critical async/storage bugs, Linux timestamp corruption, and shallow stub-only test coverage.

#### Strengths
- **Thoughtful seed-row filtering:** `isRowUserEdited` (`app.js:145-165`) and its native ports avoid polluting Read Mode, completion meters, and Executive Summaries with untouched template rows or Quick-Add chips.
- **Defensive HTML & photo escaping:** `esc` (`app.js:13`), `safeImgUrl` (`app.js:14`), and `safeJson` (`app.js:15`) consistently guard rendered strings and `<script>` tag termination.
- **Atomic file writes on Linux & Apple:** `store.rs:86-94` writes to a `.json.tmp` file with `0600` permissions before `fs::rename`, and `GuideStore.swift:50` uses `.atomic`.

#### Issues
| Severity | Finding | Evidence | Recommendation |
|---|---|---|---|
| **Critical** | **Browser-lock `save()` runs 250k PBKDF2 on every keystroke and deletes plaintext before async write completes:** Every `input` event invokes `save()` (`app.js:903, 912`), which synchronously calls `localStorage.removeItem(KEY)` (`app.js:101`) and queues `deriveKey` (250,000 PBKDF2 rounds) + `encrypt` onto `lockQueue` (`app.js:103-107`), swallowing errors with `.catch(() => {})`. Fast typing piles up seconds of CPU work; closing the tab or hitting quota wipes both `KEY` and `LOCK_KEY` updates silently. | `app.js:98-111, 903, 912, 1562-1565`. | Derive and cache the AES-GCM `CryptoKey` in memory on unlock/lock-enable (still using a fresh IV on each save, or re-keying on explicit save/idle), debounce `save()` (~300ms), never `removeItem(KEY)` until `setItem(LOCK_KEY)` succeeds, and surface errors visibly. |
| **High** | **Unhandled `QuotaExceededError` & non-atomic native writes with silent data wipe:** Web `localStorage.setItem` (`app.js:110`) has no `try/catch`, crashing `save()` before `meter()` runs when storage fills. Android (`GuideStore.kt:17, 34`) and Windows (`GuideStore.cs:34-39, 53`) write `state.json` directly on every keystroke without temp-file rename and silently discard the file on any JSON decode error (`GuideState()`). | `app.js:110-112`; `GuideStore.kt:16-20, 32-35`; `GuideStore.cs:32-40, 51-55`. | Wrap `localStorage.setItem` in `try/catch` with user-visible quota warning; use atomic write-temp-and-rename on Android/Windows and preserve `.corrupt` backups before resetting state. |
| **High** | **Linux writes invalid `"saved"` / `"completed"` strings into ISO-8601 date fields:** Corrupts backup freshness and Fire Drill dates when opened on Web (`new Date("saved")` → `Invalid Date`, and `"2026-..." > "saved"` evaluates `false`, hiding unsaved backup warnings). | `dialogs.rs:287, 438` vs. `app.js:674-685, 710`. | Use `Utc::now().to_rfc3339()` in `dialogs.rs:287, 438`. |
| **High** | **Broken photo zoom in standalone `.html` backups & leaked object URLs:** Clicking a photo in an unlocked standalone `.html` file calls `window.open(this.src)` on a `data:image/jpeg;base64,...` URI, which modern browsers block as top-frame `data:` navigation. `dlJson` and `saveHtml` also never call `URL.revokeObjectURL`. | `app.js:1965, 2026, 2036`. | Render a modal lightbox inside the standalone HTML viewer (like `app.js:973`), and revoke blob URLs after download. |
| **Medium** | **Shallow test suites & unrun native tests in sandbox:** `tests/web_tests.js:5-56` uses a dummy `makeEl` DOM stub and never exercises Web Crypto AES-GCM encryption/decryption, `applyMerge`, browser lock, `save()`, or photo compression. Native test suites (`FamilyGuideCoreTests.swift`, `FamilyGuideCoreTest.kt`, `FamilyGuideCoreTests.cs`, `lib.rs`) only cover Core happy paths, `FamilyGuideUITests.swift:1-31` has zero real UI tests, and none of the 4 native test suites could be executed locally in this sandbox. | `tests/web_tests.js:5-215`; `FamilyGuideUITests.swift:7-31`; sandbox output (`node`, `gradle`, `dotnet`, `swift test` blocked). | Add real Web Crypto + `applyMerge` + lock/quota tests in Node (`webcrypto`), add UI/E2E tests, and run native suites in CI/local host to verify. |
| **Low** | **Minor native reliability paper cuts:** Apple `GuideStore.swift:26, 80` force-unwraps `urls(...).first!` and `data.REGIONS["us"]!`; `FamilyGuideiOSApp.swift:15` calls `fatalError`; `SheetsView.swift:235` ignores `.fileExporter` errors `{ _ in }`; Linux `main.rs:338-350` always renders the demo banner even when `has_any_content` or `dismiss_demo` is true. | `GuideStore.swift:26, 80`; `FamilyGuideiOSApp.swift:15`; `SheetsView.swift:235`; `main.rs:338-350`. | Replace force-unwraps/fatalError with recoverable error UI, surface file-export errors, and gate Linux's demo banner on `!has_any_content() && !dismiss_demo`. |

#### Top 3 Actions
1. Fix Web `save()` immediately: debounce writes, cache the derived `CryptoKey` while unlocked, remove `KEY` only after `LOCK_KEY` succeeds, and handle `QuotaExceededError`.
2. Fix Linux ISO-8601 timestamps (`dialogs.rs`) and make Android/Windows file persistence atomic with corrupt-file preservation.
3. Replace `window.open(this.src)` in standalone `.html` exports and expand automated tests to cover real AES-GCM, `applyMerge`, and error paths.

#### Questions for the Creator
1. Have you tested the Web app with Browser Lock enabled and rapid typing on a mid-range phone to measure the 250k PBKDF2 lag?
2. Were all 4 native apps tested end-to-end manually on physical macOS, iOS, Android, Windows, and Linux machines?

---

### 3. Security Engineer

- **Verdict:** The zero-network posture and `AES-256-GCM` / `PBKDF2` backup cryptography are solid in concept, but shipping a debuggable Android APK, leaving native `state.json` unencrypted under "lock" screens, and generating 40-bit Diceware passphrases create severe real-world exposure.
- **Score:** 5/10 — Strong cryptographic primitives and authentic offline isolation, critically undermined by 40-bit passphrase entropy, plaintext native storage, and bypassable lock screens.

#### Strengths
- **Verifiable zero-network design:** `AndroidManifest.xml:1-21` omits `INTERNET` permission and sets `android:allowBackup="false"`; `GuideStore.swift:30-33` marks the storage directory `isExcludedFromBackup = true` (iCloud exclusion); `index.html` loads zero external scripts, fonts, or stylesheets.
- **Sound backup cipher & KDF parameters:** All 5 crypto engines use `PBKDF2-HMAC-SHA256` (250,000 iterations, 16-byte random salt) + `AES-256-GCM` (12-byte random IV, 16-byte auth tag) and identical `GF(256)` Shamir math (`app.js:1562-1634`, `CryptoEngine.swift:40-225`, `CryptoEngine.kt:20-150`, `CryptoEngine.cs:13-199`, `crypto.rs:23-243`).
- **Photo URI & JSON-script injection hardening:** `safeImgUrl` (`app.js:14, 1787`) restricts image sources to base64 raster data URIs, and `safeJson` (`app.js:15, 1788`) escapes `<\/script`.

#### Issues
| Severity | Finding | Evidence | Recommendation |
|---|---|---|---|
| **Critical** | **Production Android release ships `app-debug.apk`:** Release workflow runs `gradle testDebugUnitTest assembleDebug` and uploads `app-debug.apk` as `Our-Family-Field-Guide-Android.apk`. Debug APKs set `android:debuggable="true"`, allowing any computer connected via USB (`adb shell run-as ...`) to extract plaintext `filesDir/state.json` without root. | `.github/workflows/release.yml:151-154`; `.github/workflows/android.yml:39`. | Build `assembleRelease` signed with a persistent release keystore in CI secrets, `isDebuggable = false`, and enable R8 (`isMinifyEnabled = true`). |
| **Critical** | **Native app "Lock" features are security theater on all 4 platforms:** All 4 native apps store `state.json` in **plaintext** (`GuideStore.swift:50`, `GuideStore.kt:34`, `GuideStore.cs:53`, `store.rs:87`). Windows (`MainWindow.xaml.cs:645-664`) and Linux (`main.rs:508-582`) only store the lock passphrase in memory—restarting the app bypasses the lock entirely. Apple (`GuideStore.swift:10`, `RootView.swift:38-43`) and Android (`MainActivity.kt:24, 85-91`) launch unlocked, never re-lock on backgrounding, Android silently unlocks if device auth isn't enrolled (`MainActivity.kt:88-90`), and Android lacks `FLAG_SECURE` (allowing app-switcher screenshots). | `GuideStore.swift:10, 50`; `MainActivity.kt:24, 85-91`; `MainWindow.xaml.cs:645-664`; `main.rs:508-582`. | Encrypt `state.json` at rest using OS keystore/Keychain/DPAPI/passphrase-derived keys, require auth on launch and background return (`FLAG_SECURE` on Android), and fail closed if biometrics/PIN aren't set. |
| **High** | **Weak 40-bit Diceware passphrase entropy:** `DICE_WORDS` (`regions.js:632-649`) has only **256 words** (`8` bits/word). A 5-word generated passphrase has only $256^5 = 2^{40}$ (~1.1 trillion) combinations—brute-forceable offline against an exported backup file on modern GPU hardware. | `regions.js:632-649`; `app.js:1568`; `FamilyGuideCoreTests.swift:19` (`DICE_WORDS.count == 256`). | Replace `DICE_WORDS` with the EFF 7,776-word (or 2,048-word) list so 5 words yield `55–64.6` bits, or generate 8 words (`64` bits) from the 256-word list. |
| **High** | **Web Browser Lock leaves plaintext `S` and full DOM in memory:** `engageBrowserLockScreen()` (`app.js:2390-2419`) hides `#mainWrap` with `hidden = true` without clearing `S` from JS variables or clearing `#panels.innerHTML`, trivially bypassed via DevTools (`$("#mainWrap").hidden = false`). Standalone `.html` backups (`app.js:1845`) also retain `unlockedPass` indefinitely with no lock button or idle timeout. | `app.js:2390-2419`, `app.js:1845`. | Clear `#panels.innerHTML`, `#printSheet.innerHTML`, and zero out in-memory `S` on lock; add idle timeout + lock button to standalone `.html` backups. |
| **High** | **Insecure `Math.random()` fallback in CSPRNG paths:** `generatePassphrase` (`app.js:1572`) and `sssSplit2of3` (`app.js:1604`) fall back to `Math.random()` if `window.crypto.getRandomValues` is missing. Predictable Shamir coefficients completely leak the passphrase from a single recovery card. | `app.js:1571-1572`, `app.js:1603-1604`. | Remove `Math.random()` fallbacks; throw/abort if `window.crypto?.getRandomValues` is unavailable. |
| **Medium** | **Unmasked passphrase fields & missing confirmation on native apps:** Android (`Dialogs.kt:137-138, 212`), Windows (`Dialogs.cs:115-116`), and Linux (`dialogs.rs:325-328`) display backup passphrases in cleartext `TextBox`/`Entry`/`OutlinedTextField` controls (risking shoulder-surfing and Android keyboard caching). | `Dialogs.kt:137-138, 212`; `Dialogs.cs:115-116`; `dialogs.rs:325-328`. | Use `PasswordVisualTransformation` + `KeyboardType.Password` (Android), `PasswordBox` (Windows), and `PasswordEntry` (Linux). |
| **Medium** | **Missing CSP, unvalidated imported photos on merge, and prototype-key exposure:** `index.html` has no `<meta http-equiv="Content-Security-Policy">`; standalone HTML uses inline `onclick` (`app.js:1947, 1965`); `applyMerge` (`app.js:2268-2275`) copies incoming `photos` without `safeImgUrl` checks; `S = incoming` (`app.js:2326, 2352`) does not strip `__proto__`/`constructor` keys. | `index.html:1-21`; `app.js:1947, 1965, 2268-2275, 2326`. | Add strict CSP (`default-src 'self'; img-src 'self' data: blob:; object-src 'none'`), remove inline handlers, validate `safeImgUrl` during `applyMerge`, and sanitize imported JSON keys. |
| **Medium** | **Privacy audit blind spots & false positives:** Seed-phrase and full-SSN/Aadhaar checks (`app.js:639, 652` and all 4 native stores) only scan `crypto` and `gov_ids` tables—missing raw secrets typed into `d_pm`, `d_2fa`, `d_phone`, `letter`, or custom sections—while `\b\d{9,}\b` triggers false positives on 9+ digit valid passport/policy numbers in `gov_ids`. | `app.js:637-656`; `GuideStore.swift`; `GuideStore.kt`; `GuideStore.cs`; `store.rs`. | Scan all `S.f` and `S.lists` text fields for 12/24-word seed phrases and SSN/Aadhaar patterns, and refine the `gov_ids` regex. |

#### Top 3 Actions
1. Upgrade `DICE_WORDS` / passphrase length to ≥64 bits of entropy and fail closed if `crypto.getRandomValues` is unavailable.
2. Eliminate the Android debug APK release and encrypt native `state.json` at rest with real lock-on-launch/background + `FLAG_SECURE`.
3. Wipe in-memory `S` and DOM on Web lock, mask all native passphrase inputs, add strict CSP, and extend privacy audits across all fields.

#### Questions for the Creator
1. Is the threat model for native apps "locked against casual household snooping" or "protected against device theft / forensic extraction"? (`SECURITY.md:15-16` currently conflates OS disk encryption with app-level locking.)
2. Was the 256-word `DICE_WORDS` list chosen strictly for file-size brevity in standalone HTML exports?

---

### 4. QA / UX Specialist

- **Verdict:** The crisis-centered UX, Calm Read Mode, ER Grab Sheet, and Survivor Money Guide show rare empathy, yet default-theme contrast failures, missing ARIA semantics, and unconfirmed destructive native actions create real barriers under 2 AM stress.
- **Score:** 6/10 — Outstanding crisis-domain usability design, dragged down by accessibility (a11y) defects, missing error/confirm guardrails on native apps, and zero E2E tests.

#### Strengths
- **Crisis-safe Calm Read Mode:** Hides empty fields and edit chrome (`app.js:184-204, 529-531`), auto-converts phone numbers, emails, and URLs to clickable `tel:` / `mailto:` / `https:` links (`app.js:121-139`), and keeps only Playbook checkboxes and the Call & claim log interactive.
- **High-signal 1-page print sheets:** Dedicated Executive Summary, ER Grab Sheet, Caregiver/Fridge Sheet, and Break-Glass Cover Sheet (`app.js:1271-1489`) solve real emergency handoff scenarios.
- **Helpful High Contrast & A+ modes:** High Contrast mode passes WCAG AA/AAA (`6.37:1`–`10.09:1`, `styles.css:297-300`) and `large-text` scales typography cleanly (`styles.css:290-295`).

#### Issues
| Severity | Finding | Evidence | Recommendation |
|---|---|---|---|
| **High** | **Default theme fails WCAG 2.1 AA contrast (`4.5:1`) in 6 places:** Measured ratios: placeholder `#b9b4a6` on `#fffdf8` (`2.04:1`), `--mute` `#8a8f84` on `--paper` (`2.94:1`) & `--card` (`3.26:1`), `--tomato` `#d2512f` on `--paper` (`3.76:1`), Quick Glance placeholder `#7f948a` on `--ink` (`3.82:1`), and white text on `--tomato` buttons (`4.24:1`). | `styles.css:2-4, 17, 106, 126, 131` (verified via Python WCAG calculation). | Darken `--mute` (e.g. `#5f665c`), `--tomato` (e.g. `#b83c1c` for text/solid buttons), and placeholder colors to ≥`4.5:1` in default mode. |
| **High** | **Missing ARIA roles, live regions, and default focus outlines:** `#tabs`/`#panels` lack `role="tablist"`, `role="tab"`, `aria-selected`, and `role="tabpanel"`; `#toast` lacks `role="status"` / `aria-live="polite"`; `.card-tog` lacks `aria-expanded`; `A+`/`Contrast`/`Read mode` buttons lack `aria-pressed`; `styles.css:102` sets `outline: none` on inputs while `:focus-visible` is gated inside `body.high-contrast` (`styles.css:300`). | `index.html:43, 52-55, 60, 67`; `app.js:82, 520-539`; `styles.css:102, 300`. | Add semantic ARIA roles/states, `aria-live="polite"` on `#toast`, and visible `:focus-visible` outlines for all keyboard users in default mode. |
| **High** | **Unconfirmed destructive deletes on native apps & no recovery escape on Web Lock Screen:** Apple (`TabContentView.swift:220-224, 413-417`) and Windows (`MainWindow.xaml.cs:133`) delete entire custom sections or filled rows in 1 click without confirmation (Android/Linux also delete rows without confirmation). Web's `engageBrowserLockScreen` (`app.js:2396-2404`) offers no 2-of-3 Recovery Card unlock and no "Reset browser data" option if forgotten. | `TabContentView.swift:220-224, 413-417`; `MainWindow.xaml.cs:133`; `app.js:2396-2404`. | Add confirmation alerts before deleting filled rows or custom sections on all native apps; add Recovery Card unlock + explicit Reset confirmation on Web lock screen. |
| **Medium** | **First-run cognitive overload:** Landing on `Start here` stacks masthead + meter + privacy banner + demo banner + sticky tab bar + search/comfort bar + 15-min essentials + Quick Glance + 7 playbooks + Call log + 10 scripts + Letter at once with no guided starter flow. | `index.html:25-60`; `schema.js:317-325`. | Add an optional 3-minute guided "Quick Start" modal/wizard for first-time users. |
| **Medium** | **Cross-platform UX gaps & footguns:** Linux Backup dialog (`dialogs.rs:325`) has no passphrase confirmation field (one typo locks the backup permanently); Windows merge (`Dialogs.cs:174`) omits "Smart Merge (Prefer Backup)"; native apps lack clickable `tel:`/`mailto:` links, Caregiver/Cover sheets, and `.ics` reminders; standalone HTML photo zoom fails (`app.js:1965`). | `dialogs.rs:325`; `Dialogs.cs:174`; `app.js:1965`. | Add confirm-passphrase input on Linux, 3-way merge options on Windows, clickable phone/email actions on native, and fix standalone photo lightbox. |
| **Medium** | **Zero real-browser E2E or native UI test automation:** No Playwright/Cypress/Selenium tests verify DOM rendering, printing, File API, or Service Worker behavior; `FamilyGuideUITests.swift` has 2 enum/token checks; Android/Windows/Linux have 0 UI tests. | `tests/web_tests.js`; `native/apple/Tests/FamilyGuideUITests/FamilyGuideUITests.swift`. | Add Playwright E2E tests for core Web user journeys (onboarding, edit, lock, export `.html`, unlock, merge). |

#### Top 3 Actions
1. Fix default-mode WCAG AA contrast ratios, add proper ARIA roles/`aria-live`/`aria-pressed`, and enable `:focus-visible` outlines globally.
2. Add confirmation prompts on native deletes, passphrase confirmation on Linux backup, and Recovery Card + reset options on Web's lock screen.
3. Add a Playwright E2E suite for critical Web flows and a gentle 3-minute first-run setup guide.

#### Questions for the Creator
1. Has a non-technical spouse or caregiver actually tested unlocking a standalone `.html` file and navigating Read Mode cold?
2. Which platforms do you intend to maintain full print/photo/link UX parity on?

---

### 5. Delivery / DevOps Engineer

- **Verdict:** The multi-platform GitHub Actions workflow structure is clean on the surface, but publishing an ephemeral debug-signed Android APK, lacking CI schema-drift enforcement, and omitting Rust/Gradle lockfiles make releases non-reproducible and unsafe for user data.
- **Score:** 4/10 — Well-organized workflow YAML skeleton, undermined by critical release-signing, reproducibility, and CI trigger gaps.

#### Strengths
- **Automated multi-platform release orchestration:** `.github/workflows/release.yml:1-303` builds all 6 targets from a single tag (`v*` or `workflow_dispatch`) and generates `SHA256SUMS.txt` (`release.yml:272`).
- **Fast baseline Web/parity CI:** `.github/workflows/ci.yml:1-36` syntax-checks JS, validates JSON, runs `tests/web_tests.js`, and runs `tests/test_design_parity.py`.

#### Issues
| Severity | Finding | Evidence | Recommendation |
|---|---|---|---|
| **Critical** | **Android release builds `assembleDebug` with ephemeral signing key:** Each GitHub Actions run generates a fresh debug keystore (`release.yml:151-154`). Users installing `v1.0.1` over `v1.0.0` will fail signature verification and **must uninstall first—permanently deleting their local `state.json`** (`android:allowBackup="false"`). | `.github/workflows/release.yml:151-154` (`gradle testDebugUnitTest assembleDebug` → `app-debug.apk`). | Configure `signingConfigs.release` with GitHub Secrets (`KEYSTORE_B64`, passwords, alias) and build `assembleRelease`. |
| **High** | **CI misses `schema.js` → `guide-data.json` drift & skips native builds on schema edits:** `test_design_parity.py:31-42` only checks that the 5 `guide-data.json` copies equal each other—not that they match `schema.js`/`regions.js`. Meanwhile, `apple.yml`, `android.yml`, `windows.yml`, and `linux.yml` only trigger on `shared/guide-data.json`, NOT `schema.js` or `regions.js`. | `tests/test_design_parity.py:31-42`; `apple.yml:6-13`; `android.yml:6-13`; `windows.yml:6-13`; `linux.yml:6-13`. | Run `python3 shared/sync_schema.py` + `git diff --exit-code` inside `ci.yml`, and add `schema.js` and `regions.js` to all native workflow path triggers. |
| **High** | **Unsigned/unnotarized desktop & source-only iOS artifacts:** macOS `.dmg` is ad-hoc signed (`codesign --sign -`), unnotarized, `arm64`-only, with hardcoded `CFBundleVersion` `1` (`release.yml:101, 113-115`); Windows `.exe` is unsigned (SmartScreen block, `release.yml:186`); iOS ships raw Swift source without an `.xcodeproj` (`release.yml:117-123`). | `.github/workflows/release.yml:101, 113-130, 185-190`. | Sign/notarize macOS & Windows binaries (Developer ID + Authenticode) and ship iOS via TestFlight/App Store, or explicitly label native releases as Developer Previews. |
| **High** | **Missing build lockfiles & unpinned CI actions:** `native/linux/` has no `Cargo.lock` (`Cargo.toml` uses floating `0.10`, `0.9`, `1` specs); `native/android/` has no Gradle Wrapper (`gradlew`) or checksum verification; all workflows reference mutable tags (`actions/checkout@v4`, `dtolnay/rust-toolchain@stable`, `Swatinem/rust-cache@v2`). | `native/linux/Cargo.toml`, `native/linux/crates/*/Cargo.toml`, `native/android/` (no `gradlew`), `.github/workflows/*.yml`. | Commit `Cargo.lock` (use `--locked` in CI), commit Gradle Wrapper (`gradlew`), and pin GitHub Actions to full commit SHAs. |
| **Medium** | **Manual Service Worker cache busting & no Pages deploy workflow:** `sw.js:1` relies on manually bumping `"ffg-v8"` (`CONTRIBUTING.md:19`), with no CI check when cached files change, no in-app update banner, and no automated GitHub Pages deployment workflow despite `README.md:18` linking to GitHub Pages. | `sw.js:1-38`; `CONTRIBUTING.md:19`; `.github/workflows/` (no Pages workflow). | Add a CI check verifying `sw.js` cache version bumps on asset edits, add an update-available toast, and add a `pages.yml` deploy workflow. |
| **Low** | **No rollback runbook & `.vscode/launch.json` committed:** No documented release rollback procedure (especially critical for schema/storage changes), and editor-specific `.vscode/launch.json` was committed in `b63a283`. | `git show --stat b63a283`; repo root. | Document rollback/hotfix guidelines and add `.vscode/` to `.gitignore` if user-specific. |

*(Note: Native CI builds and `node` could not be locally executed in this sandbox; workflow observations are derived from static inspection of `.github/workflows/*.yml` and project manifests.)*

#### Top 3 Actions
1. Replace `assembleDebug` in `release.yml` with a persistently signed `assembleRelease` APK using repository secrets.
2. Enforce `sync_schema.py` drift checking in `ci.yml` and trigger native workflows on `schema.js` / `regions.js` edits.
3. Commit `Cargo.lock` and Gradle Wrapper (`gradlew`), pin GitHub Actions by SHA, and clarify or obtain signing/notarization for desktop/mobile binaries.

#### Questions for the Creator
1. How is the GitHub Pages live site currently deployed (branch-based Pages setting vs. external trigger)?
2. Are you planning to acquire Apple Developer (`$99/yr`), Google Play (`$25`), and Windows code-signing certificates for official store/signed distribution?

---

### 6. CTO

- **Verdict:** The zero-COGS, zero-server architecture is strategically brilliant for trust and unit economics, but maintaining 16,928 lines across 5 languages as a solo builder creates severe maintenance drag and existential data-loss risk in a high-stakes domain.
- **Score:** 5/10 — Smart privacy/cost strategy undermined by premature 5-language sprawl and unready native reliability.

#### Strengths
- **$0 infrastructure & zero breach surface:** Because everything runs locally with zero servers (`README.md:27`, `SECURITY.md:7`), hosting cost is near zero (static GitHub Pages) and there is zero centralized database to breach, subpoena, or maintain 24/7.
- **Strong technical moat in standalone `.html` portability:** A single encrypted `.html` file that opens offline in any browser years from now (`app.js:1702-2066`) directly solves the "will my spouse still be able to open this in 10 years?" longevity problem.

#### Issues
| Severity | Finding | Evidence | Recommendation |
|---|---|---|---|
| **Critical** | **Unsustainable 5x engineering surface area:** 21 commits in 2 days produced ~16.9k LOC across JS, Swift, Kotlin, C#, and Rust. Every future feature, bug fix, or regulatory update must be implemented and tested 5 times—already causing broken parity (photos, `.html` export, merge fields, Linux timestamps). | `wc -l` (~16.9k LOC across 5 languages); `git log` (1 author, 2 days); parity gaps noted above. | Concentrate 90% of engineering on the Web PWA + at most one shared cross-platform core (Rust/UniFFI or Tauri/Capacitor) rather than 4 hand-written native apps. |
| **High** | **Reputational & human trust risk from silent data-loss / fake-lock bugs:** In a crisis app, a single incident where an Android APK upgrade wipes `state.json`, `localStorage` silently fails on quota, or a native app's lock fails to protect data on disk permanently destroys credibility. | `release.yml:151-154`; `app.js:98-111`; native plaintext `state.json` (`GuideStore.swift:50`, `GuideStore.kt:34`, `GuideStore.cs:53`, `store.rs:87`). | Gate public promotion behind a "Zero Data Loss" hardening milestone (Web save fix, persistent signing, encrypted native storage, E2E/contract tests). |
| **High** | **Build-vs-buy / wrapper reversal:** Commit `f860356` added Tauri, then `be8f66e` removed it in favor of 4 hand-rolled native stacks. Unless a dedicated multi-platform team exists, pure native across 4 desktop/mobile stacks will stall velocity. | `git log -n 10 --oneline` (`f860356` → `be8f66e`). | Re-evaluate a single thin shell (Capacitor/Tauri or shared Rust core) if desktop/mobile store presence is required. |
| **Medium** | **Stale regulatory/financial guidance liability across 9 jurisdictions:** Even with disclaimers (`README.md:138`, `schema.js:14`), concrete figures (`$60k` US NRA estate threshold, FDIC `$250k`, FSCS `£85k`, DICGC `₹5L`, H-1B 60-day grace period, INA § 204(l)) change over time and have no `lastVerified` metadata or review cadence. | `regions.js:15-67, 196-208`. | Add `lastVerified` dates per region preset and an annual review checklist before tax/legal limits go stale. |
| **Medium** | **Contributor onboarding gap:** `CONTRIBUTING.md:1-57` only explains editing Web files (`schema.js`, `regions.js`, `app.js`), giving zero guidance on `sync_schema.py`, `test_design_parity.py`, or native build/test rules. | `CONTRIBUTING.md:11-20`. | Document the full schema-sync workflow, parity rules, and platform ownership expectations in `CONTRIBUTING.md`. |

#### Top 3 Actions
1. Commit to **Web PWA + Standalone `.html`** as the primary supported product and re-scope or archive the 4 pure-native apps until core quality and a shared-core architecture are settled.
2. Execute a "Zero Data Loss & Real Security" stabilization sprint before calling any release `v1.x` production-ready.
3. Add jurisdiction `lastVerified` metadata and update `CONTRIBUTING.md` with cross-platform architecture rules.

#### Questions for the Creator
1. How much weekly maintenance time can you realistically commit over the next 2 years across 5 separate languages?
2. What drove the decision to drop Tauri and hand-write 4 native apps?

---

### 7. Product Owner

- **Verdict:** Exceptional problem discovery and domain depth—particularly for H-1B/cross-border families, 2 AM chronic illness ER trips, and bereaved spouses facing big payouts—held back by documentation over-promising native parity and first-run cognitive overload.
- **Score:** 8/10 — Best-in-class empathy, content structure, and real-world utility; needs honest scoping, guided onboarding, and selective caregiver sharing.

#### Strengths
- **Solves high-anxiety, underserved real-world crises:** Goes far beyond generic password/document checklists by addressing dependent-visa grace periods (`schema.js:103-117`), chronic illness red-flag fever rules & arm/port restrictions (`schema.js:412-420`, `app.js:1359-1405`), 6-to-12 month post-payout freezes & anti-scam scripts (`schema.js:177-249`), and free institutional allies like Dollar For, VITA, and hospital social workers (`schema.js:251-314`).
- **Thoughtful collaboration & habit loops:** Two-Spouse Smart Merge with conflict preview (`app.js:2194-2294`), 10-minute Family Fire Drill (`schema.js:629-635`), and 6-month `.ics` calendar reminders (`app.js:1237-1260`) directly combat the biggest failure mode of emergency guides (going stale or being unopenable by a spouse).
- **Safe-by-design data hygiene:** Encouraging location pointers + last 4 digits instead of raw passwords/SSNs/seed phrases (`SECURITY.md:25`) plus automated privacy audits.

#### Issues
| Severity | Finding | Evidence | Recommendation |
|---|---|---|---|
| **High** | **README and native docs over-promise native parity:** Claims every app writes standalone `.html` backups (`README.md:26, 87`; `native/apple/README.md:6`; `native/windows/README.md:7`), when all 4 native apps export `.json` only and omit Reference Photos, Caregiver/Cover print sheets, `.ics` reminders, and tappable `tel:`/`mailto:` links. | `README.md:26, 87` vs. `SheetsView.swift:206`, `MainActivity.kt:28`, `Dialogs.cs:131`, `dialogs.rs:391`, `TabContentView.swift:31-55`. | Publish an honest Platform Feature Matrix in `README.md` and correct native READMEs so users aren't surprised. |
| **High** | **No "First 5 Minutes" guided onboarding:** Users already procrastinate on mortality planning; landing on 6 tabs, ~30 cards, 7 playbooks, and 10 scripts feels daunting even with the `15-minute essentials` bar. | `index.html:25-60`; `schema.js:317-482`. | Add an optional 4-step "Quick Start" wizard (1. Pick region → 2. #1 person to call + paper location → 3. Phone unlock → 4. Export first `.html` backup). |
| **Medium** | **Missing selective-scope sharing (Least-Privilege Handoff):** You cannot export a locked/printable packet containing *only* `Kids + Caregiver + Health ER` without either sharing the full financial backup passphrase or printing plain paper. | `app.js:2068-2129` (backup always encrypts full `S`). | Add scoped export ("Caregiver / ER Packet Only") so babysitters or relatives never receive bank/insurance/crypto maps. |
| **Medium** | **No privacy-respecting product success loop:** Zero telemetry is non-negotiable, yet there is no structured opt-in feedback mechanism (e.g., issue templates, Fire Drill completion feedback prompt, or moderated user-testing protocol) to learn where spouses get stuck. | Repo has no `.github/ISSUE_TEMPLATE/` or feedback link in app. | Add GitHub issue/discussion templates for preset accuracy & usability friction, and run 5–10 moderated spouse dry-run tests. |
| **Low** | **English-only UI across 9 global presets:** `regions.js` adapts terms for India, EU, UK, Canada, Australia, and cross-border families, but UI copy and scripts remain English-only—limiting usefulness for non-English-speaking parents or local caregivers. | `schema.js`, `regions.js` (100% English strings). | Structure UI labels for i18n if community translations are a goal (`CONTRIBUTING.md:3`). |

#### Top 3 Actions
1. Update `README.md` and native READMEs with an accurate Platform Feature Matrix so user expectations match reality.
2. Build a 5-minute guided Quick-Start onboarding flow ending in a tested `.html` backup + Fire Drill step 1.
3. Add scoped "Caregiver / ER Only" sharing/export and validate UX with 5–10 real couples.

#### Questions for the Creator
1. Which specific user persona (US+India H-1B family, chronic illness caregiver, or general family) is your primary target for initial launch?
2. Would you be willing to prioritize Web PWA + iOS/Android mobile over desktop native apps based on where spouses actually look during a 2 AM crisis?

---

### 8. CEO

- **Verdict:** There is a genuine, high-trust wedge here that commercial competitors miss—especially for cross-border/H-1B families and caregivers—but sideloading debug APKs, Gatekeeper warnings, and unfixed data-loss bugs mean only the Web PWA is fit to show early beta users right now.
- **Score:** 6/10 — Compelling market differentiation and $0 infrastructure moat, constrained by distribution friction, premature 6-platform sprawl, and no sustainability model.

#### Strengths
- **Clear differentiation against `$60–$200/yr` SaaS incumbents:** Competitors like Everplans, Trustworthy, and GoodTrust require cloud accounts and recurring subscriptions—the exact friction and trust barrier many privacy-minded families reject. Zero-server + standalone `.html` longevity is a memorable, shareable hook.
- **High-intent organic distribution wedges:** Natural word-of-mouth fit in H-1B/NRI forums, caregiver/oncology support groups, personal-finance communities, and Hacker News / GitHub.

#### Issues
| Severity | Finding | Evidence | Recommendation |
|---|---|---|---|
| **Critical** | **Distribution friction blocks the real end user:** Non-technical or grieving spouses will not enable Android Developer/Unknown Sources to sideload a debug APK, bypass macOS Gatekeeper ("Open Anyway"), dismiss Windows SmartScreen, or compile iOS Swift packages in Xcode. Only the Web PWA URL is frictionless today. | `README.md:70-78`; `release.yml:113, 154, 186`. | Lead 100% with the **Live Web PWA + Standalone `.html`** as the universal product; pause promoting unverified native binaries until store-published/notarized. |
| **High** | **Premature 6-platform expansion before PMF/retention validation:** Building 5 language stacks in 2 days spread effort thin before proving 25 families actually finish the 15-minute essentials and successfully run a Fire Drill on Platform #1. | `git log` (21 commits in 2 days across 6 platforms). | Freeze new platform work; prove completion and spouse-unlock success on the Web PWA first. |
| **High** | **No business or sustainability model:** MIT license + `$0` revenue + 9 jurisdictions' legal/tax rules means ongoing maintenance cost falls entirely on the founder's free time. | `LICENSE`, `README.md:138`. | Define a sustainability path: keep Web PWA free & open-source for trust/growth, and consider paid App Store/Play Store apps, B2B2C licensing (estate attorneys, fee-only CFPs, employer HR/EAPs), or physical fireproof binder kits. |
| **Medium** | **Not ready for institutional partners, paying customers, or investors:** Ready for **tech-savvy beta users via Web PWA**, NOT ready for broad consumer launch or B2B partnerships due to Android debug APK, 40-bit Diceware, and plaintext native locks. | `release.yml:154`; `regions.js:632-649`; native `GuideStore` files. | Complete Beta/Security hardening before pitching HR benefits teams, patient advocacy nonprofits, or estate attorneys. |
| **Medium** | **Competitive moat risk from password managers & Apple/Google Legacy:** 1Password Emergency Kit + Apple Legacy Contact already solve credential inheritance; this product wins on *holistic crisis playbooks + financial/medical/visa guidance*, which needs crisp positioning. | `README.md:24-28`; `schema.js`. | Frame positioning around **"Your family's 2 AM crisis & cross-border playbook (that works without a cloud or app store)"** rather than competing head-on as a generic vault. |

#### Top 3 Actions
1. Position the **Web PWA + Standalone `.html` Backup** as the single hero experience and remove Gatekeeper/debug-APK friction from the main user path.
2. Recruit 25–50 real target households (e.g., H-1B/NRI & caregiver communities) to measure 15-minute completion and Fire Drill success.
3. Choose a long-term sustainability model (free open-source Web core + paid store-signed mobile apps or B2B advisor/HR partnerships).

#### Questions for the Creator
1. Is your goal a pure community open-source project, or do you want this to become a sustainable product/business?
2. Would estate attorneys, fee-only financial planners, or employer HR/EAP teams be natural distribution partners for you?

---

## Phase 3: Board Synthesis

### Scorecard

| Persona | Score | One-Line Justification |
|---|---:|---|
| Software Architect | 5/10 | Smart single-source-of-truth schema and backup wire spec, undermined by 5x manual re-implementation and a 2.5k-LOC Web monolith. |
| Experienced Senior Software Engineer | 5/10 | Pragmatic domain code, held back by per-keystroke PBKDF2 queuing, unhandled storage quotas, non-atomic writes, Linux timestamp bugs, and stub-only tests. |
| Security Engineer | 5/10 | Solid AES-256-GCM/zero-network design, severely weakened by 40-bit Diceware entropy, debuggable release APK, plaintext native storage, and bypassable UI locks. |
| QA / UX Specialist | 6/10 | Empathetic, high-utility crisis UX, offset by default WCAG AA contrast failures, missing ARIA/focus rings, unconfirmed native deletes, and zero E2E tests. |
| Delivery / DevOps Engineer | 4/10 | Clean release workflow skeleton, crippled by debug-signed Android APK with ephemeral keystore, unsigned binaries, missing lockfiles, and CI schema-drift blind spots. |
| CTO | 5/10 | Zero-COGS offline strategy is smart, but a 5-language solo codebase creates unsustainable maintenance drag and high trust/data-loss risk. |
| Product Owner | 8/10 | Deeply differentiated, human problem-solution fit (cross-border, chronic illness, big money), held back by onboarding overwhelm and README vs. native parity gaps. |
| CEO | 6/10 | High-trust wedge and strong niche demand, blocked from mainstream adoption by sideloading/signing friction, premature 6-platform sprawl, and no sustainability model. |
| **Overall Average** | **5.5/10** | Strong product heart and clear privacy philosophy; engineering, security, and release hygiene need hardening before broad real-world family reliance. |

---

### Where Personas Agree
1. **5x Native Re-Implementation Sprawl & Parity Drift** (*Architect, Senior Eng, CTO, PO, CEO*): Writing and maintaining ~16.9k LOC across JS, Swift, Kotlin, C#, and Rust has already caused diverging merge logic, missing photo support, `.json`-only native exports vs. `.html` docs, and platform-specific bugs.
2. **Real Data-Loss & Storage Hazards** (*Architect, Senior Eng, Security, DevOps, CTO*): Per-keystroke PBKDF2 + premature `removeItem(KEY)` and uncaught `QuotaExceededError` on Web, non-atomic writes + silent reset on Android/Windows, ephemeral debug-keystore Android upgrades wiping `state.json`, and Linux non-ISO timestamps (`"saved"` / `"completed"`).
3. **False Security in Lock Screens & Weak 40-Bit Diceware** (*Security, Senior Eng, QA/UX, CTO*): 256-word Diceware (`40` bits), plaintext native `state.json` behind RAM-only/launch-unlocked UI gates, and Web's hidden-DOM lock screen create dangerous false confidence.
4. **Distribution & Release-Signing Friction** (*Security, DevOps, CTO, PO, CEO*): Debug-signed Android APK, ad-hoc macOS DMG, unsigned Windows EXE, and Xcode-source-only iOS block real families from safely installing native builds.
5. **Testing & CI Blind Spots** (*Senior Eng, QA/UX, DevOps*): Stub-DOM Web tests miss crypto/merge/quota flows, zero E2E/UI tests exist, and CI does not detect `schema.js` → `guide-data.json` sync drift.
6. **Genuine Domain Empathy & Differentiation** (*PO, CEO, QA/UX, Architect, CTO*): The crisis-specific playbooks, H-1B/NRI cross-border coverage, ER Grab Sheet, Survivor Money Guide, and standalone `.html` longevity are rare, high-value differentiators.

---

### Where Personas Disagree (Tensions & Recommendations)

1. **Web-First Speed vs. 6-Platform Pure Native Breadth**
   - *Tension:* The **CEO** and **PO** want frictionless mainstream adoption (Web PWA now, App Store / Play Store later), while the **Architect** and **CTO** warn that 5 parallel codebases cannot be safely maintained by one person.
   - *Recommendation:* Declare the **Web PWA + Standalone `.html`** the official flagship product for `v1.x`. Demote the 4 native apps to "Developer Preview" in `README.md`, and either share one core (`family-guide-core` via UniFFI) or focus native efforts strictly on store-signed mobile (iOS + Android) later.

2. **Strict Cryptographic Security vs. 2 AM Crisis Usability**
   - *Tension:* The **Security Engineer** pushes for ≥64-bit passphrases, strict auto-locking, full at-rest encryption, and memory wiping, whereas **QA/UX** and the **PO** worry that aggressive locks or complex passphrases could lock out a panicked spouse at 2 AM.
   - *Recommendation:* Upgrade Diceware to EFF 5-word (~64.6 bits—still 5 easy words), add **2-of-3 Recovery Card unlock directly on the Web lock screen**, and pair native OS-encrypted at-rest storage with seamless Face ID / Touch ID / `BiometricPrompt` so security is strong *and* frictionless.

3. **Zero-Telemetry Purity vs. Product Learning & Monetization**
   - *Tension:* **Security** and the **CTO** fiercely protect the verifiable 100% zero-network guarantee, while the **PO** and **CEO** need usage/completion feedback and a revenue model.
   - *Recommendation:* Never compromise zero-network privacy inside the app (it is the product's core trust moat). Gather learning via external moderated spouse dry-runs and opt-in GitHub Discussions, and monetize outside telemetry (paid signed App Store/Play Store apps, B2B licensing for CFPs/attorneys/HR, or physical binder kits).

---

### Prioritized Action Plan (Top 10 Across All Personas)

| Rank | Action | Horizon | Raised By |
|---:|---|---|---|
| 1 | **Fix Web `save()` PBKDF2 queuing, lock-screen DOM/RAM wipe, and `QuotaExceededError` handling** (debounce saves, cache derived `CryptoKey` in RAM while unlocked, don't delete `KEY` before `LOCK_KEY` writes, clear `S` & `#panels.innerHTML` on lock). | **Quick win** | Senior Eng, Security, CTO |
| 2 | **Upgrade Diceware to ≥64-bit entropy & remove `Math.random()` CSPRNG fallbacks** (expand `DICE_WORDS` to EFF 2,048–7,776 words or 8 words from 256, and fail closed without `crypto.getRandomValues`). | **Quick win** | Security, Senior Eng |
| 3 | **Fix Android release signing** (stop publishing `app-debug.apk` with ephemeral keystores; configure `assembleRelease` with persistent repo-secret keystore, R8, `debuggable=false`, and `FLAG_SECURE`). | **Quick win** | DevOps, Security, CTO, CEO |
| 4 | **Align `README.md` & native READMEs with real feature parity** (publish an honest Platform Matrix, clarify `.json`-only native exports, and label unsigned native builds as Preview while making Web PWA primary). | **Quick win** | PO, CEO, Architect, DevOps |
| 5 | **Fix Linux ISO-8601 timestamps (`"saved"`/`"completed"`), mask native passphrase inputs, and fix standalone `.html` photo zoom** (`Utc::now().to_rfc3339()`, `PasswordBox`/`PasswordEntry`/`PasswordVisualTransformation`, in-page lightbox). | **Quick win** | Senior Eng, Security, QA/UX |
| 6 | **Fix default-theme WCAG AA contrast, ARIA semantics, `:focus-visible` outlines, and native delete confirmations** (darken `--mute`/`--tomato`/placeholders, add `tablist`/`aria-live`/`aria-pressed`, confirm destructive native deletes, add Linux confirm-passphrase & Web lock-screen recovery/reset). | **Short-term** | QA/UX |
| 7 | **Harden CI & build reproducibility** (run `sync_schema.py` + `git diff --exit-code` in `ci.yml`, trigger native workflows on `schema.js`/`regions.js`, commit `Cargo.lock` & `gradlew`, pin GitHub Actions to SHAs, add `sw.js` cache check). | **Short-term** | DevOps, Architect |
| 8 | **Implement encrypted, atomic local storage & real launch/background locking on native apps** (plus full-state seed/ID privacy-audit scanning and strict CSP on Web). | **Short-term** | Security, Senior Eng, CTO |
| 9 | **Modularize `app.js`, add Playwright E2E + golden cross-platform contract tests, and build a 5-minute guided onboarding wizard** (also add scoped Caregiver/ER-only packet export). | **Short-term** | Architect, Senior Eng, QA/UX, PO |
| 10 | **Execute a sustainable platform & distribution strategy** (Web PWA flagship + either shared Rust/UniFFI core or store-signed iOS/Android, jurisdiction `lastVerified` review cadence, 25–50 household validation, and sustainability model). | **Long-term** | CTO, CEO, Architect, PO |

---

### Production Readiness

- **Current Verdict:** **Ready for internal demo** (the **Web PWA** is close to **Ready for beta users** after Quick Wins #1–#2; the **4 native apps** are **Not ready** for real family data).
- **Blockers to "Ready for beta users" (Web PWA):**
  - Fix per-keystroke PBKDF2 lock-queue & premature `KEY` deletion + `QuotaExceededError` handling (`app.js:98-111`).
  - Clear in-memory `S` and DOM on Web lock screen (`app.js:2390-2419`).
  - Upgrade Diceware to ≥64-bit entropy and remove `Math.random()` fallback (`regions.js:632-649`, `app.js:1572, 1604`).
  - Fix standalone `.html` photo zoom (`app.js:1965`) and align `README.md` platform claims.
- **Blockers to "Production-ready" (All Platforms):**
  - All Beta blockers above.
  - Persistent release-signed non-debuggable Android APK (with `FLAG_SECURE`), plus notarized/signed desktop or App Store/Play Store builds—or formal deprecation of unsigned native binaries.
  - Encrypted, atomic local `state.json` storage with real lock-on-launch/background across native apps and Linux ISO-8601 timestamp fix.
  - WCAG AA contrast & ARIA/keyboard compliance in default Web theme + destructive-action confirmations on native apps.
  - CI schema-drift enforcement, `Cargo.lock` + `gradlew`, Playwright E2E tests, cross-platform golden contract tests (including `photos`, `fireDrill`, `lastDryRun`, `reviewed` merge), and jurisdiction `lastVerified` review metadata.

---

### Open Questions (Unverified Items)

1. **Native test & CI runtime status:** `node tests/web_tests.js`, `swift test`, `cargo test`, `gradle testDebugUnitTest`, and `dotnet test` could not run inside this sandbox (Web JS tests were verified via `jsc` and parity checks via Python). Live GitHub Actions pass/fail status was not fetched over the network.
2. **Live deployment & release artifacts:** The live GitHub Pages site (`https://dineshkumar-ponnusamy.github.io/Family-Guide/`) and published `v1.0.0` release binaries were not downloaded or tested on physical devices.
3. **Real-device & OS behavior:** iOS Safari PWA `localStorage` eviction, Android sideload upgrade/biometric flows, macOS Gatekeeper UX, Windows SmartScreen/PrintDialog, and Linux Wayland/X11 GTK4 rendering were not runtime-tested.
4. **Domain expert review:** Unknown whether estate attorneys, immigration attorneys, oncology/clinical staff, or fee-only CFPs reviewed the 9 regional presets in `schema.js` and `regions.js`.
5. **Creator roadmap:** Unknown whether the creator intends this to remain a solo open-source utility or evolve into a store-distributed/commercial product with ongoing multi-platform engineering.
