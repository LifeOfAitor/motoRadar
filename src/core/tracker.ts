import { angularDiff, bearingDegrees, distanceMeters, type LatLon } from './geo';
import { isRelevant, type Radar } from './radar';

/** Radar counts as passed once we are this much farther than our closest approach. */
export const PASS_MARGIN_M = 60;
/** A radar this far off our course (degrees) is behind us. */
export const BEHIND_ANGLE_DEG = 120;
/**
 * A tracked radar that ends up behind us counts as passed only if we got this
 * close. Farther away it may be a bend, roundabout or junction: it is hidden,
 * not suppressed, and alerts again when it is back ahead.
 */
export const PASSED_BEHIND_MAX_M = 100;
/** A passed/announced radar is forgotten once it is this far beyond the alert radius. */
export const REARM_MARGIN_M = 150;
/** After a U-turn, consecutive approaching fixes needed before a passed radar alerts again. */
const UTURN_APPROACH_FIXES = 2;

export interface TrackerOptions {
  alertRadius: number;
  laneFilter: boolean;
}

export type TrackerResult =
  | { kind: 'none' }
  | {
      kind: 'alert';
      radar: Radar;
      distance: number;
      /** First step alerting for this radar (announce it). */
      isNew: boolean;
    };

interface Memory {
  radar: Radar;
  passed: boolean;
  /** Course when it was passed, to recognise a U-turn. */
  passedCourse: number | null;
  lastDistance: number;
  approachFixes: number;
}

interface Measured {
  radar: Radar;
  distance: number;
}

/**
 * Picks the radar to alert for and decides when it has been passed.
 *
 * - Passed radars stay suppressed until we are well away (or U-turn back
 *   towards them), so a radar behind us never comes back with growing distances.
 * - Without a direction of travel (stopped, no GPS course) only the radar
 *   already being tracked keeps alerting; no new radar is started or announced.
 */
export class RadarTracker {
  private trackedId: string | null = null;
  private minDistance = Infinity;
  /** Radars already announced or passed, keyed by id. */
  private memory = new Map<string, Memory>();

  step(
    position: LatLon,
    heading: number | null,
    candidates: Radar[],
    { alertRadius, laneFilter }: TrackerOptions,
  ): TrackerResult {
    this.forgetDistant(position, alertRadius);

    const measured = candidates
      .map((radar) => ({ radar, distance: distanceMeters(position, radar) }))
      .filter(({ distance }) => distance <= alertRadius);

    this.rearmAfterUTurn(measured, position, heading, laneFilter);

    const inRange = measured.filter(({ radar }) => !this.memory.get(radar.id)?.passed);
    const relevant =
      heading === null
        ? inRange.filter(({ radar }) => radar.id === this.trackedId)
        : inRange.filter(({ radar }) =>
            // corridor to start a new radar; the wider cone to keep the tracked one
            isRelevant(radar, position, heading, laneFilter, radar.id !== this.trackedId),
          );

    // Tracked radar is no longer relevant: passed if it is behind us and we got close, else just hidden.
    if (this.trackedId && !relevant.some(({ radar }) => radar.id === this.trackedId)) {
      const tracked = inRange.find(({ radar }) => radar.id === this.trackedId);
      if (
        tracked &&
        heading !== null &&
        angularDiff(bearingDegrees(position, tracked.radar), heading) > BEHIND_ANGLE_DEG &&
        this.minDistance <= PASSED_BEHIND_MAX_M &&
        tracked.distance > this.minDistance
      ) {
        this.markPassed(tracked, heading);
      }
      this.untrack();
    }

    const sorted = relevant.sort((a, b) => a.distance - b.distance);
    for (const entry of sorted) {
      const { radar, distance } = entry;
      if (radar.id !== this.trackedId) {
        this.trackedId = radar.id;
        this.minDistance = distance;
      } else if (distance < this.minDistance) {
        this.minDistance = distance;
      }

      if (distance > this.minDistance + PASS_MARGIN_M) {
        this.markPassed(entry, heading);
        this.untrack();
        continue; // try the next-nearest radar
      }

      const isNew = !this.memory.has(radar.id);
      if (isNew) {
        this.memory.set(radar.id, { radar, passed: false, passedCourse: null, lastDistance: distance, approachFixes: 0 });
      }
      return { kind: 'alert', radar, distance, isNew };
    }

    return { kind: 'none' };
  }

  reset() {
    this.untrack();
    this.memory.clear();
  }

  private markPassed({ radar, distance }: Measured, heading: number | null) {
    const entry = this.memory.get(radar.id);
    if (!entry) return;
    entry.passed = true;
    entry.passedCourse = heading;
    entry.lastDistance = distance;
    entry.approachFixes = 0;
  }

  private untrack() {
    this.trackedId = null;
    this.minDistance = Infinity;
  }

  /** A passed radar becomes new again if we turned around and are clearly approaching it. */
  private rearmAfterUTurn(measured: Measured[], position: LatLon, heading: number | null, laneFilter: boolean) {
    if (heading === null) return;
    for (const { radar, distance } of measured) {
      const entry = this.memory.get(radar.id);
      if (!entry?.passed || entry.passedCourse === null) continue;
      const reversed = angularDiff(heading, entry.passedCourse) > BEHIND_ANGLE_DEG;
      const approaching = distance < entry.lastDistance - 5;
      entry.approachFixes = reversed && approaching && isRelevant(radar, position, heading, laneFilter)
        ? entry.approachFixes + 1
        : 0;
      entry.lastDistance = distance;
      if (entry.approachFixes >= UTURN_APPROACH_FIXES) this.memory.delete(radar.id);
    }
  }

  private forgetDistant(position: LatLon, alertRadius: number) {
    for (const [id, { radar }] of this.memory) {
      if (distanceMeters(position, radar) > alertRadius + REARM_MARGIN_M) {
        this.memory.delete(id);
        if (id === this.trackedId) this.untrack();
      }
    }
  }
}
