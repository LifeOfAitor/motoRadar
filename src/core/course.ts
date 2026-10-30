import { bearingDegrees, distanceMeters, type LatLon } from './geo';

export interface Fix extends LatLon {
  /** GPS course (direction of travel) in degrees, or null/negative when unknown. */
  heading: number | null;
  /** Speed in m/s, or null/negative when unknown. */
  speed: number | null;
  timestamp: number;
}

/** Below this speed the GPS course is noise (≈ 7 km/h). */
const MIN_SPEED_FOR_COURSE = 2;
/** Minimum displacement to derive a course from two fixes. */
const MIN_DISPLACEMENT_M = 15;
/** A course older than this is no longer trusted. */
const COURSE_MAX_AGE_MS = 15_000;

/**
 * Tracks the direction of travel. Uses the GPS course (not the compass: in a
 * pocket or tank bag the compass points wherever the phone happens to face),
 * falling back to the bearing between consecutive fixes.
 */
export class CourseTracker {
  private anchor: Fix | null = null;
  private course: number | null = null;
  private courseAt = 0;

  update(fix: Fix): number | null {
    const speed = fix.speed ?? -1;
    const gpsHeading = fix.heading ?? -1;

    if (gpsHeading >= 0 && speed >= MIN_SPEED_FOR_COURSE) {
      this.set(gpsHeading, fix);
    } else if (this.anchor && distanceMeters(this.anchor, fix) >= MIN_DISPLACEMENT_M) {
      this.set(bearingDegrees(this.anchor, fix), fix);
    } else if (!this.anchor) {
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
