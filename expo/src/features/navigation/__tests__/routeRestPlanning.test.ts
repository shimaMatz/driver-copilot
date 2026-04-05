import type { RouteStep } from '../navigationApiClient';
import { markPlannedRestStops } from '../routeRestPlanning';

function step(
  name: string,
  type: RouteStep['type'],
  etaMinutes: number,
  extra: Partial<RouteStep> = {},
): RouteStep {
  return {
    name,
    lat: 0,
    lng: 0,
    distanceFromStartKm: 0,
    etaMinutes,
    isToll: false,
    type,
    ...extra,
  };
}

describe('markPlannedRestStops', () => {
  it('各区間240分以内に収まるよう、最も遅いSA/PAを暫定休憩にする', () => {
    const steps: RouteStep[] = [
      step('出発', 'origin', 0),
      step('幕張インター', 'ic', 30),
      step('Aサービスエリア', 'sa', 80),
      step('Bサービスエリア', 'sa', 200),
      step('Cパーキングエリア', 'pa', 350),
      step('目的地', 'destination', 400),
    ];
    const out = markPlannedRestStops(steps, 240);
    const rests = out.filter(s => s.isPlannedRest).map(s => s.name);
    expect(rests).toContain('Bサービスエリア');
    expect(rests).toContain('Cパーキングエリア');
    expect(rests).not.toContain('Aサービスエリア');
  });

  it('240分以内にSA/PAが無い場合は直後の最初のSA/PAを選ぶ', () => {
    const steps: RouteStep[] = [
      step('出発', 'origin', 0),
      step('大和郷JCT', 'jct', 60),
      step('遠いSA', 'sa', 300),
      step('目的地', 'destination', 400),
    ];
    const out = markPlannedRestStops(steps, 240);
    expect(out.find(s => s.name === '遠いSA')?.isPlannedRest).toBe(true);
  });

  it('出発と目的地のみではマークしない', () => {
    const steps: RouteStep[] = [
      step('出発', 'origin', 0),
      step('目的地', 'destination', 120),
    ];
    const out = markPlannedRestStops(steps, 240);
    expect(out.every(s => !s.isPlannedRest)).toBe(true);
  });
});
