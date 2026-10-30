import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { formatDistance } from '../core/format';
import { engineStore } from '../engine/engine';
import { colors, radius } from './theme';

export function AlertCard() {
  const alert = engineStore.use((s) => s.alert);

  if (!alert) {
    return (
      <View style={styles.card}>
        <Ionicons name="shield-checkmark" size={32} color={colors.ok} />
        <Text style={styles.idle}>Sin radares próximos</Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, styles.active]} accessibilityLiveRegion="polite">
      <Ionicons name="warning" size={40} color={colors.danger} />
      <View style={styles.texts}>
        <Text style={styles.distance}>{formatDistance(alert.distance)}</Text>
        <Text style={styles.subtitle}>
          {alert.radar.speedLimit ? `Límite ${alert.radar.speedLimit} km/h` : 'Radar de velocidad'}
        </Text>
      </View>
      {alert.radar.speedLimit ? (
        <View style={styles.sign}>
          <Text style={styles.signText}>{alert.radar.speedLimit}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: radius,
    backgroundColor: colors.card,
  },
  active: {
    borderWidth: 2,
    borderColor: colors.danger,
  },
  idle: { fontSize: 17, fontWeight: '600', color: colors.textSecondary },
  texts: { flex: 1 },
  distance: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  subtitle: { fontSize: 15, color: colors.textSecondary },
  sign: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 6,
    borderColor: colors.danger,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signText: { fontSize: 24, fontWeight: '800', color: colors.text },
});
