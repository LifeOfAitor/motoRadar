import UIKit
import CoreLocation

final class HapticManager {
    private var timer: Timer?
    private let heavy  = UIImpactFeedbackGenerator(style: .heavy)
    private let medium = UIImpactFeedbackGenerator(style: .medium)
    private let light  = UIImpactFeedbackGenerator(style: .light)

    init() {
        heavy.prepare()
        medium.prepare()
        light.prepare()
    }

    func trigger(forDistance distance: CLLocationDistance, multiplier: Double = 1.0) {
        let params = HapticParams(distance: distance)
        guard params.interval > 0 else { stop(); return }

        stop()  // always restart clean — no caching that could block firing

        fire(params: params, multiplier: multiplier)

        // Use .common so the timer fires even during map scroll / UI interaction
        timer = Timer(timeInterval: params.interval, repeats: true) { [weak self] _ in
            self?.fire(params: params, multiplier: multiplier)
        }
        RunLoop.main.add(timer!, forMode: .common)
    }

    func stop() {
        timer?.invalidate()
        timer = nil
    }

    // MARK: - Private

    private func fire(params: HapticParams, multiplier: Double) {
        let intensity = CGFloat(min(params.intensity * multiplier, 1.0))
        switch params.generator {
        case .heavy:  heavy.impactOccurred(intensity: intensity);  heavy.prepare()
        case .medium: medium.impactOccurred(intensity: intensity); medium.prepare()
        case .light:  light.impactOccurred(intensity: intensity);  light.prepare()
        }
    }
}

// MARK: - Distance → haptic mapping

private enum GeneratorStyle { case heavy, medium, light }

private struct HapticParams {
    let intensity: Double
    let interval: TimeInterval
    let generator: GeneratorStyle

    init(distance: CLLocationDistance) {
        switch distance {
        case ..<50:      (intensity, interval, generator) = (1.0, 0.25, .heavy)
        case 50..<150:   (intensity, interval, generator) = (1.0, 0.5,  .heavy)
        case 150..<300:  (intensity, interval, generator) = (0.8, 1.0,  .medium)
        case 300..<500:  (intensity, interval, generator) = (0.6, 2.0,  .light)
        default:         (intensity, interval, generator) = (0.0, 0,    .light)
        }
    }
}
