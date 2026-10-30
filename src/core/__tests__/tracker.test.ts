import { offset, MADRID, radarAt } from '../../test/helpers';
import { bearingDegrees, type LatLon } from '../geo';
import type { Radar } from '../radar';
import { RadarTracker, type TrackerOptions, type TrackerResult } from '../tracker';

const OPTIONS: TrackerOptions = { alertRadius: 500, laneFilter: true };

interface Step {
  position: LatLon;
  heading: number | null;
}

/** Straight ride along `bearing`, from `start` meters before `origin` to `end` meters past it, every `every` m. */
function straightRide(origin: LatLon, bearing: number, start: number, end: number, every = 20, heading: number | null = bearing): Step[] {
  const steps: Step[] = [];
  for (let d = -start; d <= end; d += every) {
    steps.push({ position: d < 0 ? offset(origin, -d, bearing + 180) : offset(origin, d, bearing), heading });
  }
  return steps;
}

function run(tracker: RadarTracker, steps: Step[], radars: Radar[], options = OPTIONS): TrackerResult[] {
  return steps.map(({ position, heading }) => tracker.step(position, heading, radars, options));
}

const alerts = (results: TrackerResult[]) =>
  results.filter((r): r is Extract<TrackerResult, { kind: 'alert' }> => r.kind === 'alert');

/** Indexes of results that are alerts. */
const alertIndexes = (results: TrackerResult[]) =>
  results.flatMap((r, i) => (r.kind === 'alert' ? [i] : []));

describe('RadarTracker', () => {
  const radar = radarAt(MADRID);

  it('alerts while approaching, announces once, and stops after passing', () => {
    const results = run(new RadarTracker(), straightRide(MADRID, 0, 700, 400), [radar]);
    const hits = alerts(results);

    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].distance).toBeLessThanOrEqual(500);
    expect(hits.filter((h) => h.isNew)).toHaveLength(1);
    // distances only go down: never the "ascending meters" bug
    for (let i = 1; i < hits.length; i++) expect(hits[i].distance).toBeLessThanOrEqual(hits[i - 1].distance);
    // alerts form one contiguous block that ends right around the radar
    const idx = alertIndexes(results);
    expect(idx[idx.length - 1] - idx[0] + 1).toBe(idx.length);
    expect(results[results.length - 1].kind).toBe('none');
  });

  it('keeps alerting the tracked radar if the course is lost, and still stops after passing', () => {
    const tracker = new RadarTracker();
    run(tracker, straightRide(MADRID, 0, 600, -100), [radar]); // course known up to 100 m before
    const results = run(tracker, straightRide(MADRID, 0, 100, 400, 20, null), [radar]);
    const lastAlert = alertIndexes(results).pop()!;
    expect(alerts(results).every((r) => !r.isNew)).toBe(true);
    expect(lastAlert).toBeGreaterThanOrEqual(100 / 20); // alerted all the way to the radar
    expect(lastAlert).toBeLessThanOrEqual(100 / 20 + 4); // and stopped right after passing
    expect(results.slice(lastAlert + 1).every((r) => r.kind === 'none')).toBe(true);
  });

  it('does not start alerting a new radar without a direction of travel', () => {
    const results = run(new RadarTracker(), straightRide(MADRID, 0, 400, 0, 20, null), [radar]);
    expect(alerts(results)).toHaveLength(0);
  });

  it('does not alert an opposite-lane camera behind us when the course is lost', () => {
    const opposite = radarAt(MADRID, 'opp', { directions: [180] });
    const tracker = new RadarTracker();
    run(tracker, straightRide(MADRID, 0, 400, 40), [opposite]); // filtered: never tracked
    const stopped = run(tracker, [{ position: offset(MADRID, 48, 0), heading: null }], [opposite]);
    expect(alerts(stopped)).toHaveLength(0);
  });

  it('never re-alerts a passed radar even if the heading then points back at it', () => {
    const tracker = new RadarTracker();
    run(tracker, straightRide(MADRID, 0, 600, 120), [radar]);
    // Bogus heading (e.g. GPS course glitch) pointing back south towards the radar
    const back = run(tracker, straightRide(MADRID, 0, -140, 300, 20, 180), [radar]);
    expect(alerts(back)).toHaveLength(0);
  });

  it('keeps alerting while stopped at a light with GPS jitter', () => {
    const tracker = new RadarTracker();
    run(tracker, straightRide(MADRID, 0, 600, -200), [radar]); // ride up to 200 m before
    const stop = offset(MADRID, 200, 180);
    const jitter: Step[] = Array.from({ length: 30 }, (_, i) => ({
      position: offset(stop, 8, (i * 97) % 360),
      heading: null,
    }));
    const results = run(tracker, jitter, [radar]);
    expect(results.every((r) => r.kind === 'alert')).toBe(true);
    expect(alerts(results).some((r) => r.isNew)).toBe(false);
  });

  it('ignores a radar beyond the alert radius', () => {
    const far = radarAt(offset(MADRID, 800, 0));
    expect(new RadarTracker().step(MADRID, 0, [far], OPTIONS)).toEqual({ kind: 'none' });
  });

  it('ignores a radar on the opposite lane when the lane filter is on', () => {
    const opposite = radarAt(MADRID, 'opp', { directions: [180] });
    const ride = straightRide(MADRID, 0, 600, 200);
    expect(alerts(run(new RadarTracker(), ride, [opposite]))).toHaveLength(0);
    expect(alerts(run(new RadarTracker(), ride, [opposite], { ...OPTIONS, laneFilter: false })).length).toBeGreaterThan(0);
  });

  it('handles two radars in a row, announcing each once', () => {
    const second = radarAt(offset(MADRID, 300, 0), 'r2');
    const results = run(new RadarTracker(), straightRide(MADRID, 0, 700, 900), [radar, second]);
    const announced = alerts(results).filter((r) => r.isNew).map((r) => r.radar.id);
    expect(announced).toEqual(['r1', 'r2']);
    expect(results[results.length - 1].kind).toBe('none');
  });

  it('does not suppress a far radar that briefly leaves the cone in a bend', () => {
    const tracker = new RadarTracker();
    const approach = straightRide(MADRID, 0, 450, -400); // from 450 m to 400 m before
    run(tracker, approach, [radar]);
    const where = offset(MADRID, 400, 180);
    // In the bend the course points east for a moment: radar is 90° off → hidden
    expect(tracker.step(where, 95, [radar], OPTIONS).kind).toBe('none');
    // Back on course: alert resumes without a second announcement
    const resumed = tracker.step(offset(MADRID, 380, 180), 0, [radar], OPTIONS);
    expect(resumed).toMatchObject({ kind: 'alert', isNew: false });
  });

  it('still alerts after the road swings away and back (distance grew while hidden)', () => {
    const tracker = new RadarTracker();
    run(tracker, straightRide(MADRID, 0, 450, -300), [radar]); // up to 300 m before
    // Road swings east for 200 m: distance grows to ~360 m, radar out of the cone
    const start = offset(MADRID, 300, 180);
    const swing: Step[] = Array.from({ length: 10 }, (_, i) => ({ position: offset(start, (i + 1) * 20, 90), heading: 90 }));
    run(tracker, swing, [radar]);
    // ...then heads straight for the radar
    const turnPoint = swing[swing.length - 1].position;
    const toRadar = bearingDegrees(turnPoint, radar);
    const back: Step[] = Array.from({ length: 17 }, (_, i) => ({ position: offset(turnPoint, (i + 1) * 20, toRadar), heading: toRadar }));
    const results = run(tracker, back, [radar]);
    const hits = alerts(results);
    expect(hits.length).toBeGreaterThan(10);
    expect(Math.min(...hits.map((h) => h.distance))).toBeLessThan(30);
    expect(hits.some((h) => h.isNew)).toBe(false);
  });

  it('a roundabout 130 m before the camera hides it but does not mark it passed', () => {
    const tracker = new RadarTracker();
    run(tracker, straightRide(MADRID, 0, 450, -130), [radar]);
    const entry = offset(MADRID, 130, 180);
    // Going round: course swings east, south (radar behind us!) and west
    for (const heading of [100, 160, 200, 250, 300]) tracker.step(offset(entry, 15, heading), heading, [radar], OPTIONS);
    // Exit north towards the camera
    const results = run(tracker, straightRide(MADRID, 0, 120, 0), [radar]);
    expect(alerts(results).length).toBe(results.length);
    expect(alerts(results).some((h) => h.isNew)).toBe(false);
  });

  it('alerts again after a U-turn back towards a passed radar', () => {
    const tracker = new RadarTracker();
    run(tracker, straightRide(MADRID, 0, 600, 200), [radar]); // pass it, ride on 200 m
    const back = run(tracker, straightRide(MADRID, 180, 200, 0), [radar]); // U-turn, head back south
    const hits = alerts(back);
    expect(hits.filter((h) => h.isNew)).toHaveLength(1);
    expect(Math.min(...hits.map((h) => h.distance))).toBeLessThan(30);
  });

  it('alerts again on the way back once we have been far away', () => {
    const tracker = new RadarTracker();
    run(tracker, straightRide(MADRID, 0, 600, 800), [radar]); // pass it and ride on 800 m
    const back = run(tracker, straightRide(MADRID, 180, 800, 200), [radar]); // return southbound
    expect(alerts(back).filter((r) => r.isNew)).toHaveLength(1);
  });
});
