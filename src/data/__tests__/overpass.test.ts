import { buildQuery, parseDirections, parseMaxSpeed, parseResponse } from '../overpass';

describe('parseMaxSpeed', () => {
  it.each([
    ['50', 50],
    [' 120 ', 120],
    ['30 mph', 48],
    ['50;30', 50],
    ['ES:urban', null],
    ['none', null],
    ['0', null],
    [undefined, null],
  ])('%p → %p', (input, expected) => {
    expect(parseMaxSpeed(input)).toBe(expected);
  });
});

describe('parseDirections', () => {
  it.each([
    ['90', [90]],
    ['370', [10]],
    ['-90', [270]],
    ['NE', [45]],
    ['ssw', [202.5]],
    ['90;270', [90, 270]],
    ['forward', []],
    ['90;backward', []],
    [undefined, []],
  ])('%p → %p', (input, expected) => {
    expect(parseDirections(input)).toEqual(expected);
  });
});

describe('parseResponse', () => {
  it('maps speed camera nodes to radars', () => {
    const radars = parseResponse({
      elements: [
        { type: 'node', id: 123, lat: 40.1, lon: -3.2, tags: { highway: 'speed_camera', maxspeed: '80', direction: '45' } },
        { type: 'node', id: 456, lat: 40.2, lon: -3.3 },
        { type: 'way', id: 789 },
      ],
    });
    expect(radars).toEqual([
      { id: '123', latitude: 40.1, longitude: -3.2, speedLimit: 80, directions: [45] },
      { id: '456', latitude: 40.2, longitude: -3.3, speedLimit: null, directions: [] },
    ]);
  });

  it('rejects malformed responses', () => {
    expect(() => parseResponse({ remark: 'runtime error' })).toThrow();
    expect(() => parseResponse(null)).toThrow();
  });
});

describe('buildQuery', () => {
  it('queries speed cameras around the point', () => {
    const query = buildQuery({ latitude: 40.5, longitude: -3.5 }, 100_000.4);
    expect(query).toContain('node["highway"="speed_camera"](around:100000,40.5,-3.5)');
    expect(query).toContain('[out:json]');
  });
});
