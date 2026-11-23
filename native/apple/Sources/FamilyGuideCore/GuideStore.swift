import Foundation
import LocalAuthentication
import Observation

@MainActor
@Observable
public final class GuideStore {
    public let data: GuideData
    public var state: GuideState
    public var isBiometricLocked: Bool = false
    public var statusToast: String?

    private let stateURL: URL

    public init(storageDirectory: URL? = nil) throws {
        guard let url = Bundle.module.url(forResource: "guide-data", withExtension: "json") else {
            throw NSError(domain: "FamilyGuideCore", code: 1, userInfo: [NSLocalizedDescriptionKey: "Missing bundled guide-data.json"])
        }
        let raw = try Data(contentsOf: url)
        self.data = try JSONDecoder().decode(GuideData.self, from: raw)

        let dir: URL
        if let storageDirectory {
            dir = storageDirectory
        } else {
            let appSup = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first!
            dir = appSup.appendingPathComponent("FamilyFieldGuide", isDirectory: true)
        }
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        self.stateURL = dir.appendingPathComponent("state.json")

        if let saved = try? Data(contentsOf: stateURL),
           let decoded = try? JSONDecoder().decode(GuideState.self, from: saved) {
            self.state = decoded
        } else {
            self.state = GuideState()
        }
        normalize()
    }

    public func save(touch: Bool = true) {
        if touch {
            state.updated = ISO8601DateFormatter().string(from: Date())
        }
        if let encoded = try? JSONEncoder().encode(state) {
            try? encoded.write(to: stateURL, options: [.atomic])
        }
    }

    public func normalize() {
        if data.REGIONS[state.region] == nil { state.region = "us" }
        if data.PLAYBOOK[state.track] == nil { state.track = "hurt" }
        for tab in data.TABS {
            for block in tab.blocks where block.type == "list" {
                if let bid = block.id, state.lists[bid] == nil {
                    state.lists[bid] = (block.seed ?? [[:]])
                }
            }
        }
        for (_, items) in state.extra {
            for item in items where item.type == "list" {
                if state.lists[item.id] == nil { state.lists[item.id] = [[:]] }
            }
        }
        let validTabIds = Set(allTabIds())
        if !validTabIds.contains(state.tab) {
            state.tab = "start"
        }
    }

    public func allTabIds() -> [String] {
        data.TABS.map(\.id) + state.customTabs.map(\.id)
    }

    public var currentRegion: RegionPreset {
        data.REGIONS[state.region] ?? data.REGIONS["us"]!
    }

    public func localizedField(_ f: FieldDef) -> FieldDef {
        guard let ov = currentRegion.fieldOverrides?[f.id] else { return f }
        return FieldDef(
            id: f.id,
            label: ov.label ?? f.label,
            placeholder: ov.ph ?? f.placeholder,
            wide: f.wide
        )
    }

    public func localizedList(_ b: BlockDef) -> (hint: String?, suggestions: [String], cols: [ColDef]) {
        let ov = b.id.flatMap { currentRegion.listOverrides?[$0] }
        var sugs = b.suggestions ?? []
        if let extra = ov?.extraSuggestions {
            for s in extra where !sugs.contains(s) {
                sugs.append(s)
            }
        }
        let cols = (b.cols ?? []).map { col in
            ColDef(key: col.key, label: ov?.colLabels?[col.key] ?? col.label)
        }
        return (ov?.hint ?? b.hint, sugs, cols)
    }

    public func localizedStep(_ s: PlaybookStep) -> PlaybookStep {
        guard let ov = currentRegion.stepOverrides?[s.id] else { return s }
        return PlaybookStep(id: s.id, t: ov.t ?? s.t, d: ov.d ?? s.d, ref: s.ref, refTab: s.refTab, refBlock: s.refBlock)
    }

    public func findListDef(_ id: String) -> BlockDef? {
        for tab in data.TABS {
            if let b = tab.blocks.first(where: { $0.id == id }) { return b }
        }
        return nil
    }

    public func isRowUserEdited(blockId: String, row: [String: String]) -> Bool {
        let nonEmpty = row.filter { !$0.value.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
        if nonEmpty.isEmpty { return false }

        if let def = findListDef(blockId) {
            let loc = localizedList(def)
            if let seeds = def.seed, !seeds.isEmpty {
                let matchesSeed = seeds.contains { seedRow in
                    let seedEntries = seedRow.filter { !$0.value.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
                    guard seedEntries.count == nonEmpty.count else { return false }
                    return seedEntries.allSatisfy { k, v in
                        (row[k] ?? "").trimmingCharacters(in: .whitespacesAndNewlines) == v.trimmingCharacters(in: .whitespacesAndNewlines)
                    }
                }
                if matchesSeed { return false }
            }
            if !loc.suggestions.isEmpty, nonEmpty.count == 1, let first = nonEmpty.first {
                let scol = def.suggestCol ?? def.cols?.first?.key ?? ""
                if first.key == scol && loc.suggestions.contains(where: { $0.caseInsensitiveCompare(first.value.trimmingCharacters(in: .whitespacesAndNewlines)) == .orderedSame }) {
                    return false
                }
            }
        }
        return true
    }

    public var hasAnyContent: Bool {
        if state.f.values.contains(where: { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }) { return true }
        for (id, rows) in state.lists {
            if rows.contains(where: { isRowUserEdited(blockId: id, row: $0) }) { return true }
        }
        if !state.customTabs.isEmpty || !state.extra.isEmpty || !state.photos.isEmpty { return true }
        return false
    }

    public var completionPercent: Int {
        var total = 0
        var got = 0
        func has(_ id: String) -> Int {
            (state.f[id] ?? "").trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? 0 : 1
        }
        func listFilled(_ id: String) -> Int {
            min(2, (state.lists[id] ?? []).filter { isRowUserEdited(blockId: id, row: $0) }.count)
        }
        for tab in data.TABS {
            for b in tab.blocks {
                if b.type == "fields", let fields = b.fields {
                    for f in fields { total += 1; got += has(f.id) }
                } else if b.type == "list", let lid = b.id {
                    total += 2; got += listFilled(lid)
                }
            }
        }
        for items in state.extra.values {
            for x in items {
                if x.type == "field" { total += 1; got += has(x.id) }
                else { total += 2; got += listFilled(x.id) }
            }
        }
        for g in data.GLANCE { total += 1; got += has(g.id) }
        for k in data.KIDS { total += 1; got += has(k.id) }
        total += 1; got += has("letter")
        return total > 0 ? Int(round(Double(got) / Double(total) * 100.0)) : 0
    }

    // MARK: - Demo & Actions

    public func loadDemo() {
        let src = data.DEMO_FAMILIES[state.region] ?? data.DEMO_FAMILIES["default"]!
        let keepRegion = state.region
        let keepLarge = state.largeText
        let keepHc = state.highContrast
        var next = GuideState()
        next.region = keepRegion
        next.largeText = keepLarge
        next.highContrast = keepHc
        next.isDemo = true
        next.track = src.track ?? "hurt"
        next.tab = "start"
        next.f = src.f ?? [:]
        if let patch = src.f_extra_patch {
            for (k, v) in patch { next.f[k] = v }
        }
        next.lists = src.lists ?? [:]
        next.customTabs = src.customTabs ?? []
        next.extra = src.extra ?? [:]
        state = next
        normalize()
        save(touch: false)
        statusToast = "Sample family loaded"
    }

    public func clearDemo() {
        let keepRegion = state.region
        let keepLarge = state.largeText
        let keepHc = state.highContrast
        var next = GuideState()
        next.region = keepRegion
        next.largeText = keepLarge
        next.highContrast = keepHc
        state = next
        normalize()
        save(touch: false)
        statusToast = "Cleared sample — ready for your family"
    }

    public func addCustomSection(name: String) {
        let tid = "tab_" + UUID().uuidString.prefix(8).lowercased()
        state.customTabs.append(CustomTab(id: tid, label: name, title: name))
        state.tab = tid
        save()
    }

    public func applySectionTemplate(_ tpl: SectionTemplate) {
        let tid = "tab_" + UUID().uuidString.prefix(8).lowercased()
        state.customTabs.append(CustomTab(id: tid, label: tpl.name, title: tpl.name))
        var items: [ExtraItem] = []
        for f in tpl.fields {
            items.append(ExtraItem(type: "field", id: "x_" + UUID().uuidString.prefix(8).lowercased(), label: f.label, wide: f.wide))
        }
        for l in tpl.lists {
            let lid = "l_" + UUID().uuidString.prefix(8).lowercased()
            let cols = l.cols.enumerated().map { ColDef(key: "c\($0.offset)", label: $0.element) }
            items.append(ExtraItem(type: "list", id: lid, title: l.title, cols: cols))
            state.lists[lid] = [[:]]
        }
        state.extra[tid] = items
        state.tab = tid
        save()
        statusToast = "Added \"\(tpl.name)\""
    }

    // MARK: - Readiness Audit (Including Crypto Seed & Gov ID Privacy Checks)

    public func computeAudit() -> [AuditItem] {
        func f(_ id: String) -> String { (state.f[id] ?? "").trimmingCharacters(in: .whitespacesAndNewlines) }
        func rowsOf(_ id: String) -> [[String: String]] {
            (state.lists[id] ?? []).filter { isRowUserEdited(blockId: id, row: $0) }
        }
        var items: [AuditItem] = []
        let reg = currentRegion

        let missCore = [f("q_first").isEmpty ? "First person to call" : nil, f("q_binder").isEmpty ? "Where papers live" : nil].compactMap { $0 }
        if !missCore.isEmpty {
            items.append(AuditItem(id: "start_core", sev: .high, title: "Start-here essentials incomplete", detail: "Missing: \(missCore.joined(separator: ", ")).", tab: "start", block: "If you read nothing else", field: f("q_first").isEmpty ? "q_first" : "q_binder"))
        } else {
            items.append(AuditItem(id: "start_core", sev: .ok, title: "First-call & paper locations set", detail: "Your spouse knows who to call and where originals live."))
        }

        if f("d_phone").isEmpty {
            items.append(AuditItem(id: "phone_2fa", sev: .high, title: "No phone unlock instructions", detail: "Banks and email send 2FA codes to your phone—without unlock notes, your spouse can get locked out.", tab: "docs", block: "Getting into things", field: "d_phone"))
        } else if f("d_2fa").isEmpty && f("d_sim").isEmpty {
            items.append(AuditItem(id: "phone_2fa", sev: .med, title: "Add 2FA recovery or carrier SIM PIN", detail: "Phone unlock is noted, but 2FA recovery codes or SIM PIN instructions will prevent lockouts.", tab: "docs", block: "Getting into things", field: "d_2fa"))
        } else {
            items.append(AuditItem(id: "phone_2fa", sev: .ok, title: "Phone & 2FA access documented", detail: "Unlock and 2FA/SIM instructions are covered."))
        }

        let accts = rowsOf("accounts")
        let hasJoint = accts.contains { ($0["own"] ?? "").range(of: "joint|both|shared|either|survivor|&|\\band\\b", options: [.regularExpression, .caseInsensitive]) != nil }
        if accts.isEmpty {
            items.append(AuditItem(id: "joint_bank", sev: .med, title: "No bank accounts listed yet", detail: "List checking/savings (last 4 digits) and mark which ones are Joint.", tab: "money", block: "accounts"))
        } else if !hasJoint {
            items.append(AuditItem(id: "joint_bank", sev: .high, title: "No bank account marked Joint", detail: "Solo accounts often freeze upon death, stranding household bills until probate.", tab: "money", block: "accounts"))
        } else {
            items.append(AuditItem(id: "joint_bank", sev: .ok, title: "Joint bank access listed", detail: "At least one account is marked joint/shared."))
        }

        let invRows = rowsOf("invest")
        let lifeRows = rowsOf("insurance").filter { ($0["type"] ?? "").range(of: "life|term", options: [.regularExpression, .caseInsensitive]) != nil }
        let totalBenefMiss = invRows.filter { ($0["benef"] ?? "").trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }.count
            + lifeRows.filter { ($0["benef"] ?? "").trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }.count
        let indiaNote = reg.indiaNotes ? " In India, bank/demat nominees are custodians—ensure your will/legal heirs match." : ""
        if totalBenefMiss > 0 {
            items.append(AuditItem(id: "beneficiaries", sev: .high, title: "\(totalBenefMiss) retirement/life-insurance entry missing a Beneficiary", detail: "Named beneficiaries override your will—record who is named on each." + indiaNote, tab: "money", block: "insurance"))
        } else if invRows.isEmpty && lifeRows.isEmpty {
            items.append(AuditItem(id: "beneficiaries", sev: .med, title: "No life insurance or retirement accounts listed", detail: "Record policies and retirement accounts along with named beneficiaries." + indiaNote, tab: "money", block: "insurance"))
        } else {
            items.append(AuditItem(id: "beneficiaries", sev: .ok, title: "Beneficiaries recorded", detail: "Listed life insurance & retirement entries name a beneficiary." + indiaNote))
        }

        let missLegal = [f("d_will").isEmpty ? "Will / trust" : nil, f("d_hcd").isEmpty ? "Healthcare directive" : nil, f("d_fpoa").isEmpty ? "Financial POA" : nil].compactMap { $0 }
        if !missLegal.isEmpty {
            let onlyMed = missLegal.count == 1 && f("d_hcd").isEmpty
            items.append(AuditItem(id: "legal_med", sev: .high, title: "Missing legal/medical papers (\(missLegal.count))", detail: "Not recorded: \(missLegal.joined(separator: ", ")).", tab: onlyMed ? "health" : "docs"))
        } else {
            items.append(AuditItem(id: "legal_med", sev: .ok, title: "Core legal & medical directives mapped", detail: "Will/trust, healthcare directive, and financial POA locations are recorded."))
        }

        if f("d_pm").isEmpty && f("d_legacy").isEmpty {
            items.append(AuditItem(id: "digital_legacy", sev: .med, title: "No password manager or legacy contact noted", detail: "Set up Password Manager emergency access or Apple/Google Legacy Contacts.", tab: "docs", field: "d_pm"))
        } else {
            items.append(AuditItem(id: "digital_legacy", sev: .ok, title: "Digital legacy / password access set", detail: "Password manager or platform legacy contacts are documented."))
        }

        let cryptoRows = rowsOf("crypto")
        if !cryptoRows.isEmpty {
            let hasSeed = cryptoRows.contains { row in
                row.values.contains { $0.range(of: #"\b([a-z]{3,}\s+){11,}[a-z]{3,}\b"#, options: [.regularExpression, .caseInsensitive]) != nil }
            }
            let missCrypto = cryptoRows.contains {
                ($0["access"] ?? "").trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || ($0["helper"] ?? "").trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            }
            if hasSeed {
                items.append(AuditItem(id: "crypto_safety", sev: .high, title: "Possible crypto seed phrase detected!", detail: "Never store 12/24-word recovery seeds in this guide—write ONLY where the physical backup lives.", tab: "money", block: "crypto"))
            } else if missCrypto {
                items.append(AuditItem(id: "crypto_safety", sev: .med, title: "Crypto entry missing recovery location or helper", detail: "Record where the seed/hardware wallet is stored and a trusted helper.", tab: "money", block: "crypto"))
            } else {
                items.append(AuditItem(id: "crypto_safety", sev: .ok, title: "Crypto recovery map documented (no raw seeds)", detail: "Holdings, storage locations, and trusted helper instructions are recorded."))
            }
        }

        let govRows = rowsOf("gov_ids")
        if !govRows.isEmpty {
            let hasFullId = govRows.contains { row in
                row.values.contains { $0.range(of: #"\b\d{3}-\d{2}-\d{4}\b|\b\d{4}[\s-]\d{4}[\s-]\d{4}\b|\b\d{9,}\b"#, options: .regularExpression) != nil }
            }
            if hasFullId {
                items.append(AuditItem(id: "gov_id_privacy", sev: .high, title: "Possible full SSN / National ID detected!", detail: "Safety rule: enter ONLY the last 4 digits and where the original card lives.", tab: "docs", block: "gov_ids"))
            } else {
                items.append(AuditItem(id: "gov_id_privacy", sev: .ok, title: "Key IDs mapped safely (last 4 only)", detail: "Government IDs record only last 4 digits and physical locations."))
            }
        }

        if !f("q_life").isEmpty || !lifeRows.isEmpty {
            let hasPayout = ![f("m_payout_first"), f("m_payout_payoff"), f("m_payout_advisor"), f("m_payout_monthly")].allSatisfy(\.isEmpty)
            if hasPayout {
                items.append(AuditItem(id: "payout_plan", sev: .ok, title: "Survivor big-money instructions documented", detail: "Plain-English instructions for handling insurance payouts are filled in."))
            } else {
                items.append(AuditItem(id: "payout_plan", sev: .med, title: "Add personal instructions for life insurance / big money", detail: "Tell your spouse what to do first with payouts, which debts to leave alone, and who to trust.", tab: "money", field: "m_payout_first"))
            }
        }

        if reg.crossBorder {
            let blob = "\(state.f) \(state.lists["doclocs"] ?? []) \(state.customTabs)"
            let hasVisaInfo = blob.range(of: "i-797|i-140|h-1b|h-4|oci|visa|immig", options: [.regularExpression, .caseInsensitive]) != nil
            let hasImmigPro = (state.lists["pros"] ?? []).contains { $0.values.joined(separator: " ").range(of: "immig|visa|cross", options: [.regularExpression, .caseInsensitive]) != nil }
            if hasVisaInfo && hasImmigPro {
                items.append(AuditItem(id: "cross_border", sev: .ok, title: "Cross-border & visa readiness covered", detail: "Visa papers, separate country planning, and immigration counsel are noted."))
            } else {
                items.append(AuditItem(id: "cross_border", sev: .high, title: "Cross-border / Visa readiness incomplete", detail: "Record visa filings, immigration attorney, local temporary guardian, and separate wills.", tab: "docs"))
            }
        }

        let iso = ISO8601DateFormatter()
        if hasAnyContent && state.lastBackup == nil {
            items.append(AuditItem(id: "backup_fresh", sev: .high, title: "No locked backup saved yet", detail: "Export an AES-256-GCM locked backup file now.", act: "backup"))
        } else if hasAnyContent, let upd = state.updated, let lb = state.lastBackup, upd > lb {
            items.append(AuditItem(id: "backup_fresh", sev: .med, title: "Recent changes aren't in your latest backup", detail: "Save a fresh locked backup so your spouse's copy matches.", act: "backup"))
        } else {
            items.append(AuditItem(id: "backup_fresh", sev: .ok, title: "Locked backup status", detail: state.lastBackup.flatMap { iso.date(from: $0)?.formatted(date: .abbreviated, time: .omitted) }.map { "Saved \($0)." } ?? "Ready."))
        }

        if state.lastDryRun == nil {
            items.append(AuditItem(id: "fire_drill", sev: .med, title: "Run a 10-minute Family Fire Drill", detail: "Verify your spouse can unlock the guide and locate papers and phone access."))
        } else {
            items.append(AuditItem(id: "fire_drill", sev: .ok, title: "Family Fire Drill completed", detail: "Completed."))
        }

        return items.sorted { $0.sev < $1.sev }
    }

    // MARK: - Search

    public func search(_ query: String) -> [SearchHit] {
        let term = query.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard !term.isEmpty else { return [] }
        var hits: [SearchHit] = []
        func push(_ tabId: String, _ tabLabel: String, _ title: String, _ sub: String, _ bk: String = "", _ fid: String = "", _ tk: String = "") {
            guard hits.count < 20 else { return }
            hits.append(SearchHit(tabId: tabId, tabLabel: tabLabel, title: title, sub: sub, blockKey: bk, fieldId: fid, trackKey: tk))
        }

        for rawG in data.GLANCE {
            let rf = localizedField(FieldDef(id: rawG.id, label: rawG.label, placeholder: rawG.placeholder))
            let val = state.f[rf.id] ?? ""
            if rf.label.lowercased().contains(term) || val.lowercased().contains(term) {
                push("start", "Start here", rf.label, val.isEmpty ? "Quick glance" : val, "glance", rf.id)
            }
        }
        for tab in data.TABS {
            for b in tab.blocks {
                if b.type == "fields", let fields = b.fields {
                    for rawF in fields {
                        let rf = localizedField(rawF)
                        let val = state.f[rf.id] ?? ""
                        if rf.label.lowercased().contains(term) || val.lowercased().contains(term) || (b.title ?? "").lowercased().contains(term) {
                            push(tab.id, tab.label, rf.label, val.isEmpty ? (b.title ?? "") : val, b.title ?? "", rf.id)
                        }
                    }
                } else if b.type == "list", let bid = b.id {
                    let loc = localizedList(b)
                    let matchedRow = (state.lists[bid] ?? []).first { $0.values.contains { $0.lowercased().contains(term) } }
                    let matchedSug = loc.suggestions.first { $0.lowercased().contains(term) }
                    if (b.title ?? "").lowercased().contains(term) || matchedRow != nil || matchedSug != nil || (loc.hint ?? "").lowercased().contains(term) {
                        let preview = matchedRow?.values.filter { !$0.isEmpty }.joined(separator: " · ") ?? (matchedSug.map { "Quick-add: \($0)" } ?? (loc.hint ?? "Table"))
                        push(tab.id, tab.label, b.title ?? "Table", preview, bid)
                    }
                }
            }
        }
        for g in data.MONEY_GUIDE {
            let txt = "\(g.title) \(g.summary) \(g.bullets.joined(separator: " ")) \(g.note ?? "")".lowercased()
            if txt.contains(term) { push("money", "Money Guide", g.title, g.summary, "money_guide") }
        }
        if let pf = currentRegion.proFinder {
            let pairs: [(String, String?)] = [("Legal", pf.legal), ("Visa", pf.visa), ("Money", pf.money), ("Tax", pf.tax)]
            if let hit = pairs.first(where: { ($0.1 ?? "").lowercased().contains(term) })?.1 {
                push("contacts", "Finding Help", "Local directories (\(currentRegion.label))", hit, "pro_finder")
            }
        }
        for c in data.PRO_FINDER {
            let txt = "\(c.title) \(c.summary) \(c.bullets.joined(separator: " ")) \(c.note ?? "")".lowercased()
            if txt.contains(term) { push("contacts", "Finding Help", c.title, c.summary, "pro_finder") }
        }
        for (tk, pb) in data.PLAYBOOK {
            for ph in pb.phases {
                for rawS in ph.steps {
                    let s = localizedStep(rawS)
                    if s.t.lowercased().contains(term) || s.d.lowercased().contains(term) {
                        push("start", "Playbook", s.t, s.d, s.id, "", tk)
                    }
                }
            }
        }
        for sc in data.SCRIPTS where sc.title.lowercased().contains(term) || sc.body.lowercased().contains(term) {
            push("start", "Scripts", sc.title, sc.body, "scripts")
        }
        return hits
    }

    // MARK: - Two-Spouse Smart Merge

    private func rowSig(_ row: [String: String]) -> String {
        row.map { ($0.key, $0.value.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()) }
            .filter { !$0.1.isEmpty }
            .sorted { $0.0 < $1.0 }
            .map { "\($0.0)=\($0.1)" }
            .joined(separator: "|")
    }

    public func fieldLabel(for id: String, extraFromIncoming: [String: [ExtraItem]] = [:]) -> String {
        if id == "letter" { return "A note to you" }
        if let g = data.GLANCE.first(where: { $0.id == id }) { return g.label }
        if let k = data.KIDS.first(where: { $0.id == id }) { return k.label }
        for t in data.TABS {
            for b in t.blocks where b.type == "fields" {
                if let f = b.fields?.first(where: { $0.id == id }) { return f.label }
            }
        }
        let extras = Array(state.extra.values.joined()) + Array(extraFromIncoming.values.joined())
        return extras.first(where: { $0.id == id })?.label ?? id
    }

    public func computeMergePlan(incoming inc: GuideState) -> MergePlan {
        var newFields = 0
        var conflicts: [MergeConflict] = []
        for (id, val) in inc.f {
            let iv = val.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !iv.isEmpty else { continue }
            let cv = (state.f[id] ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
            if cv.isEmpty { newFields += 1 }
            else if cv != iv { conflicts.append(MergeConflict(id: id, label: fieldLabel(for: id, extraFromIncoming: inc.extra))) }
        }
        let curTabIds = Set(state.customTabs.map(\.id))
        let newTabs = inc.customTabs.filter { !curTabIds.contains($0.id) }.count
        var newExtras = 0
        for (tid, arr) in inc.extra {
            let ex = Set((state.extra[tid] ?? []).map(\.id))
            newExtras += arr.filter { !ex.contains($0.id) }.count
        }
        var newRows = 0
        for (lid, rows) in inc.lists {
            var sigs = Set((state.lists[lid] ?? []).map(rowSig).filter { !$0.isEmpty })
            for r in rows where isRowUserEdited(blockId: lid, row: r) {
                let sig = rowSig(r)
                if !sig.isEmpty && !sigs.contains(sig) {
                    newRows += 1
                    sigs.insert(sig)
                }
            }
        }
        let newChecks = inc.checks.filter { $0.value && !(state.checks[$0.key] ?? false) }.count
        return MergePlan(newFields: newFields, conflictFields: conflicts, newTabs: newTabs, newExtras: newExtras, newRows: newRows, newChecks: newChecks)
    }

    @discardableResult
    public func applyMerge(incoming inc: GuideState, overwriteConflicts: Bool) -> String {
        var addedF = 0, updatedF = 0, addedR = 0, addedC = 0, addedS = 0
        var curTabIds = Set(state.customTabs.map(\.id))
        for t in inc.customTabs where !curTabIds.contains(t.id) {
            state.customTabs.append(t)
            curTabIds.insert(t.id)
            addedS += 1
        }
        for (tid, arr) in inc.extra {
            var curArr = state.extra[tid] ?? []
            var ex = Set(curArr.map(\.id))
            for x in arr where !ex.contains(x.id) {
                curArr.append(x)
                ex.insert(x.id)
            }
            state.extra[tid] = curArr
        }
        for (id, val) in inc.f {
            let iv = val.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !iv.isEmpty else { continue }
            let cv = (state.f[id] ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
            if cv.isEmpty { state.f[id] = val; addedF += 1 }
            else if cv != iv && overwriteConflicts { state.f[id] = val; updatedF += 1 }
        }
        for (lid, rows) in inc.lists {
            var curRows = state.lists[lid] ?? []
            var sigs = Set(curRows.map(rowSig).filter { !$0.isEmpty })
            var addedHere = 0
            for r in rows where isRowUserEdited(blockId: lid, row: r) {
                let sig = rowSig(r)
                if !sig.isEmpty && !sigs.contains(sig) {
                    curRows.append(r)
                    sigs.insert(sig)
                    addedR += 1
                    addedHere += 1
                }
            }
            if addedHere > 0 {
                curRows.removeAll { r in !r.values.contains { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty } }
                if curRows.isEmpty { curRows = [[:]] }
            }
            state.lists[lid] = curRows
        }
        for (k, v) in inc.checks where v && !(state.checks[k] ?? false) {
            state.checks[k] = true
            addedC += 1
        }
        normalize()
        save()
        var parts: [String] = []
        if addedF > 0 { parts.append("+\(addedF) fields") }
        if updatedF > 0 { parts.append("\(updatedF) updated") }
        if addedR > 0 { parts.append("+\(addedR) rows") }
        if addedS > 0 { parts.append("+\(addedS) sections") }
        if addedC > 0 { parts.append("+\(addedC) checks") }
        let msg = parts.isEmpty ? "Already up to date" : "Merged (\(parts.joined(separator: ", ")))"
        statusToast = msg
        return msg
    }

    // MARK: - Printable / Shareable Sheets

    public func exportErGrabSheetText() -> String {
        func f(_ id: String) -> String { (state.f[id] ?? "").trimmingCharacters(in: .whitespacesAndNewlines) }
        var lines: [String] = [
            "1-PAGE ER & MEDICAL TREATMENT GRAB SHEET",
            "Region: \(currentRegion.label) | Emergency #: \(currentRegion.emergency)",
            "=================================================="
        ]
        if !f("h_triage").isEmpty { lines.append("24/7 SPECIALIST TRIAGE / ER: \(f("h_triage"))") }
        if !f("h_redflag").isEmpty { lines.append("RED-FLAG RULE: \(f("h_redflag"))") }
        if !f("h_diag").isEmpty { lines.append("Diagnosis / Protocol: \(f("h_diag"))") }
        if !f("h_devices").isEmpty { lines.append("Ports / Implants / Arm Limits: \(f("h_devices"))") }
        if !f("d_meds").isEmpty { lines.append("Daily Meds & Allergies: \(f("d_meds"))") }
        if !f("h_rescue").isEmpty { lines.append("Rescue Meds: \(f("h_rescue"))") }
        if !f("h_pharm").isEmpty { lines.append("Pharmacy: \(f("h_pharm"))") }
        if !f("d_mpoa").isEmpty { lines.append("Medical POA: \(f("d_mpoa"))") }
        if !f("h_portal").isEmpty { lines.append("Portal Proxy / HIPAA: \(f("h_portal"))") }
        if !f("d_ins").isEmpty { lines.append("Insurance: \(f("d_ins"))") }
        if !f("q_first").isEmpty { lines.append("Call First: \(f("q_first"))") }
        return lines.joined(separator: "\n")
    }

    public func exportExecutiveSummaryText() -> String {
        func f(_ id: String) -> String { (state.f[id] ?? "").trimmingCharacters(in: .whitespacesAndNewlines) }
        func rowsOf(_ id: String) -> [[String: String]] { (state.lists[id] ?? []).filter { isRowUserEdited(blockId: id, row: $0) } }
        var out: [String] = [
            "OUR FAMILY FIELD GUIDE — 1-PAGE SUMMARY (\(currentRegion.label))",
            "=================================================="
        ]
        if !f("q_first").isEmpty { out.append("Call First: \(f("q_first"))") }
        if !f("q_binder").isEmpty { out.append("Papers Location: \(f("q_binder"))") }
        if !f("q_life").isEmpty { out.append("Total Life Insurance: \(f("q_life"))") }
        if !f("m_monthly").isEmpty { out.append("Monthly Spending: \(f("m_monthly"))") }
        if !f("m_payout_first").isEmpty { out.append("Payout First Step: \(f("m_payout_first"))") }
        let accts = rowsOf("accounts")
        if !accts.isEmpty {
            out.append("\nBank Accounts:")
            accts.forEach { out.append(" - \($0["inst"] ?? $0["type"] ?? "Account") (\($0["own"] ?? ""), *\($0["last4"] ?? ""))") }
        }
        let crypto = rowsOf("crypto")
        if !crypto.isEmpty {
            out.append("\nCrypto / Digital:")
            crypto.forEach { out.append(" - \($0["platform"] ?? "Wallet"): \($0["access"] ?? "")") }
        }
        let ins = rowsOf("insurance")
        if !ins.isEmpty {
            out.append("\nInsurance:")
            ins.forEach { out.append(" - \($0["type"] ?? "Policy"): \($0["co"] ?? "") \($0["amt"] ?? "") (Benef: \($0["benef"] ?? ""))") }
        }
        let ids = rowsOf("gov_ids")
        if !ids.isEmpty {
            out.append("\nKey IDs (last 4 only):")
            ids.forEach { out.append(" - \($0["idtype"] ?? "ID") *\($0["last4"] ?? "") (\($0["where"] ?? ""))") }
        }
        if !f("h_diag").isEmpty || !f("h_triage").isEmpty || !f("h_redflag").isEmpty {
            out.append("\nER / Active Illness Alert:")
            if !f("h_diag").isEmpty { out.append(" - Diagnosis: \(f("h_diag"))") }
            if !f("h_triage").isEmpty { out.append(" - Triage: \(f("h_triage"))") }
            if !f("h_redflag").isEmpty { out.append(" - Red-flag rule: \(f("h_redflag"))") }
        }
        return out.joined(separator: "\n")
    }

    // MARK: - Biometric Lock (Face ID / Touch ID)

    public func authenticateWithBiometrics() async -> Bool {
        let ctx = LAContext()
        var err: NSError?
        guard ctx.canEvaluatePolicy(.deviceOwnerAuthentication, error: &err) else {
            return false
        }
        return await withCheckedContinuation { cont in
            ctx.evaluatePolicy(.deviceOwnerAuthentication, localizedReason: "Unlock Our Family Field Guide") { success, _ in
                cont.resume(returning: success)
            }
        }
    }
}
