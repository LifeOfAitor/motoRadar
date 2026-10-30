import Foundation
import Combine
import CoreLocation
import SwiftData

@MainActor
final class RadarEngine: ObservableObject {
    @Published private(set) var nearestRadar: Radar?
    @Published private(set) var distanceToNearest: CLLocationDistance = .infinity
    @Published private(set) var isAlertActive: Bool = false
    @Published private(set) var radarCount: Int = 0
    @Published private(set) var isRefreshing: Bool = false
    @Published private(set) var nearbyRadars: [Radar] = []   // for map display (2 km radius)

    let locationManager: LocationManager
    private let radarStore: RadarStore
    private let hapticManager: HapticManager
    private let audioManager: AudioAlertManager
    private let overpassService: OverpassService
    private let settings: SettingsManager

    // Pass-detection: track closest approach per radar
    private var trackedRadarId: String?
    private var minimumDistanceReached: CLLocationDistance = .infinity

    private var cancellables = Set<AnyCancellable>()

    init(modelContainer: ModelContainer) {
        radarStore = RadarStore(modelContext: modelContainer.mainContext)
        locationManager = LocationManager()
        hapticManager = HapticManager()
        audioManager = AudioAlertManager()
        overpassService = OverpassService()
        settings = SettingsManager.shared

        setupLocationSubscription()
    }

    // MARK: - Lifecycle

    func start() {
        locationManager.requestPermission()
        locationManager.start()
    }

    // MARK: - Combine pipeline

    private func setupLocationSubscription() {
        locationManager.$location
            .compactMap { $0 }
            .removeDuplicates { $0.distance(from: $1) < 5 }
            .throttle(for: .seconds(2), scheduler: DispatchQueue.main, latest: true)
            .sink { [weak self] location in
                self?.processLocation(location)
            }
            .store(in: &cancellables)

        locationManager.$location
            .compactMap { $0 }
            .first()
            .sink { [weak self] location in
                Task { await self?.refreshIfNeeded(near: location) }
            }
            .store(in: &cancellables)
    }

    // MARK: - Location processing

    private func processLocation(_ location: CLLocation) {
        nearbyRadars = radarStore.fetchAll()

        let alertRadius = Double(settings.alertRadius)
        let nearby = radarStore.radarsNearby(center: location, radius: alertRadius)
        let heading = locationManager.heading?.trueHeading ?? -1

        // Always apply direction filter when heading is available:
        // checks both geometric (ahead within 90°) and lane (radar direction matches travel)
        let filtered: [Radar] = heading >= 0
            ? nearby.filter { $0.isRelevant(for: location, heading: heading) }
            : nearby

        guard let nearest = filtered.min(by: { $0.distance(from: location) < $1.distance(from: location) }) else {
            clearAlert()
            return
        }

        let distance = nearest.distance(from: location)

        // Pass-detection: track closest approach per radar
        if nearest.osmId != trackedRadarId {
            trackedRadarId = nearest.osmId
            minimumDistanceReached = distance
        } else if distance < minimumDistanceReached {
            minimumDistanceReached = distance
        }

        // Passed if: distance increasing >60 m from closest point,
        // OR radar is now more than 120° behind the user
        let radarIsBehind: Bool
        if heading >= 0 {
            let bearingToRadar = location.coordinate.bearing(to: nearest.coordinate)
            let diff = abs((bearingToRadar - heading + 540).truncatingRemainder(dividingBy: 360) - 180)
            radarIsBehind = diff > 120
        } else {
            radarIsBehind = false
        }

        if distance > minimumDistanceReached + 60 || radarIsBehind {
            clearAlert()
            trackedRadarId = nil
            minimumDistanceReached = .infinity
            return
        }

        nearestRadar = nearest
        distanceToNearest = distance
        isAlertActive = true

        guard !settings.isMuted else { return }

        switch settings.alertMode {
        case .haptic:
            hapticManager.trigger(forDistance: distance, multiplier: settings.hapticIntensity)
        case .audio:
            audioManager.announce(distance: distance, speedLimit: nearest.speedLimit)
        case .both:
            hapticManager.trigger(forDistance: distance, multiplier: settings.hapticIntensity)
            audioManager.announce(distance: distance, speedLimit: nearest.speedLimit)
        }
    }

    private func clearAlert() {
        nearestRadar = nil
        distanceToNearest = .infinity
        isAlertActive = false
        hapticManager.stop()
        audioManager.stop()
    }

    // MARK: - Data refresh

    func refreshIfNeeded(near location: CLLocation) async {
        guard radarStore.needsRefresh(from: location) else {
            radarCount = radarStore.count
            // Data is already fresh — populate map from existing DB
            nearbyRadars = radarStore.fetchAll()
            return
        }
        await refresh(near: location)
    }

    func refresh(near location: CLLocation) async {
        isRefreshing = true
        defer { isRefreshing = false }
        do {
            let radars = try await overpassService.fetchRadars(near: location.coordinate, radius: 100_000)
            try radarStore.deleteAll()
            for radar in radars { radarStore.insert(radar) }
            try radarStore.save()
            radarStore.lastFetchDate = Date()
            radarStore.lastFetchLocation = location
            radarCount = radarStore.count
            // Populate map immediately without waiting for the next GPS movement
            nearbyRadars = radarStore.fetchAll()
        } catch {
            // Keep stale data; non-fatal
        }
    }
}
