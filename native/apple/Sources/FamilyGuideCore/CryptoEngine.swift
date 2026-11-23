import CommonCrypto
import CryptoKit
import Foundation
import Security

public enum CryptoEngineError: LocalizedError, Sendable {
    case invalidPassphrase
    case invalidPackage
    case encryptionFailed
    case decryptionFailed
    case invalidShareFormat
    case duplicateShareIndex
    case mismatchedShareLength

    public var errorDescription: String? {
        switch self {
        case .invalidPassphrase: return "Use at least 8 characters for the passphrase."
        case .invalidPackage: return "That file or text isn't a valid Family Field Guide backup."
        case .encryptionFailed: return "Could not encrypt backup."
        case .decryptionFailed: return "Wrong passphrase or corrupted backup."
        case .invalidShareFormat: return "Invalid recovery card format (expected FFG-1-...)."
        case .duplicateShareIndex: return "Use two different recovery cards (e.g. Card 1 and Card 2)."
        case .mismatchedShareLength: return "Recovery cards do not match each other."
        }
    }
}

public enum CryptoEngine: Sendable {
    public static let pbkdf2Iterations = 250_000

    public static func randomBytes(_ count: Int) -> Data {
        var bytes = [UInt8](repeating: 0, count: count)
        let status = SecRandomCopyBytes(kSecRandomDefault, count, &bytes)
        if status == errSecSuccess {
            return Data(bytes)
        }
        return Data((0..<count).map { _ in UInt8.random(in: 0...255) })
    }

    public static func deriveKey(passphrase: String, salt: Data, iterations: Int = pbkdf2Iterations) throws -> SymmetricKey {
        let passData = Data(passphrase.utf8)
        var derived = [UInt8](repeating: 0, count: 32)
        let result = derived.withUnsafeMutableBytes { outBuf in
            passData.withUnsafeBytes { passBuf in
                salt.withUnsafeBytes { saltBuf in
                    CCKeyDerivationPBKDF(
                        CCPBKDFAlgorithm(kCCPBKDF2),
                        passBuf.baseAddress?.assumingMemoryBound(to: Int8.self),
                        passData.count,
                        saltBuf.baseAddress?.assumingMemoryBound(to: UInt8.self),
                        salt.count,
                        CCPseudoRandomAlgorithm(kCCPRFHmacAlgSHA256),
                        UInt32(iterations),
                        outBuf.baseAddress?.assumingMemoryBound(to: UInt8.self),
                        32
                    )
                }
            }
        }
        guard result == kCCSuccess else { throw CryptoEngineError.encryptionFailed }
        return SymmetricKey(data: Data(derived))
    }

    public static func encrypt(state: GuideState, passphrase: String) throws -> EncryptedBackupPackage {
        guard !passphrase.isEmpty else { throw CryptoEngineError.invalidPassphrase }
        let salt = randomBytes(16)
        let ivData = randomBytes(12)
        let key = try deriveKey(passphrase: passphrase, salt: salt)
        let encoder = JSONEncoder()
        let plaintext = try encoder.encode(state)
        let nonce = try AES.GCM.Nonce(data: ivData)
        let sealed = try AES.GCM.seal(plaintext, using: key, nonce: nonce)
        // Web Crypto outputs ciphertext || 16-byte authentication tag.
        let combined = sealed.ciphertext + sealed.tag
        return EncryptedBackupPackage(
            app: "family-field-guide",
            v: 1,
            salt: salt.base64EncodedString(),
            iv: ivData.base64EncodedString(),
            data: combined.base64EncodedString()
        )
    }

    public static func decrypt(package: EncryptedBackupPackage, passphrase: String) throws -> GuideState {
        guard package.app == "family-field-guide",
              package.v == 1,
              let salt = Data(base64Encoded: package.salt),
              let ivData = Data(base64Encoded: package.iv),
              let combined = Data(base64Encoded: package.data),
              combined.count > 16 else {
            throw CryptoEngineError.invalidPackage
        }
        let key = try deriveKey(passphrase: passphrase, salt: salt)
        let ciphertext = combined.dropLast(16)
        let tag = combined.suffix(16)
        do {
            let nonce = try AES.GCM.Nonce(data: ivData)
            let box = try AES.GCM.SealedBox(nonce: nonce, ciphertext: ciphertext, tag: tag)
            let plaintext = try AES.GCM.open(box, using: key)
            return try JSONDecoder().decode(GuideState.self, from: plaintext)
        } catch {
            throw CryptoEngineError.decryptionFailed
        }
    }

    public static func parseBackupPayload(from text: String) throws -> EncryptedBackupPackage {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { throw CryptoEngineError.invalidPackage }
        if trimmed.hasPrefix("{") {
            let pkg = try JSONDecoder().decode(EncryptedBackupPackage.self, from: Data(trimmed.utf8))
            guard pkg.app == "family-field-guide" else { throw CryptoEngineError.invalidPackage }
            return pkg
        }
        let pattern = #"<script\s+id=["']ffg-pkg["'][^>]*>([\s\S]*?)<\/script>"#
        let regex = try NSRegularExpression(pattern: pattern, options: [.caseInsensitive])
        let range = NSRange(trimmed.startIndex..<trimmed.endIndex, in: trimmed)
        guard let match = regex.firstMatch(in: trimmed, options: [], range: range),
              let capRange = Range(match.range(at: 1), in: trimmed) else {
            throw CryptoEngineError.invalidPackage
        }
        let rawJson = String(trimmed[capRange]).replacingOccurrences(of: #"<\/script"#, with: "</script")
        let pkg = try JSONDecoder().decode(EncryptedBackupPackage.self, from: Data(rawJson.utf8))
        guard pkg.app == "family-field-guide" else { throw CryptoEngineError.invalidPackage }
        return pkg
    }

    public static func generatePassphrase(wordCount: Int = 5, words: [String]) -> String {
        let pool = words.isEmpty ? ["maple", "river", "lantern", "cedar", "orbit"] : words
        var picks: [String] = []
        picks.reserveCapacity(wordCount)
        for _ in 0..<wordCount {
            let idx = Int(UInt32.random(in: 0..<UInt32(pool.count)))
            picks.append(pool[idx])
        }
        return picks.joined(separator: "-")
    }

    // MARK: - GF(256) Shamir 2-of-3 Recovery Cards (Matches app.js 0x1b)

    private static func gfMul(_ aIn: UInt8, _ bIn: UInt8) -> UInt8 {
        var a = aIn
        var b = bIn
        var p: UInt8 = 0
        for _ in 0..<8 {
            if (b & 1) != 0 { p ^= a }
            let hi = (a & 0x80) != 0
            a <<= 1
            if hi { a ^= 0x1b }
            b >>= 1
        }
        return p
    }

    private static func gfPow(_ a: UInt8, _ eIn: Int) -> UInt8 {
        var res: UInt8 = 1
        var base = a
        var e = eIn
        while e > 0 {
            if (e & 1) != 0 { res = gfMul(res, base) }
            base = gfMul(base, base)
            e >>= 1
        }
        return res
    }

    private static func gfDiv(_ a: UInt8, _ b: UInt8) -> UInt8 {
        a == 0 ? 0 : gfMul(a, gfPow(b, 254))
    }

    public static func sssSplit2of3(secret: String) throws -> [String] {
        let bytes = Array(secret.utf8)
        guard !bytes.isEmpty else { throw CryptoEngineError.invalidPassphrase }
        let rand = [UInt8](randomBytes(bytes.count))
        return (1...3).map { x in
            let hex = (0..<bytes.count).map { i in
                String(format: "%02X", bytes[i] ^ gfMul(rand[i], UInt8(x)))
            }.joined()
            var grouped = ""
            for (idx, ch) in hex.enumerated() {
                if idx > 0 && idx % 4 == 0 { grouped.append("-") }
                grouped.append(ch)
            }
            return "FFG-\(x)-\(grouped)"
        }
    }

    private static func parseShare(_ str: String) throws -> (x: UInt8, bytes: [UInt8]) {
        let up = str.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
        guard up.hasPrefix("FFG-") else { throw CryptoEngineError.invalidShareFormat }
        let rest = up.dropFirst(4)
        guard let idxChar = rest.first, let xVal = UInt8(String(idxChar)), (1...3).contains(xVal) else {
            throw CryptoEngineError.invalidShareFormat
        }
        let afterDash = rest.dropFirst()
        guard afterDash.first == "-" else { throw CryptoEngineError.invalidShareFormat }
        let hex = afterDash.dropFirst().filter { ("0"..."9").contains($0) || ("A"..."F").contains($0) }
        guard !hex.isEmpty && hex.count % 2 == 0 else { throw CryptoEngineError.invalidShareFormat }
        var bytes: [UInt8] = []
        bytes.reserveCapacity(hex.count / 2)
        var i = hex.startIndex
        while i < hex.endIndex {
            let next = hex.index(i, offsetBy: 2)
            guard let byte = UInt8(hex[i..<next], radix: 16) else { throw CryptoEngineError.invalidShareFormat }
            bytes.append(byte)
            i = next
        }
        return (xVal, bytes)
    }

    public static func sssCombine2of3(_ shareA: String, _ shareB: String) throws -> String {
        let a = try parseShare(shareA)
        let b = try parseShare(shareB)
        guard a.x != b.x else { throw CryptoEngineError.duplicateShareIndex }
        guard a.bytes.count == b.bytes.count else { throw CryptoEngineError.mismatchedShareLength }
        let dx = a.x ^ b.x
        let l1 = gfDiv(b.x, dx)
        let l2 = gfDiv(a.x, dx)
        let out = (0..<a.bytes.count).map { i in
            gfMul(a.bytes[i], l1) ^ gfMul(b.bytes[i], l2)
        }
        guard let decoded = String(bytes: out, encoding: .utf8) else {
            throw CryptoEngineError.decryptionFailed
        }
        return decoded
    }
}
