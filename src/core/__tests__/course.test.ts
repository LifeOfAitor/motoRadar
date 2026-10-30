import { CourseTracker, type Fix } from '../course';
import { angularDiff, type LatLon } from '../geo';
import { MADRID, offset } from '../../test/helpers';

const fix = (p: LatLon, t: number, heading: number | null = null, speed: number | null = null): Fix => ({
  ...p,
  heading,
  speed,
  timestamp: t,
});

describe('CourseTracker', () => {
  it('uses the GPS course when moving', () => {
    const tracker = new CourseTracker();
    expect(tracker.update(fix(MADRID, 0, 123, 15))).toBe(123);
  });

  it('ignores the GPS course when (almost) stopped', () => {
    const tracker = new CourseTracker();
    expect(tracker.update(fix(MADRID, 0, 123, 0.5))).toBeNull();
  });

  it('derives the course from displacement when the GPS gives none', () => {
    const tracker = new CourseTracker();
    tracker.update(fix(MADRID, 0));
    const course = tracker.update(fix(offset(MADRID, 30, 90), 2000));
    expect(course).not.toBeNull();
    expect(angularDiff(course!, 90)).toBeLessThan(1);
  });

  it('does not derive a course from GPS jitter', () => {
    const tracker = new CourseTracker();
    tracker.update(fix(MADRID, 0));
    expect(tracker.update(fix(offset(MADRID, 5, 200), 1000))).toBeNull();
  });

  it('keeps the last course briefly while stopped, then forgets it', () => {
    const tracker = new CourseTracker();
    tracker.update(fix(MADRID, 0, 45, 20));
    expect(tracker.update(fix(MADRID, 5_000, null, 0))).toBe(45);
    expect(tracker.update(fix(MADRID, 20_000, null, 0))).toBeNull();
  });
});
