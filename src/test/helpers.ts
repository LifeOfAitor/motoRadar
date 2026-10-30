import type { LatLon } from '../core/geo';
import type { Radar } from '../core/radar';

export const MADRID: LatLon = { latitude: 40.4168, longitude: -3.7038 };

/** Point `meters` away from `origin` towards `bearing` (flat-earth approximation, fine for < 10 km). */
export function offset(origin: LatLon, meters: number, bearing: number): LatLon {
  const rad = (bearing * Math.PI) / 180;
  const dLat = (meters * Math.cos(rad)) / 111_320;
  const dLon = (meters * Math.sin(rad)) / (111_320 * Math.cos((origin.latitude * Math.PI) / 180));
  return { latitude: origin.latitude + dLat, longitude: origin.longitude + dLon };
}

export function radarAt(position: LatLon, id = 'r1', extra: Partial<Radar> = {}): Radar {
  return { id, ...position, speedLimit: 80, directions: [], ...extra };
}
