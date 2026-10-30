/**
 * Distance → vibration rhythm. Closer = more frequent; under 50 m it is almost continuous.
 *
 * Android honours `pulseMs` (longer pulse = stronger feel), scaled by the user's
 * intensity setting. iOS ignores it: every system vibration lasts ~400 ms at full
 * strength, so only the interval changes there.
 */
export interface VibrationBand {
  /** Stable id so the engine only restarts the pattern when the band changes. */
  id: number;
  /** Time between the start of consecutive pulses. */
  intervalMs: number;
  /** Pulse length (Android only). */
  pulseMs: number;
}

const BANDS: { maxDistance: number; intervalMs: number }[] = [
  { maxDistance: 50, intervalMs: 500 },
  { maxDistance: 150, intervalMs: 800 },
  { maxDistance: 300, intervalMs: 1300 },
  { maxDistance: 500, intervalMs: 2000 },
  { maxDistance: Infinity, intervalMs: 3000 },
];

export const MIN_INTENSITY = 0.3;
export const MAX_INTENSITY = 1;
const MIN_PULSE_MS = 150;
const MAX_PULSE_MS = 400;
/** Keep a short gap so consecutive pulses are felt as separate. */
const MIN_GAP_MS = 100;

export function vibrationBand(distance: number, intensity: number): VibrationBand {
  const index = BANDS.findIndex((band) => distance < band.maxDistance);
  const { intervalMs } = BANDS[index];
  const t = (clamp(intensity, MIN_INTENSITY, MAX_INTENSITY) - MIN_INTENSITY) / (MAX_INTENSITY - MIN_INTENSITY);
  const pulse = Math.round(MIN_PULSE_MS + t * (MAX_PULSE_MS - MIN_PULSE_MS));
  return { id: index, intervalMs, pulseMs: Math.min(pulse, intervalMs - MIN_GAP_MS) };
}

/** Pattern for React Native's `Vibration.vibrate(pattern, true)` on each platform. */
export function vibrationPattern(band: VibrationBand, platform: 'ios' | 'android'): number[] {
  return platform === 'android'
    ? [0, band.pulseMs, band.intervalMs - band.pulseMs] // [wait, vibrate, wait] repeated
    : [0, band.intervalMs]; // iOS: values are pauses between fixed ~400 ms vibrations
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
