import SwiftUI

public enum Theme {
    // Canonical Palette (#F6F1E6, #EFE7D6, #FFFDF8, #1F3A2E, #4B5F55, #5D6359, #D9CFB9, #D2512F, #B3381A, #E9B44C, #4F7C8A)
    public static let paper = Color(red: 0xF6 / 255.0, green: 0xF1 / 255.0, blue: 0xE6 / 255.0)
    public static let paper2 = Color(red: 0xEF / 255.0, green: 0xE7 / 255.0, blue: 0xD6 / 255.0)
    public static let card = Color(red: 1.0, green: 0xFD / 255.0, blue: 0xF8 / 255.0)
    public static let ink = Color(red: 0x1F / 255.0, green: 0x3A / 255.0, blue: 0x2E / 255.0)
    public static let ink2 = Color(red: 0x4B / 255.0, green: 0x5F / 255.0, blue: 0x55 / 255.0)
    public static let mute = Color(red: 0x5D / 255.0, green: 0x63 / 255.0, blue: 0x59 / 255.0)
    public static let rule = Color(red: 0xD9 / 255.0, green: 0xCF / 255.0, blue: 0xB9 / 255.0)
    public static let tomato = Color(red: 0xD2 / 255.0, green: 0x51 / 255.0, blue: 0x2F / 255.0)
    public static let tomatoInk = Color(red: 0xB3 / 255.0, green: 0x38 / 255.0, blue: 0x1A / 255.0)
    public static let sun = Color(red: 0xE9 / 255.0, green: 0xB4 / 255.0, blue: 0x4C / 255.0)
    public static let sky = Color(red: 0x4F / 255.0, green: 0x7C / 255.0, blue: 0x8A / 255.0)

    public static let alertBg = Color(red: 1.0, green: 0xF5 / 255.0, blue: 0xF2 / 255.0)
    public static let warnBg = Color(red: 0xFB / 255.0, green: 0xF3 / 255.0, blue: 0xDF / 255.0)
    public static let infoBg = Color(red: 0xE7 / 255.0, green: 0xF0 / 255.0, blue: 0xF2 / 255.0)
    public static let demoIdleBg = Color(red: 0xEE / 255.0, green: 0xF5 / 255.0, blue: 0xEE / 255.0)
    public static let demoActiveBg = Color(red: 1.0, green: 0xF3 / 255.0, blue: 0xDD / 255.0)
    public static let okGreen = Color(red: 0x2E / 255.0, green: 0x6F / 255.0, blue: 0x5E / 255.0)

    public static let hcPaper = Color.white
    public static let hcInk = Color(red: 0x0B / 255.0, green: 0x14 / 255.0, blue: 0x10 / 255.0)
    public static let hcRule = Color(red: 0x33 / 255.0, green: 0x33 / 255.0, blue: 0x33 / 255.0)

    public static func paperBg(_ hc: Bool) -> Color { hc ? hcPaper : paper }
    public static func cardBg(_ hc: Bool) -> Color { hc ? hcPaper : card }
    public static func inkFg(_ hc: Bool) -> Color { hc ? hcInk : ink }
    public static func ink2Fg(_ hc: Bool) -> Color { hc ? hcInk : ink2 }
    public static func ruleStroke(_ hc: Bool) -> Color { hc ? hcRule : rule }

    // Canonical Ordering Matching Web `regions.js` and `schema.js`
    public static let regionOrder = ["us", "us_in", "in", "visa_intl", "uk", "ca", "au", "eu", "generic"]
    public static let playbookOrder = ["hurt", "illness", "gone", "windfall", "money", "caregiver", "visa"]

    // Editorial Typography Helpers (.serif / .default / .monospaced)
    public static func serifTitle(large: Bool = false) -> Font {
        .system(size: large ? 32 : 28, weight: .bold, design: .serif)
    }
    public static func serifSection(large: Bool = false) -> Font {
        .system(size: large ? 22 : 19, weight: .semibold, design: .serif)
    }
    public static func serifItalic(large: Bool = false) -> Font {
        .system(size: large ? 19 : 16, weight: .medium, design: .serif).italic()
    }
    public static func sansBody(large: Bool = false) -> Font {
        .system(size: large ? 17 : 14.5, weight: .regular, design: .default)
    }
    public static func monoLabel(large: Bool = false) -> Font {
        .system(size: large ? 12.5 : 11, weight: .semibold, design: .monospaced)
    }
}

/// Vector SwiftUI recreation of root `icon.svg` (rounded `#F6F1E6` badge, `#1F3A2E` border, `#FFFDF8` house, `#D2512F` heart).
public struct BrandLogoView: View {
    public let size: CGFloat

    public init(size: CGFloat = 36) {
        self.size = size
    }

    public var body: some View {
        Canvas { ctx, sz in
            let s = min(sz.width, sz.height) / 128.0
            ctx.scaleBy(x: s, y: s)

            let outer = Path(roundedRect: CGRect(x: 0, y: 0, width: 128, height: 128), cornerRadius: 28)
            ctx.fill(outer, with: .color(Theme.paper))

            let frame = Path(roundedRect: CGRect(x: 8, y: 8, width: 112, height: 112), cornerRadius: 22)
            ctx.stroke(frame, with: .color(Theme.ink), lineWidth: 6)

            var house = Path()
            house.move(to: CGPoint(x: 64, y: 26))
            house.addLine(to: CGPoint(x: 28, y: 54))
            house.addLine(to: CGPoint(x: 28, y: 98))
            house.addLine(to: CGPoint(x: 100, y: 98))
            house.addLine(to: CGPoint(x: 100, y: 54))
            house.closeSubpath()
            ctx.fill(house, with: .color(Theme.card))
            ctx.stroke(house, with: .color(Theme.ink), style: StrokeStyle(lineWidth: 5, lineJoin: .round))

            var heart = Path()
            heart.move(to: CGPoint(x: 64, y: 84))
            heart.addCurve(to: CGPoint(x: 46, y: 62), control1: CGPoint(x: 53, y: 76.5), control2: CGPoint(x: 46, y: 70))
            heart.addArc(center: CGPoint(x: 55, y: 62), radius: 9, startAngle: .degrees(180), endAngle: .degrees(0), clockwise: false)
            heart.addArc(center: CGPoint(x: 73, y: 62), radius: 9, startAngle: .degrees(180), endAngle: .degrees(0), clockwise: false)
            heart.addCurve(to: CGPoint(x: 64, y: 84), control1: CGPoint(x: 82, y: 70), control2: CGPoint(x: 75, y: 76.5))
            heart.closeSubpath()
            ctx.fill(heart, with: .color(Theme.tomato))
        }
        .frame(width: size, height: size)
        .accessibilityHidden(true)
    }
}

public struct FFGCard<Content: View>: View {
    let highlightTomato: Bool
    let highContrast: Bool
    @ViewBuilder let content: () -> Content

    public init(highlightTomato: Bool = false, highContrast: Bool = false, @ViewBuilder content: @escaping () -> Content) {
        self.highlightTomato = highlightTomato
        self.highContrast = highContrast
        self.content = content
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            content()
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(highlightTomato ? Theme.alertBg : Theme.cardBg(highContrast))
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(highlightTomato ? Theme.tomato : Theme.ruleStroke(highContrast), lineWidth: (highlightTomato || highContrast) ? 2 : 1)
        )
        .cornerRadius(8)
    }
}
