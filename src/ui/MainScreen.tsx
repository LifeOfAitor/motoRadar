import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatSpeed } from '../core/format';
import type { Radar } from '../core/radar';
import { settingsStore, updateSettings } from '../data/settings';
import { engineStore, loadCacheInfo, refreshRadars, type PermissionLevel } from '../engine/engine';
import { startTracking } from '../engine/tracking';
import { AlertCard } from './AlertCard';
import { RadarDetailSheet } from './RadarDetailSheet';
import { RadarMap } from './RadarMap';
import { SettingsSheet } from './SettingsSheet';
import { colors } from './theme';

const STATUS: Record<PermissionLevel, { text: string; color: string }> = {
  always: { text: 'GPS activo', color: colors.ok },
  foreground: { text: 'GPS solo con la app abierta', color: colors.caution },
  denied: { text: 'GPS denegado', color: colors.danger },
  undetermined: { text: 'Esperando permiso de GPS', color: colors.textSecondary },
};

export function MainScreen() {
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [selectedRadar, setSelectedRadar] = useState<Radar | null>(null);
  const isAlert = engineStore.use((s) => s.alert !== null);
  const permission = engineStore.use((s) => s.permission);
  const radarCount = engineStore.use((s) => s.radarCount);

  // Always on: no start/stop button. Re-check permissions each time the app comes back,
  // in case the user just granted "Siempre" in the system settings.
  useEffect(() => {
    void loadCacheInfo();
    void startTracking();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void startTracking();
    });
    return () => subscription.remove();
  }, []);

  return (
    <SafeAreaView style={[styles.screen, isAlert && styles.screenAlert]}>
      <View style={styles.topBar}>
        <RefreshButton />
        <View style={styles.status}>
          <View style={[styles.dot, { backgroundColor: STATUS[permission].color }]} />
          <Text style={styles.statusText} numberOfLines={1}>
            {STATUS[permission].text}
          </Text>
          {radarCount > 0 && <Text style={styles.count}>· {radarCount} radares</Text>}
        </View>
        <Pressable onPress={() => setSettingsVisible(true)} hitSlop={12} accessibilityLabel="Ajustes">
          <Ionicons name="settings-sharp" size={24} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.body}>
        <AlertCard />
        <RadarMap onSelectRadar={setSelectedRadar} />
      </View>

      <BottomBar />

      <SettingsSheet visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
      <RadarDetailSheet radar={selectedRadar} onClose={() => setSelectedRadar(null)} />
    </SafeAreaView>
  );
}

function RefreshButton() {
  const refreshing = engineStore.use((s) => s.refreshing);
  const hasFix = engineStore.use((s) => s.fix !== null);
  if (refreshing) return <ActivityIndicator style={styles.iconSlot} />;
  return (
    <Pressable
      style={styles.iconSlot}
      disabled={!hasFix}
      onPress={() => {
        const fix = engineStore.get().fix;
        if (fix) void refreshRadars(fix);
      }}
      hitSlop={12}
      accessibilityLabel="Actualizar radares"
    >
      <Ionicons name="refresh" size={24} color={hasFix ? colors.text : colors.separator} />
    </Pressable>
  );
}

function BottomBar() {
  const muted = settingsStore.use((s) => s.muted);
  const speed = engineStore.use((s) => s.fix?.speed ?? null);
  return (
    <View style={styles.bottomBar}>
      <Pressable
        style={[styles.muteButton, muted && styles.muteButtonOn]}
        onPress={() => updateSettings({ muted: !muted })}
        accessibilityRole="switch"
        accessibilityState={{ checked: muted }}
      >
        <Ionicons name={muted ? 'notifications-off' : 'notifications'} size={22} color={muted ? '#fff' : colors.text} />
        <Text style={[styles.muteText, muted && styles.muteTextOn]}>{muted ? 'Silenciado' : 'Avisos activos'}</Text>
      </Pressable>
      <Text style={styles.speed}>
        {formatSpeed(speed)} <Text style={styles.speedUnit}>km/h</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  screenAlert: { backgroundColor: colors.alertBackground },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  iconSlot: { width: 24, height: 24 },
  status: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { fontSize: 13, color: colors.textSecondary, flexShrink: 1 },
  count: { fontSize: 13, color: colors.textSecondary },
  body: { flex: 1, paddingHorizontal: 16, gap: 12 },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  muteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: colors.card,
  },
  muteButtonOn: { backgroundColor: colors.textSecondary },
  muteText: { fontSize: 15, fontWeight: '600', color: colors.text },
  muteTextOn: { color: '#fff' },
  speed: { fontSize: 28, fontWeight: '800', color: colors.text, fontVariant: ['tabular-nums'] },
  speedUnit: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
});
