import FamilyGuideCore
import FamilyGuideUI
import SwiftUI

/// Drop this entry file into an Xcode iOS App target linked against
/// the local `native/apple` Swift Package (`FamilyGuideCore` + `FamilyGuideUI`).
@main
struct FamilyGuideiOSApp: App {
    @State private var store: GuideStore

    init() {
        do {
            _store = State(initialValue: try GuideStore())
        } catch {
            fatalError("Failed to initialize GuideStore: \(error)")
        }
    }

    var body: some Scene {
        WindowGroup {
            RootView(store: store)
        }
    }
}
