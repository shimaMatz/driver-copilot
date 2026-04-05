import type { LatLng } from './useNavigation';

const EARTH_RADIUS_KM = 6371;

export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

/** 概算所要時間（分）。一般道寄りの平均速度 km/h を仮定。 */
export function estimateMinutes(distanceKm: number, assumedKmh: number): number {
  if (distanceKm <= 0 || assumedKmh <= 0) return 0;
  return Math.max(1, Math.round((distanceKm / assumedKmh) * 60));
}

export function formatDurationJa(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h <= 0) return `${m}分`;
  return m === 0 ? `${h}時間` : `${h}時間${m}分`;
}

export function regionForPoints(points: LatLng[]): {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
} {
  if (points.length === 0) {
    return {
      latitude: 35.681236,
      longitude: 139.767125,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    };
  }
  const lats = points.map(p => p.lat);
  const lngs = points.map(p => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latPad = Math.max((maxLat - minLat) * 0.35, 0.015);
  const lngPad = Math.max((maxLng - minLng) * 0.35, 0.015);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(maxLat - minLat + latPad, 0.04),
    longitudeDelta: Math.max(maxLng - minLng + lngPad, 0.04),
  };
}
