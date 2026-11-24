package io.github.dineshkumarponnusamy.familyfieldguide.core

import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.io.File
import java.nio.file.Files
import java.nio.file.StandardCopyOption
import java.time.Instant
import java.time.OffsetDateTime
import java.util.UUID
import kotlin.math.roundToInt

class GuideStore(
    guideDataJson: String,
    private val stateFile: File,
    private val storageEncrypt: ((ByteArray) -> ByteArray)? = null,
    private val storageDecrypt: ((ByteArray) -> ByteArray)? = null
) {
    private val json = Json { ignoreUnknownKeys = true; encodeDefaults = true }
    val data: GuideData = json.decodeFromString(GuideData.serializer(), guideDataJson)
    var state: GuideState = loadInitialState()
    var statusToast: String? = null
    var onStateChanged: (() -> Unit)? = null

    init {
        normalize()
    }

    private fun loadInitialState(): GuideState {
        if (!stateFile.exists()) return GuideState()
        var wasPlainJson = false
        val loaded = runCatching {
            val raw = stateFile.readBytes()
            val trimmedFirst = raw.firstOrNull { b ->
                b != ' '.code.toByte() && b != '\n'.code.toByte() && b != '\r'.code.toByte() && b != '\t'.code.toByte()
            }
            wasPlainJson = trimmedFirst == '{'.code.toByte()
            val plainBytes = if (storageDecrypt != null && !wasPlainJson) {
                storageDecrypt.invoke(raw)
            } else {
                raw
            }
            json.decodeFromString(GuideState.serializer(), String(plainBytes, Charsets.UTF_8))
        }.getOrElse {
            runCatching {
                val corruptFile = File(stateFile.parentFile, "state.json.corrupt")
                stateFile.copyTo(corruptFile, overwrite = true)
            }
            return GuideState()
        }
        if (wasPlainJson && storageEncrypt != null) {
            runCatching { writeStateAtomically(loaded) }
        }
        return loaded
    }

    private fun writeStateAtomically(targetState: GuideState) {
        stateFile.parentFile?.mkdirs()
        val plainBytes = json.encodeToString(targetState).toByteArray(Charsets.UTF_8)
        val outBytes = storageEncrypt?.invoke(plainBytes) ?: plainBytes
        val tmpFile = File(stateFile.parentFile, "state.json.tmp")
        tmpFile.writeBytes(outBytes)
        try {
            Files.move(
                tmpFile.toPath(),
                stateFile.toPath(),
                StandardCopyOption.REPLACE_EXISTING,
                StandardCopyOption.ATOMIC_MOVE
            )
        } catch (_: Exception) {
            if (!tmpFile.renameTo(stateFile)) {
                Files.move(
                    tmpFile.toPath(),
                    stateFile.toPath(),
                    StandardCopyOption.REPLACE_EXISTING
                )
            }
        }
    }

    fun save(touch: Boolean = true) {
        if (touch) {
            state = state.copy(updated = Instant.now().toString())
        }
        runCatching {
            writeStateAtomically(state)
        }
        onStateChanged?.invoke()
    }

    fun normalize() {
        val reg = if (data.REGIONS.containsKey(state.region)) state.region else "us"
        val trk = if (data.PLAYBOOK.containsKey(state.track)) state.track else "hurt"
        val nextLists = state.lists.toMutableMap()
        for (tab in data.TABS) {
            for (b in tab.blocks) {
                if (b.type == "list" && b.id != null && !nextLists.containsKey(b.id)) {
                    nextLists[b.id] = b.seed ?: listOf(emptyMap())
                }
            }
        }
        for ((_, items) in state.extra) {
            for (item in items) {
                if (item.type == "list" && !nextLists.containsKey(item.id)) {
                    nextLists[item.id] = listOf(emptyMap())
                }
            }
        }
        val validTabs = (data.TABS.map { it.id } + state.customTabs.map { it.id }).toSet()
        val tab = if (validTabs.contains(state.tab)) state.tab else "start"
        state = state.copy(region = reg, track = trk, tab = tab, lists = nextLists)
    }

    val currentRegion: RegionPreset
        get() = data.REGIONS[state.region] ?: data.REGIONS["us"]!!

    fun localizedField(f: FieldDef): FieldDef {
        val ov = currentRegion.fieldOverrides?.get(f.id) ?: return f
        return f.copy(label = ov.label ?: f.label, placeholder = ov.ph ?: f.placeholder)
    }

    data class LocalizedList(val hint: String?, val suggestions: List<String>, val cols: List<ColDef>)

    fun localizedList(b: BlockDef): LocalizedList {
        val ov = b.id?.let { currentRegion.listOverrides?.get(it) }
        val baseSugs = b.suggestions ?: emptyList()
        val extra = ov?.extraSuggestions ?: emptyList()
        val merged = baseSugs + extra.filter { it !in baseSugs }
        val cols = (b.cols ?: emptyList()).map { col ->
            ColDef(col.key, ov?.colLabels?.get(col.key) ?: col.label)
        }
        return LocalizedList(hint = ov?.hint ?: b.hint, suggestions = merged, cols = cols)
    }

    fun localizedStep(s: PlaybookStep): PlaybookStep {
        val ov = currentRegion.stepOverrides?.get(s.id) ?: return s
        return s.copy(t = ov.t ?: s.t, d = ov.d ?: s.d)
    }

    fun findListDef(id: String): BlockDef? {
        for (t in data.TABS) {
            val found = t.blocks.firstOrNull { it.id == id }
            if (found != null) return found
        }
        return null
    }

    fun isRowUserEdited(blockId: String, row: Map<String, String>): Boolean {
        val nonEmpty = row.filter { it.value.trim().isNotEmpty() }
        if (nonEmpty.isEmpty()) return false
        val def = findListDef(blockId) ?: return true
        val loc = localizedList(def)
        val seeds = def.seed
        if (!seeds.isNullOrEmpty()) {
            val matchesSeed = seeds.any { seedRow ->
                val se = seedRow.filter { it.value.trim().isNotEmpty() }
                se.size == nonEmpty.size && se.all { (k, v) -> (row[k] ?: "").trim() == v.trim() }
            }
            if (matchesSeed) return false
        }
        if (loc.suggestions.isNotEmpty() && nonEmpty.size == 1) {
            val (k, v) = nonEmpty.entries.first()
            val scol = def.suggestCol ?: def.cols?.firstOrNull()?.key ?: ""
            if (k == scol && loc.suggestions.any { it.equals(v.trim(), ignoreCase = true) }) {
                return false
            }
        }
        return true
    }

    val hasAnyContent: Boolean
        get() {
            if (state.f.values.any { it.trim().isNotEmpty() }) return true
            for ((id, rows) in state.lists) {
                if (rows.any { isRowUserEdited(id, it) }) return true
            }
            return state.customTabs.isNotEmpty() || state.extra.isNotEmpty() || state.photos.isNotEmpty()
        }

    val completionPercent: Int
        get() {
            var total = 0
            var got = 0
            fun has(id: String) = if ((state.f[id] ?: "").trim().isEmpty()) 0 else 1
            fun listFilled(id: String) = minOf(2, (state.lists[id] ?: emptyList()).count { isRowUserEdited(id, it) })
            for (t in data.TABS) {
                for (b in t.blocks) {
                    if (b.type == "fields" && b.fields != null) {
                        for (f in b.fields) { total += 1; got += has(f.id) }
                    } else if (b.type == "list" && b.id != null) {
                        total += 2; got += listFilled(b.id)
                    }
                }
            }
            for (items in state.extra.values) {
                for (x in items) {
                    if (x.type == "field") { total += 1; got += has(x.id) }
                    else { total += 2; got += listFilled(x.id) }
                }
            }
            for (g in data.GLANCE) { total += 1; got += has(g.id) }
            for (k in data.KIDS) { total += 1; got += has(k.id) }
            total += 1; got += has("letter")
            return if (total > 0) ((got.toDouble() / total) * 100.0).roundToInt() else 0
        }

    fun updateField(id: String, value: String) {
        val next = state.f.toMutableMap()
        next[id] = value
        state = state.copy(f = next)
        save()
    }

    fun updateListCell(listId: String, rowIdx: Int, colKey: String, value: String) {
        val rows = (state.lists[listId] ?: emptyList()).toMutableList()
        if (rowIdx !in rows.indices) return
        val row = rows[rowIdx].toMutableMap()
        row[colKey] = value
        rows[rowIdx] = row
        val nextLists = state.lists.toMutableMap()
        nextLists[listId] = rows
        state = state.copy(lists = nextLists)
        save()
    }

    fun addListRow(listId: String, initial: Map<String, String> = emptyMap()) {
        val rows = (state.lists[listId] ?: emptyList()).toMutableList()
        rows.add(initial)
        val nextLists = state.lists.toMutableMap()
        nextLists[listId] = rows
        state = state.copy(lists = nextLists)
        save()
    }

    fun removeListRow(listId: String, rowIdx: Int, keepOneBlank: Boolean = false) {
        val rows = (state.lists[listId] ?: emptyList()).toMutableList()
        if (rowIdx in rows.indices) rows.removeAt(rowIdx)
        if (rows.isEmpty() && keepOneBlank) rows.add(emptyMap())
        val nextLists = state.lists.toMutableMap()
        nextLists[listId] = rows
        state = state.copy(lists = nextLists)
        save()
    }

    fun loadDemo() {
        val src = data.DEMO_FAMILIES[state.region] ?: data.DEMO_FAMILIES["default"]!!
        val patchedF = (src.f ?: emptyMap()).toMutableMap()
        src.f_extra_patch?.forEach { (k, v) -> patchedF[k] = v }
        state = GuideState(
            region = state.region,
            largeText = state.largeText,
            highContrast = state.highContrast,
            isDemo = true,
            track = src.track ?: "hurt",
            tab = "start",
            f = patchedF,
            lists = src.lists ?: emptyMap(),
            customTabs = src.customTabs ?: emptyList(),
            extra = src.extra ?: emptyMap()
        )
        normalize()
        save(touch = false)
        statusToast = "Sample family loaded"
    }

    fun clearDemo() {
        state = GuideState(region = state.region, largeText = state.largeText, highContrast = state.highContrast)
        normalize()
        save(touch = false)
        statusToast = "Cleared sample — ready for your family"
    }

    fun addCustomSection(name: String) {
        val tid = "tab_" + UUID.randomUUID().toString().take(8)
        state = state.copy(
            customTabs = state.customTabs + CustomTab(tid, name, name),
            tab = tid
        )
        save()
    }

    fun applySectionTemplate(tpl: SectionTemplate) {
        val tid = "tab_" + UUID.randomUUID().toString().take(8)
        val items = mutableListOf<ExtraItem>()
        val nextLists = state.lists.toMutableMap()
        for (f in tpl.fields) {
            items.add(ExtraItem(type = "field", id = "x_" + UUID.randomUUID().toString().take(8), label = f.label, wide = f.wide))
        }
        for (l in tpl.lists) {
            val lid = "l_" + UUID.randomUUID().toString().take(8)
            val cols = l.cols.mapIndexed { idx, lbl -> ColDef("c$idx", lbl) }
            items.add(ExtraItem(type = "list", id = lid, title = l.title, cols = cols))
            nextLists[lid] = listOf(emptyMap())
        }
        val nextExtra = state.extra.toMutableMap()
        nextExtra[tid] = items
        state = state.copy(
            customTabs = state.customTabs + CustomTab(tid, tpl.name, tpl.name),
            extra = nextExtra,
            lists = nextLists,
            tab = tid
        )
        save()
        statusToast = "Added \"${tpl.name}\""
    }

    fun deleteCustomSection(tabId: String) {
        val nextF = state.f.toMutableMap()
        val nextLists = state.lists.toMutableMap()
        for (x in state.extra[tabId] ?: emptyList()) {
            nextF.remove(x.id)
            nextLists.remove(x.id)
        }
        val nextExtra = state.extra.toMutableMap()
        nextExtra.remove(tabId)
        state = state.copy(
            f = nextF,
            lists = nextLists,
            extra = nextExtra,
            customTabs = state.customTabs.filter { it.id != tabId },
            tab = "start"
        )
        save()
    }

    fun computeAudit(): List<AuditItem> {
        fun f(id: String) = (state.f[id] ?: "").trim()
        fun rowsOf(id: String) = (state.lists[id] ?: emptyList()).filter { isRowUserEdited(id, it) }
        val items = mutableListOf<AuditItem>()
        val reg = currentRegion

        val missCore = listOfNotNull(
            if (f("q_first").isEmpty()) "First person to call" else null,
            if (f("q_binder").isEmpty()) "Where papers live" else null
        )
        if (missCore.isNotEmpty()) {
            items.add(AuditItem("start_core", AuditSeverity.high, "Start-here essentials incomplete", "Missing: ${missCore.joinToString(", ")}.", "start", "glance"))
        } else {
            items.add(AuditItem("start_core", AuditSeverity.ok, "First-call & paper locations set", "Your spouse knows who to call and where originals live."))
        }

        if (f("d_phone").isEmpty()) {
            items.add(AuditItem("phone_2fa", AuditSeverity.high, "No phone unlock instructions", "Banks and email send 2FA codes to your phone—without unlock notes, your spouse can get locked out.", "docs", "Getting into things"))
        } else if (f("d_2fa").isEmpty() && f("d_sim").isEmpty()) {
            items.add(AuditItem("phone_2fa", AuditSeverity.med, "Add 2FA recovery or carrier SIM PIN", "Phone unlock is noted, but 2FA recovery codes or SIM PIN instructions will prevent lockouts.", "docs", "Getting into things"))
        } else {
            items.add(AuditItem("phone_2fa", AuditSeverity.ok, "Phone & 2FA access documented", "Unlock and 2FA/SIM instructions are covered."))
        }

        val accts = rowsOf("accounts")
        val jointRe = Regex("joint|both|shared|either|survivor|&|\\band\\b", RegexOption.IGNORE_CASE)
        val hasJoint = accts.any { jointRe.containsMatchIn(it["own"] ?: "") }
        when {
            accts.isEmpty() -> items.add(AuditItem("joint_bank", AuditSeverity.med, "No bank accounts listed yet", "List checking/savings (last 4 digits) and mark which ones are Joint.", "money", "accounts"))
            !hasJoint -> items.add(AuditItem("joint_bank", AuditSeverity.high, "No bank account marked Joint", "Solo accounts often freeze upon death, stranding household bills until probate.", "money", "accounts"))
            else -> items.add(AuditItem("joint_bank", AuditSeverity.ok, "Joint bank access listed", "At least one account is marked joint/shared."))
        }

        val invRows = rowsOf("invest")
        val lifeRows = rowsOf("insurance").filter { Regex("life|term", RegexOption.IGNORE_CASE).containsMatchIn(it["type"] ?: "") }
        val missBenef = invRows.count { (it["benef"] ?: "").trim().isEmpty() } + lifeRows.count { (it["benef"] ?: "").trim().isEmpty() }
        val indiaNote = if (reg.indiaNotes) " In India, bank/demat nominees are custodians—ensure your will/legal heirs match." else ""
        when {
            missBenef > 0 -> items.add(AuditItem("beneficiaries", AuditSeverity.high, "$missBenef retirement/life-insurance entry missing a Beneficiary", "Named beneficiaries override your will—record who is named on each.$indiaNote", "money", "insurance"))
            invRows.isEmpty() && lifeRows.isEmpty() -> items.add(AuditItem("beneficiaries", AuditSeverity.med, "No life insurance or retirement accounts listed", "Record policies and retirement accounts along with named beneficiaries.$indiaNote", "money", "insurance"))
            else -> items.add(AuditItem("beneficiaries", AuditSeverity.ok, "Beneficiaries recorded", "Listed life insurance & retirement entries name a beneficiary.$indiaNote"))
        }

        val cryptoRows = rowsOf("crypto")
        val seedRe = Regex("""\b([a-z]{3,}\s+){11,}[a-z]{3,}\b""", RegexOption.IGNORE_CASE)
        val seedFields = listOf("d_pm", "d_2fa", "d_phone", "d_keys", "d_safe", "d_sim", "d_email")
        val cryptoNameRe = Regex("""crypto|seed|wallet|mnemonic|recovery\s*phrase|ledger|trezor|bitcoin|btc|eth""", RegexOption.IGNORE_CASE)
        val customCryptoValues = state.extra.values.flatten().flatMap { item ->
            val name = "${item.label ?: ""} ${item.title ?: ""}"
            if (!cryptoNameRe.containsMatchIn(name)) emptyList()
            else if (item.type == "field") listOf(state.f[item.id] ?: "")
            else (state.lists[item.id] ?: emptyList()).flatMap { it.values }
        }
        val hasSeed = cryptoRows.any { r -> r.values.any { seedRe.containsMatchIn(it) } } ||
            seedFields.any { seedRe.containsMatchIn(f(it)) } ||
            customCryptoValues.any { seedRe.containsMatchIn(it) }
        if (hasSeed || cryptoRows.isNotEmpty()) {
            val missCrypto = cryptoRows.any { (it["access"] ?: "").trim().isEmpty() || (it["helper"] ?: "").trim().isEmpty() }
            when {
                hasSeed -> items.add(AuditItem("crypto_safety", AuditSeverity.high, "Possible crypto seed phrase detected!", "Never store 12/24-word recovery seeds in this guide—write ONLY where the physical backup lives.", "money", "crypto"))
                missCrypto -> items.add(AuditItem("crypto_safety", AuditSeverity.med, "Crypto entry missing recovery location or helper", "Record where the seed/hardware wallet is stored and a trusted helper.", "money", "crypto"))
                else -> items.add(AuditItem("crypto_safety", AuditSeverity.ok, "Crypto recovery map documented (no raw seeds)", "Holdings, storage locations, and trusted helper instructions are recorded."))
            }
        }

        val govRows = rowsOf("gov_ids")
        val formattedIdRe = Regex("""\b\d{3}-\d{2}-\d{4}\b|\b\d{4}[\s-]\d{4}[\s-]\d{4}\b""")
        val longDigitsRe = Regex("""\b\d{9,}\b""")
        val hasFormattedIdAnywhere = state.f.values.any { formattedIdRe.containsMatchIn(it) } ||
            state.lists.values.any { rows -> rows.any { r -> r.values.any { formattedIdRe.containsMatchIn(it) } } }
        val hasLongGovLast4 = govRows.any { longDigitsRe.containsMatchIn(it["last4"] ?: "") }
        val hasFullId = hasFormattedIdAnywhere || hasLongGovLast4
        if (hasFullId) {
            items.add(AuditItem("gov_id_privacy", AuditSeverity.high, "Possible full SSN / National ID detected!", "Safety rule: enter ONLY the last 4 digits and where the original card lives.", "docs", "gov_ids"))
        } else if (govRows.isNotEmpty()) {
            items.add(AuditItem("gov_id_privacy", AuditSeverity.ok, "Key IDs mapped safely (last 4 only)", "Government IDs record only last 4 digits and physical locations."))
        }

        if (f("q_life").isNotEmpty() || lifeRows.isNotEmpty()) {
            val hasPayout = listOf(f("m_payout_first"), f("m_payout_payoff"), f("m_payout_advisor"), f("m_payout_monthly")).any { it.isNotEmpty() }
            if (hasPayout) {
                items.add(AuditItem("payout_plan", AuditSeverity.ok, "Survivor big-money instructions documented", "Plain-English instructions for handling insurance payouts are filled in."))
            } else {
                items.add(AuditItem("payout_plan", AuditSeverity.med, "Add personal instructions for life insurance / big money", "Tell your spouse what to do first with payouts, which debts to leave alone, and who to trust.", "money", "My instructions for big money / insurance payouts"))
            }
        }

        if (reg.crossBorder) {
            val blob = "${state.f} ${state.lists["doclocs"]} ${state.customTabs}"
            val hasVisa = Regex("i-797|i-140|h-1b|h-4|oci|visa|immig", RegexOption.IGNORE_CASE).containsMatchIn(blob)
            val hasPro = (state.lists["pros"] ?: emptyList()).any { Regex("immig|visa|cross", RegexOption.IGNORE_CASE).containsMatchIn(it.values.joinToString(" ")) }
            if (hasVisa && hasPro) {
                items.add(AuditItem("cross_border", AuditSeverity.ok, "Cross-border & visa readiness covered", "Visa papers, separate country planning, and immigration counsel are noted."))
            } else {
                items.add(AuditItem("cross_border", AuditSeverity.high, "Cross-border / Visa readiness incomplete", "Record visa filings, immigration attorney, local temporary guardian, and separate wills.", "docs", "doclocs"))
            }
        }

        if (hasAnyContent && state.lastBackup == null) {
            items.add(AuditItem("backup_fresh", AuditSeverity.high, "No locked backup saved yet", "Export an AES-256-GCM locked backup file now.", act = "backup"))
        } else {
            items.add(AuditItem("backup_fresh", AuditSeverity.ok, "Locked backup status", if (state.lastBackup != null) "Saved." else "Ready."))
        }

        if (state.lastDryRun == null) {
            items.add(AuditItem("fire_drill", AuditSeverity.med, "Run a 10-minute Family Fire Drill", "Verify your spouse can unlock the guide and locate papers and phone access."))
        } else {
            items.add(AuditItem("fire_drill", AuditSeverity.ok, "Family Fire Drill completed", "Completed."))
        }

        return items.sortedBy { it.sev.rank }
    }

    fun search(query: String): List<SearchHit> {
        val term = query.trim().lowercase()
        if (term.isEmpty()) return emptyList()
        val hits = mutableListOf<SearchHit>()
        fun push(tabId: String, tabLabel: String, title: String, sub: String, bk: String = "", tk: String = "") {
            if (hits.size < 20) hits.add(SearchHit(tabId, tabLabel, title, sub, bk, tk))
        }

        for (rawG in data.GLANCE) {
            val rf = localizedField(FieldDef(rawG.id, rawG.label, rawG.placeholder))
            val v = state.f[rf.id] ?: ""
            if (rf.label.lowercase().contains(term) || v.lowercase().contains(term)) {
                push("start", "Start here", rf.label, v.ifEmpty { "Quick glance" }, "glance")
            }
        }
        for (t in data.TABS) {
            for (b in t.blocks) {
                if (b.type == "fields" && b.fields != null) {
                    for (rawF in b.fields) {
                        val rf = localizedField(rawF)
                        val v = state.f[rf.id] ?: ""
                        if (rf.label.lowercase().contains(term) || v.lowercase().contains(term) || (b.title ?: "").lowercase().contains(term)) {
                            push(t.id, t.label, rf.label, v.ifEmpty { b.title ?: "" }, b.stableId)
                        }
                    }
                } else if (b.type == "list" && b.id != null) {
                    val loc = localizedList(b)
                    val mr = (state.lists[b.id] ?: emptyList()).firstOrNull { r -> r.values.any { it.lowercase().contains(term) } }
                    val ms = loc.suggestions.firstOrNull { it.lowercase().contains(term) }
                    if ((b.title ?: "").lowercase().contains(term) || mr != null || ms != null || (loc.hint ?: "").lowercase().contains(term)) {
                        val sub = mr?.values?.filter { it.isNotEmpty() }?.joinToString(" · ") ?: ms?.let { "Quick-add: $it" } ?: (loc.hint ?: "Table")
                        push(t.id, t.label, b.title ?: "Table", sub, b.id)
                    }
                }
            }
        }
        for (g in data.MONEY_GUIDE) {
            val txt = "${g.title} ${g.summary} ${g.bullets.joinToString(" ")} ${g.note ?: ""}".lowercase()
            if (txt.contains(term)) push("money", "Money Guide", g.title, g.summary, "money_guide")
        }
        currentRegion.proFinder?.let { pf ->
            val hit = listOfNotNull(pf.legal, pf.visa, pf.money, pf.tax).firstOrNull { it.lowercase().contains(term) }
            if (hit != null) push("contacts", "Finding Help", "Local directories (${currentRegion.label})", hit, "pro_finder")
        }
        for (c in data.PRO_FINDER) {
            val txt = "${c.title} ${c.summary} ${c.bullets.joinToString(" ")} ${c.note ?: ""}".lowercase()
            if (txt.contains(term)) push("contacts", "Finding Help", c.title, c.summary, "pro_finder")
        }
        for ((tk, pb) in data.PLAYBOOK) {
            for (ph in pb.phases) {
                for (rawS in ph.steps) {
                    val s = localizedStep(rawS)
                    if (s.t.lowercase().contains(term) || s.d.lowercase().contains(term)) {
                        push("start", "Playbook", s.t, s.d, "playbook", tk)
                    }
                }
            }
        }
        for (sc in data.SCRIPTS) {
            if (sc.title.lowercase().contains(term) || sc.body.lowercase().contains(term)) {
                push("start", "Scripts", sc.title, sc.body, "scripts")
            }
        }
        return hits
    }

    private fun rowSig(row: Map<String, String>): String =
        row.map { it.key to it.value.trim().lowercase() }
            .filter { it.second.isNotEmpty() }
            .sortedBy { it.first }
            .joinToString("|") { "${it.first}=${it.second}" }

    fun fieldLabel(id: String, extraFromIncoming: Map<String, List<ExtraItem>> = emptyMap()): String {
        if (id == "letter") return "A note to you"
        data.GLANCE.firstOrNull { it.id == id }?.let { return it.label }
        data.KIDS.firstOrNull { it.id == id }?.let { return it.label }
        for (t in data.TABS) {
            for (b in t.blocks) {
                b.fields?.firstOrNull { it.id == id }?.let { return it.label }
            }
        }
        val allEx = state.extra.values.flatten() + extraFromIncoming.values.flatten()
        return allEx.firstOrNull { it.id == id }?.label ?: id
    }

    fun computeMergePlan(inc: GuideState): MergePlan {
        var newFields = 0
        val conflicts = mutableListOf<MergeConflict>()
        for ((id, valStr) in inc.f) {
            val iv = valStr.trim()
            if (iv.isEmpty()) continue
            val cv = (state.f[id] ?: "").trim()
            if (cv.isEmpty()) newFields++
            else if (cv != iv) conflicts.add(MergeConflict(id, fieldLabel(id, inc.extra)))
        }
        val curTabs = state.customTabs.map { it.id }.toSet()
        val newTabs = inc.customTabs.count { it.id !in curTabs }
        var newExtras = 0
        for ((tid, arr) in inc.extra) {
            val ex = (state.extra[tid] ?: emptyList()).map { it.id }.toSet()
            newExtras += arr.count { it.id !in ex }
        }
        var newRows = 0
        for ((lid, rows) in inc.lists) {
            val sigs = (state.lists[lid] ?: emptyList()).map(::rowSig).filter { it.isNotEmpty() }.toMutableSet()
            for (r in rows) {
                if (isRowUserEdited(lid, r)) {
                    val sig = rowSig(r)
                    if (sig.isNotEmpty() && sigs.add(sig)) newRows++
                }
            }
        }
        val newChecks = inc.checks.count { (k, v) -> v && !(state.checks[k] ?: false) }
        return MergePlan(newFields, conflicts, newTabs, newExtras, newRows, newChecks)
    }

    private fun newerIso(a: String?, b: String?): String? {
        if (a.isNullOrBlank()) return b?.takeIf { it.isNotBlank() }
        if (b.isNullOrBlank()) return a
        val ia = runCatching { OffsetDateTime.parse(a).toInstant() }.getOrElse { runCatching { Instant.parse(a) }.getOrNull() }
        val ib = runCatching { OffsetDateTime.parse(b).toInstant() }.getOrElse { runCatching { Instant.parse(b) }.getOrNull() }
        return when {
            ia != null && ib != null -> if (ib.isAfter(ia)) b else a
            else -> if (b > a) b else a
        }
    }

    fun applyMerge(inc: GuideState, overwriteConflicts: Boolean): String {
        var addedF = 0; var updatedF = 0; var addedR = 0; var addedC = 0; var addedS = 0; var addedP = 0
        val curTabs = state.customTabs.toMutableList()
        val curTabIds = curTabs.map { it.id }.toMutableSet()
        for (t in inc.customTabs) {
            if (curTabIds.add(t.id)) { curTabs.add(t); addedS++ }
        }
        val nextExtra = state.extra.toMutableMap()
        for ((tid, arr) in inc.extra) {
            val curArr = (nextExtra[tid] ?: emptyList()).toMutableList()
            val ex = curArr.map { it.id }.toMutableSet()
            for (x in arr) if (ex.add(x.id)) curArr.add(x)
            nextExtra[tid] = curArr
        }
        val nextF = state.f.toMutableMap()
        for ((id, valStr) in inc.f) {
            val iv = valStr.trim()
            if (iv.isEmpty()) continue
            val cv = (nextF[id] ?: "").trim()
            if (cv.isEmpty()) { nextF[id] = valStr; addedF++ }
            else if (cv != iv && overwriteConflicts) { nextF[id] = valStr; updatedF++ }
        }
        val nextLists = state.lists.toMutableMap()
        for ((lid, rows) in inc.lists) {
            val curRows = (nextLists[lid] ?: emptyList()).toMutableList()
            val sigs = curRows.map(::rowSig).filter { it.isNotEmpty() }.toMutableSet()
            var addedHere = 0
            for (r in rows) {
                if (isRowUserEdited(lid, r)) {
                    val sig = rowSig(r)
                    if (sig.isNotEmpty() && sigs.add(sig)) { curRows.add(r); addedR++; addedHere++ }
                }
            }
            if (addedHere > 0) {
                curRows.removeAll { r -> r.values.all { it.trim().isEmpty() } }
                if (curRows.isEmpty()) curRows.add(emptyMap())
            }
            nextLists[lid] = curRows
        }
        val nextChecks = state.checks.toMutableMap()
        for ((k, v) in inc.checks) {
            if (v && !(nextChecks[k] ?: false)) { nextChecks[k] = true; addedC++ }
        }
        val safePhotoRe = Regex("""^data:image/(?:jpeg|jpg|png|webp|gif);base64,[A-Za-z0-9+/=]+$""")
        val nextPhotos = state.photos.filter { safePhotoRe.matches(it.dataUrl) }.take(10).toMutableList()
        val seenPhotoIds = nextPhotos.map { it.id }.toMutableSet()
        val seenPhotoUrls = nextPhotos.map { it.dataUrl }.toMutableSet()
        for (p in inc.photos) {
            if (nextPhotos.size >= 10) break
            if (!safePhotoRe.matches(p.dataUrl)) continue
            if (seenPhotoIds.add(p.id) && seenPhotoUrls.add(p.dataUrl)) {
                nextPhotos.add(p)
                addedP++
            }
        }
        val nextFireDrill = state.fireDrill.toMutableMap()
        for ((k, v) in inc.fireDrill) {
            if (v && !(nextFireDrill[k] ?: false)) { nextFireDrill[k] = true }
        }
        val nextLastDryRun = newerIso(state.lastDryRun, inc.lastDryRun)
        val nextReviewed = newerIso(state.reviewed, inc.reviewed)
        state = state.copy(
            customTabs = curTabs,
            extra = nextExtra,
            f = nextF,
            lists = nextLists,
            checks = nextChecks,
            photos = nextPhotos,
            fireDrill = nextFireDrill,
            lastDryRun = nextLastDryRun,
            reviewed = nextReviewed
        )
        normalize()
        save()
        val parts = listOfNotNull(
            if (addedF > 0) "+$addedF fields" else null,
            if (updatedF > 0) "$updatedF updated" else null,
            if (addedR > 0) "+$addedR rows" else null,
            if (addedS > 0) "+$addedS sections" else null,
            if (addedC > 0) "+$addedC checks" else null,
            if (addedP > 0) "+$addedP photos" else null
        )
        val msg = if (parts.isEmpty()) "Already up to date" else "Merged (${parts.joinToString(", ")})"
        statusToast = msg
        return msg
    }

    fun exportErGrabSheetText(): String {
        fun f(id: String) = (state.f[id] ?: "").trim()
        val lines = mutableListOf(
            "1-PAGE ER & MEDICAL TREATMENT GRAB SHEET",
            "Region: ${currentRegion.label} | Emergency #: ${currentRegion.emergency}",
            "=================================================="
        )
        if (f("h_triage").isNotEmpty()) lines.add("24/7 SPECIALIST TRIAGE / ER: ${f("h_triage")}")
        if (f("h_redflag").isNotEmpty()) lines.add("RED-FLAG RULE: ${f("h_redflag")}")
        if (f("h_diag").isNotEmpty()) lines.add("Diagnosis / Protocol: ${f("h_diag")}")
        if (f("h_devices").isNotEmpty()) lines.add("Ports / Implants / Arm Limits: ${f("h_devices")}")
        if (f("d_meds").isNotEmpty()) lines.add("Daily Meds & Allergies: ${f("d_meds")}")
        if (f("h_rescue").isNotEmpty()) lines.add("Rescue Meds: ${f("h_rescue")}")
        if (f("h_pharm").isNotEmpty()) lines.add("Pharmacy: ${f("h_pharm")}")
        if (f("d_mpoa").isNotEmpty()) lines.add("Medical POA: ${f("d_mpoa")}")
        if (f("h_portal").isNotEmpty()) lines.add("Portal Proxy / HIPAA: ${f("h_portal")}")
        if (f("d_ins").isNotEmpty()) lines.add("Insurance: ${f("d_ins")}")
        if (f("q_first").isNotEmpty()) lines.add("Call First: ${f("q_first")}")
        return lines.joinToString("\n")
    }

    fun exportExecutiveSummaryText(): String {
        fun f(id: String) = (state.f[id] ?: "").trim()
        fun rowsOf(id: String) = (state.lists[id] ?: emptyList()).filter { isRowUserEdited(id, it) }
        val out = mutableListOf(
            "OUR FAMILY FIELD GUIDE — 1-PAGE SUMMARY (${currentRegion.label})",
            "=================================================="
        )
        if (f("q_first").isNotEmpty()) out.add("Call First: ${f("q_first")}")
        if (f("q_binder").isNotEmpty()) out.add("Papers Location: ${f("q_binder")}")
        if (f("q_life").isNotEmpty()) out.add("Total Life Insurance: ${f("q_life")}")
        if (f("m_monthly").isNotEmpty()) out.add("Monthly Spending: ${f("m_monthly")}")
        if (f("m_payout_first").isNotEmpty()) out.add("Payout First Step: ${f("m_payout_first")}")
        val accts = rowsOf("accounts")
        if (accts.isNotEmpty()) {
            out.add("\nBank Accounts:")
            accts.forEach { out.add(" - ${it["inst"] ?: it["type"] ?: "Account"} (${it["own"] ?: ""}, *${it["last4"] ?: ""})") }
        }
        val crypto = rowsOf("crypto")
        if (crypto.isNotEmpty()) {
            out.add("\nCrypto / Digital:")
            crypto.forEach { out.add(" - ${it["platform"] ?: "Wallet"}: ${it["access"] ?: ""}") }
        }
        val ins = rowsOf("insurance")
        if (ins.isNotEmpty()) {
            out.add("\nInsurance:")
            ins.forEach { out.add(" - ${it["type"] ?: "Policy"}: ${it["co"] ?: ""} ${it["amt"] ?: ""} (Benef: ${it["benef"] ?: ""})") }
        }
        val ids = rowsOf("gov_ids")
        if (ids.isNotEmpty()) {
            out.add("\nKey IDs (last 4 only):")
            ids.forEach { out.add(" - ${it["idtype"] ?: "ID"} *${it["last4"] ?: ""} (${it["where"] ?: ""})") }
        }
        if (f("h_diag").isNotEmpty() || f("h_triage").isNotEmpty() || f("h_redflag").isNotEmpty()) {
            out.add("\nER / Active Illness Alert:")
            if (f("h_diag").isNotEmpty()) out.add(" - Diagnosis: ${f("h_diag")}")
            if (f("h_triage").isNotEmpty()) out.add(" - Triage: ${f("h_triage")}")
            if (f("h_redflag").isNotEmpty()) out.add(" - Red-flag rule: ${f("h_redflag")}")
        }
        return out.joinToString("\n")
    }
}
