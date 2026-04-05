import axios from 'axios';
import { markPlannedRestStops } from './routeRestPlanning';
import { NavigationRecommendation, PlaceSuggestion, QolSpot, QolSpotType } from './types';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://192.168.1.2:8080';
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
const API_TIMEOUT_MS = 10_000;

// --- ルートセグメント ---

export interface RouteSegment {
  points: Array<{ lat: number; lng: number }>;
  isToll: boolean;
}

/** ルート上の通過ポイント（IC・JCT・SA・PA 等。一般道の細かい曲がりは含めない） */
export interface RouteStep {
  name: string;
  lat: number;
  lng: number;
  distanceFromStartKm: number;
  etaMinutes: number;
  isToll: boolean;
  type: 'origin' | 'ic' | 'jct' | 'sa' | 'pa' | 'destination';
  /** 4時間運転の区切りとして暫定で選んだ休憩（SA/PA） */
  isPlannedRest?: boolean;
}

export interface DirectionsRoute {
  segments: RouteSegment[];
  polylinePoints: Array<{ lat: number; lng: number }>; // バウンディングボックス用
  distanceMeters: number;
  durationSeconds: number;
  steps: RouteStep[];
}

// --- ポリラインデコード ---

function decodePolyline(encoded: string): Array<{ lat: number; lng: number }> {
  const points: Array<{ lat: number; lng: number }> = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
}

// --- 有料道路判定（日本の高速道路パターン） ---

const TOLL_PATTERN = /高速|自動車道|有料|首都高|阪神高|名神|東名|中央道|北陸道|東北道|常磐道|山陽道|九州道|関越|道央|E\d+/;

function isTollStep(htmlInstruction: string): boolean {
  return TOLL_PATTERN.test(htmlInstruction);
}

// --- Google Directions API ---

interface DirectionsStep {
  html_instructions: string;
  polyline: { points: string };
  distance: { value: number };
  duration: { value: number };
}

interface DirectionsResponse {
  routes: Array<{
    overview_polyline: { points: string };
    legs: Array<{
      distance: { value: number };
      duration: { value: number };
      steps: DirectionsStep[];
    }>;
  }>;
  status: string;
}

function extractStepName(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

/**
 * インター・JCT・SA・PA のみ（高速の「出口」単独や一般道の交差点は除外）
 */
function classifyHighwayManeuver(cleanedName: string, tollContext: boolean): RouteStep['type'] | null {
  const n = cleanedName.replace(/\s+/g, ' ').trim();
  if (!n) return null;

  if (/サービスエリア/.test(n)) return 'sa';
  if (/パーキングエリア/.test(n)) return 'pa';
  if (/ジャンクション|JCTに|JCTで|JCTを|JCTへ|\bJCT\b/.test(n)) return 'jct';
  if (
    /インターチェンジ|インターに|インターへ|インターで|インターを|インター\b/.test(n) ||
    /\bIC\b|ICに|ICで|ICを|ICへ/.test(n)
  ) {
    return 'ic';
  }
  if (/料金所/.test(n) && tollContext) return 'ic';
  return null;
}

function buildStepsFromLegs(
  legs: DirectionsResponse['routes'][0]['legs'],
  originName: string,
  destName: string,
): RouteStep[] {
  const steps: RouteStep[] = [];
  let cumDistKm = 0;
  let cumDurMin = 0;

  steps.push({
    name: originName,
    lat: 0,
    lng: 0,
    distanceFromStartKm: 0,
    etaMinutes: 0,
    isToll: false,
    type: 'origin',
  });

  for (const leg of legs) {
    for (const step of leg.steps) {
      const name = extractStepName(step.html_instructions);
      const toll = isTollStep(step.html_instructions);
      cumDistKm += step.distance.value / 1000;
      cumDurMin += step.duration.value / 60;
      const kind = classifyHighwayManeuver(name, toll);
      if (!kind) continue;

      const pts = decodePolyline(step.polyline.points);
      const pt =
        pts.length > 0 ? pts[pts.length - 1]! : { lat: 0, lng: 0 };

      const prev = steps[steps.length - 1];
      if (prev && prev.name === name && prev.type === kind) continue;

      steps.push({
        name,
        lat: pt.lat,
        lng: pt.lng,
        distanceFromStartKm: Math.round(cumDistKm * 10) / 10,
        etaMinutes: Math.round(cumDurMin),
        isToll: toll,
        type: kind,
      });
    }
  }

  const totalDist = legs.reduce((s, l) => s + l.distance.value, 0);
  const totalDur = legs.reduce((s, l) => s + l.duration.value, 0);
  steps.push({
    name: destName,
    lat: 0,
    lng: 0,
    distanceFromStartKm: Math.round(totalDist / 100) / 10,
    etaMinutes: Math.round(totalDur / 60),
    isToll: false,
    type: 'destination',
  });

  return markPlannedRestStops(steps, 240);
}

function buildSegments(legs: DirectionsResponse['routes'][0]['legs']): RouteSegment[] {
  const result: RouteSegment[] = [];
  for (const leg of legs) {
    for (const step of leg.steps) {
      const pts = decodePolyline(step.polyline.points);
      if (pts.length === 0) continue;
      const toll = isTollStep(step.html_instructions);
      const prev = result[result.length - 1];
      if (prev && prev.isToll === toll) {
        // 同一種別は結合（重複点を除く）
        prev.points.push(...pts.slice(1));
      } else {
        // 種別が変わる場合、前セグメントの末尾点から開始して連続性を保つ
        const start = prev ? [prev.points[prev.points.length - 1], ...pts.slice(1)] : pts;
        result.push({ points: start, isToll: toll });
      }
    }
  }
  return result;
}

async function fetchGoogleDirectionsRoute(
  origin: { lat: number; lng: number },
  dest: { lat: number; lng: number },
  waypoints?: Array<{ lat: number; lng: number }>,
  avoidTolls = false,
): Promise<DirectionsRoute | null> {
  const waypointsParam =
    waypoints && waypoints.length > 0
      ? waypoints.map(w => `${w.lat},${w.lng}`).join('|')
      : undefined;
  const { data } = await axios.get<DirectionsResponse>(
    'https://maps.googleapis.com/maps/api/directions/json',
    {
      params: {
        origin: `${origin.lat},${origin.lng}`,
        destination: `${dest.lat},${dest.lng}`,
        mode: 'driving',
        language: 'ja',
        key: GOOGLE_MAPS_API_KEY,
        ...(waypointsParam ? { waypoints: waypointsParam } : {}),
        ...(avoidTolls ? { avoid: 'tolls' } : {}),
      },
      timeout: API_TIMEOUT_MS,
    },
  );
  if (data.status !== 'OK' || data.routes.length === 0) return null;
  const route = data.routes[0];
  const segments = buildSegments(route.legs);
  const polylinePoints = decodePolyline(route.overview_polyline.points);
  const steps = buildStepsFromLegs(route.legs, '出発', '目的地');
  return {
    segments,
    polylinePoints,
    distanceMeters: route.legs.reduce((s, l) => s + l.distance.value, 0),
    durationSeconds: route.legs.reduce((s, l) => s + l.duration.value, 0),
    steps,
  };
}

// --- OSRM (フォールバック) ---

interface OsrmResponse {
  code: string;
  routes: Array<{
    geometry: { coordinates: [number, number][]; type: string };
    distance: number;
    duration: number;
  }>;
}

async function fetchOsrmRoute(
  origin: { lat: number; lng: number },
  dest: { lat: number; lng: number },
  waypoints?: Array<{ lat: number; lng: number }>,
): Promise<DirectionsRoute | null> {
  const coords = [origin, ...(waypoints ?? []), dest]
    .map(p => `${p.lng},${p.lat}`)
    .join(';');
  const { data } = await axios.get<OsrmResponse>(
    `https://router.project-osrm.org/route/v1/driving/${coords}`,
    {
      params: { overview: 'full', geometries: 'geojson' },
      timeout: API_TIMEOUT_MS,
    },
  );
  if (data.code !== 'Ok' || !data.routes?.length) return null;
  const route = data.routes[0];
  const pts = route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));
  const durMin = Math.max(0, Math.round(route.duration / 60));
  const distKm = Math.round(route.distance / 100) / 10;
  const osrmSteps: RouteStep[] = markPlannedRestStops(
    [
      {
        name: '出発',
        lat: origin.lat,
        lng: origin.lng,
        distanceFromStartKm: 0,
        etaMinutes: 0,
        isToll: false,
        type: 'origin',
      },
      {
        name: '目的地',
        lat: dest.lat,
        lng: dest.lng,
        distanceFromStartKm: distKm,
        etaMinutes: durMin,
        isToll: false,
        type: 'destination',
      },
    ],
    240,
  );
  return {
    segments: [{ points: pts, isToll: false }],
    polylinePoints: pts,
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    steps: osrmSteps,
  };
}

export async function fetchDirectionsRoute(
  origin: { lat: number; lng: number },
  dest: { lat: number; lng: number },
  waypoints?: Array<{ lat: number; lng: number }>,
  avoidTolls = false,
): Promise<DirectionsRoute | null> {
  if (GOOGLE_MAPS_API_KEY) {
    try {
      const result = await fetchGoogleDirectionsRoute(origin, dest, waypoints, avoidTolls);
      if (result) return result;
    } catch {
      // Google 失敗時は OSRM へフォールバック
    }
  }
  return fetchOsrmRoute(origin, dest, waypoints);
}

// --- バックエンド API ---

export interface RecommendRestRequest {
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  remainingDrivingSeconds: number;
}

export async function recommendRest(req: RecommendRestRequest): Promise<NavigationRecommendation> {
  const { data } = await axios.post<NavigationRecommendation>(
    `${BASE_URL}/api/v1/navigation/recommend-rest`,
    req,
    { timeout: API_TIMEOUT_MS },
  );
  return data;
}

// --- 場所検索 ---

interface PlacesAutocompleteResponse {
  predictions: Array<{ place_id: string; description: string }>;
  status: string;
}

interface PlaceDetailsResponse {
  result?: { geometry?: { location?: { lat: number; lng: number } } };
  status: string;
}

const NOMINATIM_PREFIX = 'nominatim:';

interface NominatimResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
}

async function fetchNominatimSuggestions(input: string): Promise<PlaceSuggestion[]> {
  const { data } = await axios.get<NominatimResult[]>(
    'https://nominatim.openstreetmap.org/search',
    {
      params: { q: input, format: 'json', countrycodes: 'jp', limit: 5, 'accept-language': 'ja' },
      headers: { 'User-Agent': 'TruckCopilot/1.0' },
      timeout: API_TIMEOUT_MS,
    },
  );
  return data.map(r => ({
    placeId: `${NOMINATIM_PREFIX}${r.lat}:${r.lon}`,
    description: r.display_name,
  }));
}

export async function fetchPlaceSuggestions(input: string): Promise<PlaceSuggestion[]> {
  if (input.trim().length < 2) return [];
  if (GOOGLE_MAPS_API_KEY) {
    try {
      const { data } = await axios.get<PlacesAutocompleteResponse>(
        'https://maps.googleapis.com/maps/api/place/autocomplete/json',
        {
          params: { input, language: 'ja', key: GOOGLE_MAPS_API_KEY, components: 'country:jp' },
          timeout: API_TIMEOUT_MS,
        },
      );
      if (data.status === 'OK' && data.predictions.length > 0) {
        return data.predictions.map(p => ({ placeId: p.place_id, description: p.description }));
      }
    } catch {
      // Nominatim へフォールバック
    }
  }
  return fetchNominatimSuggestions(input);
}

export async function resolvePlaceToLatLng(
  placeId: string,
): Promise<{ lat: number; lng: number } | null> {
  if (placeId.startsWith(NOMINATIM_PREFIX)) {
    const [lat, lng] = placeId.slice(NOMINATIM_PREFIX.length).split(':').map(Number);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
    return null;
  }
  if (!GOOGLE_MAPS_API_KEY || !placeId) return null;
  const { data } = await axios.get<PlaceDetailsResponse>(
    'https://maps.googleapis.com/maps/api/place/details/json',
    {
      params: { place_id: placeId, fields: 'geometry', key: GOOGLE_MAPS_API_KEY, language: 'ja' },
      timeout: API_TIMEOUT_MS,
    },
  );
  const location = data.result?.geometry?.location;
  if (!location) return null;
  return { lat: location.lat, lng: location.lng };
}

// --- QOLスポット検索 ---

interface PlacesNearbyResponse {
  results: Array<{
    place_id: string;
    name: string;
    geometry: { location: { lat: number; lng: number } };
    vicinity: string;
    opening_hours?: { open_now: boolean };
  }>;
  status: string;
}

const QOL_SPOT_KEYWORDS: Record<QolSpotType, string> = {
  sento: '銭湯 スーパー銭湯 大型車',
  restaurant_24h: '24時間 レストラン トラック ドライバー',
  laundry: 'コインランドリー 大型車',
};

interface OverpassElement {
  id: number;
  type: 'node' | 'way' | 'relation';
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

const OVERPASS_FILTERS: Record<QolSpotType, string> = {
  sento: '["amenity"="public_bath"]',
  restaurant_24h: '["amenity"="restaurant"]["opening_hours"~"24/7|00:00-24:00|24時間"]',
  laundry: '["shop"="laundry"]',
};

async function fetchOverpassQolSpots(
  center: { lat: number; lng: number },
  spotType: QolSpotType,
  radiusMeters: number,
): Promise<QolSpot[]> {
  const f = OVERPASS_FILTERS[spotType];
  const q = `[out:json][timeout:10];(node${f}(around:${radiusMeters},${center.lat},${center.lng});way${f}(around:${radiusMeters},${center.lat},${center.lng}););out center 10;`;
  const { data } = await axios.post<{ elements: OverpassElement[] }>(
    'https://overpass-api.de/api/interpreter',
    `data=${encodeURIComponent(q)}`,
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: API_TIMEOUT_MS },
  );
  return data.elements.slice(0, 8).map(el => ({
    id: `overpass-${el.id}`,
    name: el.tags?.name ?? '名称不明',
    lat: el.type === 'way' ? (el.center?.lat ?? 0) : (el.lat ?? 0),
    lng: el.type === 'way' ? (el.center?.lon ?? 0) : (el.lon ?? 0),
    type: spotType,
    address: el.tags?.['addr:full'] ?? el.tags?.['addr:city'] ?? undefined,
  }));
}

export async function fetchQolSpots(
  center: { lat: number; lng: number },
  spotType: QolSpotType,
  radiusMeters = 10_000,
): Promise<QolSpot[]> {
  if (GOOGLE_MAPS_API_KEY) {
    try {
      const { data } = await axios.get<PlacesNearbyResponse>(
        'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
        {
          params: {
            location: `${center.lat},${center.lng}`,
            radius: radiusMeters,
            keyword: QOL_SPOT_KEYWORDS[spotType],
            language: 'ja',
            key: GOOGLE_MAPS_API_KEY,
          },
          timeout: API_TIMEOUT_MS,
        },
      );
      if (data.status === 'OK' && data.results.length > 0) {
        return data.results.slice(0, 8).map(r => ({
          id: r.place_id,
          name: r.name,
          lat: r.geometry.location.lat,
          lng: r.geometry.location.lng,
          type: spotType,
          address: r.vicinity,
          openNow: r.opening_hours?.open_now,
        }));
      }
    } catch {
      // Overpass へフォールバック
    }
  }
  return fetchOverpassQolSpots(center, spotType, radiusMeters);
}
