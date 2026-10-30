import { Platform, Vibration } from 'react-native';

import { burstToPattern, planBurst, type Burst, type VibrationBand } from '../core/vibration';

/**
 * Vibration keeps going only while the engine keeps calling `keepVibrating`
 * (once per GPS fix). Without new fixes it dies out after this long, so it can
 * never get stuck on (tunnel, stopped at a light, crash).
 */
const KEEP_ALIVE_MS = 6000;

// Android: finite native burst, re-planned on every fix (see planBurst).
let burst: Burst | null = null;

// iOS: our own loop of single system vibrations (~400 ms each). RN's iOS
// pattern scheduler races when restarted with a new pattern, and iOS JS timers
// do keep running in the background while location updates keep the app alive.
let iosBand: VibrationBand | null = null;
let iosTimer: ReturnType<typeof setTimeout> | null = null;
let iosDeadline = 0;

export function keepVibrating(band: VibrationBand) {
  const now = Date.now();

  if (Platform.OS === 'android') {
    const next = planBurst(burst, band, now, KEEP_ALIVE_MS);
    if (!next) return; // a pulse is playing; the next fix re-plans
    Vibration.vibrate(burstToPattern(next, now)); // replaces the previous burst
    burst = next;
    return;
  }

  iosBand = band;
  iosDeadline = now + KEEP_ALIVE_MS;
  if (!iosTimer) iosTick();
}

function iosTick() {
  iosTimer = null;
  if (!iosBand || Date.now() > iosDeadline) {
    iosBand = null;
    return;
  }
  Vibration.vibrate();
  iosTimer = setTimeout(iosTick, iosBand.intervalMs);
}

export function stopVibration() {
  if (!burst && !iosBand) return;
  burst = null;
  iosBand = null;
  if (iosTimer) clearTimeout(iosTimer);
  iosTimer = null;
  Vibration.cancel();
}

/** Three pulses of `sample`, for the "Probar vibración" button. */
export function testVibration(sample: VibrationBand) {
  stopVibration();
  if (Platform.OS === 'android') {
    const now = Date.now();
    Vibration.vibrate(burstToPattern({ firstPulseAt: now, intervalMs: sample.intervalMs, pulseMs: sample.pulseMs, pulses: 3 }, now));
    return;
  }
  for (let i = 0; i < 3; i++) setTimeout(() => Vibration.vibrate(), i * sample.intervalMs);
}
