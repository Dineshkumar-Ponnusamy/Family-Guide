// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "FamilyFieldGuide",
    platforms: [
        .macOS(.v14),
        .iOS(.v17)
    ],
    products: [
        .library(name: "FamilyGuideCore", targets: ["FamilyGuideCore"]),
        .library(name: "FamilyGuideUI", targets: ["FamilyGuideUI"]),
        .executable(name: "FamilyGuideMac", targets: ["FamilyGuideMac"])
    ],
    dependencies: [],
    targets: [
        .target(
            name: "FamilyGuideCore",
            dependencies: [],
            resources: [
                .copy("Resources/guide-data.json")
            ]
        ),
        .target(
            name: "FamilyGuideUI",
            dependencies: ["FamilyGuideCore"]
        ),
        .executableTarget(
            name: "FamilyGuideMac",
            dependencies: ["FamilyGuideCore", "FamilyGuideUI"]
        ),
        .testTarget(
            name: "FamilyGuideCoreTests",
            dependencies: ["FamilyGuideCore"]
        )
    ]
)
