package io.github.dineshkumarponnusamy.familyfieldguide.core

import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.security.SecureRandom
import java.util.Base64
import javax.crypto.Cipher
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.PBEKeySpec
import javax.crypto.spec.SecretKeySpec

object CryptoEngine {
    const val PBKDF2_ITERATIONS = 250_000
    private val rng = SecureRandom()
    private val json = Json { ignoreUnknownKeys = true; encodeDefaults = true }

    fun randomBytes(count: Int): ByteArray = ByteArray(count).also { rng.nextBytes(it) }

    fun deriveKey(passphrase: String, salt: ByteArray, iterations: Int = PBKDF2_ITERATIONS): SecretKeySpec {
        val spec = PBEKeySpec(passphrase.toCharArray(), salt, iterations, 256)
        val factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
        val bytes = factory.generateSecret(spec).encoded
        return SecretKeySpec(bytes, "AES")
    }

    fun encrypt(state: GuideState, passphrase: String): EncryptedBackupPackage {
        require(passphrase.isNotEmpty()) { "Passphrase cannot be empty." }
        val salt = randomBytes(16)
        val iv = randomBytes(12)
        val key = deriveKey(passphrase, salt)
        val plaintext = json.encodeToString(state).toByteArray(Charsets.UTF_8)
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, key, GCMParameterSpec(128, iv))
        // Java AES/GCM doFinal returns ciphertext || 16-byte authentication tag (matches Web Crypto).
        val combined = cipher.doFinal(plaintext)
        val b64 = Base64.getEncoder()
        return EncryptedBackupPackage(
            app = "family-field-guide",
            v = 1,
            salt = b64.encodeToString(salt),
            iv = b64.encodeToString(iv),
            data = b64.encodeToString(combined)
        )
    }

    fun decrypt(pkg: EncryptedBackupPackage, passphrase: String): GuideState {
        require(pkg.app == "family-field-guide" && pkg.v == 1) { "Invalid backup package." }
        val dec = Base64.getDecoder()
        val salt = dec.decode(pkg.salt)
        val iv = dec.decode(pkg.iv)
        val combined = dec.decode(pkg.data)
        require(combined.size > 16) { "Corrupted backup payload." }
        val key = deriveKey(passphrase, salt)
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.DECRYPT_MODE, key, GCMParameterSpec(128, iv))
        val plaintext = cipher.doFinal(combined)
        return json.decodeFromString(GuideState.serializer(), String(plaintext, Charsets.UTF_8))
    }

    fun parseBackupPayload(text: String): EncryptedBackupPackage {
        val trimmed = text.trim()
        require(trimmed.isNotEmpty()) { "Empty backup input." }
        if (trimmed.startsWith("{")) {
            val pkg = json.decodeFromString(EncryptedBackupPackage.serializer(), trimmed)
            require(pkg.app == "family-field-guide") { "Not a Family Field Guide backup." }
            return pkg
        }
        val regex = Regex("""<script\s+id=["']ffg-pkg["'][^>]*>([\s\S]*?)<\/script>""", RegexOption.IGNORE_CASE)
        val match = regex.find(trimmed) ?: throw IllegalArgumentException("Not a valid guide backup file.")
        val rawJson = match.groupValues[1].replace("""<\/script""", "</script")
        val pkg = json.decodeFromString(EncryptedBackupPackage.serializer(), rawJson)
        require(pkg.app == "family-field-guide") { "Not a Family Field Guide backup." }
        return pkg
    }

    fun generatePassphrase(wordCount: Int = 5, words: List<String>): String {
        val pool = if (words.isEmpty()) listOf("maple", "river", "lantern", "cedar", "orbit") else words
        return (0 until wordCount).joinToString("-") { pool[rng.nextInt(pool.size)] }
    }

    // GF(256) Shamir 2-of-3 Recovery Cards (AES polynomial 0x1b, byte-for-byte compatible with app.js & Swift)

    private fun gfMul(aIn: Int, bIn: Int): Int {
        var a = aIn and 0xff
        var b = bIn and 0xff
        var p = 0
        for (i in 0 until 8) {
            if ((b and 1) != 0) p = p xor a
            val hi = (a and 0x80) != 0
            a = (a shl 1) and 0xff
            if (hi) a = a xor 0x1b
            b = b ushr 1
        }
        return p
    }

    private fun gfPow(a: Int, eIn: Int): Int {
        var res = 1
        var base = a and 0xff
        var e = eIn
        while (e > 0) {
            if ((e and 1) != 0) res = gfMul(res, base)
            base = gfMul(base, base)
            e = e ushr 1
        }
        return res
    }

    private fun gfDiv(a: Int, b: Int): Int = if (a == 0) 0 else gfMul(a, gfPow(b, 254))

    fun sssSplit2of3(secret: String): List<String> {
        val bytes = secret.toByteArray(Charsets.UTF_8)
        require(bytes.isNotEmpty()) { "Passphrase cannot be empty." }
        val rand = randomBytes(bytes.size)
        return (1..3).map { x ->
            val sb = StringBuilder()
            for (i in bytes.indices) {
                val y = (bytes[i].toInt() and 0xff) xor gfMul(rand[i].toInt() and 0xff, x)
                sb.append(String.format("%02X", y))
            }
            val hex = sb.toString()
            val grouped = hex.chunked(4).joinToString("-")
            "FFG-$x-$grouped"
        }
    }

    private fun parseShare(str: String): Pair<Int, ByteArray> {
        val match = Regex("""^FFG-([123])-(.+)$""").matchEntire(str.trim().uppercase())
            ?: throw IllegalArgumentException("Invalid recovery card format (expected FFG-1-...).")
        val x = match.groupValues[1].toInt()
        val hex = match.groupValues[2].replace(Regex("[^0-9A-F]"), "")
        require(hex.isNotEmpty() && hex.length % 2 == 0) { "Invalid recovery card hex." }
        val bytes = ByteArray(hex.length / 2) { i -> hex.substring(i * 2, i * 2 + 2).toInt(16).toByte() }
        return x to bytes
    }

    fun sssCombine2of3(shareA: String, shareB: String): String {
        val (x1, b1) = parseShare(shareA)
        val (x2, b2) = parseShare(shareB)
        require(x1 != x2) { "Use two different cards (e.g. Card 1 and Card 2)." }
        require(b1.size == b2.size) { "Recovery cards do not match." }
        val dx = x1 xor x2
        val l1 = gfDiv(x2, dx)
        val l2 = gfDiv(x1, dx)
        val out = ByteArray(b1.size) { i ->
            (gfMul(b1[i].toInt() and 0xff, l1) xor gfMul(b2[i].toInt() and 0xff, l2)).toByte()
        }
        return String(out, Charsets.UTF_8)
    }
}
