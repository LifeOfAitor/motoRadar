import { vibrationBand, vibrationPattern } from '../vibration';

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

describe('vibrationPattern', () => {
  it('Android: [wait, vibrate, wait] summing to the interval', () => {
    const band = vibrationBand(100, 1);
    const pattern = vibrationPattern(band, 'android');
    expect(pattern[0]).toBe(0);
    expect(pattern[1]).toBe(band.pulseMs);
    expect(pattern[1] + pattern[2]).toBe(band.intervalMs);
  });

  it('iOS: immediate vibration then the interval as pause', () => {
    const band = vibrationBand(100, 1);
    expect(vibrationPattern(band, 'ios')).toEqual([0, band.intervalMs]);
  });
});
