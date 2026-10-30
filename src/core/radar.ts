import { angularDiff, bearingDegrees, type LatLon } from './geo';

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

/** Radar must be within this cone (± degrees) of the direction of travel to count as "ahead". */
export const AHEAD_CONE_DEG = 90;
/** Radar's monitored direction must be within this many degrees of travel to be in our lane. */
export const LANE_TOLERANCE_DEG = 60;

/**
 * Whether `radar` matters to someone at `position` travelling towards `heading`.
 * 1. Geometric: radar is roughly ahead.
 * 2. Lane (optional): if the radar has direction tags, one must match our direction of travel.
 */
export function isRelevant(
  radar: Radar,
  position: LatLon,
  heading: number,
  laneFilter = true,
): boolean {
  if (angularDiff(bearingDegrees(position, radar), heading) >= AHEAD_CONE_DEG) return false;
  if (!laneFilter || radar.directions.length === 0) return true;
  return radar.directions.some((dir) => angularDiff(dir, heading) < LANE_TOLERANCE_DEG);
}
