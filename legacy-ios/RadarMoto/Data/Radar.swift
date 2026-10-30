import Foundation
import SwiftData
import CoreLocation

@Model
final class Radar {
    @Attribute(.unique) var osmId: String
    var latitude: Double
    var longitude: Double
    var type: String
    var speedLimit: Int?
    var direction: Double?   // bearing in degrees of monitored traffic; nil = omnidirectional
    var fetchedAt: Date

    init(osmId: String,
         latitude: Double,
         longitude: Double,
         type: String,
         speedLimit: Int? = nil,
         direction: Double? = nil) {
        self.osmId = osmId
        self.latitude = latitude
        self.longitude = longitude
        self.type = type
        self.speedLimit = speedLimit
        self.direction = direction
        self.fetchedAt = Date()
    }

    var coordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }

    func distance(from location: CLLocation) -> CLLocationDistance {
        CLLocation(latitude: latitude, longitude: longitude).distance(from: location)
    }

    // Returns true if this radar is relevant for a user travelling at `heading`.
    // Combines two checks:
    // 1. Geometric: radar must be roughly ahead (within 90° forward cone)
    // 2. Lane: if the radar has a direction tag, it must monitor the same direction as the user
    func isRelevant(for location: CLLocation, heading: Double) -> Bool {
        let bearingToRadar = location.coordinate.bearing(to: coordinate)

        // 1. Geometric check — radar must be within 90° forward cone
        let geoDiff = angularDiff(bearingToRadar, heading)
        guard geoDiff < 90 else { return false }

        // 2. Lane check — if radar has a direction tag, must match user's lane
        if let dir = direction {
            let laneDiff = angularDiff(dir, heading)
            return laneDiff < 60   // within 60° = same lane direction
        }

        return true  // no direction tag → omnidirectional
    }
}

// Shortest angular difference between two bearings (0–180)
private func angularDiff(_ a: Double, _ b: Double) -> Double {
    abs((a - b + 540).truncatingRemainder(dividingBy: 360) - 180)
}

extension CLLocationCoordinate2D {
    func bearing(to destination: CLLocationCoordinate2D) -> Double {
        let lat1 = latitude * .pi / 180
        let lat2 = destination.latitude * .pi / 180
        let dLon = (destination.longitude - longitude) * .pi / 180
        let y = sin(dLon) * cos(lat2)
        let x = cos(lat1) * sin(lat2) - sin(lat1) * cos(lat2) * cos(dLon)
        return (atan2(y, x) * 180 / .pi + 360).truncatingRemainder(dividingBy: 360)
    }
}
