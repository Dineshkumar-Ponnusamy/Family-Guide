# Security & Privacy Policy

**Our Family Field Guide** is designed so you never have to trust a server, cloud account, or third-party vendor with your family's emergency instructions.

## Privacy Guarantees

- **Zero backend / zero telemetry:** Neither the Web PWA nor any native app makes network requests, uses analytics or crash trackers, or loads external scripts, fonts, or stylesheets.
- **OS-enforced offline on Android:** `AndroidManifest.xml` declares zero `<uses-permission>` entries (not even `android.permission.INTERNET`) and disables Android Auto Backup (`android:allowBackup="false"`).
- **No cloud backup leakage on iOS:** The local storage directory (`Application Support/FamilyFieldGuide`) is marked `isExcludedFromBackup = true` so local `state.json` stays off unencrypted/automatic iCloud device backups.

## At-Rest Storage vs. Passphrase Encryption

1. **Local Storage on Your Device:**
   - **Web / PWA:** Saved locally in browser `localStorage` (`familyFieldGuide.v1`). Enabling **Lock** encrypts local storage under `familyFieldGuide.locked.v1` with your passphrase (`AES-256-GCM`) and auto-locks after 15 minutes idle.
   - **Native Apps:** Stored in each OS's private app-data location (`Application Support` on macOS/iOS, internal `filesDir` on Android, `%AppData%\FamilyFieldGuide` on Windows, `$XDG_DATA_HOME/family-field-guide/state.json` with `0600` permissions on Linux), protected by your OS full-disk encryption (FileVault, iOS Data Protection, Android FBE, BitLocker, LUKS).
   - **Device Lock Screens:** macOS/iOS use Touch ID / Face ID / device passcode (`LocalAuthentication`), Android uses `BiometricPrompt`, and Windows & Linux use an in-memory session lock passphrase while open.
2. **Encrypted Backups & Interop ([`shared/BACKUP_FORMAT.md`](shared/BACKUP_FORMAT.md)):**
   - **Cipher:** `AES-GCM` with a 256-bit key (`ciphertext || 16-byte tag`)
   - **Key Derivation:** `PBKDF2-HMAC-SHA256`, **250,000 iterations**, fresh random **16-byte salt** per save
   - **Nonce / IV:** Fresh random **12-byte IV** per encryption operation
   - **2-of-3 Split Recovery Cards:** Client-side Shamir Secret Sharing over `GF(256)` (`0x1b`) splits your passphrase into 3 cards (`FFG-1-...`, `FFG-2-...`, `FFG-3-...`). Any 2 reconstruct the passphrase; 1 alone reveals zero information.

## Safe Usage Rules (Important)

1. **Never enter raw secrets:** Never type account passwords, 12/24-word crypto seed phrases, private keys, or full national ID numbers (SSN / Aadhaar / SIN). Write **where** those items are stored plus the **last 4 digits only**. Built-in Readiness Audits flag accidental seed phrases or full SSN/Aadhaar patterns.
2. **Keep backups offline & separate from passphrases:** Store standalone `.html` / `.json` backups separately from their passphrase (or use the 2-of-3 Split Recovery Cards across Spouse · Safe · Trusted Person). Never commit backup files to GitHub.
3. **Use a private repository if customizing personal labels:** Public repositories expose anything you commit, including custom section or table names.
4. **iOS / Safari PWA note:** Apple Safari can purge unused `localStorage` on web apps not opened for extended periods. Always export a locked standalone `.html` backup (or use the native iOS app).

## Reporting a Vulnerability

If you discover a security or cryptographic issue in this codebase, please open a **Private Vulnerability Report** via the repository's **Security** tab (or contact the maintainer directly) before posting public exploit details so a fix can be prepared responsibly.
