import { distanceMeters, type LatLon } from './geo';
import { isRelevant, type Radar } from './radar';

/** Radar counts as passed once we are this much farther than our closest approach. */
export const PASS_MARGIN_M = 60;
/**
 * If a tracked radar drops out of the forward cone after we got this close, it is
 * behind us → passed. Farther away it may just be a bend in the road, so it is
 * hidden but not suppressed.
 */
export const CLOSE_APPROACH_M = 150;
/** A passed/announced radar is forgotten once it is this far beyond the alert radius. */
export const REARM_MARGIN_M = 150;

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
}

/**
 * Picks the radar to alert for and decides when it has been passed.
 *
 * Passed radars stay suppressed until we are well away from them, so a radar
 * behind us never comes back with growing distances.
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

    const inRange = candidates
      .map((radar) => ({ radar, distance: distanceMeters(position, radar) }))
      .filter(({ radar, distance }) => distance <= alertRadius && !this.memory.get(radar.id)?.passed);

    const relevant =
      heading === null
        ? inRange
        : inRange.filter(({ radar }) => isRelevant(radar, position, heading, laneFilter));

    // Tracked radar dropped out of the relevant set (but is still in range).
    if (this.trackedId && !relevant.some(({ radar }) => radar.id === this.trackedId)) {
      const stillInRange = inRange.some(({ radar }) => radar.id === this.trackedId);
      if (stillInRange && this.minDistance <= CLOSE_APPROACH_M) this.markPassed(this.trackedId);
      if (!stillInRange || this.minDistance <= CLOSE_APPROACH_M) this.untrack();
    }

    const sorted = relevant.sort((a, b) => a.distance - b.distance);
    for (const { radar, distance } of sorted) {
      if (radar.id !== this.trackedId) {
        this.trackedId = radar.id;
        this.minDistance = distance;
      } else if (distance < this.minDistance) {
        this.minDistance = distance;
      }

      if (distance > this.minDistance + PASS_MARGIN_M) {
        this.markPassed(radar.id);
        this.untrack();
        continue; // try the next-nearest radar
      }

      const isNew = !this.memory.has(radar.id);
      if (isNew) this.memory.set(radar.id, { radar, passed: false });
      return { kind: 'alert', radar, distance, isNew };
    }

    return { kind: 'none' };
  }

  reset() {
    this.untrack();
    this.memory.clear();
  }

  private markPassed(id: string) {
    const entry = this.memory.get(id);
    if (entry) entry.passed = true;
  }

  private untrack() {
    this.trackedId = null;
    this.minDistance = Infinity;
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
