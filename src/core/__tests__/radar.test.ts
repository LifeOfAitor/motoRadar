import { isRelevant } from '../radar';
import { MADRID, offset, radarAt } from '../../test/helpers';

describe('isRelevant', () => {
  const heading = 0; // riding north

  it('accepts an omnidirectional radar ahead', () => {
    expect(isRelevant(radarAt(offset(MADRID, 300, 10)), MADRID, heading)).toBe(true);
  });

  it('rejects a radar behind', () => {
    expect(isRelevant(radarAt(offset(MADRID, 300, 180)), MADRID, heading)).toBe(false);
  });

  it('rejects a radar abeam (just past 90°)', () => {
    expect(isRelevant(radarAt(offset(MADRID, 300, 92)), MADRID, heading)).toBe(false);
  });

  it('accepts a radar monitoring our direction', () => {
    const radar = radarAt(offset(MADRID, 300, 0), 'r', { directions: [10] });
    expect(isRelevant(radar, MADRID, heading)).toBe(true);
  });

  it('rejects a radar monitoring the opposite lane', () => {
    const radar = radarAt(offset(MADRID, 300, 0), 'r', { directions: [180] });
    expect(isRelevant(radar, MADRID, heading)).toBe(false);
  });

  it('accepts a radar monitoring both directions', () => {
    const radar = radarAt(offset(MADRID, 300, 0), 'r', { directions: [180, 0] });
    expect(isRelevant(radar, MADRID, heading)).toBe(true);
  });

  it('ignores the lane check when the lane filter is off', () => {
    const radar = radarAt(offset(MADRID, 300, 0), 'r', { directions: [180] });
    expect(isRelevant(radar, MADRID, heading, false)).toBe(true);
  });

  it('handles the 0/360 wrap-around', () => {
    const radar = radarAt(offset(MADRID, 300, 355), 'r', { directions: [350] });
    expect(isRelevant(radar, MADRID, 5)).toBe(true);
  });

  it('rejects a radar on a parallel street (65 m to the side)', () => {
    const side = offset(offset(MADRID, 36, 0), 65, 90);
    expect(isRelevant(radarAt(side), MADRID, heading)).toBe(false);
    // ...but the tracked radar keeps the wide cone
    expect(isRelevant(radarAt(side), MADRID, heading, true, false)).toBe(true);
  });

  it('rejects a far radar 180 m to the side, accepts a gentle bend', () => {
    const parallel = offset(offset(MADRID, 400, 0), 180, 90);
    expect(isRelevant(radarAt(parallel), MADRID, heading)).toBe(false);
    const bend = offset(offset(MADRID, 400, 0), 80, 90); // ~R=1 km curve
    expect(isRelevant(radarAt(bend), MADRID, heading)).toBe(true);
  });

  it('accepts a radar right beside the road when close (opposite carriageway)', () => {
    const near = offset(offset(MADRID, 60, 0), 30, 90);
    expect(isRelevant(radarAt(near), MADRID, heading)).toBe(true);
  });
});
