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
        assertEquals(256, store.data.DICE_WORDS.size)
        assertNotNull(store.data.REGIONS["us_in"]?.moneyGuide)
        assertNotNull(store.data.REGIONS["in"]?.proFinder)
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
}
