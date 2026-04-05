import { formatHighwayStepTitle } from '../routeStepDisplay';

describe('formatHighwayStepTitle', () => {
  it('JCT の長い案内を短くする', () => {
    const raw =
      '東名高速道路方面へ右方向です。その先、大和郷ジャンクションを経由して首都高に向かいます';
    const s = formatHighwayStepTitle(raw, 'jct');
    expect(s.length).toBeLessThanOrEqual(28);
    expect(s).toContain('JCT');
    expect(s).not.toMatch(/方面へ/);
  });

  it('インターチェンジを IC に圧縮する', () => {
    const s = formatHighwayStepTitle('幕張インターチェンジに向かう', 'ic');
    expect(s).toContain('IC');
    expect(s).not.toContain('インターチェンジ');
  });

  it('出発・目的地は固定ラベル', () => {
    expect(formatHighwayStepTitle('なんでも', 'origin')).toBe('出発');
    expect(formatHighwayStepTitle('なんでも', 'destination')).toBe('目的地');
  });
});
