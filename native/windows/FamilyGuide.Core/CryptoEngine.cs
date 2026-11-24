using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace FamilyGuide.Core;

public static class CryptoEngine
{
    public const int Pbkdf2Iterations = 250_000;
    private static readonly JsonSerializerOptions JsonOpts = new() { WriteIndented = false };

    public static byte[] DeriveKey(string passphrase, byte[] salt, int iterations = Pbkdf2Iterations) =>
        Rfc2898DeriveBytes.Pbkdf2(
            Encoding.UTF8.GetBytes(passphrase),
            salt,
            iterations,
            HashAlgorithmName.SHA256,
            32
        );

    public static EncryptedBackupPackage Encrypt(GuideState state, string passphrase)
    {
        if (string.IsNullOrEmpty(passphrase))
            throw new ArgumentException("Passphrase cannot be empty.", nameof(passphrase));

        byte[] salt = RandomNumberGenerator.GetBytes(16);
        byte[] iv = RandomNumberGenerator.GetBytes(12);
        byte[] key = DeriveKey(passphrase, salt);
        byte[] plaintext = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(state, JsonOpts));

        byte[] ciphertext = new byte[plaintext.Length];
        byte[] tag = new byte[16];
        using (var aes = new AesGcm(key, 16))
        {
            aes.Encrypt(iv, plaintext, ciphertext, tag);
        }

        // Web Crypto outputs ciphertext || 16-byte authentication tag.
        byte[] combined = new byte[ciphertext.Length + tag.Length];
        Buffer.BlockCopy(ciphertext, 0, combined, 0, ciphertext.Length);
        Buffer.BlockCopy(tag, 0, combined, ciphertext.Length, tag.Length);

        return new EncryptedBackupPackage
        {
            app = "family-field-guide",
            v = 1,
            salt = Convert.ToBase64String(salt),
            iv = Convert.ToBase64String(iv),
            data = Convert.ToBase64String(combined)
        };
    }

    public static GuideState Decrypt(EncryptedBackupPackage pkg, string passphrase)
    {
        if (pkg.app != "family-field-guide" || pkg.v != 1)
            throw new InvalidDataException("Not a valid Family Field Guide backup.");

        byte[] salt = Convert.FromBase64String(pkg.salt);
        byte[] iv = Convert.FromBase64String(pkg.iv);
        byte[] combined = Convert.FromBase64String(pkg.data);
        if (combined.Length <= 16)
            throw new InvalidDataException("Corrupted backup payload.");

        byte[] key = DeriveKey(passphrase, salt);
        int ctLen = combined.Length - 16;
        byte[] ciphertext = combined[..ctLen];
        byte[] tag = combined[ctLen..];
        byte[] plaintext = new byte[ctLen];

        using (var aes = new AesGcm(key, 16))
        {
            aes.Decrypt(iv, ciphertext, tag, plaintext);
        }

        return JsonSerializer.Deserialize<GuideState>(plaintext)
               ?? throw new InvalidDataException("Could not decode decrypted state.");
    }

    public static EncryptedBackupPackage ParseBackupPayload(string text)
    {
        string trimmed = (text ?? "").Trim();
        if (string.IsNullOrEmpty(trimmed))
            throw new InvalidDataException("Backup input is empty.");

        if (trimmed.StartsWith('{'))
        {
            var pkg = JsonSerializer.Deserialize<EncryptedBackupPackage>(trimmed)
                      ?? throw new InvalidDataException("Invalid backup JSON.");
            if (pkg.app != "family-field-guide")
                throw new InvalidDataException("Not a Family Field Guide backup.");
            return pkg;
        }

        var m = Regex.Match(trimmed, @"<script\s+id=[""']ffg-pkg[""'][^>]*>([\s\S]*?)<\/script>", RegexOptions.IgnoreCase);
        if (!m.Success)
            throw new InvalidDataException("File is neither a valid .json nor standalone .html backup.");

        string rawJson = m.Groups[1].Value.Replace(@"<\/script", "</script");
        var htmlPkg = JsonSerializer.Deserialize<EncryptedBackupPackage>(rawJson)
                      ?? throw new InvalidDataException("Invalid embedded backup JSON.");
        if (htmlPkg.app != "family-field-guide")
            throw new InvalidDataException("Not a Family Field Guide backup.");
        return htmlPkg;
    }

    public static string GeneratePassphrase(int wordCount, IReadOnlyList<string> words)
    {
        IReadOnlyList<string> pool = words.Count > 0 ? words : new[] { "maple", "river", "lantern", "cedar", "orbit" };
        var picks = new string[wordCount];
        for (int i = 0; i < wordCount; i++)
            picks[i] = pool[RandomNumberGenerator.GetInt32(pool.Count)];
        return string.Join("-", picks);
    }

    // GF(256) Shamir 2-of-3 Recovery Cards (AES polynomial 0x1b, byte-for-byte compatible with Web, Apple & Android)

    private static byte GfMul(byte aIn, byte bIn)
    {
        byte a = aIn, b = bIn, p = 0;
        for (int i = 0; i < 8; i++)
        {
            if ((b & 1) != 0) p ^= a;
            bool hi = (a & 0x80) != 0;
            a <<= 1;
            if (hi) a ^= 0x1b;
            b >>= 1;
        }
        return p;
    }

    private static byte GfPow(byte a, int e)
    {
        byte res = 1, b = a;
        while (e > 0)
        {
            if ((e & 1) != 0) res = GfMul(res, b);
            b = GfMul(b, b);
            e >>= 1;
        }
        return res;
    }

    private static byte GfDiv(byte a, byte b) => a == 0 ? (byte)0 : GfMul(a, GfPow(b, 254));

    public static List<string> SssSplit2of3(string secret)
    {
        byte[] bytes = Encoding.UTF8.GetBytes(secret);
        if (bytes.Length == 0)
            throw new ArgumentException("Passphrase cannot be empty.", nameof(secret));

        byte[] rand = RandomNumberGenerator.GetBytes(bytes.Length);
        var outCards = new List<string>(3);
        for (int x = 1; x <= 3; x++)
        {
            var hex = new StringBuilder(bytes.Length * 2);
            for (int i = 0; i < bytes.Length; i++)
                hex.Append(((byte)(bytes[i] ^ GfMul(rand[i], (byte)x))).ToString("X2"));

            string raw = hex.ToString();
            var grouped = new StringBuilder();
            for (int i = 0; i < raw.Length; i++)
            {
                if (i > 0 && i % 4 == 0) grouped.Append('-');
                grouped.Append(raw[i]);
            }
            outCards.Add($"FFG-{x}-{grouped}");
        }
        return outCards;
    }

    private static (byte x, byte[] bytes) ParseShare(string str)
    {
        var m = Regex.Match((str ?? "").Trim().ToUpperInvariant(), @"^FFG-([123])-(.+)$");
        if (!m.Success) throw new FormatException("Invalid recovery card format (expected FFG-1-...).");
        byte x = byte.Parse(m.Groups[1].Value);
        string hex = Regex.Replace(m.Groups[2].Value, @"[^0-9A-F]", "");
        if (hex.Length == 0 || hex.Length % 2 != 0) throw new FormatException("Invalid recovery card hex.");
        var bytes = new byte[hex.Length / 2];
        for (int i = 0; i < bytes.Length; i++)
            bytes[i] = Convert.ToByte(hex.Substring(i * 2, 2), 16);
        return (x, bytes);
    }

    public static string SssCombine2of3(string shareA, string shareB)
    {
        var a = ParseShare(shareA);
        var b = ParseShare(shareB);
        if (a.x == b.x) throw new InvalidOperationException("Use two different cards (e.g. Card 1 and Card 2).");
        if (a.bytes.Length != b.bytes.Length) throw new InvalidDataException("Recovery cards do not match.");

        byte dx = (byte)(a.x ^ b.x);
        byte l1 = GfDiv(b.x, dx);
        byte l2 = GfDiv(a.x, dx);
        var outBytes = new byte[a.bytes.Length];
        for (int i = 0; i < outBytes.Length; i++)
            outBytes[i] = (byte)(GfMul(a.bytes[i], l1) ^ GfMul(b.bytes[i], l2));
        return Encoding.UTF8.GetString(outBytes);
    }
}
