# Security & Privacy Policy

**Our Family Field Guide** is designed so you never have to trust a server, cloud account, or third-party vendor with your family's emergency instructions.

## Privacy Guarantees

- **Zero backend / zero telemetry:** Neither the Web PWA nor any native app makes network requests, uses analytics or crash trackers, or loads external scripts, fonts, or stylesheets.
- **Strict Web Content Security Policy (CSP):** `index.html` enforces `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; object-src 'none'; base-uri 'none'; form-action 'self';`, blocking external script/network execution and `object`/`base` injection.
- **OS-enforced offline on Android:** `AndroidManifest.xml` declares zero `<uses-permission>` entries (not even `android.permission.INTERNET`) and disables Android Auto Backup (`android:allowBackup="false"`).
- **No cloud backup leakage on Apple (iOS / macOS):** The local storage directory (`Application Support/FamilyFieldGuide`) is marked `isExcludedFromBackup = true` so local data stays off unencrypted/automatic iCloud device backups.

## Cryptography & Passphrase Generation

1. **66-Bit Diceware Passphrase Generator:**
   - Generates **6-word passphrases from a 2,048-word Diceware wordlist** ($2048^6 = 2^{66}$, i.e., **66 bits of entropy**) using rejection sampling to eliminate modulo bias.
2. **Fail-Closed CSPRNG:**
   - **Web / PWA:** Requires `window.crypto.getRandomValues` (and `crypto.subtle`) and **fails closed** with an explicit error if the CSPRNG is unavailable—never falling back to `Math.random()`.
   - **Native Apps:** Use OS-backed CSPRNGs (`SecRandomCopyBytes` on Apple, `java.security.SecureRandom` on Android, `System.Security.Cryptography.RandomNumberGenerator` on Windows, and `OsRng` on Linux).
3. **Encrypted Backups & Interop ([`shared/BACKUP_FORMAT.md`](shared/BACKUP_FORMAT.md)):**
   - **Cipher:** `AES-GCM` with a 256-bit key (`ciphertext || 16-byte tag`)
   - **Key Derivation:** `PBKDF2-HMAC-SHA256`, **250,000 iterations**, fresh random **16-byte salt** per save
   - **Nonce / IV:** Fresh random **12-byte IV** per encryption operation
   - **2-of-3 Split Recovery Cards:** Client-side Shamir Secret Sharing over `GF(256)` (`0x1b`) splits your passphrase into 3 cards (`FFG-1-...`, `FFG-2-...`, `FFG-3-...`). Any 2 reconstruct the passphrase; 1 alone reveals zero information.
   - **Backup Formats:** All 6 platforms export encrypted `.json` backups and import both `.json` and standalone `.html` backups; the **Web PWA** also exports standalone self-contained `.html` backups (full guide and least-privilege **Caregiver / ER packets**).

## At-Rest Storage & App Lock Protections

1. **Web / PWA:**
   - Unencrypted mode saves locally in `localStorage` (`familyFieldGuide.v1`).
   - Enabling **Lock** encrypts local storage into `familyFieldGuide.locked.v1` (`AES-256-GCM`) and removes the unencrypted key.
   - On lock or after **15 minutes of inactivity**, the app wipes the visible DOM (`panels`, `printSheet`, banners, search results) and clears in-memory state/key variables (`S`, `browserLockPass`, `browserLockKey`, `browserLockSalt`), and supports unlocking via passphrase or **2-of-3 Recovery Cards (`FFG-1-...`)** (both in-browser lock and standalone `.html` backups).
2. **Android:**
   - Stores data in internal `filesDir` with **`AndroidKeyStore`-backed encryption**, sets **`FLAG_SECURE`** to block screenshots and OS task-switcher previews, and supports **`BiometricPrompt`** lock.
   - **Release signing behavior:** CI signs `Our-Family-Field-Guide-Android.apk` with `assembleRelease` only when release keystore secrets (`ANDROID_KEYSTORE_BASE64`, etc.) are configured; otherwise CI builds and labels `Our-Family-Field-Guide-Android-PREVIEW-debug.apk` so debug builds are never mistaken for production upgrade-compatible releases.
3. **Apple (macOS & iOS):**
   - Stores data in `Application Support/FamilyFieldGuide` (`isExcludedFromBackup = true`), protects encryption keys via **Apple Keychain**, authenticates with Touch ID / Face ID / device passcode (`LocalAuthentication`), and automatically **re-locks on background**.
4. **Windows & Linux:**
   - Stores data in private user directories (`%AppData%\FamilyFieldGuide` on Windows; `$XDG_DATA_HOME/family-field-guide` with `0600` file permissions on Linux).
   - Enabling passphrase lock persists encrypted state to **`state.locked.json`** (`AES-256-GCM`), ensuring sensitive guide contents are not left plaintext on disk when locked.

## Full-State Privacy Audit Scanning

- The built-in **Readiness & Privacy Audit** scans across **all** standard fields, standard tables, custom fields, and custom tables/sections to flag:
  - Possible 12+ word crypto recovery seed phrases anywhere in the guide
  - Possible full national ID numbers (e.g., `XXX-XX-XXXX` SSN or 12-digit Aadhaar patterns)
- Write **where** physical backups or cards live plus the **last 4 digits only**—never raw passwords, seed phrases, or full government ID numbers.

## Safe Usage Rules (Important)

1. **Never enter raw secrets:** Never type account passwords, 12/24-word crypto seed phrases, private keys, or full national ID numbers (SSN / Aadhaar / SIN).
2. **Keep backups offline & separate from passphrases:** Store standalone `.html` / `.json` backups separately from their passphrase (or use the 2-of-3 Split Recovery Cards across Spouse · Safe · Trusted Person). Never commit backup files to GitHub.
3. **Use least-privilege Caregiver / ER packets when sharing with sitters:** Export a **Caregiver & ER Packet** instead of your full financial/legal guide when sharing emergency info with a babysitter or temporary caregiver.
4. **Use a private repository if customizing personal labels:** Public repositories expose anything you commit, including custom section or table names.
5. **iOS / Safari PWA note:** Apple Safari can purge unused `localStorage` on web apps not opened for extended periods. Always export a locked standalone `.html` backup (or use the native iOS app).

## Reporting a Vulnerability

If you discover a security or cryptographic issue in this codebase, please open a **Private Vulnerability Report** via the repository's **Security** tab (or contact the maintainer directly) before posting public exploit details so a fix can be prepared responsibly.
