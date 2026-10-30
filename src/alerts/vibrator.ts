import { Platform, Vibration } from 'react-native';

import { vibrationPattern, type VibrationBand } from '../core/vibration';

let currentBandId: number | null = null;
let currentPulseMs: number | null = null;

/** Starts (or switches to) the repeating pattern for `band`. No-op if it is already playing. */
export function vibrateForBand(band: VibrationBand) {
  if (band.id === currentBandId && band.pulseMs === currentPulseMs) return;
  Vibration.cancel();
  Vibration.vibrate(vibrationPattern(band, Platform.OS === 'android' ? 'android' : 'ios'), true);
  currentBandId = band.id;
  currentPulseMs = band.pulseMs;
}

export function stopVibration() {
  if (currentBandId === null) return;
  Vibration.cancel();
  currentBandId = null;
  currentPulseMs = null;
}

/** Three pulses, for the "Probar vibración" button. */
export function testVibration(band: VibrationBand) {
  stopVibration();
  const gap = band.intervalMs - band.pulseMs;
  Vibration.vibrate(
    Platform.OS === 'android'
      ? [0, band.pulseMs, gap, band.pulseMs, gap, band.pulseMs]
      : [0, band.intervalMs, band.intervalMs], // iOS: fixed-length pulses separated by the pauses
  );
}
