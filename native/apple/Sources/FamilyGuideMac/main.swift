import FamilyGuideCore
import FamilyGuideUI
import SwiftUI

@main
struct FamilyGuideMacApp: App {
    @State private var store: GuideStore

    init() {
        do {
            _store = State(initialValue: try GuideStore())
        } catch {
            fatalError("Failed to initialize GuideStore: \(error)")
        }
    }

    var body: some Scene {
        WindowGroup("Our Family Field Guide") {
            RootView(store: store)
                .frame(minWidth: 880, minHeight: 620)
        }
    }
}
