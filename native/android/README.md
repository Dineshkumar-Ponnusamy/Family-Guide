# Pure Native Android App (Kotlin 2.0 + Jetpack Compose + Material 3)

100% pure native Android implementation of **Our Family Field Guide** (`minSdk 26` / Android 8.0+), with **zero `INTERNET` permission** in `AndroidManifest.xml`—meaning the Android OS itself guarantees zero network traffic leaves your phone.

## Highlights
- **OS-Enforced Offline:** Zero `INTERNET` permission requested, with `android:allowBackup="false"` and `FLAG_SECURE` enabled to block screenshots and app-switcher previews.
- **At-Rest Local Encryption:** `state.json` is encrypted on disk using an `AndroidKeyStore` AES-256-GCM key (`ffg_local_state_key`, storing `12-byte IV || ciphertext`), with atomic writes (`state.json.tmp` → `state.json`) and transparent migration from legacy plaintext files.
- **Byte-for-Byte Interoperable Backups:** Exports encrypted `.json` backups and imports `.json` or `.html` backups using `PBKDF2WithHmacSHA256` (250k rounds) + `AES/GCM/NoPadding` and `GF(256)` 2-of-3 Shamir Split Recovery Cards compatible with Web, macOS, iOS, Windows, and Linux.
- **Native Fingerprint / Face / PIN Lock:** Uses AndroidX `BiometricPrompt`, persists `lock_enabled` in `SharedPreferences`, locks on launch when enabled, and auto-locks when backgrounded (`onStop`).
- **Single Source of Truth:** Syncs `app/src/main/assets/guide-data.json` from `shared/guide-data.json` via `python3 ../../shared/sync_schema.py`.

## Build & Test Locally

Open `native/android/` in **Android Studio**, or build with Gradle 8.11+ + JDK 17:

```bash
cd native/android
gradle testDebugUnitTest assembleDebug
```

### Signed Release Builds

Release builds enable R8 minification (`isMinifyEnabled = true`) and resource shrinking (`isShrinkResources = true`). To sign `assembleRelease`, set the following environment variables:

- `FFG_KEYSTORE_PATH`
- `FFG_KEYSTORE_PASSWORD`
- `FFG_KEY_ALIAS`
- `FFG_KEY_PASSWORD`

In CI, `.github/workflows/release.yml` maps GitHub Actions secrets `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, and `ANDROID_KEY_PASSWORD` to those `FFG_KEYSTORE_*` environment variables to publish a signed `Our-Family-Field-Guide-Android.apk`, and falls back to `Our-Family-Field-Guide-Android-PREVIEW-debug.apk` when those secrets are not configured.

On GitHub, `.github/workflows/android.yml` automatically runs all unit tests and builds a downloadable `.apk` artifact.
