import FamilyGuideCore
import SwiftUI

public struct TabContentView: View {
    @Bindable var store: GuideStore
    let tab: TabDef
    let jumpHandler: (String, String?, String?) -> Void

    public var body: some View {
        let large = store.state.largeText
        let hc = store.state.highContrast
        VStack(alignment: .leading, spacing: 16) {
            Text(tab.title)
                .font(Theme.serifTitle(large: large))
                .foregroundColor(Theme.inkFg(hc))
            Text(tab.lede)
                .font(Theme.sansBody(large: large))
                .foregroundColor(Theme.ink2Fg(hc))

            ForEach(tab.blocks, id: \.stableId) { b in
                blockView(b)
                    .id(b.stableId)
            }

            ExtrasSectionView(store: store, tabId: tab.id, customTitle: "More details")
        }
    }

    @ViewBuilder
    private func blockView(_ b: BlockDef) -> some View {
        switch b.type {
        case "glance":
            glanceCard
        case "playbook":
            playbookCard
        case "fields":
            fieldsCard(title: b.title ?? "", hint: b.hint, fields: b.fields ?? [])
        case "list":
            if let bid = b.id {
                let loc = store.localizedList(b)
                listCard(id: bid, title: b.title ?? "", hint: loc.hint, cols: loc.cols, suggestions: loc.suggestions, suggestCol: b.suggestCol ?? loc.cols.first?.key ?? "", crisisEditable: b.crisisEditable ?? false)
            }
        case "money_guide":
            moneyGuideCard(title: b.title ?? "Beginner's guide: handling big money")
        case "pro_finder":
            proFinderCard(title: b.title ?? "How to find vetted & low-cost help")
        case "scripts":
            scriptsCard
        case "letter":
            letterCard
        case "kids":
            kidsCard
        default:
            EmptyView()
        }
    }

    private var glanceCard: some View {
        let large = store.state.largeText
        let items = store.data.GLANCE.map { store.localizedField(FieldDef(id: $0.id, label: $0.label, placeholder: $0.placeholder)) }
        return VStack(alignment: .leading, spacing: 10) {
            Text("If you read nothing else")
                .font(Theme.serifSection(large: large))
                .foregroundColor(Theme.paper)
            ForEach(items) { f in
                if !store.state.readMode || !(store.state.f[f.id] ?? "").trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(f.label.uppercased()).font(Theme.monoLabel(large: large)).foregroundColor(Theme.paper2)
                        fieldControl(f, darkBg: true)
                    }
                }
            }
        }
        .padding(16)
        .background(Theme.ink)
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(Theme.tomato, lineWidth: 2))
        .cornerRadius(10)
    }

    private var playbookCard: some View {
        let large = store.state.largeText
        let hc = store.state.highContrast
        return FFGCard(highContrast: hc) {
            Text("What's happening?")
                .font(Theme.serifSection(large: large))
                .foregroundColor(Theme.inkFg(hc))
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(Theme.playbookOrder.filter { store.data.PLAYBOOK[$0] != nil }, id: \.self) { k in
                        if let pb = store.data.PLAYBOOK[k] {
                            Button(pb.label) {
                                store.state.track = k
                                store.save(touch: false)
                            }
                            .buttonStyle(.borderedProminent)
                            .tint(store.state.track == k ? Theme.tomato : Theme.paper2)
                            .foregroundColor(store.state.track == k ? .white : Theme.ink)
                        }
                    }
                }
            }

            if let active = store.data.PLAYBOOK[store.state.track] {
                ForEach(active.phases) { ph in
                    VStack(alignment: .leading, spacing: 8) {
                        Text(ph.when)
                            .font(Theme.serifItalic(large: large))
                            .foregroundColor(Theme.tomato)
                            .padding(.top, 6)
                        ForEach(ph.steps) { rawS in
                            let s = store.localizedStep(rawS)
                            let checked = store.state.checks[s.id] ?? false
                            HStack(alignment: .top, spacing: 10) {
                                Button {
                                    store.state.checks[s.id] = !checked
                                    store.save()
                                } label: {
                                    Image(systemName: checked ? "checkmark.circle.fill" : "circle")
                                        .font(.title3)
                                        .foregroundColor(checked ? Theme.inkFg(hc) : Theme.mute)
                                }
                                .buttonStyle(.plain)

                                VStack(alignment: .leading, spacing: 3) {
                                    Text(s.t)
                                        .font(Theme.sansBody(large: large).weight(.semibold))
                                        .strikethrough(checked)
                                        .foregroundColor(checked ? Theme.mute : Theme.inkFg(hc))
                                    Text(s.d)
                                        .font(Theme.sansBody(large: large))
                                        .foregroundColor(Theme.ink2Fg(hc))
                                    if let ref = s.ref, !ref.isEmpty, let rt = s.refTab {
                                        Button("↳ \(ref)") { jumpHandler(rt, s.refBlock, nil) }
                                            .font(Theme.monoLabel(large: large))
                                            .foregroundColor(Theme.sky)
                                    }
                                }
                            }
                            Divider()
                        }
                    }
                }
            }
        }
    }

    @ViewBuilder
    private func fieldsCard(title: String, hint: String?, fields: [FieldDef]) -> some View {
        let large = store.state.largeText
        let hc = store.state.highContrast
        let locFields = fields.map { store.localizedField($0) }
        let visible = store.state.readMode
            ? locFields.filter { !(store.state.f[$0.id] ?? "").trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
            : locFields
        if !visible.isEmpty {
            FFGCard(highContrast: hc) {
                Text(title).font(Theme.serifSection(large: large)).foregroundColor(Theme.inkFg(hc))
                if let hint { Text(hint).font(.caption).foregroundColor(Theme.mute) }
                ForEach(visible) { rf in
                    VStack(alignment: .leading, spacing: 3) {
                        Text(rf.label.uppercased()).font(Theme.monoLabel(large: large)).foregroundColor(Theme.ink2Fg(hc))
                        fieldControl(rf, darkBg: false)
                    }
                }
            }
        }
    }

    @ViewBuilder
    private func fieldControl(_ f: FieldDef, darkBg: Bool = false) -> some View {
        let val = store.state.f[f.id] ?? ""
        if store.state.readMode {
            Text(val)
                .textSelection(.enabled)
                .foregroundColor(darkBg ? Theme.paper : Theme.ink)
                .padding(.vertical, 4)
        } else if f.wide {
            TextField(f.placeholder, text: Binding(
                get: { store.state.f[f.id] ?? "" },
                set: { store.state.f[f.id] = $0; store.save() }
            ), axis: .vertical)
            .textFieldStyle(.roundedBorder)
        } else {
            TextField(f.placeholder, text: Binding(
                get: { store.state.f[f.id] ?? "" },
                set: { store.state.f[f.id] = $0; store.save() }
            ))
            .textFieldStyle(.roundedBorder)
        }
    }

    @ViewBuilder
    private func listCard(id: String, title: String, hint: String?, cols: [ColDef], suggestions: [String], suggestCol: String, crisisEditable: Bool) -> some View {
        let rows = store.state.lists[id] ?? []
        let editable = !store.state.readMode || crisisEditable
        let filledRows = rows.enumerated().filter { store.isRowUserEdited(blockId: id, row: $0.element) }

        if editable || !filledRows.isEmpty {
            FFGCard {
                HStack {
                    Text(title).font(.title3.bold()).foregroundColor(Theme.ink)
                    Spacer()
                    if !filledRows.isEmpty {
                        Text("\(filledRows.count) filled")
                            .font(.caption.monospaced())
                            .padding(.horizontal, 8)
                            .padding(.vertical, 2)
                            .background(Theme.paper2)
                            .clipShape(Capsule())
                    }
                }
                if let hint { Text(hint).font(.caption).foregroundColor(Theme.mute) }

                let indices = editable ? Array(rows.indices) : filledRows.map(\.offset)
                ForEach(indices, id: \.self) { idx in
                    VStack(alignment: .leading, spacing: 6) {
                        HStack {
                            Spacer()
                            if editable {
                                Button(role: .destructive) {
                                    store.state.lists[id]?.remove(at: idx)
                                    if store.state.lists[id]?.isEmpty == true && crisisEditable {
                                        store.state.lists[id] = [[:]]
                                    }
                                    store.save()
                                } label: {
                                    Image(systemName: "xmark.circle").foregroundColor(Theme.mute)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        ForEach(cols) { col in
                            let val = store.state.lists[id]?[idx][col.key] ?? ""
                            if editable || !val.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(col.label.uppercased()).font(.caption2.bold()).foregroundColor(Theme.ink2)
                                    if editable {
                                        TextField("", text: Binding(
                                            get: { store.state.lists[id]?[idx][col.key] ?? "" },
                                            set: {
                                                guard store.state.lists[id]?.indices.contains(idx) == true else { return }
                                                store.state.lists[id]?[idx][col.key] = $0
                                                store.save()
                                            }
                                        ))
                                        .textFieldStyle(.roundedBorder)
                                    } else {
                                        Text(val).textSelection(.enabled)
                                    }
                                }
                            }
                        }
                    }
                    .padding(10)
                    .background(Theme.paper)
                    .cornerRadius(6)
                }

                if editable {
                    Button("+ Add a row") {
                        store.state.lists[id, default: []].append([:])
                        store.save()
                    }
                    .buttonStyle(.bordered)
                    .tint(Theme.tomato)

                    if !suggestions.isEmpty && !store.state.readMode {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 6) {
                                ForEach(suggestions, id: \.self) { lbl in
                                    Button("+ \(lbl)") {
                                        store.state.lists[id, default: []].append([suggestCol: lbl])
                                        store.save()
                                    }
                                    .font(.caption)
                                    .buttonStyle(.bordered)
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    private func moneyGuideCard(title: String) -> some View {
        let mg = store.currentRegion.moneyGuide
        return FFGCard {
            Text(title).font(.title3.bold()).foregroundColor(Theme.ink)
            if let mg {
                VStack(alignment: .leading, spacing: 4) {
                    if let cap = mg.depositCap { Text("**Deposit Cap (\(store.currentRegion.label)):** \(cap)") }
                    if let safe = mg.safeCash { Text("**Safe Cash:** \(safe)") }
                    if let fid = mg.fiduciaryName { Text("**Who to Hire:** \(fid)") }
                    if let tax = mg.taxNote { Text("**Tax Note:** \(tax)") }
                }
                .font(.caption)
                .padding(10)
                .background(Color(red: 0.984, green: 0.953, blue: 0.875))
                .cornerRadius(6)

                if let lines = mg.sampleLines, !lines.isEmpty {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(mg.sampleTitle ?? "Sample Allocation").font(.subheadline.bold())
                        ForEach(lines, id: \.self) { l in Text("• \(l)").font(.caption) }
                    }
                    .padding(10)
                    .background(Theme.paper)
                    .cornerRadius(6)
                }
            }
            ForEach(store.data.MONEY_GUIDE) { card in
                guideCardItem(card)
            }
        }
    }

    private func proFinderCard(title: String) -> some View {
        let pf = store.currentRegion.proFinder
        return FFGCard {
            Text(title).font(.title3.bold()).foregroundColor(Theme.ink)
            if let pf {
                VStack(alignment: .leading, spacing: 4) {
                    if let v = pf.legal { Text("**Legal / Estate:** \(v)") }
                    if let v = pf.visa { Text("**Immigration / Visa:** \(v)") }
                    if let v = pf.money { Text("**Financial Advisor:** \(v)") }
                    if let v = pf.tax { Text("**Taxes & Free Aid:** \(v)") }
                }
                .font(.caption)
                .padding(10)
                .background(Color(red: 0.984, green: 0.953, blue: 0.875))
                .cornerRadius(6)
            }
            ForEach(store.data.PRO_FINDER) { card in
                guideCardItem(card)
            }
        }
    }

    private func guideCardItem(_ card: GuideCard) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(card.title).font(.subheadline.bold()).foregroundColor(Theme.ink)
                Spacer()
                Text(card.badge).font(.caption2.monospaced()).foregroundColor(Theme.sky)
            }
            Text(card.summary).font(.caption).foregroundColor(Theme.ink2)
            ForEach(card.bullets, id: \.self) { b in
                Text("• \(b)").font(.caption)
            }
            if let note = card.note {
                Text(note).font(.caption2).padding(8).background(Color(red: 0.906, green: 0.941, blue: 0.949)).cornerRadius(4)
            }
        }
        .padding(10)
        .background(Theme.paper)
        .cornerRadius(6)
    }

    private var scriptsCard: some View {
        let large = store.state.largeText
        let hc = store.state.highContrast
        return FFGCard(highContrast: hc) {
            Text("What to say").font(Theme.serifSection(large: large)).foregroundColor(Theme.inkFg(hc))
            ForEach(store.data.SCRIPTS) { sc in
                VStack(alignment: .leading, spacing: 3) {
                    Text(sc.title.uppercased()).font(Theme.monoLabel(large: large)).foregroundColor(Theme.ink2Fg(hc))
                    Text(sc.body).font(Theme.serifItalic(large: large)).foregroundColor(Theme.inkFg(hc)).textSelection(.enabled)
                }
                .padding(8)
                .background(Theme.paperBg(hc))
                .cornerRadius(6)
            }
        }
    }

    @ViewBuilder
    private var letterCard: some View {
        let val = store.state.f["letter"] ?? ""
        if !store.state.readMode || !val.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            FFGCard(highContrast: store.state.highContrast) {
                Text("A note to you").font(Theme.serifSection(large: store.state.largeText)).foregroundColor(Theme.inkFg(store.state.highContrast))
                fieldControl(FieldDef(id: "letter", label: "From me", placeholder: "I love you. You can do this...", wide: true))
            }
        }
    }

    private var kidsCard: some View {
        FFGCard(highContrast: store.state.highContrast) {
            ForEach(store.data.KIDS) { k in
                let rf = store.localizedField(FieldDef(id: k.id, label: k.label, placeholder: k.placeholder, wide: true))
                VStack(alignment: .leading, spacing: 4) {
                    Text("\(k.emoji) \(rf.label)").font(Theme.serifSection(large: store.state.largeText))
                    fieldControl(rf)
                }
            }
        }
    }
}

public struct CustomTabContentView: View {
    @Bindable var store: GuideStore
    let customTab: CustomTab

    public var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text(customTab.title)
                    .font(Theme.serifTitle(large: store.state.largeText))
                    .foregroundColor(Theme.inkFg(store.state.highContrast))
                Spacer()
                if !store.state.readMode {
                    Button(role: .destructive) {
                        store.deleteCustomSection(customTab.id)
                    } label: {
                        Text("Delete section")
                    }
                    .buttonStyle(.bordered)
                }
            }
            ExtrasSectionView(store: store, tabId: customTab.id, customTitle: "Details")
        }
    }
}

public struct ExtrasSectionView: View {
    @Bindable var store: GuideStore
    let tabId: String
    let customTitle: String

    public var body: some View {
        let items = store.state.extra[tabId] ?? []
        let fields = items.filter { $0.type == "field" }
        let lists = items.filter { $0.type == "list" }

        if !fields.isEmpty {
            FFGCard {
                Text(customTitle).font(.title3.bold()).foregroundColor(Theme.ink)
                ForEach(fields) { x in
                    VStack(alignment: .leading, spacing: 2) {
                        Text((x.label ?? "").uppercased()).font(.caption2.bold()).foregroundColor(Theme.ink2)
                        TextField("", text: Binding(
                            get: { store.state.f[x.id] ?? "" },
                            set: { store.state.f[x.id] = $0; store.save() }
                        ), axis: (x.wide ?? false) ? .vertical : .horizontal)
                        .textFieldStyle(.roundedBorder)
                        .disabled(store.state.readMode)
                    }
                }
            }
        }
        ForEach(lists) { x in
            let rows = store.state.lists[x.id] ?? []
            FFGCard {
                Text(x.title ?? "Table").font(.title3.bold()).foregroundColor(Theme.ink)
                ForEach(Array(rows.indices), id: \.self) { idx in
                    VStack(alignment: .leading, spacing: 4) {
                        ForEach(x.cols ?? []) { col in
                            Text(col.label.uppercased()).font(.caption2.bold()).foregroundColor(Theme.ink2)
                            TextField("", text: Binding(
                                get: { store.state.lists[x.id]?[idx][col.key] ?? "" },
                                set: { store.state.lists[x.id]?[idx][col.key] = $0; store.save() }
                            ))
                            .textFieldStyle(.roundedBorder)
                            .disabled(store.state.readMode)
                        }
                    }
                    .padding(8)
                    .background(Theme.paper)
                    .cornerRadius(6)
                }
                if !store.state.readMode {
                    Button("+ Add a row") {
                        store.state.lists[x.id, default: []].append([:])
                        store.save()
                    }
                    .buttonStyle(.bordered)
                    .tint(Theme.tomato)
                }
            }
        }
    }
}
