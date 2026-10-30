import Storage from 'expo-sqlite/kv-store';

import type { FetchMeta } from '../core/refreshPolicy';
import { createStore } from '../lib/createStore';

export interface Settings {
  /** Alert radius in meters. */
  alertRadius: number;
  vibrationEnabled: boolean;
  /** 0.3 (suave) … 1 (máxima). Android only; iOS vibrates at a fixed strength. */
  vibrationIntensity: number;
  /** Speak once when a radar is first detected. */
  voiceEnabled: boolean;
  /** Ignore radars that monitor the opposite direction. */
  laneFilterEnabled: boolean;
  /** Quick mute from the main screen: silences vibration, voice and notifications. */
  muted: boolean;
}

export const RADIUS_OPTIONS = [300, 500, 750, 1000];

const DEFAULTS: Settings = {
  alertRadius: 500,
  vibrationEnabled: true,
  vibrationIntensity: 1,
  voiceEnabled: true,
  laneFilterEnabled: true,
  muted: false,
};

const SETTINGS_KEY = 'settings';
const FETCH_META_KEY = 'fetchMeta';

function readJson<T>(key: string): T | null {
  try {
    const raw = Storage.getItemSync(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export const settingsStore = createStore<Settings>({
  ...DEFAULTS,
  ...readJson<Partial<Settings>>(SETTINGS_KEY),
});

export function updateSettings(patch: Partial<Settings>) {
  settingsStore.set(patch);
  Storage.setItemSync(SETTINGS_KEY, JSON.stringify(settingsStore.get()));
}

export function getFetchMeta(): FetchMeta | null {
  return readJson<FetchMeta>(FETCH_META_KEY);
}

export function setFetchMeta(meta: FetchMeta) {
  Storage.setItemSync(FETCH_META_KEY, JSON.stringify(meta));
}
