import { offset, MADRID } from '../../test/helpers';
import { needsRefresh } from '../refreshPolicy';

const DAY = 24 * 60 * 60 * 1000;
const now = 1_800_000_000_000;

describe('needsRefresh', () => {
  it('refreshes when there is no data', () => {
    expect(needsRefresh(null, MADRID, now)).toBe(true);
  });

  it('does not refresh fresh, nearby data', () => {
    expect(needsRefresh({ ...MADRID, fetchedAt: now - DAY }, offset(MADRID, 10_000, 90), now)).toBe(false);
  });

  it('refreshes data older than 7 days', () => {
    expect(needsRefresh({ ...MADRID, fetchedAt: now - 8 * DAY }, MADRID, now)).toBe(true);
  });

  it('refreshes after moving more than 40 km', () => {
    expect(needsRefresh({ ...MADRID, fetchedAt: now }, offset(MADRID, 41_000, 0), now)).toBe(true);
  });
});
