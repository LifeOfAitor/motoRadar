import Ionicons from '@expo/vector-icons/Ionicons';
import {
  Camera,
  GeoJSONSource,
  Layer,
  Map,
  NativeUserLocation,
} from '@maplibre/maplibre-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Radar } from '../core/radar';
import { allRadars } from '../data/radarStore';
import { engineStore } from '../engine/engine';
import { colors, radius } from './theme';

/** Free OpenStreetMap vector tiles, no API key. Muted style so radars stand out. */
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/positron';

interface Props {
  onSelectRadar: (radar: Radar) => void;
}

export function RadarMap({ onSelectRadar }: Props) {
  const radarsVersion = engineStore.use((s) => s.radarsVersion);
  const alertId = engineStore.use((s) => s.alert?.radar.id ?? '');
  const [radars, setRadars] = useState<Radar[]>([]);
  const [following, setFollowing] = useState(true);

  useEffect(() => {
    allRadars().then(setRadars).catch(() => setRadars([]));
  }, [radarsVersion]);

  const byId = useMemo(() => new globalThis.Map(radars.map((r) => [r.id, r])), [radars]);
  const shape = useMemo<GeoJSON.FeatureCollection>(
    () => ({
      type: 'FeatureCollection',
      features: radars.map((r) => ({
        type: 'Feature',
        id: r.id,
        geometry: { type: 'Point', coordinates: [r.longitude, r.latitude] },
        properties: { id: r.id, limit: r.speedLimit ? String(r.speedLimit) : '' },
      })),
    }),
    [radars],
  );

  return (
    <View style={styles.container}>
      <Map style={StyleSheet.absoluteFill} mapStyle={MAP_STYLE} compass={false} logo={false} touchPitch={false}>
        <Camera
          initialViewState={{ zoom: 15 }}
          trackUserLocation={following ? 'course' : undefined}
          onTrackUserLocationChange={(e) => setFollowing(e.nativeEvent.trackUserLocation !== null)}
        />
        <NativeUserLocation mode="course" />
        <GeoJSONSource
          id="radars"
          data={shape}
          onPress={(e) => {
            const id = e.nativeEvent.features[0]?.properties?.id;
            const radar = id ? byId.get(String(id)) : undefined;
            if (radar) onSelectRadar(radar);
          }}
        >
          <Layer
            id="radar-circles"
            type="circle"
            paint={{
              'circle-radius': ['case', ['==', ['get', 'id'], alertId], 16, 12],
              'circle-color': ['case', ['==', ['get', 'id'], alertId], colors.danger, colors.warning],
              'circle-stroke-color': '#FFFFFF',
              'circle-stroke-width': 2,
            }}
          />
          <Layer
            id="radar-limits"
            type="symbol"
            layout={{
              'text-field': ['get', 'limit'],
              'text-font': ['Noto Sans Bold'],
              'text-size': 11,
              'text-allow-overlap': true,
              'text-ignore-placement': true,
            }}
            paint={{ 'text-color': '#FFFFFF' }}
          />
        </GeoJSONSource>
      </Map>

      {!following && (
        <Pressable
          style={styles.recenter}
          onPress={() => setFollowing(true)}
          accessibilityRole="button"
          accessibilityLabel="Centrar en mi posición"
        >
          <Ionicons name="navigate" size={22} color={colors.accent} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: radius,
    overflow: 'hidden',
    backgroundColor: colors.separator,
  },
  recenter: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
});
