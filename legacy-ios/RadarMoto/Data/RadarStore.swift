import Foundation
import SwiftData
import CoreLocation

@MainActor
final class RadarStore {
    private let modelContext: ModelContext
    private let defaults = UserDefaults.standard

    init(modelContext: ModelContext) {
        self.modelContext = modelContext
    }

    // MARK: - Geospatial query

    func radarsNearby(center: CLLocation, radius: Double) -> [Radar] {
        // Bounding-box pre-filter (SwiftData has no native geo query)
        let latDelta = radius / 111_000
        let cosLat = cos(center.coordinate.latitude * .pi / 180)
        let lonDelta = cosLat > 0 ? radius / (111_000 * cosLat) : radius / 111_000

        let minLat = center.coordinate.latitude - latDelta
        let maxLat = center.coordinate.latitude + latDelta
        let minLon = center.coordinate.longitude - lonDelta
        let maxLon = center.coordinate.longitude + lonDelta

        let predicate = #Predicate<Radar> { r in
            r.latitude >= minLat && r.latitude <= maxLat &&
            r.longitude >= minLon && r.longitude <= maxLon
        }
        let candidates = (try? modelContext.fetch(FetchDescriptor<Radar>(predicate: predicate))) ?? []
        return candidates.filter { $0.distance(from: center) <= radius }
    }

    // MARK: - CRUD

    func insert(_ radar: Radar) {
        modelContext.insert(radar)
    }

    func deleteAll() throws {
        try modelContext.delete(model: Radar.self)
    }

    func save() throws {
        try modelContext.save()
    }

    var count: Int {
        (try? modelContext.fetchCount(FetchDescriptor<Radar>())) ?? 0
    }

    func fetchAll() -> [Radar] {
        (try? modelContext.fetch(FetchDescriptor<Radar>())) ?? []
    }

    // MARK: - Refresh metadata (stored in UserDefaults)

    var lastFetchDate: Date? {
        get { defaults.object(forKey: "lastRadarFetchDate") as? Date }
        set { defaults.set(newValue, forKey: "lastRadarFetchDate") }
    }

    var lastFetchLocation: CLLocation? {
        get {
            let lat = defaults.double(forKey: "lastFetchLat")
            let lon = defaults.double(forKey: "lastFetchLon")
            guard lat != 0 || lon != 0 else { return nil }
            return CLLocation(latitude: lat, longitude: lon)
        }
        set {
            defaults.set(newValue?.coordinate.latitude ?? 0, forKey: "lastFetchLat")
            defaults.set(newValue?.coordinate.longitude ?? 0, forKey: "lastFetchLon")
        }
    }

    var needsRefresh: Bool {
        guard let lastFetch = lastFetchDate else { return true }
        return Date().timeIntervalSince(lastFetch) > 7 * 86_400
    }

    func needsRefresh(from location: CLLocation) -> Bool {
        if needsRefresh { return true }
        guard let last = lastFetchLocation else { return true }
        return location.distance(from: last) > 40_000
    }
}
