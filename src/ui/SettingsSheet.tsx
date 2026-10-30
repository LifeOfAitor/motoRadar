import Slider from '@react-native-community/slider';
import type { ReactNode } from 'react';
import { Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { testVibration } from '../alerts/vibrator';
import { speak } from '../alerts/voice';
import { announcementText } from '../core/format';
import { MAX_INTENSITY, MIN_INTENSITY, vibrationBand } from '../core/vibration';
import { RADIUS_OPTIONS, settingsStore, updateSettings } from '../data/settings';
import { engineStore, refreshRadars, type PermissionLevel } from '../engine/engine';
import { colors, radius } from './theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const PERMISSION_LABEL: Record<PermissionLevel, { text: string; color: string }> = {
  always: { text: 'Siempre (funciona bloqueado)', color: colors.ok },
  foreground: { text: 'Solo con la app abierta', color: colors.caution },
  denied: { text: 'Denegado', color: colors.danger },
  undetermined: { text: 'Sin determinar', color: colors.textSecondary },
};

export function SettingsSheet({ visible, onClose }: Props) {
  const settings = settingsStore.use((s) => s);
  const { radarCount, refreshing, refreshError, lastFetchAt, permission, fix } = engineStore.use((s) => s);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen} edges={['bottom']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Ajustes</Text>
          <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button">
            <Text style={styles.done}>Hecho</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Section title="Vibración">
            <ToggleRow
              label="Vibrar al acercarse"
              value={settings.vibrationEnabled}
              onChange={(v) => updateSettings({ vibrationEnabled: v })}
            />
            {settings.vibrationEnabled && (
              <>
                <View style={styles.row}>
                  <Text style={styles.label}>Potencia</Text>
                  <Text style={styles.value}>{Math.round(settings.vibrationIntensity * 100)}%</Text>
                </View>
                <Slider
                  minimumValue={MIN_INTENSITY}
                  maximumValue={MAX_INTENSITY}
                  step={0.05}
                  value={settings.vibrationIntensity}
                  onSlidingComplete={(v) => updateSettings({ vibrationIntensity: v })}
                  minimumTrackTintColor={colors.danger}
                />
                <Pressable
                  style={styles.button}
                  onPress={() => testVibration(vibrationBand(100, settingsStore.get().vibrationIntensity))}
                >
                  <Text style={styles.buttonText}>Probar vibración</Text>
                </Pressable>
              </>
            )}
            <Footer>
              {Platform.OS === 'ios'
                ? 'En iPhone la vibración siempre tiene la máxima potencia del sistema; cambia la frecuencia según la distancia.'
                : 'Más cerca del radar = vibración más frecuente. Por debajo de 50 m es casi continua.'}
            </Footer>
          </Section>

          <Section title="Voz">
            <ToggleRow
              label="Avisar por voz"
              value={settings.voiceEnabled}
              onChange={(v) => updateSettings({ voiceEnabled: v })}
            />
            <Pressable style={styles.button} onPress={() => speak(announcementText(500, 80))}>
              <Text style={styles.buttonText}>Probar voz</Text>
            </Pressable>
            <Footer>Un único aviso cuando se detecta el radar, p. ej. “Radar a 500 metros, límite 80”.</Footer>
          </Section>

          <Section title="Radio de alerta">
            <View style={styles.segmented}>
              {RADIUS_OPTIONS.map((r) => (
                <Pressable
                  key={r}
                  style={[styles.segment, settings.alertRadius === r && styles.segmentActive]}
                  onPress={() => updateSettings({ alertRadius: r })}
                  accessibilityState={{ selected: settings.alertRadius === r }}
                >
                  <Text style={[styles.segmentText, settings.alertRadius === r && styles.segmentTextActive]}>
                    {r} m
                  </Text>
                </Pressable>
              ))}
            </View>
          </Section>

          <Section title="Filtro de carril">
            <ToggleRow
              label="Ignorar radares del sentido contrario"
              value={settings.laneFilterEnabled}
              onChange={(v) => updateSettings({ laneFilterEnabled: v })}
            />
            <Footer>Solo afecta a radares con dirección registrada en OpenStreetMap.</Footer>
          </Section>

          <Section title="Radares">
            <View style={styles.row}>
              <Text style={styles.label}>Guardados</Text>
              <Text style={styles.value}>{radarCount}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Última descarga</Text>
              <Text style={styles.value}>
                {lastFetchAt ? new Date(lastFetchAt).toLocaleDateString('es-ES') : 'Nunca'}
              </Text>
            </View>
            <Pressable
              style={[styles.button, (!fix || refreshing) && styles.buttonDisabled]}
              disabled={!fix || refreshing}
              onPress={() => fix && refreshRadars(fix)}
            >
              <Text style={styles.buttonText}>{refreshing ? 'Descargando…' : 'Actualizar ahora'}</Text>
            </Pressable>
            {refreshError && <Footer color={colors.danger}>{refreshError}</Footer>}
            <Footer>Se actualizan solos cada 7 días o al alejarte más de 40 km.</Footer>
          </Section>

          <Section title="Ubicación">
            <View style={styles.row}>
              <Text style={styles.label}>Permiso</Text>
              <Text style={[styles.value, { color: PERMISSION_LABEL[permission].color }]}>
                {PERMISSION_LABEL[permission].text}
              </Text>
            </View>
            {permission !== 'always' && (
              <Pressable style={styles.button} onPress={() => Linking.openSettings()}>
                <Text style={styles.buttonText}>Abrir ajustes del sistema</Text>
              </Pressable>
            )}
          </Section>

          <Text style={styles.attribution}>
            Datos de radares y mapa © colaboradores de OpenStreetMap (licencia ODbL). Teselas de OpenFreeMap.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.label, styles.flex]}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.danger }} />
    </View>
  );
}

function Footer({ children, color = colors.textSecondary }: { children: ReactNode; color?: string }) {
  return <Text style={[styles.footer, { color }]}>{children}</Text>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  done: { fontSize: 17, fontWeight: '600', color: colors.accent },
  content: { padding: 16, gap: 20, paddingBottom: 40 },
  section: { gap: 6 },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginLeft: 4 },
  card: { backgroundColor: colors.card, borderRadius: radius, padding: 16, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  flex: { flex: 1 },
  label: { fontSize: 16, color: colors.text },
  value: { fontSize: 16, color: colors.textSecondary, fontVariant: ['tabular-nums'] },
  footer: { fontSize: 13, lineHeight: 18 },
  button: {
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontSize: 16, fontWeight: '600', color: colors.accent },
  segmented: { flexDirection: 'row', backgroundColor: colors.background, borderRadius: 10, padding: 3 },
  segment: { flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: 'center' },
  segmentActive: { backgroundColor: colors.card, elevation: 1, shadowOpacity: 0.1, shadowRadius: 2 },
  segmentText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  segmentTextActive: { color: colors.text },
  attribution: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 12 },
});
