import SwiftUI
import SwiftData
import MapKit
import CoreLocation

struct ContentView: View {
    @EnvironmentObject var engine: RadarEngine
    @ObservedObject private var settings = SettingsManager.shared
    @State private var showSettings = false

    var body: some View {
        NavigationStack {
            ZStack {
                alertBackground
                VStack(spacing: 16) {
                    statusIndicator
                    radarCard
                    RadarMapView(
                        nearbyRadars: engine.nearbyRadars,
                        nearestRadar: engine.nearestRadar,
                        userCoordinate: engine.locationManager.location?.coordinate,
                        userHeading: engine.locationManager.heading?.trueHeading
                    )
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                }
                .padding(.horizontal)
                .padding(.top, 8)
                .padding(.bottom)
            }
            .navigationTitle("RadarMoto")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button { showSettings = true } label: {
                        Image(systemName: "gearshape.fill")
                    }
                }
                ToolbarItem(placement: .topBarLeading) {
                    refreshButton
                }
                ToolbarItem(placement: .bottomBar) {
                    muteButton
                }
                ToolbarItem(placement: .bottomBar) {
                    Spacer()
                }
                ToolbarItem(placement: .bottomBar) {
                    speedLabel
                }
            }
            .sheet(isPresented: $showSettings) {
                SettingsView()
            }
        }
        .onAppear { engine.start() }
    }

    // MARK: - Subviews

    private var alertBackground: some View {
        engine.isAlertActive
            ? Color.red.opacity(0.10).ignoresSafeArea()
            : Color(.systemBackground).ignoresSafeArea()
    }

    private var statusIndicator: some View {
        HStack(spacing: 8) {
            Circle()
                .fill(statusColor)
                .frame(width: 10, height: 10)
            Text(statusText)
                .font(.caption)
                .foregroundStyle(.secondary)
            Spacer()
            if engine.radarCount > 0 {
                Text("\(engine.radarCount) radares")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
    }

    private var radarCard: some View {
        HStack(spacing: 20) {
            if engine.isAlertActive, let radar = engine.nearestRadar {
                Image(systemName: "exclamationmark.triangle.fill")
                    .font(.system(size: 36))
                    .foregroundStyle(.red)
                    .symbolEffect(.pulse)

                VStack(alignment: .leading, spacing: 2) {
                    Text(distanceText)
                        .font(.system(size: 36, weight: .bold, design: .rounded))
                    if let limit = radar.speedLimit {
                        Text("Límite \(limit) km/h")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                }
                Spacer()
            } else {
                Image(systemName: "checkmark.shield.fill")
                    .font(.system(size: 32))
                    .foregroundStyle(.green)
                Text("Sin radares próximos")
                    .font(.headline)
                    .foregroundStyle(.secondary)
                Spacer()
            }
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 16)
        .frame(maxWidth: .infinity)
        .background(.regularMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private var muteButton: some View {
        Button {
            settings.isMuted.toggle()
        } label: {
            Label(
                settings.isMuted ? "Silenciado" : "Activo",
                systemImage: settings.isMuted ? "bell.slash.fill" : "bell.fill"
            )
            .foregroundStyle(settings.isMuted ? .secondary : .primary)
        }
    }

    private var speedLabel: some View {
        Group {
            if let speed = engine.locationManager.location?.speed, speed >= 0 {
                Text("\(Int(speed * 3.6)) km/h")
                    .font(.system(.callout, design: .rounded).weight(.semibold))
                    .monospacedDigit()
            } else {
                Text("-- km/h")
                    .font(.system(.callout, design: .rounded))
                    .foregroundStyle(.secondary)
            }
        }
    }

    @ViewBuilder
    private var refreshButton: some View {
        if engine.isRefreshing {
            ProgressView().scaleEffect(0.8)
        } else {
            Button {
                guard let location = engine.locationManager.location else { return }
                Task { await engine.refresh(near: location) }
            } label: {
                Image(systemName: "arrow.clockwise")
            }
        }
    }

    // MARK: - Helpers

    private var distanceText: String {
        let d = engine.distanceToNearest
        guard d.isFinite else { return "" }
        let rounded = (d / 25).rounded() * 25   // nearest 25 m
        return rounded < 1000
            ? "\(Int(rounded)) m"
            : String(format: "%.1f km", rounded / 1000)
    }

    private var statusColor: Color {
        switch engine.locationManager.authorizationStatus {
        case .authorizedAlways:    return .green
        case .authorizedWhenInUse: return .yellow
        default:                   return .red
        }
    }

    private var statusText: String {
        switch engine.locationManager.authorizationStatus {
        case .authorizedAlways:    return "GPS activo"
        case .authorizedWhenInUse: return "GPS solo primer plano"
        case .denied, .restricted: return "GPS denegado"
        default:                   return "GPS sin autorizar"
        }
    }
}

// MARK: - Map

struct RadarMapView: View {
    var nearbyRadars: [Radar]
    var nearestRadar: Radar?
    var userCoordinate: CLLocationCoordinate2D?
    var userHeading: Double?

    @State private var position: MapCameraPosition = .userLocation(
        followsHeading: false,
        fallback: .automatic
    )
    @State private var selectedRadar: Radar?

    var body: some View {
        Map(position: $position) {
            if let coord = userCoordinate {
                Annotation("", coordinate: coord) {
                    ZStack {
                        Circle()
                            .fill(.blue.opacity(0.15))
                            .frame(width: 44, height: 44)
                        Image(systemName: "location.north.fill")
                            .font(.system(size: 20, weight: .semibold))
                            .foregroundStyle(.white)
                            .padding(8)
                            .background(Circle().fill(.blue))
                            .rotationEffect(.degrees(userHeading ?? 0))
                    }
                }
            }

            ForEach(nearbyRadars, id: \.osmId) { radar in
                Annotation("", coordinate: radar.coordinate) {
                    Button { selectedRadar = radar } label: {
                        radarPin(for: radar)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .mapStyle(.standard(
            elevation: .flat,
            emphasis: .muted,
            pointsOfInterest: .excludingAll,
            showsTraffic: false
        ))
        .mapControls {}
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .sheet(item: $selectedRadar) { radar in
            RadarDetailSheet(radar: radar)
                .presentationDetents([.height(200)])
                .presentationDragIndicator(.visible)
        }
    }

    private func radarPin(for radar: Radar) -> some View {
        let isNearest = radar.osmId == nearestRadar?.osmId
        let isSelected = radar.osmId == selectedRadar?.osmId
        return ZStack {
            RoundedRectangle(cornerRadius: 6)
                .fill(isNearest ? Color.red : Color.orange)
                .frame(width: 32, height: 32)
            Image(systemName: "camera.fill")
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(.white)
        }
        .shadow(color: .black.opacity(0.3), radius: 3, y: 2)
        .scaleEffect(isNearest || isSelected ? 1.25 : 1.0)
        .animation(.easeInOut(duration: 0.2), value: isNearest)
    }
}

// MARK: - Radar detail sheet

struct RadarDetailSheet: View {
    let radar: Radar

    var body: some View {
        VStack(spacing: 20) {
            HStack(spacing: 16) {
                ZStack {
                    RoundedRectangle(cornerRadius: 10)
                        .fill(Color.orange)
                        .frame(width: 52, height: 52)
                    Image(systemName: "camera.fill")
                        .font(.title2)
                        .foregroundStyle(.white)
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text("Radar de velocidad")
                        .font(.headline)
                    if let limit = radar.speedLimit {
                        Text("Límite: \(limit) km/h")
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundStyle(.red)
                    } else {
                        Text("Límite: no disponible")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    if let direction = radar.direction {
                        Text("Dirección: \(Int(direction))°")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                Spacer()
            }
            .padding(.horizontal)

            Text("ID OpenStreetMap: \(radar.osmId)")
                .font(.caption2)
                .foregroundStyle(.tertiary)
        }
        .padding(.top, 24)
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

#Preview {
    ContentView()
        .environmentObject(RadarEngine(modelContainer: {
            let schema = Schema([Radar.self])
            return try! ModelContainer(for: schema, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        }()))
}
