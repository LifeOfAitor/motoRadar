import * as SQLite from 'expo-sqlite';

import { boundingBox, distanceMeters, type LatLon } from '../core/geo';
import type { Radar } from '../core/radar';

interface RadarRow {
  id: string;
  lat: number;
  lon: number;
  speed_limit: number | null;
  directions: string;
}

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function db(): Promise<SQLite.SQLiteDatabase> {
  dbPromise ??= (async () => {
    const database = await SQLite.openDatabaseAsync('radars.db');
    await database.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS radars (
        id TEXT PRIMARY KEY NOT NULL,
        lat REAL NOT NULL,
        lon REAL NOT NULL,
        speed_limit INTEGER,
        directions TEXT NOT NULL DEFAULT ''
      );
      CREATE INDEX IF NOT EXISTS radars_lat_lon ON radars (lat, lon);
    `);
    return database;
  })().catch((error) => {
    dbPromise = null; // let the next call retry instead of caching the failure
    throw error;
  });
  return dbPromise;
}

const fromRow = (row: RadarRow): Radar => ({
  id: row.id,
  latitude: row.lat,
  longitude: row.lon,
  speedLimit: row.speed_limit,
  directions: row.directions ? row.directions.split(';').map(Number) : [],
});

/** Radars within `radius` meters of `center`. */
export async function radarsNearby(center: LatLon, radius: number): Promise<Radar[]> {
  const box = boundingBox(center, radius);
  const rows = await (await db()).getAllAsync<RadarRow>(
    'SELECT * FROM radars WHERE lat BETWEEN ? AND ? AND lon BETWEEN ? AND ?',
    box.minLat,
    box.maxLat,
    box.minLon,
    box.maxLon,
  );
  return rows.map(fromRow).filter((radar) => distanceMeters(center, radar) <= radius);
}

export async function allRadars(): Promise<Radar[]> {
  const rows = await (await db()).getAllAsync<RadarRow>('SELECT * FROM radars');
  return rows.map(fromRow);
}

export async function radarCount(): Promise<number> {
  const row = await (await db()).getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM radars');
  return row?.n ?? 0;
}

/** Replaces the whole cache atomically. */
export async function replaceAllRadars(radars: Radar[]): Promise<void> {
  await (await db()).withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync('DELETE FROM radars');
    const insert = await txn.prepareAsync(
      'INSERT OR REPLACE INTO radars (id, lat, lon, speed_limit, directions) VALUES ($id, $lat, $lon, $speed, $dirs)',
    );
    try {
      for (const radar of radars) {
        await insert.executeAsync({
          $id: radar.id,
          $lat: radar.latitude,
          $lon: radar.longitude,
          $speed: radar.speedLimit,
          $dirs: radar.directions.join(';'),
        });
      }
    } finally {
      await insert.finalizeAsync();
    }
  });
}
