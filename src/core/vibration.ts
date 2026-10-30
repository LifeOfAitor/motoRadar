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

/**
 * A finite Android vibration burst: `pulses` pulses, the first at `firstPulseAt`,
 * then one every `intervalMs`. It stops by itself.
 *
 * The engine re-plans it on every GPS fix, so vibration keeps going while fixes
 * arrive, recovers if Android cancels it when the screen turns off, and dies out
 * when fixes stop (tunnel, app killed) without needing a JS timer — React Native
 * timers do not run while an Android app is in the background.
 */
export interface Burst {
  firstPulseAt: number;
  intervalMs: number;
  pulseMs: number;
  pulses: number;
}

/**
 * Next burst covering `durationMs` from `now`, keeping the rhythm of `previous`
 * (no early or doubled pulse when re-sent). Returns null while a pulse is
 * playing, so it is not cut short; the next fix will re-plan.
 */
export function planBurst(previous: Burst | null, band: VibrationBand, now: number, durationMs: number): Burst | null {
  let firstPulseAt = now;
  if (previous) {
    const elapsedPulses = Math.floor((now - previous.firstPulseAt) / previous.intervalMs);
    if (elapsedPulses < 0) {
      firstPulseAt = previous.firstPulseAt; // first pulse still pending
    } else {
      const lastPulseAt = previous.firstPulseAt + Math.min(elapsedPulses, previous.pulses - 1) * previous.intervalMs;
      if (now < lastPulseAt + previous.pulseMs) return null;
      firstPulseAt = Math.max(now, lastPulseAt + band.intervalMs);
    }
  }
  const pulses = Math.max(1, Math.ceil((now + durationMs - firstPulseAt) / band.intervalMs));
  return { firstPulseAt, intervalMs: band.intervalMs, pulseMs: band.pulseMs, pulses };
}

/** `Vibration.vibrate(pattern)` for Android: [wait, pulse, gap, pulse, …]. */
export function burstToPattern(burst: Burst, now: number): number[] {
  const pattern = [Math.max(0, burst.firstPulseAt - now), burst.pulseMs];
  for (let i = 1; i < burst.pulses; i++) pattern.push(burst.intervalMs - burst.pulseMs, burst.pulseMs);
  return pattern;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
