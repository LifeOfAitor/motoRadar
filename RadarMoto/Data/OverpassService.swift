import Foundation
import CoreLocation

enum OverpassError: Error {
    case invalidResponse
    case httpError(Int)
}

final class OverpassService {
    private let baseURL = URL(string: "https://overpass-api.de/api/interpreter")!
    private let session: URLSession

    init(session: URLSession = .shared) {
        self.session = session
    }

    func fetchRadars(near coordinate: CLLocationCoordinate2D, radius: Double) async throws -> [Radar] {
        let query = """
        [out:json][timeout:60];
        node["highway"="speed_camera"](around:\(Int(radius)),\(coordinate.latitude),\(coordinate.longitude));
        out body;
        """

        var request = URLRequest(url: baseURL)
        request.httpMethod = "POST"
        request.httpBody = "data=\(query)".addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed)?.data(using: .utf8)
        request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")

        let (data, response) = try await session.data(for: request)

        if let http = response as? HTTPURLResponse, !(200..<300).contains(http.statusCode) {
            throw OverpassError.httpError(http.statusCode)
        }

        let result = try JSONDecoder().decode(OverpassResponse.self, from: data)
        return result.elements.map { element in
            Radar(
                osmId: String(element.id),
                latitude: element.lat,
                longitude: element.lon,
                type: element.tags?["highway"] ?? "speed_camera",
                speedLimit: element.tags?["maxspeed"].flatMap { Int($0.replacingOccurrences(of: " mph", with: "")) },
                direction: element.tags?["direction"].flatMap { Double($0) }
            )
        }
    }
}

// MARK: - Codable response models

private struct OverpassResponse: Decodable {
    let elements: [OverpassElement]
}

private struct OverpassElement: Decodable {
    let id: Int
    let lat: Double
    let lon: Double
    let tags: [String: String]?
}
