import { angularDiff, bearingDegrees, distanceMeters, type LatLon } from './geo';

export interface Radar extends LatLon {
  /** OpenStreetMap node id. */
  id: string;
  /** Speed limit in km/h, if tagged. */
  speedLimit: number | null;
  /**
   * Bearings (degrees) of the traffic the camera monitors.
   * Empty = no direction tag → treat as omnidirectional.
   */
  directions: number[];
}

/** A radar being tracked stays relevant while within this cone (± degrees) of our course. */
export const AHEAD_CONE_DEG = 90;
/** Radar's monitored direction must be within this many degrees of travel to be in our lane. */
export const LANE_TOLERANCE_DEG = 60;
/**
 * To start alerting a new radar it must lie in a corridor along our course:
 * lateral offset ≤ max(MIN_CORRIDOR_M, CORRIDOR_RATIO × distance). This rejects
 * cameras on parallel streets (e.g. 65 m or 180 m to the side in a city) while
 * still catching radars around normal bends; on tight bends they are picked up
 * a bit later, once closer.
 */
export const MIN_CORRIDOR_M = 40;
export const CORRIDOR_RATIO = 0.3;

/**
 * Whether `radar` matters to someone at `position` travelling towards `heading`.
 * 1. Geometric: radar is ahead — inside the corridor to start alerting (`acquire`),
 *    or just within the forward cone for the radar already being tracked.
 * 2. Lane (optional): if the radar has direction tags, one must match our direction of travel.
 */
export function isRelevant(
  radar: Radar,
  position: LatLon,
  heading: number,
  laneFilter = true,
  acquire = true,
): boolean {
  const offAxis = angularDiff(bearingDegrees(position, radar), heading);
  if (offAxis >= AHEAD_CONE_DEG) return false;
  if (acquire) {
    const distance = distanceMeters(position, radar);
    const lateral = distance * Math.sin((offAxis * Math.PI) / 180);
    if (lateral > Math.max(MIN_CORRIDOR_M, CORRIDOR_RATIO * distance)) return false;
  }
  if (!laneFilter || radar.directions.length === 0) return true;
  return radar.directions.some((dir) => angularDiff(dir, heading) < LANE_TOLERANCE_DEG);
}
