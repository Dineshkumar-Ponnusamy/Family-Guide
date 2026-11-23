# Pure Native Android App (Kotlin 2.0 + Jetpack Compose + Material 3)

100% pure native Android implementation of **Our Family Field Guide** (`minSdk 26` / Android 8.0+), with **zero `INTERNET` permission** in `AndroidManifest.xml`—meaning the Android OS itself guarantees zero network traffic leaves your phone.

## Highlights
- **OS-Enforced Offline:** Zero `INTERNET` permission requested.
- **Byte-for-Byte Interoperable Backups:** Uses `PBKDF2WithHmacSHA256` (250k rounds) + `AES/GCM/NoPadding` and `GF(256)` 2-of-3 Shamir Split Recovery Cards compatible with Web, macOS, iOS, Windows, and Linux.
- **Native Fingerprint / Face / PIN Lock:** Uses AndroidX `BiometricPrompt`.
- **Single Source of Truth:** Syncs `app/src/main/assets/guide-data.json` from `shared/guide-data.json` via `python3 ../../shared/sync_schema.py`.

## Build & Test Locally

Open `native/android/` in **Android Studio**, or build with Gradle 8.9 + JDK 17:

```bash
cd native/android
gradle testDebugUnitTest assembleDebug
```

On GitHub, `.github/workflows/android.yml` automatically runs all unit tests and builds a downloadable `.apk` artifact.
