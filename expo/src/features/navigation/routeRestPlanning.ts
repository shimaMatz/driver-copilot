import type { RouteStep } from './navigationApiClient';

/**
 * 連続運転の上限（分）を超える前に停車できる SA/PA を暫定の休憩地点としてマークする。
 * 各区間 [lastRest, lastRest+max] 内に存在する SA/PA のうち、最も遅い（締切に近い）地点を選ぶ。
 * 区間内に無い場合は、直後の最初の SA/PA を選ぶ（4h 超過は避けられないケース）。
 */
export function markPlannedRestStops(
  steps: RouteStep[],
  maxDrivingMinutes = 240,
): RouteStep[] {
  if (steps.length < 2) {
    return steps.map(s => ({ ...s }));
  }

  const out = steps.map(s => ({ ...s }));
  let lastRestEta = out[0]!.etaMinutes;

  for (;;) {
    const deadline = lastRestEta + maxDrivingMinutes;

    let firstSaPaAfter = -1;
    for (let j = 1; j < out.length - 1; j++) {
      const s = out[j]!;
      if (s.type === 'destination') break;
      if ((s.type === 'sa' || s.type === 'pa') && s.etaMinutes > lastRestEta) {
        firstSaPaAfter = j;
        break;
      }
    }
    if (firstSaPaAfter < 0) break;

    let pickIdx = firstSaPaAfter;
    let bestInWindow = -1;
    for (let j = firstSaPaAfter; j < out.length - 1; j++) {
      const s = out[j]!;
      if (s.type === 'destination') break;
      if (s.etaMinutes > deadline) break;
      if ((s.type === 'sa' || s.type === 'pa') && s.etaMinutes > lastRestEta) {
        bestInWindow = j;
      }
    }
    if (bestInWindow >= 0) {
      pickIdx = bestInWindow;
    }

    const picked = out[pickIdx]!;
    if (picked.isPlannedRest) {
      lastRestEta = picked.etaMinutes;
      continue;
    }

    out[pickIdx] = { ...picked, isPlannedRest: true };
    lastRestEta = picked.etaMinutes;
  }

  return out;
}
