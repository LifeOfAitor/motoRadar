# RadarMoto

Aplicación de detección de radares en segundo plano para iOS. Diseñada para usarse mientras vas en moto con el móvil en el bolsillo — sin necesidad de tocar la pantalla. La app detecta radares de velocidad a partir de una base de datos local y avisa al conductor mediante vibración háptica progresiva que aumenta de intensidad según te acercas.

---

## Funcionalidades

- Seguimiento GPS en segundo plano sin necesidad de mantener la pantalla encendida
- Vibración háptica progresiva que aumenta de intensidad a medida que te acercas a un radar
- Modo de alertas por audio para uso en coche (síntesis de voz + pitidos)
- Funciona sin conexión: los datos de radares se almacenan en local y funcionan sin cobertura
- Datos de radares obtenidos de OpenStreetMap mediante la API de Overpass
- Radio de alerta y modo de alerta configurables (háptico / audio / ambos)

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Lenguaje | Swift |
| Interfaz | SwiftUI |
| GPS | CoreLocation |
| Hápticos | CoreHaptics |
| Audio | AVFoundation |
| Almacenamiento local | SwiftData |
| Fuente de datos de radares | Overpass API (OpenStreetMap) |
| Backend futuro | FastAPI + Supabase (PostGIS) |

---

## Requisitos

- Xcode 15 o posterior
- iOS 17 o posterior
- Un iPhone físico (CoreHaptics y GPS en segundo plano no están soportados en el simulador)
- Cuenta de Apple Developer (el nivel gratuito es suficiente para uso personal)

---

## Estructura del Proyecto

```
RadarMoto/
├── App/
│   └── RadarMotoApp.swift          # Punto de entrada y configuración del contenedor SwiftData
├── Core/
│   ├── RadarEngine.swift           # Lógica central: detección de proximidad y despacho de alertas
│   ├── LocationManager.swift       # Wrapper de CoreLocation con soporte en segundo plano
│   └── HapticManager.swift         # Patrones de CoreHaptics escalados por proximidad
├── Data/
│   ├── RadarStore.swift            # Consultas y persistencia con SwiftData
│   ├── OverpassService.swift       # Cliente de la API de Overpass para obtener datos de radares
│   └── Models/
│       └── Radar.swift             # Modelo de datos de radar
├── Audio/
│   └── AudioAlertManager.swift     # Alertas de audio con AVFoundation para modo coche
├── Settings/
│   └── SettingsManager.swift       # Preferencias de usuario mediante AppStorage
└── UI/
    ├── ContentView.swift           # Pantalla principal
    ├── SettingsView.swift          # Pantalla de configuración
    └── RadarListView.swift         # Lista de radares cercanos (opcional)
```

---

## Primeros Pasos

1. Clona el repositorio
2. Abre `RadarMoto.xcodeproj` en Xcode
3. Selecciona tu equipo de Apple Developer en `Signing & Capabilities`
4. Conecta un iPhone físico
5. Compila y ejecuta (`Cmd + R`)

En el primer inicio la app pedirá permisos de localización. Selecciona **Permitir siempre** — el acceso a la ubicación en segundo plano es necesario para que la app funcione con la pantalla apagada.

---

## Cómo Funciona

### Proximidad y escalado háptico

La app comprueba la distancia al radar más cercano en cada actualización GPS y la convierte en una intensidad de vibración:

| Distancia | Intensidad háptica | Patrón |
|---|---|---|
| > 500m | Ninguna | Silencio |
| 300 – 500m | 0.2 | Un pulso cada 3 segundos |
| 150 – 300m | 0.4 | Un pulso cada 2 segundos |
| 50 – 150m | 0.7 | Un pulso cada segundo |
| < 50m | 1.0 | Vibración continua |

### Datos de radares

En el primer inicio (o cuando la caché local tiene más de 7 días), la app consulta la API de Overpass para descargar todos los nodos `highway=speed_camera` dentro de un radio configurable (por defecto 50 km) y los almacena localmente en SwiftData. Los siguientes inicios usan la caché local, por lo que la app funciona sin conexión a internet.

### Modos de alerta

- **Modo háptico** — pensado para uso en moto con el móvil en el bolsillo de la chaqueta
- **Modo audio** — pensado para uso en coche con el móvil en un soporte; usa AVSpeechSynthesizer para avisos por voz y pitidos programáticos mediante AVAudioEngine
- **Ambos** — háptico y audio simultáneamente

---

## Permisos

Las siguientes entradas son necesarias en `Info.plist`:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>RadarMoto necesita tu ubicación para detectar radares de velocidad cercanos.</string>

<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>RadarMoto necesita acceso a la ubicación en segundo plano para avisarte con la pantalla apagada.</string>

<key>NSLocationAlwaysUsageDescription</key>
<string>RadarMoto necesita acceso continuo a la ubicación para funcionar con el móvil en el bolsillo.</string>
```

Se deben activar los Background Modes en `Signing & Capabilities` con **Location updates** marcado.

---

## Fuente de Datos de Radares

Los datos de radares se obtienen de [OpenStreetMap](https://www.openstreetmap.org) mediante la [API de Overpass](https://overpass-api.de). Concretamente, nodos etiquetados con `highway=speed_camera`.

La cobertura y precisión dependen de las contribuciones de la comunidad OSM en cada región. España tiene buena cobertura. Puedes ver y contribuir a los datos de radares en [openstreetmap.org](https://www.openstreetmap.org).

---

## Hoja de Ruta

- [ ] MVP principal: GPS en segundo plano + CoreHaptics + caché local de radares
- [ ] Integración con API de Overpass con caché offline
- [ ] Modo de alerta por audio para uso en coche
- [ ] Filtrado por dirección (solo alertar de radares por delante, no por detrás)
- [ ] Backend propio con FastAPI y Supabase para radares reportados por la comunidad
- [ ] Soporte para Apple Watch
- [ ] Publicación en App Store

---

## Licencia

Este proyecto es de uso personal. No se ha definido una licencia todavía.s
