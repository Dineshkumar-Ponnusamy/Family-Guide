use aes_gcm::aead::{Aead, KeyInit};
use aes_gcm::{Aes256Gcm, Nonce};
use base64::engine::general_purpose::STANDARD as B64;
use base64::Engine as _;
use pbkdf2::pbkdf2_hmac;
use rand::rngs::OsRng;
use rand::{Rng, RngCore};
use regex::Regex;
use sha2::Sha256;

use crate::models::{EncryptedBackupPackage, GuideState};

pub const PBKDF2_ITERATIONS: u32 = 250_000;
const SALT_LEN: usize = 16;
const IV_LEN: usize = 12;

pub fn random_bytes(len: usize) -> Vec<u8> {
    let mut buf = vec![0u8; len];
    OsRng.fill_bytes(&mut buf);
    buf
}

pub fn derive_key(passphrase: &str, salt: &[u8]) -> [u8; 32] {
    let mut key = [0u8; 32];
    pbkdf2_hmac::<Sha256>(passphrase.as_bytes(), salt, PBKDF2_ITERATIONS, &mut key);
    key
}

/// Encrypts `GuideState` into the exact `familyFieldGuide.v1` JSON payload used
/// across Web Crypto, Swift CryptoKit, Android JCA, and .NET AesGcm:
/// PBKDF2-HMAC-SHA256 (250k rounds, 16-byte salt) + AES-256-GCM (12-byte IV,
/// `ciphertext || 16-byte tag` stored as base64 in `data`).
pub fn encrypt_state(state: &GuideState, passphrase: &str) -> Result<EncryptedBackupPackage, String> {
    if passphrase.is_empty() {
        return Err("Enter a passphrase to encrypt this backup.".to_string());
    }
    let salt = random_bytes(SALT_LEN);
    let iv = random_bytes(IV_LEN);
    let key = derive_key(passphrase, &salt);
    let cipher = Aes256Gcm::new_from_slice(&key).map_err(|_| "Invalid AES key".to_string())?;
    let plaintext = serde_json::to_vec(state).map_err(|e| format!("JSON encode error: {e}"))?;
    let nonce = Nonce::from_slice(&iv);
    let combined = cipher
        .encrypt(nonce, plaintext.as_ref())
        .map_err(|_| "Could not encrypt backup.".to_string())?;

    Ok(EncryptedBackupPackage {
        app: "family-field-guide".to_string(),
        v: 1,
        salt: B64.encode(&salt),
        iv: B64.encode(&iv),
        data: B64.encode(&combined),
    })
}

pub fn decrypt_state(pkg: &EncryptedBackupPackage, passphrase: &str) -> Result<GuideState, String> {
    if pkg.app != "family-field-guide" || pkg.v != 1 {
        return Err("Unsupported or invalid Family Field Guide backup package.".to_string());
    }
    let salt = B64
        .decode(pkg.salt.trim())
        .map_err(|_| "Corrupted backup salt.".to_string())?;
    let iv = B64
        .decode(pkg.iv.trim())
        .map_err(|_| "Corrupted backup IV.".to_string())?;
    let combined = B64
        .decode(pkg.data.trim())
        .map_err(|_| "Corrupted backup payload.".to_string())?;
    if iv.len() != IV_LEN || combined.len() <= 16 {
        return Err("Corrupted backup length.".to_string());
    }

    let key = derive_key(passphrase, &salt);
    let cipher = Aes256Gcm::new_from_slice(&key).map_err(|_| "Invalid AES key".to_string())?;
    let nonce = Nonce::from_slice(&iv);
    let plaintext = cipher
        .decrypt(nonce, combined.as_ref())
        .map_err(|_| "Wrong passphrase or corrupted backup.".to_string())?;

    serde_json::from_slice::<GuideState>(&plaintext)
        .map_err(|e| format!("Backup unlocked, but state JSON was invalid: {e}"))
}

/// Parses either a raw `.json` backup or a standalone `.html` backup containing
/// `<script id="ffg-pkg" type="application/json">...</script>`.
pub fn parse_backup_payload(raw_text: &str) -> Result<EncryptedBackupPackage, String> {
    let trimmed = raw_text.trim();
    if trimmed.is_empty() {
        return Err("Backup file is empty.".to_string());
    }
    if trimmed.starts_with('{') {
        let pkg: EncryptedBackupPackage = serde_json::from_str(trimmed)
            .map_err(|_| "That file isn't a valid Family Field Guide JSON backup.".to_string())?;
        if pkg.app != "family-field-guide" {
            return Err("Unrecognized backup app identifier.".to_string());
        }
        return Ok(pkg);
    }

    let re = Regex::new(r#"(?is)<script\s+[^>]*id=["']ffg-pkg["'][^>]*>([\s\S]*?)<\/script>"#)
        .map_err(|_| "Regex error".to_string())?;
    let caps = re
        .captures(trimmed)
        .ok_or_else(|| "Could not find embedded encrypted payload (<script id=\"ffg-pkg\">) in HTML file.".to_string())?;
    let raw_json = caps[1].replace(r"<\/script", "</script");
    let pkg: EncryptedBackupPackage = serde_json::from_str(raw_json.trim())
        .map_err(|_| "Embedded HTML backup payload is malformed.".to_string())?;
    if pkg.app != "family-field-guide" {
        return Err("Unrecognized backup app identifier.".to_string());
    }
    Ok(pkg)
}

pub fn generate_passphrase(words: &[String], word_count: usize) -> String {
    let fallback = [
        "amber".to_string(),
        "cedar".to_string(),
        "lantern".to_string(),
        "orbit".to_string(),
        "river".to_string(),
    ];
    let pool = if words.is_empty() { &fallback[..] } else { words };
    let mut rng = OsRng;
    let mut picks = Vec::with_capacity(word_count);
    for _ in 0..word_count {
        let idx = rng.gen_range(0..pool.len());
        picks.push(pool[idx].clone());
    }
    picks.join("-")
}

// MARK: - GF(256) 2-of-3 Shamir Split Recovery Cards (`0x1b`, matches app.js)

fn gf_mul(mut a: u8, mut b: u8) -> u8 {
    let mut p = 0u8;
    for _ in 0..8 {
        if (b & 1) != 0 {
            p ^= a;
        }
        let hi = (a & 0x80) != 0;
        a <<= 1;
        if hi {
            a ^= 0x1b;
        }
        b >>= 1;
    }
    p
}

fn gf_pow(mut base: u8, mut exp: u32) -> u8 {
    let mut res = 1u8;
    while exp > 0 {
        if (exp & 1) != 0 {
            res = gf_mul(res, base);
        }
        base = gf_mul(base, base);
        exp >>= 1;
    }
    res
}

fn gf_div(a: u8, b: u8) -> u8 {
    if a == 0 {
        0
    } else {
        gf_mul(a, gf_pow(b, 254))
    }
}

pub fn sss_split_2of3(secret: &str) -> Result<[String; 3], String> {
    let bytes = secret.as_bytes();
    if bytes.is_empty() {
        return Err("Enter a passphrase before splitting into recovery cards.".to_string());
    }
    let rand_coeff = random_bytes(bytes.len());
    let mut cards = [String::new(), String::new(), String::new()];
    for x in 1..=3u8 {
        let mut hex = String::with_capacity(bytes.len() * 2);
        for i in 0..bytes.len() {
            let y = bytes[i] ^ gf_mul(rand_coeff[i], x);
            hex.push_str(&format!("{:02X}", y));
        }
        let mut grouped = String::with_capacity(hex.len() + hex.len() / 4);
        for (idx, ch) in hex.chars().enumerate() {
            if idx > 0 && idx % 4 == 0 {
                grouped.push('-');
            }
            grouped.push(ch);
        }
        cards[(x - 1) as usize] = format!("FFG-{x}-{grouped}");
    }
    Ok(cards)
}

fn parse_share(card: &str) -> Result<(u8, Vec<u8>), String> {
    let up = card.trim().to_uppercase();
    let rest = up
        .strip_prefix("FFG-")
        .ok_or_else(|| "Invalid recovery card format (expected FFG-1-...).".to_string())?;
    let mut chars = rest.chars();
    let idx_ch = chars
        .next()
        .ok_or_else(|| "Missing share index in recovery card.".to_string())?;
    let x_val = idx_ch
        .to_digit(10)
        .and_then(|d| if (1..=3).contains(&d) { Some(d as u8) } else { None })
        .ok_or_else(|| "Recovery card index must be 1, 2, or 3.".to_string())?;
    if chars.next() != Some('-') {
        return Err("Invalid recovery card format after share index.".to_string());
    }
    let hex: String = chars
        .filter(|c| c.is_ascii_hexdigit())
        .collect();
    if hex.is_empty() || hex.len() % 2 != 0 {
        return Err("Recovery card payload length is invalid.".to_string());
    }
    let mut out = Vec::with_capacity(hex.len() / 2);
    for chunk in hex.as_bytes().chunks_exact(2) {
        let s = std::str::from_utf8(chunk).map_err(|_| "UTF-8 error".to_string())?;
        let byte = u8::from_str_radix(s, 16)
            .map_err(|_| "Invalid hex byte in recovery card.".to_string())?;
        out.push(byte);
    }
    Ok((x_val, out))
}

pub fn sss_combine_2of3(card_a: &str, card_b: &str) -> Result<String, String> {
    let (xa, ba) = parse_share(card_a)?;
    let (xb, bb) = parse_share(card_b)?;
    if xa == xb {
        return Err("Use two different recovery cards (e.g. Card 1 and Card 2).".to_string());
    }
    if ba.len() != bb.len() {
        return Err("Recovery cards do not match each other (length mismatch).".to_string());
    }
    let dx = xa ^ xb;
    let l1 = gf_div(xb, dx);
    let l2 = gf_div(xa, dx);
    let mut out = Vec::with_capacity(ba.len());
    for i in 0..ba.len() {
        out.push(gf_mul(ba[i], l1) ^ gf_mul(bb[i], l2));
    }
    String::from_utf8(out).map_err(|_| "Recovery cards did not decode to valid UTF-8 text.".to_string())
}
