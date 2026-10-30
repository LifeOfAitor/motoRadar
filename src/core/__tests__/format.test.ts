import { announcementText, formatDistance, formatSpeed, roundDistance } from '../format';

describe('roundDistance', () => {
  it.each([
    [3, 10],
    [44, 40],
    [96, 100],
    [437, 450],
    [462, 450],
    [499, 500],
    [1234, 1250],
  ])('%i m → %i m', (input, expected) => {
    expect(roundDistance(input)).toBe(expected);
  });
});

describe('formatDistance', () => {
  it('shows meters below 1 km', () => expect(formatDistance(437)).toBe('450 m'));
  it('shows km with a decimal comma', () => expect(formatDistance(1234)).toBe('1,3 km'));
  it('is empty for infinity', () => expect(formatDistance(Infinity)).toBe(''));
});

describe('announcementText', () => {
  it('includes the limit when known', () => {
    expect(announcementText(487, 80)).toBe('Radar a 500 metros, límite 80');
  });
  it('omits the limit when unknown', () => {
    expect(announcementText(312, null)).toBe('Radar a 300 metros');
  });
});

describe('formatSpeed', () => {
  it('converts m/s to km/h', () => expect(formatSpeed(25)).toBe('90'));
  it('shows -- when unknown', () => {
    expect(formatSpeed(null)).toBe('--');
    expect(formatSpeed(-1)).toBe('--');
  });
});
