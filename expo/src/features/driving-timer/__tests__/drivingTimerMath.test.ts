import { roundToFiveMinutes } from '../useDrivingTimer';

describe('roundToFiveMinutes', () => {
  it('丸めて 5 分（300 秒）の倍数にする', () => {
    expect(roundToFiveMinutes(0)).toBe(0);
    expect(roundToFiveMinutes(299)).toBe(0);
    expect(roundToFiveMinutes(300)).toBe(300);
    expect(roundToFiveMinutes(599)).toBe(300);
    expect(roundToFiveMinutes(3600)).toBe(3600);
    expect(roundToFiveMinutes(3661)).toBe(3600);
  });
});

describe('430 ルール定数（仕様ドキュメントとの整合）', () => {
  it('4 時間 = 14400 秒、30 分休憩 = 1800 秒', () => {
    expect(4 * 60 * 60).toBe(14_400);
    expect(30 * 60).toBe(1800);
  });
});
