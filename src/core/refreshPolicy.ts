import { distanceMeters, type LatLon } from './geo';

/** Radars are downloaded in this radius around the user. */
export const DOWNLOAD_RADIUS_M = 100_000;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_DRIFT_M = 40_000;

export interface FetchMeta extends LatLon {
  fetchedAt: number;
}

/** Refresh when there is no data, it is older than 7 days, or we moved > 40 km from where it was fetched. */
export function needsRefresh(meta: FetchMeta | null, position: LatLon, now: number): boolean {
  if (!meta) return true;
  if (now - meta.fetchedAt > MAX_AGE_MS) return true;
  return distanceMeters(meta, position) > MAX_DRIFT_M;
}
