import { burstToPattern, planBurst, vibrationBand, type Burst } from '../vibration';

describe('vibrationBand', () => {
  it('vibrates more often the closer the radar', () => {
    const intervals = [20, 100, 200, 400, 700].map((d) => vibrationBand(d, 1).intervalMs);
    for (let i = 1; i < intervals.length; i++) expect(intervals[i]).toBeGreaterThan(intervals[i - 1]);
  });

  it('is almost continuous under 50 m', () => {
    const band = vibrationBand(30, 1);
    expect(band.intervalMs - band.pulseMs).toBeLessThanOrEqual(150);
  });

  it('scales the pulse with intensity and clamps out-of-range values', () => {
    expect(vibrationBand(400, 0.3).pulseMs).toBeLessThan(vibrationBand(400, 1).pulseMs);
    expect(vibrationBand(400, 0).pulseMs).toBe(vibrationBand(400, 0.3).pulseMs);
    expect(vibrationBand(400, 5).pulseMs).toBe(vibrationBand(400, 1).pulseMs);
  });

  it('always leaves a gap between pulses', () => {
    for (const d of [0, 49, 50, 149, 150, 299, 300, 499, 500, 2000]) {
      const band = vibrationBand(d, 1);
      expect(band.pulseMs).toBeLessThan(band.intervalMs);
    }
  });

  it('gives each distance range a stable id', () => {
    expect(vibrationBand(10, 1).id).toBe(vibrationBand(40, 0.5).id);
    expect(vibrationBand(40, 1).id).not.toBe(vibrationBand(60, 1).id);
  });
});

/** Absolute times (ms) at which each pulse of `pattern` starts, sent at `now`. */
function pulseTimes(pattern: number[], now: number): number[] {
  const times: number[] = [];
  let t = now;
  pattern.forEach((ms, i) => {
    if (i % 2 === 1) times.push(t);
    t += ms;
  });
  return times;
}

describe('planBurst / burstToPattern', () => {
  const band = vibrationBand(100, 1); // 800 ms interval

  it('starts immediately and covers the requested duration', () => {
    const burst = planBurst(null, band, 0, 6000)!;
    const times = pulseTimes(burstToPattern(burst, 0), 0);
    expect(times[0]).toBe(0);
    expect(times[times.length - 1]).toBeGreaterThanOrEqual(6000 - band.intervalMs);
    for (let i = 1; i < times.length; i++) expect(times[i] - times[i - 1]).toBe(band.intervalMs);
  });

  it('keeps the rhythm when re-sent mid-burst (no early or doubled pulse)', () => {
    const first = planBurst(null, band, 0, 6000)!;
    const now = 1300; // after pulse #2 (800–1200), before #3 (1600)
    const next = planBurst(first, band, now, 6000)!;
    expect(next.firstPulseAt).toBe(1600);
    expect(pulseTimes(burstToPattern(next, now), now)[0]).toBe(1600);
  });

  it('does not cut a pulse short', () => {
    const first = planBurst(null, band, 0, 6000)!;
    expect(planBurst(first, band, 850, 6000)).toBeNull(); // pulse started at 800
  });

  it('switches to a faster band from the last pulse', () => {
    const first = planBurst(null, band, 0, 6000)!;
    const close = vibrationBand(20, 1); // 500 ms
    const next = planBurst(first, close, 1250, 6000)!;
    expect(next.firstPulseAt).toBe(1300); // last pulse 800 + 500
    expect(next.intervalMs).toBe(500);
  });

  it('restarts immediately after the previous burst ended', () => {
    const first: Burst = { firstPulseAt: 0, intervalMs: 800, pulseMs: 400, pulses: 2 };
    expect(planBurst(first, band, 10_000, 6000)!.firstPulseAt).toBe(10_000);
  });

  it('waits for a first pulse that is still pending', () => {
    const pending: Burst = { firstPulseAt: 500, intervalMs: 800, pulseMs: 400, pulses: 5 };
    expect(planBurst(pending, band, 200, 6000)!.firstPulseAt).toBe(500);
  });
});
