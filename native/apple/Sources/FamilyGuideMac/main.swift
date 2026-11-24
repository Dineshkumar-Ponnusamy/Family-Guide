import Darwin
import FamilyGuideCore
import FamilyGuideUI
import Foundation
import SwiftUI

@main
struct FamilyGuideMacApp: App {
    @State private var store: GuideStore

    init() {
        if CommandLine.arguments.contains("--smoke-test") {
            Self.runSmokeTestAndExit()
        }
        do {
            _store = State(initialValue: try GuideStore())
        } catch {
            fatalError("Failed to initialize GuideStore: \(error)")
        }
    }

    private static func runSmokeTestAndExit() -> Never {
        let fm = FileManager.default
        let tmp = fm.temporaryDirectory.appendingPathComponent("ffg-mac-smoke-\(UUID().uuidString)", isDirectory: true)
        defer { try? fm.removeItem(at: tmp) }
        do {
            let store = try GuideStore(storageDirectory: tmp)
            guard store.data.TABS.count == 6,
                  store.data.REGIONS.count == 9,
                  store.data.PLAYBOOK.count == 7 else {
                fputs("MAC_APP_SMOKE_TEST_FAILED: unexpected schema counts\n", stderr)
                Darwin.exit(1)
            }
            store.loadDemo()
            guard !store.computeAudit().isEmpty else {
                fputs("MAC_APP_SMOKE_TEST_FAILED: empty readiness audit\n", stderr)
                Darwin.exit(1)
            }
            let pw = "amber-cedar-lantern-orbit-river"
            let pkg = try CryptoEngine.encrypt(state: store.state, passphrase: pw)
            let decoded = try CryptoEngine.decrypt(package: pkg, passphrase: pw)
            guard decoded.isDemo else {
                fputs("MAC_APP_SMOKE_TEST_FAILED: decrypted state mismatch\n", stderr)
                Darwin.exit(1)
            }
            let v1 = "FFG-1-39F9-5E0D-03F8-66D0-86D0-D9C2-0FA9-4188-E876-6689-C6CF-BF9E-BAB4-368E-BEAC-AF"
            let v2 = "FFG-2-D15E-1AB5-909C-6914-BB18-3FE8-AAEA-3097-647A-7E7E-2613-C39C-F304-FABC-FDEC-D3"
            guard try CryptoEngine.sssCombine2of3(v1, v2) == pw,
                  !store.exportExecutiveSummaryText().isEmpty else {
                fputs("MAC_APP_SMOKE_TEST_FAILED: shamir or summary check failed\n", stderr)
                Darwin.exit(1)
            }
            print("MAC_APP_SMOKE_TEST_PASSED")
            fflush(stdout)
            Darwin.exit(0)
        } catch {
            fputs("MAC_APP_SMOKE_TEST_FAILED: \(error)\n", stderr)
            Darwin.exit(1)
        }
    }

    var body: some Scene {
        WindowGroup("Our Family Field Guide") {
            RootView(store: store)
                .frame(minWidth: 880, minHeight: 620)
        }
    }
}
