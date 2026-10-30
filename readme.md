# 🏍️ RadarMoto — Plan de Proyecto iOS

> App detectora de radares con vibración gradual para moto. Uso en segundo plano, sin necesidad de pantalla encendida.

---

## 📦 Índice

- [[#🛠️ Lo que necesitas instalar|Lo que necesitas instalar]]
- [[#📚 Fundamentos de Swift e iOS|Fundamentos de Swift e iOS]]
- [[#🏗️ Fase 1 — Estructura del proyecto|Fase 1 — Estructura del proyecto]]
- [[#📍 Fase 2 — GPS en segundo plano|Fase 2 — GPS en segundo plano]]
- [[#📳 Fase 3 — CoreHaptics y vibración gradual|Fase 3 — CoreHaptics y vibración gradual]]
- [[#🗄️ Fase 4 — Base de datos de radares (offline)|Fase 4 — Base de datos de radares (offline)]]
- [[#🌐 Fase 5 — Integración con Overpass API|Fase 5 — Integración con Overpass API]]
- [[#⚙️ Fase 6 — Motor central RadarEngine|Fase 6 — Motor central RadarEngine]]
- [[#🔊 Fase 7 — Modo coche con audio|Fase 7 — Modo coche con audio]]
- [[#🎛️ Fase 8 — UI y configuración|Fase 8 — UI y configuración]]
- [[#🧪 Fase 9 — Pruebas reales|Fase 9 — Pruebas reales]]
- [[#☁️ Fase 10 — Backend propio (escalado futuro)|Fase 10 — Backend propio (escalado futuro)]]
- [[#📱 Fase 11 — Publicación en App Store|Fase 11 — Publicación en App Store]]
- [[#📖 Recursos y referencias|Recursos y referencias]]

---

## 🛠️ Lo que necesitas instalar

### Hardware obligatorio

- [ ] **Mac** — Xcode solo funciona en macOS. Sin Mac no hay desarrollo iOS nativo.
    - Mínimo macOS Ventura (13.0) para Xcode 15+
    - Si no tienes Mac, puedes usar un Mac Mini de segunda mano o mac en la nube (MacInCloud, Codemagic)
- [ ] **iPhone físico** — El simulador de Xcode NO soporta CoreHaptics ni GPS real. Necesitas un iPhone para probar la vibración y el GPS.
    - Cualquier iPhone con iOS 16+ vale
    - Cable USB para conectarlo a Xcode

### Software

- [ ] **Xcode** — Descarga gratuita desde la Mac App Store
    - Versión recomendada: Xcode 15 o superior
    - Pesa ~15 GB, la descarga tarda un rato
    - Incluye simulador, depurador, y todo lo necesario
- [ ] **Apple Developer Account** (gratuita para empezar)
    - Crear en: https://developer.apple.com
    - La cuenta gratuita permite instalar apps en tu propio iPhone
    - Para publicar en el App Store necesitas la cuenta de pago ($99/año) — esto es para más adelante
- [ ] **Git** — Para control de versiones
    - Viene integrado en Xcode, pero instala también la CLI: `xcode-select --install`
- [ ] **Postman** (opcional pero útil)
    - Para probar las llamadas a la Overpass API antes de implementarlas en Swift
    - Descarga en: https://postman.com

### Cuentas y servicios externos

- [ ] **Cuenta en Supabase** (gratuita) — https://supabase.com
    - Base de datos PostgreSQL hosted para cuando quieras backend propio
    - Plan gratuito más que suficiente para empezar
- [ ] **Cuenta en GitHub** — Para guardar el código
    - Crea un repo privado para el proyecto

---

## 📚 Fundamentos de Swift e iOS

> Antes de tocar el proyecto, dedica tiempo a estos fundamentos. Si vienes de Kotlin, Swift te resultará muy familiar pero tiene sus particularidades.

### Swift — El lenguaje

#### Conceptos clave que debes dominar primero

- [ ] **Sintaxis básica**: variables (`var`, `let`), tipos, funciones, closures
    - `let` es inmutable (como `val` en Kotlin)
    - `var` es mutable
    - Los closures son como las lambdas de Kotlin
- [ ] **Optionals** — El concepto más importante de Swift
    - Un `String?` puede ser nil, un `String` nunca puede serlo
    - `if let`, `guard let`, `??` para desenvolver optionals
    - Diferente a Kotlin pero el concepto es similar
- [ ] **Structs vs Classes** — En Swift los structs son muy usados (son value types)
- [ ] **Protocols** — Equivalente a las interfaces de Kotlin
- [ ] **async/await** — Para llamadas de red asíncronas (igual que en Kotlin)
- [ ] **@Published, @State, @ObservableObject** — Para reactividad en SwiftUI

#### Recursos para aprender Swift

- [ ] **Swift Tour oficial** — https://docs.swift.org/swift-book/documentation/the-swift-programming-language/guidedtour/
    - Gratis, oficial, directo al grano
- [ ] **Hacking with Swift** — https://www.hackingwithswift.com
    - El mejor recurso gratuito de la comunidad iOS
    - Tiene un curso "100 Days of SwiftUI" gratuito y excelente
- [ ] **Swift Playgrounds** (app de Mac/iPad)
    - Para practicar Swift sin montar un proyecto entero

### SwiftUI — La interfaz

- [ ] Entender la diferencia entre `View`, `@State`, `@Binding`
- [ ] Navegación con `NavigationStack`
- [ ] `Toggle`, `Slider`, `Picker` para las opciones de la app
- [ ] `List` y `ForEach` para mostrar radares cercanos (opcional)

> 💡 **Nota**: Esta app tiene poca UI — la mayor parte del trabajo está en el background. No necesitas ser un experto en SwiftUI para empezar.

---

## 🏗️ Fase 1 — Estructura del proyecto

### Crear el proyecto en Xcode

- [ ] Abrir Xcode → "Create New Project"
- [ ] Seleccionar: **iOS → App**
- [ ] Configuración:
    - Product Name: `RadarMoto`
    - Team: tu Apple ID
    - Organization Identifier: `com.tunombre.radarmoto`
    - Interface: **SwiftUI**
    - Language: **Swift**
- [ ] Guardarlo en tu carpeta de proyectos y conectar con Git desde el principio

### Estructura de carpetas recomendada

```
RadarMoto/
├── App/
│   └── RadarMotoApp.swift          # Entry point de la app
├── Core/
│   ├── RadarEngine.swift           # Lógica central (distancias, alertas)
│   ├── LocationManager.swift       # GPS y CoreLocation
│   └── HapticManager.swift         # Vibración gradual
├── Data/
│   ├── RadarStore.swift            # SwiftData / persistencia local
│   ├── OverpassService.swift       # Llamadas a la API de radares
│   └── Models/
│       └── Radar.swift             # Modelo de dato Radar
├── Audio/
│   └── AudioAlertManager.swift    # Alertas de sonido para modo coche
├── Settings/
│   └── SettingsManager.swift       # Preferencias del usuario
└── UI/
    ├── ContentView.swift           # Vista principal
    ├── SettingsView.swift          # Pantalla de configuración
    └── RadarListView.swift         # Lista de radares cercanos (opcional)
```

- [ ] Crear esta estructura de carpetas en Xcode (click derecho → New Group)
- [ ] Hacer primer commit en Git: "Initial project structure"

### Configurar el Info.plist

El `Info.plist` es donde le dices a iOS qué permisos necesita tu app. Debes añadir:

- [ ] Abrir `Info.plist` y añadir las siguientes claves:

```xml
<!-- Permiso de localización mientras la app está en uso -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>RadarMoto necesita tu ubicación para detectar radares cercanos</string>

<!-- Permiso de localización en segundo plano -->
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>RadarMoto necesita tu ubicación en segundo plano para alertarte de radares aunque la pantalla esté apagada</string>

<!-- Permiso de localización siempre (necesario para background) -->
<key>NSLocationAlwaysUsageDescription</key>
<string>RadarMoto necesita localización continua para funcionar con el móvil en el bolsillo</string>
```

### Activar Background Modes

- [ ] En Xcode, seleccionar el target `RadarMoto`
- [ ] Ir a la pestaña **Signing & Capabilities**
- [ ] Click en "+ Capability" → añadir **Background Modes**
- [ ] Activar la casilla: ✅ **Location updates**

> ⚠️ Sin esto, iOS matará la app en cuanto apagues la pantalla y no recibirás alertas.

---

## 📍 Fase 2 — GPS en segundo plano

> Esta es la pieza más crítica de la app. Debes conseguir que el GPS funcione con la pantalla apagada y el móvil en el bolsillo.

### Crear LocationManager.swift

Este archivo gestiona todo lo relacionado con el GPS:

```swift
import CoreLocation
import Combine

class LocationManager: NSObject, ObservableObject, CLLocationManagerDelegate {
    
    private let locationManager = CLLocationManager()
    
    @Published var currentLocation: CLLocation?
    @Published var authorizationStatus: CLAuthorizationStatus = .notDetermined
    
    override init() {
        super.init()
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBestForNavigation
        locationManager.distanceFilter = 10 // Actualizar cada 10 metros
        locationManager.allowsBackgroundLocationUpdates = true // CRÍTICO
        locationManager.pausesLocationUpdatesAutomatically = false // No pausar nunca
    }
    
    func requestPermission() {
        locationManager.requestAlwaysAuthorization() // Necesitamos "siempre"
    }
    
    func startTracking() {
        locationManager.startUpdatingLocation()
    }
    
    func stopTracking() {
        locationManager.stopUpdatingLocation()
    }
    
    // Delegate: se llama cada vez que hay una nueva ubicación
    func locationManager(_ manager: CLLocationManager, 
                         didUpdateLocations locations: [CLLocation]) {
        currentLocation = locations.last
    }
    
    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        authorizationStatus = manager.authorizationStatus
    }
}
```

### Checklist de esta fase

- [ ] Crear `LocationManager.swift` con el código base
- [ ] Solicitar permiso `requestAlwaysAuthorization()` al arrancar
- [ ] Verificar que `allowsBackgroundLocationUpdates = true` está activado
- [ ] Probar en iPhone físico que el GPS sigue activo con pantalla apagada
    - Forma de verificar: añadir un `print()` en `didUpdateLocations` y ver la consola de Xcode con el iPhone conectado
- [ ] Ajustar `distanceFilter` según el consumo de batería (empezar con 10m)

### Consideraciones de batería

- `kCLLocationAccuracyBestForNavigation` — máxima precisión, más batería
- `kCLLocationAccuracyNearestTenMeters` — buen equilibrio para esta app
- `distanceFilter = 10` — solo actualiza si te has movido 10 metros (ahorra batería)
- Considera bajar la precisión si la app no está en movimiento (modo estático)

---

## 📳 Fase 3 — CoreHaptics y vibración gradual

> El corazón de la experiencia de usuario. La vibración debe sentirse como una advertencia progresiva, no un susto repentino.

### Entender CoreHaptics

CoreHaptics permite controlar dos parámetros de la vibración:

- **Intensity** (0.0 → 1.0): qué tan fuerte vibra
- **Sharpness** (0.0 → 1.0): 0 = vibración suave y continua, 1 = pulso seco y nítido

### Crear HapticManager.swift

```swift
import CoreHaptics
import UIKit

class HapticManager {
    
    private var engine: CHHapticEngine?
    private var continuousPlayer: CHHapticAdvancedPatternPlayer?
    
    init() {
        setupEngine()
    }
    
    private func setupEngine() {
        guard CHHapticEngine.capabilitiesForHardware().supportsHaptics else { return }
        
        do {
            engine = try CHHapticEngine()
            engine?.isAutoShutdownEnabled = false
            try engine?.start()
        } catch {
            print("Error iniciando CoreHaptics: \(error)")
        }
    }
    
    // Vibración proporcional a la proximidad
    // distance: distancia en metros al radar
    func vibrateForDistance(_ distance: Double) {
        let intensity = intensityForDistance(distance)
        let sharpness = sharpnessForDistance(distance)
        
        guard intensity > 0 else {
            stopVibration()
            return
        }
        
        playHapticPulse(intensity: intensity, sharpness: sharpness)
    }
    
    // Mapear distancia a intensidad: más cerca = más fuerte
    private func intensityForDistance(_ distance: Double) -> Float {
        switch distance {
        case ..<50:    return 1.0   // Zona crítica: vibración máxima
        case 50..<150: return 0.7   // Zona cercana: vibración fuerte
        case 150..<300: return 0.4  // Zona media: vibración moderada
        case 300..<500: return 0.2  // Zona lejana: vibración suave
        default:       return 0.0   // Fuera de rango: nada
        }
    }
    
    private func sharpnessForDistance(_ distance: Double) -> Float {
        // Cerca: pulsos nítidos. Lejos: vibración suave
        return distance < 100 ? 0.8 : 0.3
    }
    
    private func playHapticPulse(intensity: Float, sharpness: Float) {
        guard let engine = engine else { return }
        
        let intensityParam = CHHapticEventParameter(
            parameterID: .hapticIntensity, value: intensity)
        let sharpnessParam = CHHapticEventParameter(
            parameterID: .hapticSharpness, value: sharpness)
        
        let event = CHHapticEvent(
            eventType: .hapticContinuous,
            parameters: [intensityParam, sharpnessParam],
            relativeTime: 0,
            duration: 0.5
        )
        
        do {
            let pattern = try CHHapticPattern(events: [event], parameters: [])
            let player = try engine.makePlayer(with: pattern)
            try player.start(atTime: 0)
        } catch {
            print("Error reproduciendo haptic: \(error)")
        }
    }
    
    func stopVibration() {
        // Detener vibración continua
    }
    
    // Fallback para dispositivos sin CoreHaptics (iPhone 6 y anteriores)
    func simpleVibration() {
        UIImpactFeedbackGenerator(style: .heavy).impactOccurred()
    }
}
```

### Patrón de vibración gradual — diseño

Define el comportamiento que quieres conseguir:

|Distancia al radar|Intensidad|Patrón|
|---|---|---|
|> 500m|Ninguna|Silencio|
|300–500m|Muy suave (0.2)|Pulso cada 3 segundos|
|150–300m|Suave (0.4)|Pulso cada 2 segundos|
|50–150m|Fuerte (0.7)|Pulso cada 1 segundo|
|< 50m|Máxima (1.0)|Vibración continua|

### Checklist de esta fase

- [ ] Crear `HapticManager.swift`
- [ ] Verificar que `CHHapticEngine.capabilitiesForHardware().supportsHaptics` devuelve `true` en tu iPhone
- [ ] Probar la función `vibrateForDistance()` con valores hardcodeados (100m, 200m, 400m)
- [ ] Ajustar los umbrales de distancia según la sensación real en mano
- [ ] Implementar el timer de pulsaciones (pulso cada X segundos según zona)
- [ ] Probar con el móvil en el bolsillo de la chaqueta de moto

---

## 🗄️ Fase 4 — Base de datos de radares (offline)

> **Offline-first es crítico**. En carretera puedes perder cobertura. Los radares deben estar descargados localmente.

### Modelo de dato: Radar.swift

```swift
import Foundation
import SwiftData
import CoreLocation

@Model
class Radar {
    var id: UUID
    var latitude: Double
    var longitude: Double
    var type: RadarType         // Fijo, tramo, semáforo
    var speedLimit: Int?        // Velocidad límite (si se conoce)
    var direction: Double?      // Dirección en grados (si aplica)
    var country: String
    var lastUpdated: Date
    
    init(id: UUID = UUID(),
         latitude: Double,
         longitude: Double,
         type: RadarType,
         speedLimit: Int? = nil,
         direction: Double? = nil,
         country: String = "ES") {
        self.id = id
        self.latitude = latitude
        self.longitude = longitude
        self.type = type
        self.speedLimit = speedLimit
        self.direction = direction
        self.country = country
        self.lastUpdated = Date()
    }
    
    // Calcular distancia a una ubicación dada
    func distance(from location: CLLocation) -> Double {
        let radarLocation = CLLocation(latitude: latitude, longitude: longitude)
        return location.distance(from: radarLocation) // en metros
    }
}

enum RadarType: String, Codable {
    case fixed = "fixed"           // Radar fijo
    case section = "section"       // Radar de tramo
    case mobile = "mobile"         // Radar móvil (reportado por usuarios)
    case redLight = "red_light"    // Cámara de semáforo
    case unknown = "unknown"
}
```

### Configurar SwiftData

- [ ] En `RadarMotoApp.swift`, añadir el modelContainer:

```swift
@main
struct RadarMotoApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        .modelContainer(for: Radar.self)
    }
}
```

### RadarStore.swift — Acceso a datos

```swift
import SwiftData
import CoreLocation

class RadarStore {
    
    private var modelContext: ModelContext
    
    init(modelContext: ModelContext) {
        self.modelContext = modelContext
    }
    
    // Obtener radares cercanos a una ubicación (radio en metros)
    func radarsNearby(location: CLLocation, radius: Double = 2000) -> [Radar] {
        // Fetch todos y filtrar por distancia
        // Para una app más grande, usar una query geoespacial
        let descriptor = FetchDescriptor<Radar>()
        let allRadars = (try? modelContext.fetch(descriptor)) ?? []
        
        return allRadars.filter { radar in
            radar.distance(from: location) <= radius
        }
    }
    
    // Guardar un radar
    func save(_ radar: Radar) {
        modelContext.insert(radar)
        try? modelContext.save()
    }
    
    // Guardar múltiples radares (desde API)
    func saveAll(_ radars: [Radar]) {
        radars.forEach { modelContext.insert($0) }
        try? modelContext.save()
    }
    
    // Borrar radares antiguos para no crecer indefinidamente
    func deleteOldRadars(olderThan days: Int = 30) {
        let cutoffDate = Calendar.current.date(
            byAdding: .day, value: -days, to: Date()) ?? Date()
        let descriptor = FetchDescriptor<Radar>(
            predicate: #Predicate { $0.lastUpdated < cutoffDate })
        let old = (try? modelContext.fetch(descriptor)) ?? []
        old.forEach { modelContext.delete($0) }
        try? modelContext.save()
    }
}
```

### Checklist de esta fase

- [ ] Crear el modelo `Radar.swift` con SwiftData (`@Model`)
- [ ] Configurar `modelContainer` en el entry point de la app
- [ ] Crear `RadarStore.swift` con las operaciones básicas
- [ ] Insertar 5 radares hardcodeados de prueba (coordenadas reales de radares que conozcas)
- [ ] Verificar que se guardan y se recuperan correctamente
- [ ] Probar `radarsNearby()` con tu ubicación real

---

## 🌐 Fase 5 — Integración con Overpass API

> Overpass API es la puerta de acceso a OpenStreetMap. Te permite descargar todos los radares de una zona geográfica.

### Qué es Overpass API

- API gratuita y sin límites estrictos para uso razonable
- Endpoint: `https://overpass-api.de/api/interpreter`
- Devuelve nodos de OSM que coincidan con tu query
- En España, los radares están etiquetados como `highway=speed_camera`

### Query de Overpass para España

```
[out:json][timeout:30];
(
  node["highway"="speed_camera"](around:50000, LAT, LON);
  node["highway"="speed_camera"]["source"="survey"](around:50000, LAT, LON);
);
out body;
```

Esto descarga radares en un radio de 50km alrededor de tus coordenadas.

### Crear OverpassService.swift

```swift
import Foundation
import CoreLocation

struct OverpassRadar: Decodable {
    let id: Int
    let lat: Double
    let lon: Double
    let tags: [String: String]?
}

struct OverpassResponse: Decodable {
    let elements: [OverpassRadar]
}

class OverpassService {
    
    private let baseURL = "https://overpass-api.de/api/interpreter"
    
    // Descargar radares alrededor de una ubicación
    func fetchRadars(near location: CLLocation, 
                     radius: Double = 50000) async throws -> [Radar] {
        
        let lat = location.coordinate.latitude
        let lon = location.coordinate.longitude
        
        let query = """
        [out:json][timeout:30];
        (
          node["highway"="speed_camera"](around:\(Int(radius)),\(lat),\(lon));
        );
        out body;
        """
        
        var request = URLRequest(url: URL(string: baseURL)!)
        request.httpMethod = "POST"
        request.httpBody = "data=\(query)".data(using: .utf8)
        request.setValue("application/x-www-form-urlencoded", 
                         forHTTPHeaderField: "Content-Type")
        
        let (data, _) = try await URLSession.shared.data(for: request)
        let response = try JSONDecoder().decode(OverpassResponse.self, from: data)
        
        return response.elements.map { element in
            let speedLimit = element.tags?["maxspeed"].flatMap { Int($0) }
            return Radar(
                latitude: element.lat,
                longitude: element.lon,
                type: .fixed,
                speedLimit: speedLimit,
                country: "ES"
            )
        }
    }
}
```

### Estrategia de descarga

La descarga no debe hacerse continuamente. Diseña la lógica así:

```
Al arrancar la app:
  ├── ¿Tengo radares descargados recientemente? (< 7 días)
  │   ├── SÍ → usar datos locales
  │   └── NO → descargar de Overpass y guardar en SwiftData
  │
  └── En movimiento:
      └── Si me alejo > 40km del punto de descarga → descargar nueva zona
```

### Checklist de esta fase

- [ ] Crear `OverpassService.swift`
- [ ] Probar la query en Postman primero para ver el JSON que devuelve
- [ ] Implementar la llamada en Swift con `async/await`
- [ ] Parsear la respuesta y convertir a modelos `Radar`
- [ ] Guardar en SwiftData via `RadarStore`
- [ ] Implementar lógica de "no descargar si datos recientes"
- [ ] Manejar errores de red (sin conexión → usar datos locales)
- [ ] Probar con coordenadas reales de una carretera española

---

## ⚙️ Fase 6 — Motor central RadarEngine

> Esta es la clase que une todo: recibe la ubicación GPS, consulta los radares cercanos y decide si debe vibrar.

### Crear RadarEngine.swift

```swift
import CoreLocation
import Combine

class RadarEngine: ObservableObject {
    
    private let locationManager: LocationManager
    private let hapticManager: HapticManager
    private let audioManager: AudioAlertManager
    private let radarStore: RadarStore
    private let settings: SettingsManager
    
    @Published var nearestRadar: Radar?
    @Published var distanceToNearest: Double = Double.infinity
    @Published var isAlertActive: Bool = false
    
    private var cancellables = Set<AnyCancellable>()
    private var alertTimer: Timer?
    
    // Radio de búsqueda de radares cercanos
    private let searchRadius: Double = 2000 // 2km
    
    init(locationManager: LocationManager,
         hapticManager: HapticManager,
         audioManager: AudioAlertManager,
         radarStore: RadarStore,
         settings: SettingsManager) {
        self.locationManager = locationManager
        self.hapticManager = hapticManager
        self.audioManager = audioManager
        self.radarStore = radarStore
        self.settings = settings
        
        setupLocationSubscription()
    }
    
    private func setupLocationSubscription() {
        locationManager.$currentLocation
            .compactMap { $0 }
            .sink { [weak self] location in
                self?.processLocation(location)
            }
            .store(in: &cancellables)
    }
    
    private func processLocation(_ location: CLLocation) {
        // 1. Buscar radares en el radio de búsqueda
        let nearby = radarStore.radarsNearby(
            location: location, radius: searchRadius)
        
        // 2. Encontrar el más cercano
        let nearest = nearby.min { a, b in
            a.distance(from: location) < b.distance(from: location)
        }
        
        // 3. Actualizar estado
        nearestRadar = nearest
        distanceToNearest = nearest?.distance(from: location) ?? Double.infinity
        
        // 4. Activar alerta si corresponde
        if let distance = nearest.map({ $0.distance(from: location) }), distance < 500 {
            triggerAlert(distance: distance)
        } else {
            stopAlert()
        }
    }
    
    private func triggerAlert(distance: Double) {
        isAlertActive = true
        
        if settings.alertMode == .haptic {
            hapticManager.vibrateForDistance(distance)
        } else {
            audioManager.playAlertForDistance(distance)
        }
    }
    
    private func stopAlert() {
        isAlertActive = false
        hapticManager.stopVibration()
        audioManager.stopAlert()
    }
}
```

### Lógica de dirección (avanzado)

Para evitar alertas cuando el radar está detrás tuyo:

```swift
// Solo alertar si el radar está en tu dirección de avance
private func isRadarAhead(_ radar: Radar, from location: CLLocation) -> Bool {
    guard let course = location.course as Double?, course >= 0 else { return true }
    
    let radarBearing = location.coordinate.bearing(to: 
        CLLocationCoordinate2D(latitude: radar.latitude, longitude: radar.longitude))
    let angleDiff = abs(course - radarBearing)
    
    return angleDiff < 45 || angleDiff > 315 // Radar en un cono de 90° hacia adelante
}
```

### Checklist de esta fase

- [ ] Crear `RadarEngine.swift`
- [ ] Conectar `LocationManager` → `RadarEngine` vía Combine/publisher
- [ ] Implementar búsqueda de radares cercanos en cada actualización GPS
- [ ] Conectar con `HapticManager` para disparar vibración
- [ ] Probar el ciclo completo: GPS → radar cercano → vibración
- [ ] Añadir logs temporales para depurar en consola de Xcode
- [ ] (Opcional) Implementar lógica de dirección para evitar falsos positivos

---

## 🔊 Fase 7 — Modo coche con audio

> Cuando vas en coche con el móvil en un soporte, la vibración no se nota. Esta fase añade alertas de sonido.

### Crear AudioAlertManager.swift

```swift
import AVFoundation

class AudioAlertManager {
    
    private var audioPlayer: AVAudioPlayer?
    private var speechSynthesizer = AVSpeechSynthesizer()
    
    init() {
        setupAudioSession()
    }
    
    private func setupAudioSession() {
        try? AVAudioSession.sharedInstance().setCategory(
            .playback,
            mode: .default,
            options: [.mixWithOthers, .duckOthers] // Bajar volumen de música
        )
        try? AVAudioSession.sharedInstance().setActive(true)
    }
    
    func playAlertForDistance(_ distance: Double) {
        switch distance {
        case ..<100:
            // Alerta urgente: pitido rápido + voz
            playBeep(frequency: 1000, duration: 0.2, times: 3)
            speak("Radar muy cercano")
        case 100..<300:
            playBeep(frequency: 800, duration: 0.3, times: 2)
        case 300..<500:
            playBeep(frequency: 600, duration: 0.5, times: 1)
            speak("Radar en \(Int(distance)) metros")
        default:
            break
        }
    }
    
    // Síntesis de voz (no requiere archivos de audio)
    func speak(_ text: String) {
        let utterance = AVSpeechUtterance(string: text)
        utterance.voice = AVSpeechSynthesisVoice(language: "es-ES")
        utterance.rate = 0.5
        utterance.volume = 0.8
        speechSynthesizer.speak(utterance)
    }
    
    func stopAlert() {
        audioPlayer?.stop()
        speechSynthesizer.stopSpeaking(at: .immediate)
    }
    
    private func playBeep(frequency: Double, duration: Double, times: Int) {
        // Generar beep programáticamente con AVAudioEngine
        // Implementación completa en la documentación de AVFoundation
    }
}
```

### Checklist de esta fase

- [ ] Crear `AudioAlertManager.swift`
- [ ] Probar `AVSpeechSynthesizer` — es lo más rápido de implementar
- [ ] Verificar que el audio funciona con pantalla apagada y con auriculares Bluetooth
- [ ] Añadir opción en Settings para elegir el idioma de las alertas de voz
- [ ] Probar que la música/podcast se reduce cuando suena la alerta (`duckOthers`)

---

## 🎛️ Fase 8 — UI y configuración

> La UI de esta app es mínima pero debe ser clara. El usuario la configura una vez y luego no la toca.

### Pantalla principal — ContentView.swift

La pantalla principal debería mostrar:

- Estado de la app (activa/inactiva)
- Radar más cercano y distancia
- Botón de inicio/parada

```swift
struct ContentView: View {
    @StateObject var engine: RadarEngine
    @StateObject var locationManager: LocationManager
    
    var body: some View {
        VStack(spacing: 30) {
            // Estado
            Circle()
                .fill(engine.isAlertActive ? .red : .green)
                .frame(width: 20, height: 20)
            
            // Info del radar más cercano
            if let radar = engine.nearestRadar {
                VStack {
                    Text("⚠️ Radar detectado")
                        .font(.headline)
                    Text("\(Int(engine.distanceToNearest))m")
                        .font(.system(size: 60, weight: .bold))
                    if let limit = radar.speedLimit {
                        Text("Límite: \(limit) km/h")
                    }
                }
            } else {
                Text("Sin radares cercanos")
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            // Botón de configuración
            NavigationLink("⚙️ Configuración") {
                SettingsView()
            }
        }
        .padding()
        .navigationTitle("RadarMoto")
    }
}
```

### Pantalla de configuración — SettingsView.swift

```swift
struct SettingsView: View {
    @AppStorage("alertMode") var alertMode: String = "haptic"
    @AppStorage("alertRadius") var alertRadius: Double = 500
    @AppStorage("downloadRadius") var downloadRadius: Double = 50000
    
    var body: some View {
        Form {
            Section("Modo de alerta") {
                Picker("Tipo de alerta", selection: $alertMode) {
                    Text("Vibración (moto)").tag("haptic")
                    Text("Sonido (coche)").tag("audio")
                    Text("Ambos").tag("both")
                }
                .pickerStyle(.segmented)
            }
            
            Section("Distancia de alerta") {
                VStack(alignment: .leading) {
                    Text("Alertar a \(Int(alertRadius))m")
                    Slider(value: $alertRadius, in: 100...1000, step: 50)
                }
            }
            
            Section("Descarga de datos") {
                VStack(alignment: .leading) {
                    Text("Radio: \(Int(downloadRadius/1000))km")
                    Slider(value: $downloadRadius, in: 10000...100000, step: 10000)
                }
                Button("Actualizar radares ahora") {
                    // Forzar descarga desde Overpass
                }
            }
            
            Section("Información") {
                Text("Fuente de datos: OpenStreetMap")
                Text("Versión: 1.0.0")
            }
        }
        .navigationTitle("Configuración")
    }
}
```

### Checklist de esta fase

- [ ] Implementar `ContentView.swift` con el estado del radar más cercano
- [ ] Implementar `SettingsView.swift` con los toggles de modo moto/coche
- [ ] Usar `@AppStorage` para persistir preferencias automáticamente
- [ ] Añadir pantalla de onboarding (primera vez que abre la app → pedir permisos)
- [ ] Probar que la UI se actualiza en tiempo real cuando cambia la distancia

---

## 🧪 Fase 9 — Pruebas reales

> El simulador de Xcode no sirve para esta app. Necesitas pruebas en carretera.

### Pruebas en escritorio antes de salir

- [ ] **Simular movimiento**: Xcode → Debug → Simulate Location → seguir una ruta
- [ ] **Probar con radares cercanos hardcodeados** a 10m, 50m, 100m, 300m, 600m
- [ ] **Verificar en consola** que los logs muestran las actualizaciones GPS
- [ ] **Comprobar batería**: dejar la app corriendo 1 hora con pantalla apagada y medir consumo

### Checklist de pruebas en carretera

- [ ] Montar el iPhone en el bolsillo con la app activa
- [ ] Pasar por radares conocidos y verificar que la vibración empieza a tiempo
- [ ] Comprobar que la vibración escala correctamente al acercarse
- [ ] Verificar que para al alejarse
- [ ] Probar en túneles (pérdida de GPS) — la app debe recuperarse al salir
- [ ] Probar con auriculares Bluetooth conectados (modo audio)
- [ ] Medir consumo de batería en una ruta de 1 hora

### Depuración remota

- Conecta el iPhone por USB mientras conduces (o pide a alguien que conduzca)
- Xcode → Window → Devices and Simulators → ver logs en tiempo real
- O usar `OSLog` para logs que se pueden ver después en Instruments

---

## ☁️ Fase 10 — Backend propio (escalado futuro)

> Esta fase es para cuando quieras abrir la app a otros usuarios o añadir radares reportados por la comunidad.

### Stack recomendado

- **Python + FastAPI** — rápido de desarrollar, fácil de escalar
- **Supabase** — PostgreSQL con PostGIS para queries geoespaciales
- **Railway o Render** — hosting sencillo para el backend (tienen plan gratuito)

### Endpoints a implementar

```
GET  /radars?lat=40.4&lon=-3.7&radius=50000  → radares en zona
POST /radars                                  → reportar radar nuevo
POST /radars/{id}/confirm                     → confirmar radar existente
POST /radars/{id}/deny                        → marcar como incorrecto
GET  /radars/updates?since=2024-01-01         → radares actualizados
```

### Modelo en PostgreSQL con PostGIS

```sql
CREATE TABLE radars (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location    GEOGRAPHY(POINT, 4326) NOT NULL,
    type        VARCHAR(20) NOT NULL DEFAULT 'fixed',
    speed_limit INTEGER,
    direction   FLOAT,
    country     VARCHAR(2) DEFAULT 'ES',
    confirmed   INTEGER DEFAULT 0,
    denied      INTEGER DEFAULT 0,
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);

-- Índice geoespacial para queries rápidas
CREATE INDEX idx_radars_location ON radars USING GIST(location);

-- Query de ejemplo: radares en 50km
SELECT *, ST_Distance(location, ST_MakePoint(-3.7, 40.4)::geography) as distance
FROM radars
WHERE ST_DWithin(location, ST_MakePoint(-3.7, 40.4)::geography, 50000)
ORDER BY distance;
```

### Checklist de esta fase

- [ ] Crear cuenta en Supabase y activar extensión PostGIS
- [ ] Crear la tabla `radars` con el esquema geoespacial
- [ ] Importar los datos de Overpass a Supabase (script Python)
- [ ] Crear el backend con FastAPI
- [ ] Implementar el endpoint de consulta por zona
- [ ] Actualizar `OverpassService.swift` → `RadarAPIService.swift` para usar tu backend
- [ ] Implementar endpoint de reporte de nuevos radares
- [ ] Añadir autenticación básica (API key por usuario)
- [ ] Desplegar en Railway/Render

---

## 📱 Fase 11 — Publicación en App Store

> Para uso personal no necesitas esto. Solo si quieres distribuirlo a otros.

### Requisitos previos

- [ ] **Apple Developer Program** — $99/año en https://developer.apple.com/programs/
- [ ] **App Store Connect** — https://appstoreconnect.apple.com

### Preparación de la app

- [ ] Crear icono de app (1024x1024 PNG) — puedes usar Figma o Canva
- [ ] Crear screenshots para todas las pantallas requeridas
- [ ] Escribir descripción en App Store (inglés + español)
- [ ] Configurar Privacy Policy (obligatorio si usas localización)
    - Puedes usar un generador gratuito como privacypolicygenerator.info
- [ ] Revisar App Store Guidelines — especialmente las de localización en background

### Proceso de subida

- [ ] En Xcode: Product → Archive
- [ ] Subir a App Store Connect via Xcode Organizer
- [ ] Rellenar metadata: descripción, categoría, clasificación de edad
- [ ] Marcar que la app usa localización en background y justificar el uso
- [ ] Enviar para revisión (Apple tarda 1-3 días)

### Aviso importante sobre background location

Apple revisa con lupa las apps que usan localización en background. Debes justificar claramente que es necesario para la funcionalidad core. Para esta app es obvio (detector de radares), pero la descripción debe dejarlo claro.

---

## 📖 Recursos y referencias

### Documentación oficial de Apple

- [CoreLocation Documentation](https://developer.apple.com/documentation/corelocation)
- [CoreHaptics Documentation](https://developer.apple.com/documentation/corehaptics)
- [SwiftData Documentation](https://developer.apple.com/documentation/swiftdata)
- [AVFoundation Documentation](https://developer.apple.com/documentation/avfoundation)
- [Background Execution Guide](https://developer.apple.com/documentation/uikit/app_and_environment/scenes/preparing_your_ui_to_run_in_the_background)

### Aprendizaje

- [Hacking with Swift](https://www.hackingwithswift.com/) — mejor recurso gratuito de iOS
- [Swift Documentation](https://docs.swift.org/) — documentación oficial del lenguaje
- [WWDC Sessions](https://developer.apple.com/videos/) — vídeos de Apple sobre CoreHaptics, CoreLocation, etc.
    - Buscar: "Introducing Core Haptics" (WWDC 2019)
    - Buscar: "What's new in CoreLocation" (últimas ediciones)

### Herramientas útiles

- [Overpass Turbo](https://overpass-turbo.eu/) — para probar queries de Overpass en el mapa visualmente
- [OSM Spain Radars](https://www.openstreetmap.org/) — ver radares existentes en OSM
- [Instruments (Xcode)](https://developer.apple.com/tutorials/data/doc/instruments) — para medir consumo de batería y CPU
- [SF Symbols](https://developer.apple.com/sf-symbols/) — iconos nativos de Apple para la UI

### Librerías Swift útiles (opcionales)

- No se necesitan librerías externas para el MVP — todo con frameworks nativos de Apple
- Si en el futuro quieres mapas: [MapKit](https://developer.apple.com/documentation/mapkit) (nativo y gratuito)

---

## 🗒️ Notas personales

> Usa este espacio para ir anotando decisiones técnicas, problemas encontrados y soluciones.

### Decisiones tomadas

- Stack: Swift + SwiftUI + CoreLocation + CoreHaptics + SwiftData
- Fuente de datos inicial: Overpass API (OpenStreetMap)
- Backend futuro: FastAPI + Supabase
- Offline-first: los radares se cachean localmente

### Problemas encontrados

### Ideas para futuras versiones

- [ ] Modo carretera vs ciudad (diferentes umbrales de distancia)
- [ ] Integración con Apple Watch (vibración en la muñeca)
- [ ] Widget de iOS con el radar más cercano
- [ ] Compartir radares entre usuarios (backend propio)
- [ ] Importar rutas desde Apple Maps y pre-descargar radares del trayecto
- [ ] Soporte para Android (Kotlin Multiplatform)

---

_Proyecto iniciado: 2026_ _Stack: Swift · SwiftUI · CoreLocation · CoreHaptics · SwiftData · Overpass API_