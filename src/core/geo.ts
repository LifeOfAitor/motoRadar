export interface LatLon {
  latitude: number;
  longitude: number;
}

const EARTH_RADIUS_M = 6_371_000;
const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

/** Great-circle distance in meters (haversine). */
export function distanceMeters(a: LatLon, b: LatLon): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Initial bearing from `from` to `to`, degrees clockwise from north (0–360). */
export function bearingDegrees(from: LatLon, to: LatLon): number {
  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);
  const dLon = toRad(to.longitude - from.longitude);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/** Shortest angular difference between two bearings (0–180). */
export function angularDiff(a: number, b: number): number {
  return Math.abs((((a - b + 540) % 360) + 360) % 360 - 180);
}

export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

/** Bounding box that contains every point within `radius` meters of `center`. */
export function boundingBox(center: LatLon, radius: number): BoundingBox {
  const latDelta = radius / 111_000;
  const cosLat = Math.cos(toRad(center.latitude));
  const lonDelta = cosLat > 1e-6 ? radius / (111_000 * cosLat) : 180;
  return {
    minLat: center.latitude - latDelta,
    maxLat: center.latitude + latDelta,
    minLon: center.longitude - lonDelta,
    maxLon: center.longitude + lonDelta,
  };
}
