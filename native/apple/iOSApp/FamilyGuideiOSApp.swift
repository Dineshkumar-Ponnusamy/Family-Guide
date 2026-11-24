import FamilyGuideCore
import FamilyGuideUI
import SwiftUI

/// Drop this entry file into an Xcode iOS App target linked against
/// the local `native/apple` Swift Package (`FamilyGuideCore` + `FamilyGuideUI`).
@main
struct FamilyGuideiOSApp: App {
    @State private var store: GuideStore?
    @State private var initError: String?

    init() {
        do {
            _store = State(initialValue: try GuideStore())
            _initError = State(initialValue: nil)
        } catch {
            _store = State(initialValue: nil)
            _initError = State(initialValue: error.localizedDescription)
        }
    }

    var body: some Scene {
        WindowGroup {
            if let store {
                RootView(store: store)
            } else {
                ContentUnavailableView(
                    "Unable to Open Field Guide",
                    systemImage: "exclamationmark.triangle",
                    description: Text(initError ?? "Missing guide data resources.")
                )
            }
        }
    }
}
