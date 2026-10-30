/**
 * Distance rounded for display/speech: 10 m steps under 100 m, 50 m steps up to
 * 1 km, then kilometres with one decimal. Meter-level precision is noise at speed.
 */
export function roundDistance(meters: number): number {
  if (meters < 100) return Math.max(10, Math.round(meters / 10) * 10);
  return Math.round(meters / 50) * 50;
}

export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters)) return '';
  const rounded = roundDistance(meters);
  if (rounded < 1000) return `${rounded} m`;
  return `${(rounded / 1000).toFixed(1).replace('.', ',')} km`;
}

/** Single spoken announcement when a radar is first detected. */
export function announcementText(meters: number, speedLimit: number | null): string {
  const rounded = roundDistance(meters);
  const distance =
    rounded < 1000 ? `${rounded} metros` : `${(rounded / 1000).toFixed(1).replace('.', ',')} kilómetros`;
  return speedLimit ? `Radar a ${distance}, límite ${speedLimit}` : `Radar a ${distance}`;
}

export function formatSpeed(metersPerSecond: number | null): string {
  if (metersPerSecond === null || metersPerSecond < 0) return '--';
  return String(Math.round(metersPerSecond * 3.6));
}
