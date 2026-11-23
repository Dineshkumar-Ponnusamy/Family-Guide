import FamilyGuideCore
import SwiftUI
import UniformTypeIdentifiers

public struct BackupFileDocument: FileDocument {
    public static var readableContentTypes: [UTType] { [.json, .html, .plainText] }
    public var text: String

    public init(text: String) {
        self.text = text
    }

    public init(configuration: ReadConfiguration) throws {
        let data = configuration.file.regularFileContents ?? Data()
        self.text = String(decoding: data, as: UTF8.self)
    }

    public func fileWrapper(configuration: WriteConfiguration) throws -> FileWrapper {
        FileWrapper(regularFileWithContents: Data(text.utf8))
    }
}

public struct SummarySheetView: View {
    let store: GuideStore
    let onJump: (String, String?) -> Void
    @Environment(\.dismiss) private var dismiss

    public var body: some View {
        NavigationStack {
            ScrollView {
                Text(store.exportExecutiveSummaryText())
                    .font(.system(.body, design: .monospaced))
                    .textSelection(.enabled)
                    .padding()
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            .navigationTitle("1-Page Executive Summary")
            .toolbar {
                ToolbarItem(placement: .confirmationAction) { Button("Done") { dismiss() } }
                ToolbarItem(placement: .automatic) {
                    ShareLink(item: store.exportExecutiveSummaryText()) {
                        Label("Share / Print", systemImage: "square.and.arrow.up")
                    }
                }
            }
        }
        .frame(minWidth: 520, minHeight: 460)
    }
}

public struct ErGrabSheetView: View {
    let store: GuideStore
    @Environment(\.dismiss) private var dismiss

    public var body: some View {
        NavigationStack {
            ScrollView {
                Text(store.exportErGrabSheetText())
                    .font(.system(.body, design: .monospaced))
                    .textSelection(.enabled)
                    .padding()
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            .navigationTitle("1-Page ER & Medical Grab Sheet")
            .toolbar {
                ToolbarItem(placement: .confirmationAction) { Button("Done") { dismiss() } }
                ToolbarItem(placement: .automatic) {
                    ShareLink(item: store.exportErGrabSheetText()) {
                        Label("Share / Print", systemImage: "square.and.arrow.up")
                    }
                }
            }
        }
        .frame(minWidth: 520, minHeight: 420)
    }
}

public struct ReadinessSheetView: View {
    @Bindable var store: GuideStore
    let onAction: (String?, String?, String?) -> Void
    @Environment(\.dismiss) private var dismiss

    public var body: some View {
        let audit = store.computeAudit()
        NavigationStack {
            List {
                Section("Readiness Checks") {
                    ForEach(audit) { item in
                        HStack(alignment: .top, spacing: 10) {
                            Circle()
                                .fill(item.sev == .high ? Theme.tomato : (item.sev == .med ? Theme.sun : .green))
                                .frame(width: 10, height: 10)
                                .padding(.top, 6)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(item.title).font(.headline)
                                Text(item.detail).font(.caption).foregroundColor(Theme.ink2)
                            }
                            Spacer()
                            if item.sev != .ok && (item.tab != nil || item.act != nil) {
                                Button("Fix →") {
                                    dismiss()
                                    onAction(item.tab, item.block, item.act)
                                }
                                .buttonStyle(.bordered)
                            }
                        }
                    }
                }
                Section("10-Minute Family Fire Drill") {
                    ForEach(store.data.FIRE_DRILL) { fd in
                        let checked = store.state.fireDrill[fd.id] ?? false
                        Button {
                            store.state.fireDrill[fd.id] = !checked
                            store.save()
                        } label: {
                            HStack(alignment: .top) {
                                Image(systemName: checked ? "checkmark.square.fill" : "square")
                                VStack(alignment: .leading) {
                                    Text(fd.t).strikethrough(checked)
                                    Text(fd.d).font(.caption).foregroundColor(.secondary)
                                }
                            }
                        }
                        .buttonStyle(.plain)
                    }
                    Button("Mark Fire Drill Complete") {
                        store.state.lastDryRun = ISO8601DateFormatter().string(from: Date())
                        store.save()
                        store.statusToast = "Family fire drill recorded"
                    }
                }
            }
            .navigationTitle("Readiness & Fire Drill")
            .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Done") { dismiss() } } }
        }
        .frame(minWidth: 560, minHeight: 500)
    }
}

public struct SearchSheetView: View {
    let store: GuideStore
    let onSelect: (SearchHit) -> Void
    @State private var query = ""
    @Environment(\.dismiss) private var dismiss

    public var body: some View {
        let hits = store.search(query)
        NavigationStack {
            List(hits) { h in
                Button {
                    dismiss()
                    onSelect(h)
                } label: {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(h.tabLabel.uppercased()).font(.caption2.monospaced()).foregroundColor(Theme.sky)
                        Text(h.title).font(.headline)
                        if !h.sub.isEmpty { Text(h.sub).font(.caption).foregroundColor(Theme.ink2).lineLimit(2) }
                    }
                }
            }
            .searchable(text: $query, prompt: "Search guide ($1M, AILA, crypto, SSN, fever…)")
            .navigationTitle("Search Guide")
            .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Close") { dismiss() } } }
        }
        .frame(minWidth: 520, minHeight: 420)
    }
}

public struct BackupSheetView: View {
    @Bindable var store: GuideStore
    @State private var pw1 = ""
    @State private var pw2 = ""
    @State private var makeCards = false
    @State private var cards: [String] = []
    @State private var exportedJson: String?
    @State private var showExporter = false
    @State private var errMsg: String?
    @Environment(\.dismiss) private var dismiss

    public var body: some View {
        NavigationStack {
            Form {
                Section("Passphrase (min 8 characters)") {
                    SecureField("Passphrase", text: $pw1)
                    SecureField("Confirm passphrase", text: $pw2)
                    Button("Generate 5-word Diceware Passphrase") {
                        let pw = CryptoEngine.generatePassphrase(wordCount: 5, words: store.data.DICE_WORDS)
                        pw1 = pw
                        pw2 = pw
                    }
                    Toggle("Also create 2-of-3 Shamir Split Recovery Cards", isOn: $makeCards)
                }
                if let errMsg {
                    Text(errMsg).foregroundColor(.red)
                }
                if !cards.isEmpty {
                    Section("2-of-3 Recovery Cards (Store Separately)") {
                        ForEach(Array(cards.enumerated()), id: \.offset) { idx, c in
                            VStack(alignment: .leading) {
                                Text("Card \(idx + 1) of 3").font(.caption.bold())
                                Text(c).font(.caption.monospaced()).textSelection(.enabled)
                            }
                        }
                    }
                }
                Section {
                    Button("Encrypt & Save Backup File (.json)") {
                        do {
                            guard pw1.count >= 8 else { throw CryptoEngineError.invalidPassphrase }
                            guard pw1 == pw2 else { errMsg = "Passphrases do not match."; return }
                            let now = ISO8601DateFormatter().string(from: Date())
                            store.state.lastBackup = now
                            if store.state.updated == nil { store.state.updated = now }
                            let pkg = try CryptoEngine.encrypt(state: store.state, passphrase: pw1)
                            let data = try JSONEncoder().encode(pkg)
                            exportedJson = String(decoding: data, as: UTF8.self)
                            if makeCards { cards = try CryptoEngine.sssSplit2of3(secret: pw1) }
                            errMsg = nil
                            store.save(touch: false)
                            showExporter = true
                        } catch {
                            errMsg = error.localizedDescription
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(Theme.ink)
                }
            }
            .navigationTitle("Save Locked Backup")
            .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Done") { dismiss() } } }
            .fileExporter(
                isPresented: $showExporter,
                document: BackupFileDocument(text: exportedJson ?? ""),
                contentType: .json,
                defaultFilename: "family-field-guide-backup.json"
            ) { _ in }
        }
        .frame(minWidth: 520, minHeight: 440)
    }
}

public struct RestoreSheetView: View {
    @Bindable var store: GuideStore
    @State private var rawPayload = ""
    @State private var passphrase = ""
    @State private var useCards = false
    @State private var cardA = ""
    @State private var cardB = ""
    @State private var unlockedIncoming: GuideState?
    @State private var mergePlan: MergePlan?
    @State private var showImporter = false
    @State private var errMsg: String?
    @Environment(\.dismiss) private var dismiss

    public var body: some View {
        NavigationStack {
            Form {
                if let incoming = unlockedIncoming, let plan = mergePlan {
                    Section("Backup Unlocked — Smart Merge") {
                        Text("+\(plan.newFields) new fields · +\(plan.newRows) rows · +\(plan.newTabs) sections · +\(plan.newChecks) checks")
                        if !plan.conflictFields.isEmpty {
                            Text("\(plan.conflictFields.count) conflicting field(s): \(plan.conflictFields.map(\.label).prefix(5).joined(separator: ", "))")
                                .foregroundColor(Theme.tomato)
                        }
                        Button("Smart Merge (Keep My Edits on Conflicts)") {
                            store.applyMerge(incoming: incoming, overwriteConflicts: false)
                            dismiss()
                        }
                        Button("Smart Merge (Prefer Backup on Conflicts)") {
                            store.applyMerge(incoming: incoming, overwriteConflicts: true)
                            dismiss()
                        }
                        Button("Replace Everything on This Device", role: .destructive) {
                            store.state = incoming
                            store.normalize()
                            store.save(touch: false)
                            store.statusToast = "Backup loaded"
                            dismiss()
                        }
                    }
                } else {
                    Section("1. Choose .json or .html Backup") {
                        Button("Choose Backup File (.json / .html)") { showImporter = true }
                        TextField("Or paste encrypted JSON text", text: $rawPayload, axis: .vertical)
                    }
                    Section("2. Unlock") {
                        Toggle("Unlock with 2 Recovery Cards instead", isOn: $useCards)
                        if useCards {
                            TextField("Card A (FFG-1-...)", text: $cardA)
                            TextField("Card B (FFG-2-...)", text: $cardB)
                        } else {
                            SecureField("Passphrase", text: $passphrase)
                        }
                        if let errMsg { Text(errMsg).foregroundColor(.red) }
                        Button("Unlock Backup") {
                            do {
                                let pkg = try CryptoEngine.parseBackupPayload(from: rawPayload)
                                let pw = useCards ? try CryptoEngine.sssCombine2of3(cardA, cardB) : passphrase
                                let inc = try CryptoEngine.decrypt(package: pkg, passphrase: pw)
                                if !store.hasAnyContent {
                                    store.state = inc
                                    store.normalize()
                                    store.save(touch: false)
                                    store.statusToast = "Backup opened"
                                    dismiss()
                                } else {
                                    unlockedIncoming = inc
                                    mergePlan = store.computeMergePlan(incoming: inc)
                                    errMsg = nil
                                }
                            } catch {
                                errMsg = error.localizedDescription
                            }
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(Theme.ink)
                    }
                }
            }
            .navigationTitle("Open / Merge Backup")
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } } }
            .fileImporter(isPresented: $showImporter, allowedContentTypes: [.json, .html, .plainText]) { res in
                if case .success(let url) = res,
                   url.startAccessingSecurityScopedResource() {
                    defer { url.stopAccessingSecurityScopedResource() }
                    if let txt = try? String(contentsOf: url, encoding: .utf8) {
                        rawPayload = txt
                    }
                }
            }
        }
        .frame(minWidth: 520, minHeight: 440)
    }
}

public struct NewSectionSheetView: View {
    @Bindable var store: GuideStore
    @State private var name = ""
    @Environment(\.dismiss) private var dismiss

    public var body: some View {
        NavigationStack {
            List {
                Section("Custom Blank Section") {
                    TextField("Section name (e.g. Farm, Boat, Collectibles)", text: $name)
                    Button("Add Blank Section") {
                        let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
                        guard !trimmed.isEmpty else { return }
                        store.addCustomSection(name: trimmed)
                        dismiss()
                    }
                    .disabled(name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
                Section("Or Start From a Template") {
                    ForEach(store.data.SECTION_TEMPLATES) { tpl in
                        Button {
                            store.applySectionTemplate(tpl)
                            dismiss()
                        } label: {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(tpl.name).font(.headline)
                                Text(tpl.desc).font(.caption).foregroundColor(Theme.ink2)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Add a Section")
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } } }
        }
        .frame(minWidth: 520, minHeight: 460)
    }
}
