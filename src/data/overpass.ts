import { boundingBox, type LatLon } from '../core/geo';
import type { Radar } from '../core/radar';

// Public Overpass servers are often overloaded (502/504, or hanging); tried in
// order with a short timeout so one stuck server doesn't block the download.
// Measured 2026-10: mail.ru ~15 s for 100 km, overpass-api.de 0–31 s or 502.
const ENDPOINTS = [
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];
const TIMEOUT_MS = 45_000;

/**
 * Bounding box rather than `around:`: for a 100 km radius `around` regularly
 * times out (HTTP 504) on the public servers, while a bbox query takes ~15–30 s.
 * Radars in the box corners (beyond the radius) are harmless.
 */
export function buildQuery(center: LatLon, radius: number): string {
  const box = boundingBox(center, radius);
  const bbox = [box.minLat, box.minLon, box.maxLat, box.maxLon].map((v) => v.toFixed(4)).join(',');
  return `[out:json][timeout:40];
node["highway"="speed_camera"](${bbox});
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
  const { elements, remark } = (json ?? {}) as { elements?: OverpassElement[]; remark?: string };
  // On timeouts / out-of-memory Overpass answers HTTP 200 with a `remark` and partial data.
  if (remark) throw new Error(`Overpass: ${remark}`);
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
 * OSM `direction` for cameras: degrees ("90"), cardinal ("NE"), a range ("0-90",
 * its middle is used) or several separated by ";" ("90;270").
 * Unparseable values (e.g. "forward") → [] = omnidirectional.
 */
export function parseDirections(value: string | undefined): number[] {
  if (!value) return [];
  const parts = value
    .split(';')
    .map((part) => part.trim().toUpperCase())
    .filter(Boolean);
  const parsed = parts.map(parseDirection);
  return parsed.length > 0 && parsed.every((dir) => dir !== null) ? (parsed as number[]) : [];
}

const normalize = (deg: number) => ((deg % 360) + 360) % 360;

function parseDirection(part: string): number | null {
  if (/^-?\d+(\.\d+)?$/.test(part)) return normalize(Number(part));
  const range = part.match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/);
  if (range) {
    const from = Number(range[1]);
    const to = Number(range[2]);
    return normalize(from + normalize(to - from) / 2);
  }
  const index = CARDINALS.indexOf(part);
  return index >= 0 ? index * 22.5 : null;
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
      console.warn(`[overpass] ${endpoint} failed`, error);
      lastError = error;
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError;
}
