import { CourseTracker, type Fix } from '../course';
import { angularDiff, type LatLon } from '../geo';
import { MADRID, offset } from '../../test/helpers';

const fix = (
  p: LatLon,
  t: number,
  heading: number | null = null,
  speed: number | null = null,
  accuracy: number | null = 5,
): Fix => ({ ...p, heading, speed, accuracy, timestamp: t });

describe('CourseTracker', () => {
  it('uses the GPS course when moving', () => {
    const tracker = new CourseTracker();
    expect(tracker.update(fix(MADRID, 0, 123, 15))).toBe(123);
  });

  it('ignores the GPS course when (almost) stopped', () => {
    const tracker = new CourseTracker();
    expect(tracker.update(fix(MADRID, 0, 123, 0.5))).toBeNull();
  });

  it('treats a heading of exactly 0 as unknown (Android "no bearing")', () => {
    const tracker = new CourseTracker();
    tracker.update(fix(MADRID, 0, 90, 15));
    expect(tracker.update(fix(offset(MADRID, 5, 90), 1000, 0, 15))).toBe(90);
  });

  it('derives the course from displacement when the GPS gives none', () => {
    const tracker = new CourseTracker();
    tracker.update(fix(MADRID, 0));
    const course = tracker.update(fix(offset(MADRID, 30, 90), 2000));
    expect(course).not.toBeNull();
    expect(angularDiff(course!, 90)).toBeLessThan(1);
  });

  it('requires a displacement larger than twice the accuracy', () => {
    const tracker = new CourseTracker();
    tracker.update(fix(MADRID, 0, null, null, 20));
    expect(tracker.update(fix(offset(MADRID, 30, 90), 2000, null, null, 20))).toBeNull();
  });

  it('does not derive a course from GPS jitter', () => {
    const tracker = new CourseTracker();
    tracker.update(fix(MADRID, 0));
    expect(tracker.update(fix(offset(MADRID, 5, 200), 1000))).toBeNull();
  });

  it('keeps the course while stopped, even with large jitter', () => {
    const tracker = new CourseTracker();
    tracker.update(fix(MADRID, 0, 45, 20));
    // 16 m jump at a red light, speed reported ~0
    expect(tracker.update(fix(offset(MADRID, 16, 230), 5_000, null, 0.3))).toBe(45);
    expect(tracker.update(fix(MADRID, 120_000, null, 0))).toBe(45);
  });

  it('forgets the course when there is no speed information for a while', () => {
    const tracker = new CourseTracker();
    tracker.update(fix(MADRID, 0, 45, 20));
    expect(tracker.update(fix(MADRID, 10_000))).toBe(45);
    expect(tracker.update(fix(MADRID, 40_000))).toBeNull();
  });
});
