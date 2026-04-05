import type { RouteStep } from './navigationApiClient';

/**
 * Google Directions の日本語テキストを、一覧用に短く読みやすくする（特に JCT の長文対策）
 */
export function formatHighwayStepTitle(raw: string, type: RouteStep['type']): string {
  if (type === 'origin') return '出発';
  if (type === 'destination') return '目的地';

  let s = raw.replace(/\s+/g, ' ').trim();
  if (!s) return raw;

  s = s.replace(/[。．]$/, '');

  // 先に施設名を拾う（「方面へ…」で全体が削られて JCT 名が消えるのを防ぐ）
  const facility =
    s.match(
      /([\u3040-\u309F\u30A0-\u30FF\u4e00-\u9fafA-Za-z0-9・\-]+(?:パーキングエリア|サービスエリア|インターチェンジ|インター|ジャンクション|\bJCT\b|\bIC\b))/,
    )?.[1] ?? null;

  if (facility) {
    s = facility.trim();
  } else {
    s = s
      .replace(/方面(へ|に).*$/, '')
      .replace(/に向か(う|い).*$/, '')
      .replace(/を経由.*$/, '')
      .replace(/で合流.*$/, '')
      .replace(/を続け.*$/, '')
      .replace(/へ進み.*$/, '')
      .replace(/その先.*$/, '')
      .replace(/を右方向.*$/, '')
      .replace(/を左方向.*$/, '')
      .replace(/右方向.*$/, '')
      .replace(/左方向.*$/, '')
      .trim();
  }

  s = s
    .replace(/インターチェンジ/g, 'IC')
    .replace(/ジャンクション/g, 'JCT')
    .replace(/サービスエリア/g, 'SA')
    .replace(/パーキングエリア/g, 'PA')
    .trim();

  if (!facility && s.length > 22) {
    const head = s.split(/[、,]/)[0]?.trim();
    if (head && head.length >= 4 && head.length + 2 < s.length) {
      s = head;
    }
  }

  if (s.length > 26) {
    s = `${s.slice(0, 25)}…`;
  }

  return s;
}
