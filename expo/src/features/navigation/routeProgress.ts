import type { RouteStep } from './navigationApiClient';
import { haversineKm } from './routeSummary';
import { formatHighwayStepTitle } from './routeStepDisplay';

type LatLng = { lat: number; lng: number };

export type RouteProgressView = {
  /** ルート全体に対するおおよその進捗 0〜1（ポリライン頂点ベース） */
  alongRoute01: number;
  /** 現在地が「steps[legIndex] → steps[legIndex+1]」の区間にある想定 */
  legIndex: number;
  fromShort: string;
  toShort: string;
  /** ルートから大きく離れているとき true */
  offRoute: boolean;
  /** ルートまでのおおよその距離（km） */
  distanceToRouteKm: number;
};

function hasValidCoord(s: RouteStep): boolean {
  return Math.abs(s.lat) > 1e-5 || Math.abs(s.lng) > 1e-5;
}

function resolveStepCoord(
  step: RouteStep,
  stepIndex: number,
  stepsLen: number,
  polyline: LatLng[],
): LatLng {
  if (hasValidCoord(step)) {
    return { lat: step.lat, lng: step.lng };
  }
  if (polyline.length === 0) {
    return { lat: step.lat, lng: step.lng };
  }
  if (step.type === 'origin') {
    return polyline[0]!;
  }
  if (step.type === 'destination') {
    return polyline[polyline.length - 1]!;
  }
  const t = stepsLen <= 1 ? 0 : stepIndex / (stepsLen - 1);
  const idx = Math.min(polyline.length - 1, Math.round(t * (polyline.length - 1)));
  return polyline[idx]!;
}

function nearestVertexIndex(p: LatLng, polyline: LatLng[]): { index: number; distKm: number } {
  let bestI = 0;
  let bestD = Infinity;
  for (let i = 0; i < polyline.length; i++) {
    const d = haversineKm(p, polyline[i]!);
    if (d < bestD) {
      bestD = d;
      bestI = i;
    }
  }
  return { index: bestI, distKm: bestD };
}

function vertexIndexToFrac(i: number, polylineLen: number): number {
  if (polylineLen <= 1) return 0;
  return i / (polylineLen - 1);
}

/**
 * GPS とルートポリライン・ステップから「今どの区間か」を推定（乗り換えアプリの進行表示に近い）
 */
export function computeRouteProgress(
  current: LatLng | null,
  steps: RouteStep[],
  polyline: LatLng[],
  options?: { offRouteKm?: number },
): RouteProgressView | null {
  const offThresh = options?.offRouteKm ?? 3.5;
  if (!current || polyline.length < 2 || steps.length < 2) {
    return null;
  }

  const { index: uIdx, distKm: distToRoute } = nearestVertexIndex(current, polyline);
  const userFrac = vertexIndexToFrac(uIdx, polyline.length);

  const stepFracs: number[] = [];
  for (let i = 0; i < steps.length; i++) {
    const c = resolveStepCoord(steps[i]!, i, steps.length, polyline);
    const { index } = nearestVertexIndex(c, polyline);
    let f = vertexIndexToFrac(index, polyline.length);
    if (i > 0 && f < stepFracs[i - 1]!) {
      f = stepFracs[i - 1]!;
    }
    stepFracs.push(f);
  }

  let legIndex = 0;
  if (userFrac <= stepFracs[0]!) {
    legIndex = 0;
  } else {
    for (let i = 0; i < stepFracs.length - 1; i++) {
      const a = stepFracs[i]!;
      const b = stepFracs[i + 1]!;
      if (userFrac >= a && userFrac <= b + 1e-5) {
        legIndex = i;
        break;
      }
      if (userFrac > b) {
        legIndex = i;
      }
    }
  }
  legIndex = Math.max(0, Math.min(legIndex, steps.length - 2));

  const fromStep = steps[legIndex]!;
  const toStep = steps[legIndex + 1]!;

  return {
    alongRoute01: Math.min(1, Math.max(0, userFrac)),
    legIndex,
    fromShort: formatHighwayStepTitle(fromStep.name, fromStep.type),
    toShort: formatHighwayStepTitle(toStep.name, toStep.type),
    offRoute: distToRoute > offThresh,
    distanceToRouteKm: distToRoute,
  };
}
