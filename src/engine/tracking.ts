import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Alert, Platform } from 'react-native';

import { setupNotifications } from '../alerts/notifications';
import { engineStore, handleLocations } from './engine';

export const LOCATION_TASK = 'radarmoto-location';

// Must run at module load (imported from index.ts) so the OS can deliver
// background updates even before any screen mounts.
TaskManager.defineTask<{ locations: Location.LocationObject[] }>(LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.warn('[tracking] task error', error.message);
    return;
  }
  if (data?.locations) handleLocations(data.locations);
});

const LOCATION_OPTIONS: Location.LocationOptions = {
  // ≈ kCLLocationAccuracyNearestTenMeters on iOS; enough for radar alerts and easy on battery.
  accuracy: Location.Accuracy.High,
  distanceInterval: 10,
  timeInterval: 1000,
};

let foregroundWatcher: Location.LocationSubscription | null = null;
let askedBackgroundThisLaunch = false;
let inFlight: Promise<void> | null = null;

/**
 * Asks for permissions and starts location updates: in the background when
 * "Siempre / Todo el tiempo" is granted, otherwise only while the app is open.
 * Safe to call repeatedly (e.g. every time the app returns to the foreground).
 */
export function startTracking(): Promise<void> {
  inFlight ??= doStartTracking().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function doStartTracking() {
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (!foreground.granted) {
    engineStore.set({ permission: 'denied' });
    await stopAll();
    return;
  }

  let background = await Location.getBackgroundPermissionsAsync();
  if (!background.granted && background.canAskAgain && !askedBackgroundThisLaunch) {
    askedBackgroundThisLaunch = true;
    await explainBackgroundPermission();
    background = await Location.requestBackgroundPermissionsAsync();
  }

  await setupNotifications().catch(() => false);

  if (background.granted) {
    await stopForegroundWatcher();
    await Location.startLocationUpdatesAsync(LOCATION_TASK, {
      ...LOCATION_OPTIONS,
      activityType: Location.ActivityType.AutomotiveNavigation,
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'RadarMoto activo',
        notificationBody: 'Vigilando radares en tu ruta',
        notificationColor: '#E53935',
        killServiceOnDestroy: true,
      },
    });
    engineStore.set({ permission: 'always' });
  } else {
    await stopBackgroundUpdates();
    foregroundWatcher ??= await Location.watchPositionAsync(LOCATION_OPTIONS, (location) =>
      handleLocations([location]),
    );
    engineStore.set({ permission: 'foreground' });
  }
}

async function stopAll() {
  await stopForegroundWatcher();
  await stopBackgroundUpdates();
}

async function stopForegroundWatcher() {
  foregroundWatcher?.remove();
  foregroundWatcher = null;
}

async function stopBackgroundUpdates() {
  if (await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false)) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK);
  }
}

function explainBackgroundPermission(): Promise<void> {
  const option = Platform.OS === 'android' ? '"Permitir todo el tiempo"' : '"Permitir siempre"';
  return new Promise((resolve) =>
    Alert.alert(
      'Avisos con el móvil bloqueado',
      `Para avisarte de los radares con la pantalla apagada, RadarMoto necesita tu ubicación en segundo plano. En la siguiente pantalla elige ${option}.`,
      [{ text: 'Continuar', onPress: () => resolve() }],
      { cancelable: false },
    ),
  );
}
