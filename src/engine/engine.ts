import type { LocationObject } from 'expo-location';

import { dismissRadarNotification, showRadarNotification } from '../alerts/notifications';
import { stopVibration, vibrateForBand } from '../alerts/vibrator';
import { speak } from '../alerts/voice';
import { CourseTracker, type Fix } from '../core/course';
import { announcementText, formatDistance } from '../core/format';
import type { Radar } from '../core/radar';
import { DOWNLOAD_RADIUS_M, needsRefresh } from '../core/refreshPolicy';
import { RadarTracker, type TrackerResult } from '../core/tracker';
import { vibrationBand } from '../core/vibration';
import { fetchRadars } from '../data/overpass';
import { radarCount, radarsNearby, replaceAllRadars } from '../data/radarStore';
import { getFetchMeta, setFetchMeta, settingsStore, type Settings } from '../data/settings';
import { createStore } from '../lib/createStore';

export type PermissionLevel = 'undetermined' | 'denied' | 'foreground' | 'always';

export interface EngineState {
  fix: Fix | null;
  /** Direction of travel, null while unknown (stopped / no GPS course yet). */
  course: number | null;
  alert: { radar: Radar; distance: number } | null;
  radarCount: number;
  /** Bumped whenever the radar cache changes, so the map reloads it. */
  radarsVersion: number;
  refreshing: boolean;
  refreshError: string | null;
  lastFetchAt: number | null;
  permission: PermissionLevel;
}

export const engineStore = createStore<EngineState>({
  fix: null,
  course: null,
  alert: null,
  radarCount: 0,
  radarsVersion: 0,
  refreshing: false,
  refreshError: null,
  lastFetchAt: getFetchMeta()?.fetchedAt ?? null,
  permission: 'undetermined',
});

/** With no GPS fix for this long (tunnel, stopped at a light), alerts stop. */
const STALE_FIX_MS = 30_000;
/** Don't retry a failed download more often than this. */
const REFRESH_RETRY_MS = 5 * 60_000;

const tracker = new RadarTracker();
const course = new CourseTracker();
let processing = false;
let pendingFix: Fix | null = null;
let staleTimer: ReturnType<typeof setTimeout> | null = null;
let lastRefreshAttempt = 0;

export async function loadCacheInfo() {
  engineStore.set({ radarCount: await radarCount() });
}

/** Entry point for location updates (background task or foreground watcher). */
export function handleLocations(locations: LocationObject[]) {
  const latest = locations[locations.length - 1];
  if (!latest) return;
  pendingFix = {
    latitude: latest.coords.latitude,
    longitude: latest.coords.longitude,
    heading: latest.coords.heading,
    speed: latest.coords.speed,
    timestamp: latest.timestamp,
  };
  void drain();
}

/** Processes fixes one at a time; if several arrive meanwhile, only the newest is used. */
async function drain() {
  if (processing) return;
  processing = true;
  try {
    while (pendingFix) {
      const fix = pendingFix;
      pendingFix = null;
      await processFix(fix);
    }
  } catch (error) {
    console.warn('[engine] processFix failed', error);
  } finally {
    processing = false;
  }
}

async function processFix(fix: Fix) {
  const heading = course.update(fix);
  engineStore.set({ fix, course: heading });
  armStaleTimer();
  maybeRefresh(fix);

  const settings = settingsStore.get();
  const candidates = await radarsNearby(fix, settings.alertRadius);
  const result = tracker.step(fix, heading, candidates, {
    alertRadius: settings.alertRadius,
    laneFilter: settings.laneFilterEnabled,
  });

  if (result.kind === 'none') {
    clearAlert();
    return;
  }
  engineStore.set({ alert: { radar: result.radar, distance: result.distance } });
  applyAlerts(result, settings);
}

function applyAlerts(result: Extract<TrackerResult, { kind: 'alert' }>, settings: Settings) {
  if (settings.muted) return;

  if (settings.vibrationEnabled) {
    vibrateForBand(vibrationBand(result.distance, settings.vibrationIntensity));
  }
  if (result.isNew) {
    if (settings.voiceEnabled) speak(announcementText(result.distance, result.radar.speedLimit));
    const limit = result.radar.speedLimit ? ` · Límite ${result.radar.speedLimit} km/h` : '';
    void showRadarNotification('Radar próximo', `${formatDistance(result.distance)}${limit}`);
  }
}

function clearAlert() {
  stopVibration();
  if (engineStore.get().alert) {
    engineStore.set({ alert: null });
    void dismissRadarNotification();
  }
}

function armStaleTimer() {
  if (staleTimer) clearTimeout(staleTimer);
  staleTimer = setTimeout(() => {
    staleTimer = null;
    clearAlert();
  }, STALE_FIX_MS);
}

// Muting or disabling vibration mid-alert takes effect immediately.
settingsStore.subscribe(() => {
  const { muted, vibrationEnabled } = settingsStore.get();
  if (muted || !vibrationEnabled) stopVibration();
  if (muted) void dismissRadarNotification();
});

function maybeRefresh(fix: Fix) {
  const now = Date.now();
  if (engineStore.get().refreshing || now - lastRefreshAttempt < REFRESH_RETRY_MS) return;
  if (!needsRefresh(getFetchMeta(), fix, now)) return;
  void refreshRadars(fix);
}

/** Downloads radars around `center` from OpenStreetMap and replaces the cache. */
export async function refreshRadars(center: { latitude: number; longitude: number }) {
  if (engineStore.get().refreshing) return;
  lastRefreshAttempt = Date.now();
  engineStore.set({ refreshing: true, refreshError: null });
  try {
    const radars = await fetchRadars(center, DOWNLOAD_RADIUS_M);
    await replaceAllRadars(radars);
    const fetchedAt = Date.now();
    setFetchMeta({ latitude: center.latitude, longitude: center.longitude, fetchedAt });
    engineStore.set({
      radarCount: radars.length,
      radarsVersion: engineStore.get().radarsVersion + 1,
      lastFetchAt: fetchedAt,
    });
  } catch (error) {
    console.warn('[engine] refresh failed', error);
    engineStore.set({ refreshError: 'No se pudieron descargar los radares. Se usan los guardados.' });
  } finally {
    engineStore.set({ refreshing: false });
  }
}
