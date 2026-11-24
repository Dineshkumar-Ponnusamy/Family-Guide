@testable import FamilyGuideCore
@testable import FamilyGuideUI
import SwiftUI
import XCTest

@MainActor
final class FamilyGuideUITests: XCTestCase {
    func testCanonicalOrderingCoversAllRegionsAndPlaybooks() throws {
        let dir = FileManager.default.temporaryDirectory.appendingPathComponent("ffg-ui-test-\(UUID().uuidString)", isDirectory: true)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let store = try GuideStore(storageDirectory: dir)
        XCTAssertEqual(Theme.regionOrder.count, 9)
        XCTAssertEqual(Set(Theme.regionOrder), Set(store.data.REGIONS.keys))
        XCTAssertEqual(Theme.playbookOrder.count, 7)
        XCTAssertEqual(Set(Theme.playbookOrder), Set(store.data.PLAYBOOK.keys))
    }

    func testThemeHelpersAndBrandLogoInstantiate() {
        _ = Theme.paperBg(false)
        _ = Theme.paperBg(true)
        _ = Theme.cardBg(true)
        _ = Theme.inkFg(true)
        _ = Theme.ruleStroke(true)
        _ = Theme.serifTitle(large: true)
        _ = Theme.serifSection(large: true)
        _ = Theme.serifItalic(large: true)
        _ = Theme.monoLabel(large: true)
        let logo = BrandLogoView(size: 40)
        XCTAssertEqual(logo.size, 40)
    }
}
