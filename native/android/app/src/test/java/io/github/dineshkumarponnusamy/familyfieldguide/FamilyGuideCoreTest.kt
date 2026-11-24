package io.github.dineshkumarponnusamy.familyfieldguide

import io.github.dineshkumarponnusamy.familyfieldguide.core.*
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import org.junit.Assert.*
import org.junit.Test
import java.io.File
import java.nio.file.Files

class FamilyGuideCoreTest {
    private fun loadStore(): GuideStore {
        val candidates = listOf(
            File("src/main/assets/guide-data.json"),
            File("app/src/main/assets/guide-data.json"),
            File("native/android/app/src/main/assets/guide-data.json")
        )
        val asset = candidates.firstOrNull { it.exists() }
            ?: error("Could not locate guide-data.json")
        val tmp = Files.createTempDirectory("ffg-android-test").toFile()
        return GuideStore(asset.readText(), File(tmp, "state.json"))
    }

    @Test
    fun schemaAndRegionsDecodeCleanly() {
        val store = loadStore()
        assertEquals(6, store.data.TABS.size)
        assertEquals(7, store.data.PLAYBOOK.size)
        assertEquals(6, store.data.MONEY_GUIDE.size)
        assertEquals(5, store.data.PRO_FINDER.size)
        assertEquals(9, store.data.REGIONS.size)
        assertEquals(2048, store.data.DICE_WORDS.size)
        assertNotNull(store.data.REGIONS["us_in"]?.moneyGuide)
        assertNotNull(store.data.REGIONS["in"]?.proFinder)
        assertEquals(6, CryptoEngine.generatePassphrase(words = store.data.DICE_WORDS).split("-").size)
    }

    @Test
    fun aesGcmEncryptDecryptAndHtmlExtraction() {
        val store = loadStore()
        store.updateField("q_first", "Priya Sharma · 206-555-0148")
        store.addListRow("crypto", mapOf("platform" to "Ledger", "access" to "Safe", "helper" to "Arjun"))
        val pw = "amber-cedar-lantern-orbit-river"

        val pkg = CryptoEngine.encrypt(store.state, pw)
        val dec = CryptoEngine.decrypt(pkg, pw)
        assertEquals("Priya Sharma · 206-555-0148", dec.f["q_first"])

        val jsonStr = Json { encodeDefaults = true }.encodeToString(pkg)
        val html = """<!DOCTYPE html><html><body><script id="ffg-pkg" type="application/json">$jsonStr</script></body></html>"""
        val parsed = CryptoEngine.parseBackupPayload(html)
        val fromHtml = CryptoEngine.decrypt(parsed, pw)
        assertEquals("Priya Sharma · 206-555-0148", fromHtml.f["q_first"])
    }

    @Test
    fun crossPlatformShamir2of3InteropWithWebJs() {
        val s1 = "FFG-1-39F9-5E0D-03F8-66D0-86D0-D9C2-0FA9-4188-E876-6689-C6CF-BF9E-BAB4-368E-BEAC-AF"
        val s2 = "FFG-2-D15E-1AB5-909C-6914-BB18-3FE8-AAEA-3097-647A-7E7E-2613-C39C-F304-FABC-FDEC-D3"
        val s3 = "FFG-3-89CA-26DD-E149-6CA1-59A9-9407-C922-1F6B-E97E-76DA-8FAE-1E6B-3D9D-BE5B-3525-0E"

        assertEquals("amber-cedar-lantern-orbit-river", CryptoEngine.sssCombine2of3(s1, s2))
        assertEquals("amber-cedar-lantern-orbit-river", CryptoEngine.sssCombine2of3(s2, s3))
        assertEquals("amber-cedar-lantern-orbit-river", CryptoEngine.sssCombine2of3(s1, s3))

        val shares = CryptoEngine.sssSplit2of3("banyan-copper-falcon-glacier-anchor")
        assertEquals(3, shares.size)
        assertEquals("banyan-copper-falcon-glacier-anchor", CryptoEngine.sssCombine2of3(shares[0], shares[2]))
    }

    @Test
    fun readinessAuditsCatchSeedsAndFullIds() {
        val store = loadStore()
        store.addListRow("crypto", mapOf("platform" to "Ledger", "access" to "alpha bravo charlie delta echo foxtrot golf hotel india juliet kilo lima"))
        store.addListRow("gov_ids", mapOf("who" to "Me", "idtype" to "SSN", "last4" to "123-45-6789"))
        var audit = store.computeAudit()
        assertEquals(AuditSeverity.high, audit.first { it.id == "crypto_safety" }.sev)
        assertEquals(AuditSeverity.high, audit.first { it.id == "gov_id_privacy" }.sev)

        val clean = loadStore()
        clean.addListRow("crypto", mapOf("platform" to "Ledger", "access" to "Safe drawer", "helper" to "Arjun"))
        clean.addListRow("gov_ids", mapOf("who" to "Me", "idtype" to "SSN", "last4" to "4812", "where" to "Safe"))
        audit = clean.computeAudit()
        assertEquals(AuditSeverity.ok, audit.first { it.id == "crypto_safety" }.sev)
        assertEquals(AuditSeverity.ok, audit.first { it.id == "gov_id_privacy" }.sev)
    }

    @Test
    fun searchAndSmartMergeWork() {
        val store = loadStore()
        store.state = store.state.copy(region = "us_in")
        store.loadDemo()
        assertTrue(store.search("$1M").isNotEmpty())
        assertTrue(store.search("AILA").isNotEmpty())

        store.state = store.state.copy(region = "in")
        store.normalize()
        assertTrue(store.search("NALSA").isNotEmpty())

        val inc = GuideState(f = mapOf("d_charity" to "St. Jude"))
        val plan = store.computeMergePlan(inc)
        assertEquals(1, plan.newFields)
        store.applyMerge(inc, overwriteConflicts = false)
        assertEquals("St. Jude", store.state.f["d_charity"])
    }

    @Test
    fun customSectionTemplateAndDelete() {
        val store = loadStore()
        assertEquals(8, store.data.SECTION_TEMPLATES.size)
        val tpl = store.data.SECTION_TEMPLATES[0]
        store.applySectionTemplate(tpl)
        assertEquals(1, store.state.customTabs.size)
        val tid = store.state.customTabs[0].id
        assertEquals(tid, store.state.tab)
        assertTrue((store.state.extra[tid] ?: emptyList()).isNotEmpty())

        store.deleteCustomSection(tid)
        assertTrue(store.state.customTabs.isEmpty())
        assertEquals("start", store.state.tab)
    }

    @Test
    fun exportsAndRegionLocalization() {
        val store = loadStore()
        store.state = store.state.copy(region = "in")
        store.normalize()
        store.updateField("h_triage", "Apollo Oncology 24/7")
        store.updateField("h_redflag", "Fever >= 100.4F -> ER")
        store.updateField("q_first", "Meera (+91-98765-43210)")

        val er = store.exportErGrabSheetText()
        assertTrue(er.contains("Apollo Oncology 24/7"))
        assertTrue(er.contains("Fever >= 100.4F"))
        assertTrue(er.contains("112"))

        val summary = store.exportExecutiveSummaryText()
        assertTrue(summary.contains("Meera (+91-98765-43210)"))
        assertTrue(summary.contains("ER / Active Illness Alert"))
    }

    @Test
    fun accessibilityAndReadModeRoundTrip() {
        val tmp = Files.createTempDirectory("ffg-android-acc").toFile()
        val stateFile = File(tmp, "state.json")
        val candidates = listOf(
            File("src/main/assets/guide-data.json"),
            File("app/src/main/assets/guide-data.json"),
            File("native/android/app/src/main/assets/guide-data.json")
        )
        val guideJson = candidates.first { it.exists() }.readText()
        val store = GuideStore(guideJson, stateFile)
        store.state = store.state.copy(readMode = true, largeText = true, highContrast = true)
        store.save(touch = false)

        val reloaded = GuideStore(guideJson, stateFile)
        assertTrue(reloaded.state.readMode)
        assertTrue(reloaded.state.largeText)
        assertTrue(reloaded.state.highContrast)
    }

    @Test
    fun applyMergeHandlesPhotosFireDrillAndTimestamps() {
        val store = loadStore()
        store.state = store.state.copy(
            photos = listOf(PhotoSnippet("p1", "Existing", "data:image/png;base64,AAAA")),
            fireDrill = mapOf("fd1" to true),
            lastDryRun = "2026-05-01T10:00:00Z",
            reviewed = "2026-06-01T10:00:00Z"
        )
        val incPhotos = listOf(
            PhotoSnippet("p1", "Dup ID", "data:image/png;base64,BBBB"),
            PhotoSnippet("p2", "Dup URL", "data:image/png;base64,AAAA"),
            PhotoSnippet("p_xss", "Bad URI", "javascript:alert(1)"),
            PhotoSnippet("p_svg", "SVG URI", "data:image/svg+xml;base64,PHN2Zz4=")
        ) + (3..15).map { i -> PhotoSnippet("p$i", "Photo $i", "data:image/jpeg;base64,QUFB$i") }

        val inc = GuideState(
            photos = incPhotos,
            fireDrill = mapOf("fd1" to false, "fd2" to true),
            lastDryRun = "2026-06-15T12:00:00Z",
            reviewed = "2026-04-01T00:00:00Z"
        )

        val msg = store.applyMerge(inc, overwriteConflicts = false)
        assertTrue(msg.contains("+9 photos"))
        assertEquals(10, store.state.photos.size)
        assertTrue(store.state.photos.none { it.id == "p_xss" || it.id == "p_svg" })
        assertEquals(true, store.state.fireDrill["fd1"])
        assertEquals(true, store.state.fireDrill["fd2"])
        assertEquals("2026-06-15T12:00:00Z", store.state.lastDryRun)
        assertEquals("2026-06-01T10:00:00Z", store.state.reviewed)
    }

    @Test
    fun atomicSaveStorageEncryptionAndCorruptBackup() {
        val candidates = listOf(
            File("src/main/assets/guide-data.json"),
            File("app/src/main/assets/guide-data.json"),
            File("native/android/app/src/main/assets/guide-data.json")
        )
        val guideJson = candidates.first { it.exists() }.readText()
        val tmp = Files.createTempDirectory("ffg-android-storage").toFile()
        val stateFile = File(tmp, "state.json")

        val xorEnc: (ByteArray) -> ByteArray = { bytes ->
            byteArrayOf(0x01, 0x02) + bytes.map { (it.toInt() xor 0x5A).toByte() }.toByteArray()
        }
        val xorDec: (ByteArray) -> ByteArray = { blob ->
            require(blob.size > 2 && blob[0] == 0x01.toByte() && blob[1] == 0x02.toByte())
            blob.copyOfRange(2, blob.size).map { (it.toInt() xor 0x5A).toByte() }.toByteArray()
        }

        // Write plaintext state first, then verify transparent migration on init
        val plainStore = GuideStore(guideJson, stateFile)
        plainStore.updateField("q_first", "Anita · 555-0199")
        assertTrue(stateFile.readText().trimStart().startsWith("{"))
        assertFalse(File(tmp, "state.json.tmp").exists())

        val encryptedStore = GuideStore(guideJson, stateFile, storageEncrypt = xorEnc, storageDecrypt = xorDec)
        assertEquals("Anita · 555-0199", encryptedStore.state.f["q_first"])
        assertFalse(stateFile.readText().trimStart().startsWith("{"))

        // Reload encrypted state
        val reloaded = GuideStore(guideJson, stateFile, storageEncrypt = xorEnc, storageDecrypt = xorDec)
        assertEquals("Anita · 555-0199", reloaded.state.f["q_first"])

        // Corrupt stateFile should be backed up to state.json.corrupt
        stateFile.writeBytes(byteArrayOf(0x7f, 0x00, 0x12, 0x34))
        val recovered = GuideStore(guideJson, stateFile, storageEncrypt = xorEnc, storageDecrypt = xorDec)
        assertTrue(File(tmp, "state.json.corrupt").exists())
        assertNull(recovered.state.f["q_first"])
    }

    @Test
    fun fullStatePrivacyAuditScansFieldsListsAndCustomCrypto() {
        val s1 = loadStore()
        s1.updateField("d_pm", "alpha bravo charlie delta echo foxtrot golf hotel india juliet kilo lima")
        s1.updateField("q_binder", "SSN 123-45-6789 is in safe")
        var audit = s1.computeAudit()
        assertEquals(AuditSeverity.high, audit.first { it.id == "crypto_safety" }.sev)
        assertEquals(AuditSeverity.high, audit.first { it.id == "gov_id_privacy" }.sev)

        val s2 = loadStore()
        s2.addListRow("accounts", mapOf("inst" to "Chase", "last4" to "1234 5678 9012"))
        audit = s2.computeAudit()
        assertEquals(AuditSeverity.high, audit.first { it.id == "gov_id_privacy" }.sev)

        val s3 = loadStore()
        s3.addListRow("gov_ids", mapOf("who" to "Me", "idtype" to "SSN", "last4" to "123456789"))
        audit = s3.computeAudit()
        assertEquals(AuditSeverity.high, audit.first { it.id == "gov_id_privacy" }.sev)

        val s4 = loadStore()
        s4.state = s4.state.copy(
            extra = mapOf(
                "tab_c" to listOf(ExtraItem(type = "field", id = "x_wallet", label = "Hardware Wallet Backup"))
            ),
            f = mapOf(
                "q_first" to "Meera 2065550148",
                "x_wallet" to "abandon ability able about above absent absorb abstract absurd abuse access accident"
            )
        )
        audit = s4.computeAudit()
        assertEquals(AuditSeverity.high, audit.first { it.id == "crypto_safety" }.sev)
        assertNull(audit.firstOrNull { it.id == "gov_id_privacy" })
    }
}
