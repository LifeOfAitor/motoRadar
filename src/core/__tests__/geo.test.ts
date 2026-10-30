import { angularDiff, bearingDegrees, boundingBox, distanceMeters } from '../geo';
import { MADRID, offset } from '../../test/helpers';

describe('distanceMeters', () => {
  it('is ~0 for the same point', () => {
    expect(distanceMeters(MADRID, MADRID)).toBeCloseTo(0, 5);
  });

  it('matches a known distance (Madrid → Barcelona ≈ 505 km)', () => {
    const barcelona = { latitude: 41.3874, longitude: 2.1686 };
    expect(distanceMeters(MADRID, barcelona) / 1000).toBeCloseTo(505, -1);
  });

  it('agrees with the test offset helper', () => {
    expect(distanceMeters(MADRID, offset(MADRID, 500, 37))).toBeCloseTo(500, -1);
  });
});

describe('bearingDegrees', () => {
  it.each([0, 45, 90, 180, 270, 315])('bearing to a point at %i° is %i°', (bearing) => {
    const result = bearingDegrees(MADRID, offset(MADRID, 1000, bearing));
    expect(angularDiff(result, bearing)).toBeLessThan(0.5);
  });

  it('is always in [0, 360)', () => {
    const result = bearingDegrees(MADRID, offset(MADRID, 1000, 350));
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThan(360);
  });
});

describe('angularDiff', () => {
  it.each([
    [0, 0, 0],
    [10, 350, 20],
    [350, 10, 20],
    [0, 180, 180],
    [90, 270, 180],
    [-10, 10, 20],
    [720, 0, 0],
  ])('angularDiff(%i, %i) = %i', (a, b, expected) => {
    expect(angularDiff(a, b)).toBeCloseTo(expected, 6);
  });
});

describe('boundingBox', () => {
  it('contains every point within the radius', () => {
    const box = boundingBox(MADRID, 1000);
    for (const bearing of [0, 45, 90, 135, 180, 225, 270, 315]) {
      const p = offset(MADRID, 990, bearing);
      expect(p.latitude).toBeGreaterThanOrEqual(box.minLat);
      expect(p.latitude).toBeLessThanOrEqual(box.maxLat);
      expect(p.longitude).toBeGreaterThanOrEqual(box.minLon);
      expect(p.longitude).toBeLessThanOrEqual(box.maxLon);
    }
  });
});
