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
});
