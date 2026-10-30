import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Radar } from '../core/radar';
import { colors, radius } from './theme';

interface Props {
  radar: Radar | null;
  onClose: () => void;
}

export function RadarDetailSheet({ radar, onClose }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={radar !== null} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Cerrar" />
      {radar && (
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}>
          <View style={styles.handle} />
          <View style={styles.row}>
            <View style={styles.icon}>
              <Ionicons name="camera" size={26} color="#fff" />
            </View>
            <View style={styles.texts}>
              <Text style={styles.title}>Radar de velocidad</Text>
              {radar.speedLimit ? (
                <Text style={styles.limit}>Límite: {radar.speedLimit} km/h</Text>
              ) : (
                <Text style={styles.secondary}>Límite: no disponible</Text>
              )}
              <Text style={styles.secondary}>
                {radar.directions.length
                  ? `Dirección: ${radar.directions.map((d) => `${Math.round(d)}°`).join(' / ')}`
                  : 'Controla ambos sentidos (o sin dato de dirección)'}
              </Text>
            </View>
          </View>
          <Text style={styles.osm}>OpenStreetMap nodo {radar.id}</Text>
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius,
    borderTopRightRadius: radius,
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 16,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.separator,
  },
  row: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1, gap: 2 },
  title: { fontSize: 17, fontWeight: '700', color: colors.text },
  limit: { fontSize: 22, fontWeight: '800', color: colors.danger },
  secondary: { fontSize: 14, color: colors.textSecondary },
  osm: { fontSize: 12, color: colors.textSecondary, textAlign: 'center' },
});
