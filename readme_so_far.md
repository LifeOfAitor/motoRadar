# RadarMoto — Estado actual del proyecto

**Última actualización:** 2026-05-16
**Estado:** Fases 1–8 completadas. Segunda iteración de feedback aplicada tras prueba en carretera.

---

## Qué hace la app ahora mismo

- Descarga radares de OpenStreetMap (Overpass API) en un radio de 100 km al arrancar
- Monitoriza la posición GPS en segundo plano
- Vibra con intensidad fuerte y frecuente según la distancia al radar (UIImpactFeedbackGenerator .heavy)
- Filtra radares del carril contrario: comprueba que el radar esté delante (90°) Y que su dirección coincida con tu sentido de marcha (60°)
- Para de alertar al pasar el radar: distancia creciente >60 m desde el punto más cercano, O radar a >120° de tu heading
- Anuncia por voz en español, bajando la música solo mientras habla (restaura volumen al terminar)
- Mapa Waze-style con todos los radares cargados, flecha de dirección y pins tapeables con info de velocidad
- Velocidad GPS en tiempo real en la barra inferior
- Botón de mute en la barra inferior (persistente entre sesiones)
- Sin botón start/stop — siempre activo al abrir la app

---

## Mapa de archivos

### Raíz

| Archivo | Para qué sirve |
|---|---|
| `readme.md` | Plan original del proyecto (especificación completa, 39 KB) |
| `readme_so_far.md` | Este archivo |
| `CLAUDE.md` | Instrucciones para Claude Code |
| `project.yml` | Spec XcodeGen. Regenerar con `xcodegen generate` |
| `RadarMoto.xcodeproj` | Proyecto Xcode generado. No editar a mano |

---

### `RadarMoto/App/`

| Archivo | Para qué sirve |
|---|---|
| `RadarMotoApp.swift` | Punto de entrada. Crea contenedor SwiftData y `RadarEngine` |

---

### `RadarMoto/Core/`

| Archivo | Para qué sirve |
|---|---|
| `LocationManager.swift` | Envuelve CLLocationManager. Publica `location` y `heading`. Background updates, `distanceFilter = 10 m` |
| `HapticManager.swift` | `UIImpactFeedbackGenerator(.heavy)`. Timer con `RunLoop.main(.common)` para que dispare incluso durante interacción UI. Siempre reinicia limpio al llamar `trigger`. Intervalos: 0.25 s (<50 m), 0.5 s (50–150 m), 1 s (150–300 m), 2 s (300–500 m) |
| `RadarEngine.swift` | Orquestador central (`@MainActor`). Detección de paso con check de distancia + check de ángulo. Filtro de carril con `isRelevant`. Respeta `isMuted`. Publica `nearbyRadars` para el mapa |

---

### `RadarMoto/Data/`

| Archivo | Para qué sirve |
|---|---|
| `Radar.swift` | Modelo SwiftData. `isRelevant(for:heading:)` combina check geométrico (90°) + check de dirección del radar (60°). `CLLocationCoordinate2D.bearing(to:)` es `internal` para usarlo desde RadarEngine |
| `RadarStore.swift` | CRUD SwiftData. `radarsNearby` para alertas, `fetchAll()` para el mapa |
| `OverpassService.swift` | Overpass API, radio 100 km, timeout 60 s |

---

### `RadarMoto/Audio/`

| Archivo | Para qué sirve |
|---|---|
| `AudioAlertManager.swift` | TTS español. La sesión AVAudio solo se activa justo antes de hablar y se desactiva al terminar (`AVSpeechSynthesizerDelegate`). Esto evita que la música baje permanentemente |

---

### `RadarMoto/Settings/`

| Archivo | Para qué sirve |
|---|---|
| `SettingsManager.swift` | Singleton `ObservableObject`. Ajustes: `alertMode`, `alertRadius`, `directionFilterEnabled`, `hapticIntensity` (0.3–1.0), `isMuted` |

---

### `RadarMoto/UI/`

| Archivo | Para qué sirve |
|---|---|
| `ContentView.swift` | Pantalla principal. Barra inferior con botón mute + velocidad GPS. Tarjeta de alerta compacta. Mapa Waze-style |
| `SettingsView.swift` | Ajustes: modo, radio, slider intensidad, filtro dirección, refresco, estado GPS |
| `RadarMapView` (en ContentView.swift) | Mapa muted sin POIs. Flecha azul direccional. Pins tapeables que abren `RadarDetailSheet` |
| `RadarDetailSheet` (en ContentView.swift) | Sheet al tapear un radar: límite de velocidad, dirección, ID OSM |

---

## Comportamientos clave no obvios

| Comportamiento | Dónde |
|---|---|
| Filtro de carril: geométrico (90°) + dirección del radar (60°) | `Radar.isRelevant(for:heading:)` |
| Detección de paso: distancia >60 m desde mínimo, O ángulo >120° | `RadarEngine.processLocation` |
| Audio solo activo mientras habla, música vuelve al volumen normal | `AudioAlertManager` + `AVSpeechSynthesizerDelegate` |
| Mute persiste entre sesiones | `SettingsManager.isMuted` en UserDefaults |
| Haptics no funcionan con pantalla apagada | Limitación iOS, no resoluble. Usar modo Audio o Both para bolsillo |
| Mapa muestra todos los radares descargados (100 km) | `RadarStore.fetchAll()` |

---

## Fases del proyecto

| Fase | Descripción | Estado |
|---|---|---|
| 1–8 | Desarrollo completo | ✅ |
| 9 | Pruebas en carretera | 🔄 En curso |
| 10 | Backend FastAPI + Supabase + PostGIS | 🔲 |
| 11 | App Store | 🔲 |
| — | Widget pantalla inicio | 🔲 Pendiente (requiere WidgetExtension) |

---

## Comandos

```bash
xcodegen generate   # regenerar .xcodeproj tras cambiar project.yml
```
