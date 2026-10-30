import Foundation
import AVFoundation
import CoreLocation

final class AudioAlertManager: NSObject, AVSpeechSynthesizerDelegate {
    private let synthesizer = AVSpeechSynthesizer()
    private var lastAnnouncedDistance: CLLocationDistance = .infinity
    private let announcementThreshold: CLLocationDistance = 100

    override init() {
        super.init()
        synthesizer.delegate = self
        // Set category only — do NOT activate session yet.
        // Activating here causes permanent ducking of music even when silent.
        try? AVAudioSession.sharedInstance().setCategory(
            .playback,
            mode: .spokenAudio,
            options: [.duckOthers, .mixWithOthers]
        )
    }

    // MARK: - Public API

    func announce(distance: CLLocationDistance, speedLimit: Int?) {
        guard shouldAnnounce(distance: distance) else { return }
        lastAnnouncedDistance = distance
        let meters = Int(distance.rounded(.toNearestOrAwayFromZero))
        var text = "Radar en \(meters) metros"
        if let limit = speedLimit { text += ", límite \(limit)" }
        speak(text)
    }

    func stop() {
        synthesizer.stopSpeaking(at: .immediate)
        lastAnnouncedDistance = .infinity
        deactivateSession()
    }

    // MARK: - AVSpeechSynthesizerDelegate

    func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance) {
        deactivateSession()  // restores music volume immediately after speaking
    }

    // MARK: - Private

    private func shouldAnnounce(distance: CLLocationDistance) -> Bool {
        let delta = lastAnnouncedDistance - distance
        return delta > announcementThreshold || lastAnnouncedDistance == .infinity
    }

    private func speak(_ text: String) {
        synthesizer.stopSpeaking(at: .word)
        // Activate only when about to speak — music ducks just for this announcement
        try? AVAudioSession.sharedInstance().setActive(true)
        let utterance = AVSpeechUtterance(string: text)
        utterance.voice = AVSpeechSynthesisVoice(language: "es-ES")
        utterance.rate = AVSpeechUtteranceDefaultSpeechRate
        utterance.volume = 0.9
        synthesizer.speak(utterance)
    }

    private func deactivateSession() {
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    }
}
