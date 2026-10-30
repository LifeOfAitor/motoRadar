import Foundation

enum AlertMode: String, CaseIterable, Identifiable {
    case haptic, audio, both
    var id: String { rawValue }
    var label: String {
        switch self {
        case .haptic: return "Haptic"
        case .audio:  return "Audio"
        case .both:   return "Haptic + Audio"
        }
    }
}

final class SettingsManager: ObservableObject {
    static let shared = SettingsManager()

    private let defaults = UserDefaults.standard

    @Published var alertMode: AlertMode {
        didSet { defaults.set(alertMode.rawValue, forKey: "alertMode") }
    }
    @Published var alertRadius: Int {
        didSet { defaults.set(alertRadius, forKey: "alertRadius") }
    }
    @Published var directionFilterEnabled: Bool {
        didSet { defaults.set(directionFilterEnabled, forKey: "directionFilterEnabled") }
    }
    // 0.3 (subtle) … 1.0 (maximum)
    @Published var hapticIntensity: Double {
        didSet { defaults.set(hapticIntensity, forKey: "hapticIntensity") }
    }
    @Published var isMuted: Bool {
        didSet { defaults.set(isMuted, forKey: "isMuted") }
    }

    private init() {
        let d = UserDefaults.standard
        alertMode              = AlertMode(rawValue: d.string(forKey: "alertMode") ?? "") ?? .haptic
        alertRadius            = d.integer(forKey: "alertRadius").nonZero ?? 500
        directionFilterEnabled = d.bool(forKey: "directionFilterEnabled")
        let stored             = d.double(forKey: "hapticIntensity")
        hapticIntensity        = stored == 0 ? 1.0 : stored
        isMuted                = d.bool(forKey: "isMuted")
    }
}

private extension Int {
    var nonZero: Int? { self == 0 ? nil : self }
}
