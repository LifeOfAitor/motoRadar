import type { LatLon } from '../core/geo';
import type { Radar } from '../core/radar';

const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];
const TIMEOUT_MS = 90_000;

export function buildQuery(center: LatLon, radius: number): string {
  return `[out:json][timeout:60];
node["highway"="speed_camera"](around:${Math.round(radius)},${center.latitude},${center.longitude});
out body;`;
}

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  tags?: Record<string, string>;
}

export function parseResponse(json: unknown): Radar[] {
  const elements = (json as { elements?: OverpassElement[] })?.elements;
  if (!Array.isArray(elements)) throw new Error('Respuesta de Overpass inválida');
  return elements
    .filter((el) => el.type === 'node' && typeof el.lat === 'number' && typeof el.lon === 'number')
    .map((el) => ({
      id: String(el.id),
      latitude: el.lat!,
      longitude: el.lon!,
      speedLimit: parseMaxSpeed(el.tags?.maxspeed),
      directions: parseDirections(el.tags?.direction),
    }));
}

/** "50" → 50, "30 mph" → 48, "50;30" → 50, "ES:urban"/"none" → null. */
export function parseMaxSpeed(value: string | undefined): number | null {
  const match = value?.trim().match(/^(\d+)\s*(mph)?/i);
  if (!match) return null;
  const speed = Number(match[1]);
  if (!speed) return null;
  return match[2] ? Math.round(speed * 1.609) : speed;
}

const CARDINALS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

/**
 * OSM `direction` for cameras: degrees ("90"), cardinal ("NE") or several
 * separated by ";" ("90;270"). Unparseable values (e.g. "forward") → [] = omnidirectional.
 */
export function parseDirections(value: string | undefined): number[] {
  if (!value) return [];
  const parts = value.split(';').map((part) => part.trim().toUpperCase());
  const parsed = parts.map((part) => {
    if (/^-?\d+(\.\d+)?$/.test(part)) return ((Number(part) % 360) + 360) % 360;
    const index = CARDINALS.indexOf(part);
    return index >= 0 ? index * 22.5 : null;
  });
  return parsed.every((dir) => dir !== null) ? (parsed as number[]) : [];
}

export async function fetchRadars(center: LatLon, radius: number): Promise<Radar[]> {
  const body = `data=${encodeURIComponent(buildQuery(center, radius))}`;
  let lastError: unknown;
  for (const endpoint of ENDPOINTS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'RadarMoto/1.0',
        },
        body,
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Overpass HTTP ${response.status}`);
      return parseResponse(await response.json());
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError;
}
