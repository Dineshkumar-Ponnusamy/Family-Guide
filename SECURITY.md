# Security & Privacy Policy

**Our Family Field Guide** is designed so you never have to trust a server, cloud account, or third-party vendor with your family's emergency instructions.

## Privacy Guarantees

- **Zero backend / zero telemetry:** The app makes no API calls, uses no analytics or error trackers, and loads no external scripts, fonts, or stylesheets.
- **Local browser persistence:** By default, data is stored only in `localStorage` under `familyFieldGuide.v1` on the device you type on.
- **Optional In-Browser Lock:** Enabling **Lock** encrypts `localStorage` under `familyFieldGuide.locked.v1` using your passphrase and automatically locks the UI after 15 minutes of inactivity.

## Cryptography Details

All encryption runs locally inside your browser using the standard **Web Crypto API** (`crypto.subtle`):

- **Cipher:** `AES-GCM` with a 256-bit key
- **Key Derivation:** `PBKDF2` with `SHA-256`, **250,000 iterations**, and a fresh random **16-byte salt** (`crypto.getRandomValues`) per backup/save
- **Nonce / IV:** Fresh random **12-byte IV** per encryption operation
- **2-of-3 Split Recovery Cards:** Pure client-side Shamir Secret Sharing over `GF(256)` splits your passphrase into 3 formatted cards (`FFG-1-...`, `FFG-2-...`, `FFG-3-...`). Any 2 cards reconstruct the passphrase; any single card reveals zero information about it.

## Safe Usage Rules (Important)

1. **Never enter raw secrets:** Never type account passwords, 12/24-word crypto seed phrases, private keys, or full national ID numbers (SSN / Aadhaar / SIN). Write **where** those items are stored plus the **last 4 digits only**. Built-in Readiness Audits check for accidental seed phrases or full SSN/Aadhaar patterns.
2. **Keep backups offline & separate from passphrases:** Store standalone `.html` / `.json` backups separately from their passphrase (or use the 2-of-3 Split Recovery Cards across Spouse · Safe · Trusted Person). Never commit backup files to GitHub.
3. **Use a private repository if customizing personal labels:** Public repositories expose anything you commit, including custom section or table names.
4. **iOS / Safari note:** Apple Safari can purge unused `localStorage` on web apps not opened for extended periods. Always export and save a locked standalone `.html` backup to Apple Files, iCloud Drive, or a USB drive.

## Reporting a Vulnerability

If you discover a security or cryptographic issue in this codebase, please avoid posting public exploit details on Reddit first—open a private security advisory on GitHub (or contact the repository maintainer directly) so a fix can be prepared responsibly.
