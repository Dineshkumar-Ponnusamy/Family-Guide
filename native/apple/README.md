# Pure Native Apple Apps (macOS & iOS — Swift 6 + SwiftUI)

100% pure native SwiftUI implementation of **Our Family Field Guide** for **macOS 14+** and **iOS 17+**, using zero third-party packages and Apple's native frameworks (`SwiftUI`, `CryptoKit`, `CommonCrypto`, `LocalAuthentication`).

## Highlights
- **Byte-for-Byte Interoperable Backups:** Reads and writes the exact same AES-256-GCM (`PBKDF2-HMAC-SHA256`, 250,000 rounds) `.json` and standalone `.html` backups—plus `GF(256)` 2-of-3 Shamir Split Recovery Cards (`FFG-1-...`)—as the Web PWA and Android, Windows, and Linux apps.
- **Native Biometric Lock:** Supports **Touch ID / Face ID / Device Passcode** via `LocalAuthentication`.
- **Single Source of Truth:** Uses `Resources/guide-data.json` synced directly from root `schema.js` and `regions.js` via `python3 ../../shared/sync_schema.py`.

## Run & Test on macOS

```bash
cd native/apple
swift test                 # Runs FamilyGuideCore & CryptoKit / Shamir interop tests
swift run FamilyGuideMac   # Launches the pure native macOS SwiftUI app
```

## Build for iOS (iPhone / iPad) in Xcode
1. Open Xcode → **File → New → Project → iOS App** (SwiftUI).
2. Drag `native/apple` into your Xcode project (or add it as a local Swift Package dependency) and link `FamilyGuideCore` + `FamilyGuideUI`.
3. Use `iOSApp/FamilyGuideiOSApp.swift` as your `@main` entry point and enable `NSFaceIDUsageDescription` in `Info.plist` for Face ID unlock.
