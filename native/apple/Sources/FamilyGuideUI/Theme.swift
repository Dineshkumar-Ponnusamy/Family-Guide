import SwiftUI

public enum Theme {
    public static let paper = Color(red: 0.965, green: 0.945, blue: 0.902)
    public static let paper2 = Color(red: 0.937, green: 0.906, blue: 0.839)
    public static let card = Color(red: 1.0, green: 0.992, blue: 0.973)
    public static let ink = Color(red: 0.122, green: 0.227, blue: 0.180)
    public static let ink2 = Color(red: 0.294, green: 0.373, blue: 0.333)
    public static let mute = Color(red: 0.541, green: 0.561, blue: 0.518)
    public static let rule = Color(red: 0.851, green: 0.812, blue: 0.725)
    public static let tomato = Color(red: 0.824, green: 0.318, blue: 0.184)
    public static let sun = Color(red: 0.914, green: 0.706, blue: 0.298)
    public static let sky = Color(red: 0.310, green: 0.486, blue: 0.541)
}

public struct FFGCard<Content: View>: View {
    let highlightTomato: Bool
    @ViewBuilder let content: () -> Content

    public init(highlightTomato: Bool = false, @ViewBuilder content: @escaping () -> Content) {
        self.highlightTomato = highlightTomato
        self.content = content
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            content()
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(highlightTomato ? Color(red: 1.0, green: 0.961, blue: 0.949) : Theme.card)
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(highlightTomato ? Theme.tomato : Theme.rule, lineWidth: highlightTomato ? 2 : 1)
        )
        .cornerRadius(8)
    }
}
