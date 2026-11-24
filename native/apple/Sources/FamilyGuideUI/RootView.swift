import FamilyGuideCore
import SwiftUI

public enum ActiveSheet: Identifiable {
    case summary
    case erGrab
    case readiness
    case search
    case backup
    case restore
    case newSection

    public var id: String {
        switch self {
        case .summary: return "summary"
        case .erGrab: return "erGrab"
        case .readiness: return "readiness"
        case .search: return "search"
        case .backup: return "backup"
        case .restore: return "restore"
        case .newSection: return "newSection"
        }
    }
}

public struct RootView: View {
    @Bindable var store: GuideStore
    @Environment(\.scenePhase) private var scenePhase
    @State private var activeSheet: ActiveSheet?
    @State private var scrollTargetId: String?

    public init(store: GuideStore) {
        self.store = store
    }

    public var body: some View {
        Group {
            if store.isBiometricLocked {
                ZStack {
                    Theme.paperBg(store.state.highContrast)
                        .ignoresSafeArea()
                    lockOverlay
                }
            } else {
                mainShell
            }
        }
        .onChange(of: scenePhase) { _, phase in
            if phase != .active && store.biometricLockEnabled {
                store.isBiometricLocked = true
            }
        }
        .onChange(of: store.isBiometricLocked) { _, locked in
            if locked {
                activeSheet = nil
            }
        }
        .sheet(item: $activeSheet) { sheet in
            switch sheet {
            case .summary:
                SummarySheetView(store: store)
            case .erGrab:
                ErGrabSheetView(store: store)
            case .readiness:
                ReadinessSheetView(store: store) { tab, block, act in
                    if act == "backup" {
                        activeSheet = .backup
                    } else if let tab {
                        jumpTo(tab: tab, block: block)
                    }
                }
            case .search:
                SearchSheetView(store: store) { hit in
                    jumpTo(tab: hit.tabId, block: hit.blockKey, track: hit.trackKey)
                }
            case .backup:
                BackupSheetView(store: store)
            case .restore:
                RestoreSheetView(store: store)
            case .newSection:
                NewSectionSheetView(store: store)
            }
        }
        .overlay(alignment: .bottom) {
            if let msg = store.statusToast {
                Text(msg)
                    .font(.caption.bold())
                    .padding(.horizontal, 14)
                    .padding(.vertical, 8)
                    .background(Theme.ink)
                    .foregroundColor(Theme.paper)
                    .clipShape(Capsule())
                    .padding(.bottom, 16)
                    .task(id: msg) {
                        try? await Task.sleep(for: .seconds(2.2))
                        if store.statusToast == msg { store.statusToast = nil }
                    }
            }
        }
    }

    private var mainShell: some View {
        NavigationSplitView {
            List(selection: Binding(
                get: { store.state.tab },
                set: { if let v = $0 { store.state.tab = v; store.save(touch: false) } }
            )) {
                Section {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack(spacing: 10) {
                            BrandLogoView(size: 36)
                            VStack(alignment: .leading, spacing: 2) {
                                Text("OPEN THIS FIRST")
                                    .font(Theme.monoLabel())
                                    .foregroundColor(Theme.tomato)
                                Text("Our Family Field Guide")
                                    .font(Theme.serifSection())
                                    .foregroundColor(Theme.inkFg(store.state.highContrast))
                            }
                        }
                        ProgressView(value: Double(store.completionPercent), total: 100)
                            .tint(Theme.tomato)
                        HStack {
                            Text("\(store.completionPercent)% filled")
                                .font(Theme.monoLabel())
                                .foregroundColor(Theme.ink2Fg(store.state.highContrast))
                            Spacer()
                            Button("Readiness") { activeSheet = .readiness }
                                .font(.caption.bold())
                        }
                    }
                    .padding(.vertical, 4)
                }

                Section("Sections") {
                    ForEach(store.data.TABS) { tab in
                        Label(tab.label, systemImage: iconForTab(tab.id))
                            .tag(tab.id)
                    }
                    ForEach(store.state.customTabs) { ct in
                        Label(ct.label, systemImage: "folder.badge.plus")
                            .tag(ct.id)
                    }
                }

                Section("Quick Tools") {
                    Button { activeSheet = .newSection } label: { Label("Add Section / Template", systemImage: "plus.circle") }
                    Button { activeSheet = .summary } label: { Label("1-Page Summary", systemImage: "doc.plaintext") }
                    Button { activeSheet = .erGrab } label: { Label("1-Page ER Grab Sheet", systemImage: "cross.case") }
                    Button { activeSheet = .backup } label: { Label("Save Locked Backup", systemImage: "lock.doc") }
                    Button { activeSheet = .restore } label: { Label("Open / Merge Backup", systemImage: "arrow.down.doc") }
                }
            }
            .navigationTitle("Field Guide")
        } detail: {
            ScrollViewReader { proxy in
                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        readModeBanner
                        demoBanner
                        if let stdTab = store.data.TABS.first(where: { $0.id == store.state.tab }) {
                            TabContentView(store: store, tab: stdTab, jumpHandler: { t, b, tr in
                                jumpTo(tab: t, block: b, track: tr)
                            })
                        } else if let customTab = store.state.customTabs.first(where: { $0.id == store.state.tab }) {
                            CustomTabContentView(store: store, customTab: customTab)
                        }
                    }
                    .padding(20)
                    .frame(maxWidth: 960, alignment: .leading)
                }
                .background(Theme.paperBg(store.state.highContrast))
                .onChange(of: scrollTargetId) { _, target in
                    if let target {
                        withAnimation { proxy.scrollTo(target, anchor: .center) }
                        scrollTargetId = nil
                    }
                }
            }
            .toolbar {
                ToolbarItemGroup(placement: .automatic) {
                    Picker("Region", selection: Binding(
                        get: { store.state.region },
                        set: { store.state.region = $0; store.save(touch: false) }
                    )) {
                        ForEach(Theme.regionOrder.filter { store.data.REGIONS[$0] != nil }, id: \.self) { k in
                            Text(store.data.REGIONS[k]?.label ?? k).tag(k)
                        }
                    }
                    .frame(maxWidth: 220)

                    Toggle(isOn: Binding(
                        get: { store.state.readMode },
                        set: { store.state.readMode = $0; store.save(touch: false) }
                    )) {
                        Text(store.state.readMode ? "Read Mode" : "Edit Mode")
                    }

                    Toggle(isOn: Binding(
                        get: { store.state.largeText },
                        set: { store.state.largeText = $0; store.save(touch: false) }
                    )) {
                        Text("A+")
                    }

                    Toggle(isOn: Binding(
                        get: { store.state.highContrast },
                        set: { store.state.highContrast = $0; store.save(touch: false) }
                    )) {
                        Text("Contrast")
                    }

                    Button { activeSheet = .search } label: { Label("Search", systemImage: "magnifyingglass") }

                    Button {
                        if store.canEvaluateBiometrics() {
                            store.setBiometricLockEnabled(true)
                            store.isBiometricLocked = true
                        } else {
                            store.statusToast = "Touch ID, Face ID, or device passcode is unavailable on this device."
                        }
                    } label: {
                        Label("Lock", systemImage: "lock.fill")
                    }
                }
            }
        }
    }

    @ViewBuilder
    private var readModeBanner: some View {
        if store.state.readMode {
            HStack {
                Text("Read Mode — showing only filled-in answers so you can't overwrite details by accident.")
                    .font(Theme.sansBody(large: store.state.largeText))
                    .foregroundColor(Theme.inkFg(store.state.highContrast))
                Spacer()
                Button("Back to Edit Mode") {
                    store.state.readMode = false
                    store.save(touch: false)
                }
                .buttonStyle(.bordered)
            }
            .padding(12)
            .background(Theme.infoBg)
            .overlay(alignment: .leading) {
                Rectangle().fill(Theme.sky).frame(width: 4)
            }
            .cornerRadius(8)
        }
    }

    @ViewBuilder
    private var demoBanner: some View {
        if store.state.isDemo {
            HStack {
                Text("Sample family preview (\(store.currentRegion.label)) — explore freely.")
                    .font(Theme.sansBody(large: store.state.largeText))
                Spacer()
                Button("Clear sample & start my guide") { store.clearDemo() }
                    .buttonStyle(.borderedProminent)
                    .tint(Theme.ink)
            }
            .padding(12)
            .background(Theme.demoActiveBg)
            .cornerRadius(8)
        } else if !store.hasAnyContent && !store.state.readMode && !store.state.dismissDemo {
            HStack {
                Text("New here? Preview how a filled guide looks (US + India H-1B or Standard).")
                    .font(Theme.sansBody(large: store.state.largeText))
                Spacer()
                Button("Load sample family") { store.loadDemo() }
                    .buttonStyle(.borderedProminent)
                    .tint(Theme.ink)
                Button("Dismiss") { store.state.dismissDemo = true; store.save(touch: false) }
                    .buttonStyle(.bordered)
            }
            .padding(12)
            .background(Theme.demoIdleBg)
            .cornerRadius(8)
        }
    }

    private var lockOverlay: some View {
        VStack(spacing: 16) {
            BrandLogoView(size: 64)
            Text("Our Family Field Guide is Locked")
                .font(Theme.serifSection(large: store.state.largeText))
                .foregroundColor(Theme.inkFg(store.state.highContrast))
            Button("Unlock with Touch ID / Face ID / Passcode") {
                Task {
                    if await store.authenticateWithBiometrics() {
                        store.isBiometricLocked = false
                    }
                }
            }
            .buttonStyle(.borderedProminent)
            .tint(Theme.ink)
        }
        .padding(32)
        .background(Theme.cardBg(store.state.highContrast))
        .cornerRadius(16)
        .shadow(radius: 12)
    }

    private func jumpTo(tab: String, block: String?, track: String? = nil) {
        if let track, !track.isEmpty, store.data.PLAYBOOK[track] != nil {
            store.state.track = track
        }
        store.state.tab = tab
        store.save(touch: false)
        if let block, !block.isEmpty {
            scrollTargetId = block
        }
    }

    private func iconForTab(_ id: String) -> String {
        switch id {
        case "start": return "star.circle"
        case "contacts": return "person.2"
        case "money": return "banknote"
        case "health": return "heart.text.square"
        case "docs": return "folder"
        case "kids": return "figure.and.child.holdinghands"
        default: return "doc"
        }
    }
}
