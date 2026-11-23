import Foundation

// MARK: - Schema & Localized Content (Decoded from shared/guide-data.json)

public struct GuideData: Codable, Sendable {
    public let TABS: [TabDef]
    public let PLAYBOOK: [String: PlaybookDef]
    public let SCRIPTS: [ScriptItem]
    public let MONEY_GUIDE: [GuideCard]
    public let PRO_FINDER: [GuideCard]
    public let GLANCE: [GlanceItem]
    public let KIDS: [KidsItem]
    public let ESSENTIALS: [EssentialItem]
    public let SECTION_TEMPLATES: [SectionTemplate]
    public let FIRE_DRILL: [FireDrillItem]
    public let REGIONS: [String: RegionPreset]
    public let DEMO_FAMILIES: [String: DemoFamily]
    public let DICE_WORDS: [String]
}

public struct TabDef: Codable, Sendable, Identifiable {
    public let id: String
    public let label: String
    public let title: String
    public let lede: String
    public let blocks: [BlockDef]
}

public struct BlockDef: Codable, Sendable, Identifiable {
    public let type: String
    public let id: String?
    public let title: String?
    public let hint: String?
    public let crisisEditable: Bool?
    public let fields: [FieldDef]?
    public let cols: [ColDef]?
    public let seed: [[String: String]]?
    public let suggestCol: String?
    public let suggestions: [String]?

    public var stableId: String {
        id ?? title ?? type
    }
}

public struct FieldDef: Codable, Sendable, Identifiable {
    public let id: String
    public let label: String
    public let placeholder: String
    public let wide: Bool

    public init(id: String, label: String, placeholder: String = "", wide: Bool = false) {
        self.id = id
        self.label = label
        self.placeholder = placeholder
        self.wide = wide
    }

    public init(from decoder: Decoder) throws {
        var c = try decoder.unkeyedContainer()
        id = try c.decode(String.self)
        label = try c.decode(String.self)
        placeholder = (try? c.decode(String.self)) ?? ""
        wide = (try? c.decode(Bool.self)) ?? false
    }

    public func encode(to encoder: Encoder) throws {
        var c = encoder.unkeyedContainer()
        try c.encode(id)
        try c.encode(label)
        try c.encode(placeholder)
        try c.encode(wide)
    }
}

public struct ColDef: Codable, Sendable, Identifiable, Equatable {
    public let key: String
    public let label: String
    public var id: String { key }

    public init(key: String, label: String) {
        self.key = key
        self.label = label
    }

    public init(from decoder: Decoder) throws {
        var c = try decoder.unkeyedContainer()
        key = try c.decode(String.self)
        label = try c.decode(String.self)
    }

    public func encode(to encoder: Encoder) throws {
        var c = encoder.unkeyedContainer()
        try c.encode(key)
        try c.encode(label)
    }
}

public struct PlaybookDef: Codable, Sendable {
    public let label: String
    public let phases: [PlaybookPhase]
}

public struct PlaybookPhase: Codable, Sendable, Identifiable {
    public let when: String
    public let steps: [PlaybookStep]
    public var id: String { when }
}

public struct PlaybookStep: Codable, Sendable, Identifiable {
    public let id: String
    public let t: String
    public let d: String
    public let ref: String?
    public let refTab: String?
    public let refBlock: String?
}

public struct ScriptItem: Codable, Sendable, Identifiable {
    public let title: String
    public let body: String
    public var id: String { title }

    public init(from decoder: Decoder) throws {
        var c = try decoder.unkeyedContainer()
        title = try c.decode(String.self)
        body = try c.decode(String.self)
    }

    public func encode(to encoder: Encoder) throws {
        var c = encoder.unkeyedContainer()
        try c.encode(title)
        try c.encode(body)
    }
}

public struct GuideCard: Codable, Sendable, Identifiable {
    public let id: String
    public let title: String
    public let badge: String
    public let summary: String
    public let bullets: [String]
    public let note: String?
}

public struct GlanceItem: Codable, Sendable, Identifiable {
    public let id: String
    public let label: String
    public let placeholder: String

    public init(from decoder: Decoder) throws {
        var c = try decoder.unkeyedContainer()
        id = try c.decode(String.self)
        label = try c.decode(String.self)
        placeholder = (try? c.decode(String.self)) ?? ""
    }

    public func encode(to encoder: Encoder) throws {
        var c = encoder.unkeyedContainer()
        try c.encode(id)
        try c.encode(label)
        try c.encode(placeholder)
    }
}

public struct KidsItem: Codable, Sendable, Identifiable {
    public let id: String
    public let emoji: String
    public let label: String
    public let placeholder: String

    public init(from decoder: Decoder) throws {
        var c = try decoder.unkeyedContainer()
        id = try c.decode(String.self)
        emoji = try c.decode(String.self)
        label = try c.decode(String.self)
        placeholder = (try? c.decode(String.self)) ?? ""
    }

    public func encode(to encoder: Encoder) throws {
        var c = encoder.unkeyedContainer()
        try c.encode(id)
        try c.encode(emoji)
        try c.encode(label)
        try c.encode(placeholder)
    }
}

public struct EssentialItem: Codable, Sendable, Identifiable {
    public let id: String
    public let type: String
    public let label: String
    public let tab: String
    public let block: String
}

public struct SectionTemplate: Codable, Sendable, Identifiable {
    public let name: String
    public let desc: String
    public let fields: [TemplateField]
    public let lists: [TemplateList]
    public var id: String { name }
}

public struct TemplateField: Codable, Sendable {
    public let label: String
    public let wide: Bool
}

public struct TemplateList: Codable, Sendable {
    public let title: String
    public let cols: [String]
}

public struct FireDrillItem: Codable, Sendable, Identifiable {
    public let id: String
    public let t: String
    public let d: String
}

public struct RegionPreset: Codable, Sendable {
    public let label: String
    public let emergency: String
    public let currency: String
    public let crossBorder: Bool
    public let indiaNotes: Bool
    public let moneyGuide: RegionMoneyGuide?
    public let proFinder: RegionProFinder?
    public let fieldOverrides: [String: FieldOverride]?
    public let listOverrides: [String: ListOverride]?
    public let stepOverrides: [String: StepOverride]?
}

public struct RegionMoneyGuide: Codable, Sendable {
    public let depositCap: String?
    public let taxNote: String?
    public let fiduciaryName: String?
    public let safeCash: String?
    public let sampleTitle: String?
    public let sampleLines: [String]?
}

public struct RegionProFinder: Codable, Sendable {
    public let legal: String?
    public let visa: String?
    public let money: String?
    public let tax: String?
}

public struct FieldOverride: Codable, Sendable {
    public let label: String?
    public let ph: String?
}

public struct ListOverride: Codable, Sendable {
    public let hint: String?
    public let colLabels: [String: String]?
    public let extraSuggestions: [String]?
}

public struct StepOverride: Codable, Sendable {
    public let t: String?
    public let d: String?
}

public struct DemoFamily: Codable, Sendable {
    public let track: String?
    public let f: [String: String]?
    public let lists: [String: [[String: String]]]?
    public let customTabs: [CustomTab]?
    public let extra: [String: [ExtraItem]]?
    public let f_extra_patch: [String: String]?
}

// MARK: - User State (`familyFieldGuide.v1`)

public struct CustomTab: Codable, Sendable, Identifiable, Equatable {
    public var id: String
    public var label: String
    public var title: String

    public init(id: String, label: String, title: String) {
        self.id = id
        self.label = label
        self.title = title
    }
}

public struct ExtraItem: Codable, Sendable, Identifiable, Equatable {
    public var type: String
    public var id: String
    public var label: String?
    public var title: String?
    public var wide: Bool?
    public var cols: [ColDef]?

    public init(type: String, id: String, label: String? = nil, title: String? = nil, wide: Bool? = nil, cols: [ColDef]? = nil) {
        self.type = type
        self.id = id
        self.label = label
        self.title = title
        self.wide = wide
        self.cols = cols
    }
}

public struct PhotoSnippet: Codable, Sendable, Identifiable, Equatable {
    public var id: String
    public var label: String
    public var dataUrl: String

    public init(id: String, label: String, dataUrl: String) {
        self.id = id
        self.label = label
        self.dataUrl = dataUrl
    }
}

public struct GuideState: Codable, Sendable {
    public var f: [String: String]
    public var lists: [String: [[String: String]]]
    public var checks: [String: Bool]
    public var track: String
    public var tab: String
    public var region: String
    public var isDemo: Bool
    public var dismissDemo: Bool
    public var readMode: Bool
    public var hideEssentials: Bool
    public var largeText: Bool
    public var highContrast: Bool
    public var customTabs: [CustomTab]
    public var extra: [String: [ExtraItem]]
    public var fireDrill: [String: Bool]
    public var photos: [PhotoSnippet]
    public var lastDryRun: String?
    public var updated: String?
    public var reviewed: String?
    public var lastBackup: String?

    public init() {
        self.f = [:]
        self.lists = [:]
        self.checks = [:]
        self.track = "hurt"
        self.tab = "start"
        self.region = "us"
        self.isDemo = false
        self.dismissDemo = false
        self.readMode = false
        self.hideEssentials = false
        self.largeText = false
        self.highContrast = false
        self.customTabs = []
        self.extra = [:]
        self.fireDrill = [:]
        self.photos = []
        self.lastDryRun = nil
        self.updated = nil
        self.reviewed = nil
        self.lastBackup = nil
    }

    enum CodingKeys: String, CodingKey {
        case f, lists, checks, track, tab, region, isDemo, dismissDemo, readMode,
             hideEssentials, largeText, highContrast, customTabs, extra, fireDrill,
             photos, lastDryRun, updated, reviewed, lastBackup
    }

    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        f = (try? c.decode([String: String].self, forKey: .f)) ?? [:]
        lists = (try? c.decode([String: [[String: String]]].self, forKey: .lists)) ?? [:]
        checks = (try? c.decode([String: Bool].self, forKey: .checks)) ?? [:]
        track = (try? c.decode(String.self, forKey: .track)) ?? "hurt"
        tab = (try? c.decode(String.self, forKey: .tab)) ?? "start"
        region = (try? c.decode(String.self, forKey: .region)) ?? "us"
        isDemo = (try? c.decode(Bool.self, forKey: .isDemo)) ?? false
        dismissDemo = (try? c.decode(Bool.self, forKey: .dismissDemo)) ?? false
        readMode = (try? c.decode(Bool.self, forKey: .readMode)) ?? false
        hideEssentials = (try? c.decode(Bool.self, forKey: .hideEssentials)) ?? false
        largeText = (try? c.decode(Bool.self, forKey: .largeText)) ?? false
        highContrast = (try? c.decode(Bool.self, forKey: .highContrast)) ?? false
        customTabs = (try? c.decode([CustomTab].self, forKey: .customTabs)) ?? []
        extra = (try? c.decode([String: [ExtraItem]].self, forKey: .extra)) ?? [:]
        fireDrill = (try? c.decode([String: Bool].self, forKey: .fireDrill)) ?? [:]
        photos = (try? c.decode([PhotoSnippet].self, forKey: .photos)) ?? []
        lastDryRun = try? c.decodeIfPresent(String.self, forKey: .lastDryRun)
        updated = try? c.decodeIfPresent(String.self, forKey: .updated)
        reviewed = try? c.decodeIfPresent(String.self, forKey: .reviewed)
        lastBackup = try? c.decodeIfPresent(String.self, forKey: .lastBackup)
    }
}

// MARK: - Interoperable Backup, Audit, Merge & Search Models

public struct EncryptedBackupPackage: Codable, Sendable {
    public let app: String
    public let v: Int
    public let salt: String
    public let iv: String
    public let data: String

    public init(app: String = "family-field-guide", v: Int = 1, salt: String, iv: String, data: String) {
        self.app = app
        self.v = v
        self.salt = salt
        self.iv = iv
        self.data = data
    }
}

public enum AuditSeverity: String, Sendable, Comparable {
    case high, med, ok
    private var rank: Int { self == .high ? 0 : (self == .med ? 1 : 2) }
    public static func < (lhs: AuditSeverity, rhs: AuditSeverity) -> Bool { lhs.rank < rhs.rank }
}

public struct AuditItem: Identifiable, Sendable {
    public let id: String
    public let sev: AuditSeverity
    public let title: String
    public let detail: String
    public let tab: String?
    public let block: String?
    public let field: String?
    public let act: String?

    public init(id: String, sev: AuditSeverity, title: String, detail: String, tab: String? = nil, block: String? = nil, field: String? = nil, act: String? = nil) {
        self.id = id
        self.sev = sev
        self.title = title
        self.detail = detail
        self.tab = tab
        self.block = block
        self.field = field
        self.act = act
    }
}

public struct MergeConflict: Sendable, Identifiable {
    public let id: String
    public let label: String
}

public struct MergePlan: Sendable {
    public let newFields: Int
    public let conflictFields: [MergeConflict]
    public let newTabs: Int
    public let newExtras: Int
    public let newRows: Int
    public let newChecks: Int
}

public struct SearchHit: Identifiable, Sendable {
    public let id = UUID()
    public let tabId: String
    public let tabLabel: String
    public let title: String
    public let sub: String
    public let blockKey: String
    public let fieldId: String
    public let trackKey: String
}
