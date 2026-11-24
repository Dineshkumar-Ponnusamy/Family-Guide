# Pure Native Apple Apps (macOS & iOS — Swift 6 + SwiftUI)

100% pure native SwiftUI implementation of **Our Family Field Guide** for **macOS 14+** and **iOS 17+**, using zero third-party packages and Apple's native frameworks (`SwiftUI`, `CryptoKit`, `CommonCrypto`, `LocalAuthentication`, `Security`).

## Highlights
- **Byte-for-Byte Interoperable Backups:** Exports AES-256-GCM (`PBKDF2-HMAC-SHA256`, 250,000 rounds) `.json` backups and imports/merges both `.json` and standalone `.html` backups—plus `GF(256)` 2-of-3 Shamir Split Recovery Cards (`FFG-1-...`)—matching the Web PWA and Android, Windows, and Linux apps.
- **Keychain-Backed Storage & Biometric Re-Lock:** Encrypts local `state.json` at rest using an AES-256-GCM symmetric key stored in the Apple Keychain (`io.github.dineshkumarponnusamy.familyfieldguide.localkey`), persists lock state, and automatically re-locks whenever the app leaves the active scene phase (`scenePhase != .active`). Unlocks via **Touch ID / Face ID / Device Passcode** (`LocalAuthentication`).
- **Single Source of Truth:** Uses `Resources/guide-data.json` synced directly from root `schema.js` and `regions.js` via `python3 ../../shared/sync_schema.py`.

## Run & Test on macOS

```bash
cd native/apple
swift test                 # Runs FamilyGuideCore & CryptoKit / Shamir interop tests
swift run FamilyGuideMac   # Launches the pure native macOS SwiftUI app
```

## Build & Signing Notes (macOS & iOS)
1. Open Xcode → **File → New → Project → iOS App** (SwiftUI).
2. Drag `native/apple` into your Xcode project (or add it as a local Swift Package dependency) and link `FamilyGuideCore` + `FamilyGuideUI`.
3. Use `iOSApp/FamilyGuideiOSApp.swift` as your `@main` entry point and enable `NSFaceIDUsageDescription` in `Info.plist` for Face ID unlock.
4. **Code Signing & Entitlements:**
   - **iOS & macOS Keychain:** Distributed `.app` builds should be signed with a valid Apple Development / Distribution team so Keychain items (`kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly`) persist reliably across launches.
   - **macOS App Sandbox:** If enabling the macOS App Sandbox in Xcode, enable **User Selected File (Read/Write)** (`com.apple.security.files.user-selected.read-write`) so `.fileExporter` and `.fileImporter` can save and open backup files.
