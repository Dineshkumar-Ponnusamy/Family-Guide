# Cross-Platform Backup & Crypto Format Specification (`v1`)

Every native app (macOS, iOS, Android, Windows, Linux) and the Web PWA read and write the **exact same encrypted backup format** so spouses can exchange backups across different devices seamlessly.

## 1. Encrypted JSON Wire Format

```json
{
  "app": "family-field-guide",
  "v": 1,
  "salt": "<base64 of 16 random bytes>",
  "iv": "<base64 of 12 random bytes>",
  "data": "<base64 of AES-256-GCM ciphertext || 16-byte authentication tag>"
}
```

Standalone `.html` backups embed this exact JSON inside:
```html
<script id="ffg-pkg" type="application/json">{...}</script>
```

### Cryptography Parameters
- **Key Derivation:** PBKDF2-HMAC-SHA256, `250,000` iterations, UTF-8 passphrase bytes, 16-byte random salt → 256-bit (32-byte) key.
- **Authenticated Encryption:** AES-256-GCM with random 12-byte IV (`nonce`), zero Additional Authenticated Data (AAD).
- **Ciphertext Layout:** Web Crypto API (`crypto.subtle.encrypt`) returns `ciphertext || 16-byte GCM tag`. Native implementations (Apple CryptoKit, Android `Cipher`, Windows .NET `AesGcm`, Rust `aes-gcm`) MUST concatenate `ciphertext + tag` on export and split the trailing 16 bytes on import.

## 2. 2-of-3 Shamir Split Recovery Cards (`FFG-1-...`)

- **Field:** `GF(2^8)` using AES irreducible polynomial `0x1b` (`x^8 + x^4 + x^3 + x + 1`).
- **Degree-1 Polynomial per UTF-8 byte `i` of passphrase:**
  - Generate random byte `r[i]` in `[0, 255]`.
  - For `x` in `{1, 2, 3}`: `y[i] = secret[i] ^ gfMul(r[i], x)`.
- **Card String Format:** `FFG-<x>-<HEX grouped in 4s separated by ->`, uppercase hex, e.g.:
  `FFG-1-4A1B-C902-...`
- **Reconstruction from any 2 distinct shares `(x1, y1)` and `(x2, y2)`:**
  - `dx = x1 ^ x2`
  - `l1 = gfDiv(x2, dx)`, `l2 = gfDiv(x1, dx)`
  - `secret[i] = gfMul(y1[i], l1) ^ gfMul(y2[i], l2)`

## 3. State JSON Schema (`familyFieldGuide.v1`)

Decrypted plaintext is UTF-8 JSON matching:
- `stateVersion`: `1` (integer schema version, normalized to `1` on load/save/sanitize for forward migration)
- `f`: `{ [fieldId: string]: string }`
- `lists`: `{ [listId: string]: Array<{ [colKey: string]: string }> }`
- `checks`: `{ [stepId: string]: boolean }`
- `track`: `"hurt" | "gone" | "money" | "caregiver" | "visa" | "illness" | "windfall"`
- `tab`: active tab id string
- `region`: `"us" | "us_in" | "in" | "visa_intl" | "uk" | "ca" | "au" | "eu" | "generic"`
- `readMode`, `largeText`, `highContrast`, `hideEssentials`, `isDemo`, `dismissDemo`: booleans
- `customTabs`: `Array<{ id, label, title }>`
- `extra`: `{ [tabId: string]: Array<{ type: "field" | "list", id, label?, title?, wide?, cols? }> }`
- `fireDrill`: `{ [drillId: string]: boolean }`
- `photos`: `Array<{ id, label, dataUrl }>`
- `updated`, `reviewed`, `lastBackup`, `lastDryRun`: strict ISO-8601 UTC timestamp strings (`YYYY-MM-DDTHH:mm:ss.sssZ` or `YYYY-MM-DDTHH:mm:ssZ`, e.g., `"2026-11-24T18:00:00.000Z"`) or `null`. All platforms MUST write UTC (`Z`) timestamps so cross-device recency comparisons and smart merges stay consistent.

## 4. Caregiver / ER Scoped Backup Packets (Least-Privilege)

The Web PWA supports exporting a scoped **Caregiver & ER Packet** (`family-caregiver-packet-YYYY-MM-DD.html` or `.json`) encrypted with the exact same `v1` envelope above so any platform can unlock and view it without exposing financial, legal, or credential-access data.

A Caregiver / ER packet sets:
- `stateVersion: 1`, `track: "caregiver"`, `tab: "kids"`, `readMode: true`, `region`, and `updated` (UTC ISO-8601)
- `f`: filtered strictly to caregiver, emergency medical/ER, and house shut-off fields (`q_first`, `q_binder`, `d_hcd`, `d_mpoa`, `d_ins`, `d_meds`, `h_pharm`, `h_wishes`, `h_diag`, `h_triage`, `h_redflag`, `h_devices`, `h_rescue`, `h_portal`, `h_comfort`, `hk_water`, `hk_gas`, `hk_breaker`, `hk_spare`, `hk_trash`, `hk_quirks`, `k_call`, `k_home`, `k_911`, `k_school`, `k_safe`, `k_routine`, `k_note`)
- `lists`: filtered strictly to `first`, `kids_info`, `fam_health`, and `pets`
- `checks: {}`, `customTabs: []`, `extra: {}`, `fireDrill: {}`
- `photos`: valid reference photos (max 10) excluding any photo whose label matches `/card|bank|ssn|passport|crypto|seed/i`
- All financial accounts, investments, crypto, insurance policies, bills, debts, property, IDs, legal documents, personal letter, and custom sections are omitted.
