import SwiftUI
import SwiftData

@main
struct RadarMotoApp: App {
    private let modelContainer: ModelContainer
    @StateObject private var engine: RadarEngine

    init() {
        let schema = Schema([Radar.self])
        let config = ModelConfiguration(schema: schema, isStoredInMemoryOnly: false)
        let container = try! ModelContainer(for: schema, configurations: [config])
        modelContainer = container
        _engine = StateObject(wrappedValue: RadarEngine(modelContainer: container))
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(engine)
        }
        .modelContainer(modelContainer)
    }
}
