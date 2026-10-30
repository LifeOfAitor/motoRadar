import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var engine: RadarEngine
    @ObservedObject private var settings = SettingsManager.shared
    @Environment(\.dismiss) private var dismiss

    private let radiusOptions = [200, 300, 500, 750, 1000]

    var body: some View {
        NavigationStack {
            Form {
                Section("Alertas") {
                    Picker("Modo", selection: $settings.alertMode) {
                        ForEach(AlertMode.allCases) { mode in
                            Text(mode.label).tag(mode)
                        }
                    }
                    .pickerStyle(.segmented)
                }

                if settings.alertMode != .audio {
                    Section {
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Text("Intensidad de vibración")
                                Spacer()
                                Text("\(Int(settings.hapticIntensity * 100))%")
                                    .foregroundStyle(.secondary)
                                    .monospacedDigit()
                            }
                            Slider(value: $settings.hapticIntensity, in: 0.3...1.0, step: 0.05)
                                .tint(.red)
                        }
                    } footer: {
                        Text("Con pantalla bloqueada los haptics no funcionan (limitación de iOS). Usa modo Audio o Haptic + Audio para recibir alertas con el móvil en el bolsillo.")
                            .foregroundStyle(.orange)
                    }
                }

                Section {
                    Picker("Radio de alerta", selection: $settings.alertRadius) {
                        ForEach(radiusOptions, id: \.self) { r in
                            Text("\(r) m").tag(r)
                        }
                    }
                    .pickerStyle(.segmented)
                } header: {
                    Text("Radio de detección")
                } footer: {
                    Text("Distancia máxima a la que se activa la alerta.")
                }

                Section {
                    Toggle("Filtro de dirección", isOn: $settings.directionFilterEnabled)
                } footer: {
                    Text("Solo alerta de radares que estén aproximadamente frente a ti.")
                }

                Section("Base de datos") {
                    LabeledContent("Radares cargados", value: "\(engine.radarCount)")
                    Button("Actualizar ahora") {
                        guard let location = engine.locationManager.location else { return }
                        Task { await engine.refresh(near: location) }
                    }
                    .disabled(engine.isRefreshing || engine.locationManager.location == nil)
                }

                Section("Permisos GPS") {
                    LabeledContent("Estado") {
                        Text(authStatusLabel)
                            .foregroundStyle(authStatusColor)
                    }
                    if engine.locationManager.authorizationStatus != .authorizedAlways {
                        Button("Abrir Ajustes") {
                            if let url = URL(string: UIApplication.openSettingsURLString) {
                                UIApplication.shared.open(url)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Configuración")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Hecho") { dismiss() }
                }
            }
        }
    }

    private var authStatusLabel: String {
        switch engine.locationManager.authorizationStatus {
        case .authorizedAlways:    return "Siempre"
        case .authorizedWhenInUse: return "Solo primer plano"
        case .denied:              return "Denegado"
        case .restricted:          return "Restringido"
        default:                   return "Sin determinar"
        }
    }

    private var authStatusColor: Color {
        engine.locationManager.authorizationStatus == .authorizedAlways ? .green : .red
    }
}
