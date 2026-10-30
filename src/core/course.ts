import { bearingDegrees, distanceMeters, type LatLon } from './geo';

export interface Fix extends LatLon {
  /** GPS course (direction of travel) in degrees, or null/negative when unknown. */
  heading: number | null;
  /** Speed in m/s, or null/negative when unknown. */
  speed: number | null;
  /** Horizontal accuracy radius in meters, null when unknown. */
  accuracy: number | null;
  timestamp: number;
}

/** Below this speed the GPS course is noise (≈ 7 km/h). */
const MIN_SPEED_FOR_COURSE = 2;
/** Minimum displacement to derive a course from two fixes (also ≥ 2× fix accuracy). */
const MIN_DISPLACEMENT_M = 15;
/** Without speed information, a course older than this is no longer trusted. */
const COURSE_MAX_AGE_MS = 30_000;

/**
 * Tracks the direction of travel. Uses the GPS course (not the compass: in a
 * pocket or tank bag the compass points wherever the phone happens to face),
 * falling back to the bearing between consecutive fixes when the GPS gives none.
 *
 * While stopped (speed known and ~0) the last course is kept: GPS jitter at a
 * red light must not turn into a bogus direction.
 */
export class CourseTracker {
  private anchor: Fix | null = null;
  private course: number | null = null;
  private courseAt = 0;

  update(fix: Fix): number | null {
    const speed = fix.speed ?? -1;
    // Android reports a bearing of exactly 0 when it has none, so 0 counts as unknown.
    const gpsHeading = fix.heading !== null && fix.heading > 0 ? fix.heading : null;
    const stopped = speed >= 0 && speed < MIN_SPEED_FOR_COURSE;

    if (gpsHeading !== null && speed >= MIN_SPEED_FOR_COURSE) {
      this.set(gpsHeading, fix);
    } else if (stopped) {
      if (this.course !== null) this.courseAt = fix.timestamp;
      this.anchor = fix;
    } else if (this.anchor) {
      const minDisplacement = Math.max(MIN_DISPLACEMENT_M, 2 * (fix.accuracy ?? 0));
      if (distanceMeters(this.anchor, fix) >= minDisplacement) {
        this.set(bearingDegrees(this.anchor, fix), fix);
      }
    } else {
      this.anchor = fix;
    }

    if (this.course !== null && fix.timestamp - this.courseAt > COURSE_MAX_AGE_MS) {
      this.course = null;
    }
    return this.course;
  }

  reset() {
    this.anchor = null;
    this.course = null;
    this.courseAt = 0;
  }

  private set(course: number, fix: Fix) {
    this.course = course;
    this.courseAt = fix.timestamp;
    this.anchor = fix;
  }
}
