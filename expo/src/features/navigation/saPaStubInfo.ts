import type { RouteStep } from './navigationApiClient';

export type CongestionLevel = 'empty' | 'normal' | 'busy' | 'full';

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0;
  }
  return h % 100;
}

/** 実 API 未接続の参考表示用（同じ SA 名では同じ結果になる固定ダミー） */
export function stubSaPaCongestion(name: string): {
  level: CongestionLevel;
  title: string;
  detail: string;
} {
  const h = hashName(name);
  if (h < 20) {
    return {
      level: 'empty',
      title: '空いている目安',
      detail: '駐車スペースに余裕がある時間帯の例です（実際は現地・公式情報を確認してください）',
    };
  }
  if (h < 45) {
    return {
      level: 'normal',
      title: 'ふつう',
      detail: '休日昼前後はやや増えることがあります',
    };
  }
  if (h < 72) {
    return {
      level: 'busy',
      title: 'やや混雑の目安',
      detail: '大型車エリアは埋まりやすい時間帯です。次の PA も検討ください',
    };
  }
  return {
    level: 'full',
    title: '混雑の目安',
    detail: '満車に近い時間帯の例です。通過または先の SA/PA を検討ください',
  };
}

export function stubParkingGuide(name: string, type: RouteStep['type']): string {
  const kind = type === 'sa' ? 'サービスエリア' : 'パーキングエリア';
  return `【${kind}の駐車（案内のしかた）】\n本アプリでは「${name}」の大型車向けスペースを、本線に近い側のトラック列としてイメージしてください。実際の区画番号・誘導は現地の看板・係員の指示に従ってください。`;
}

export function stubToiletGuide(name: string): string {
  const h = hashName(name + 't');
  const wing = h % 2 === 0 ? '下り線側施設' : '上り線側施設';
  return `【トイレの探し方】\n「${name}」では、まず ${wing} の建物を目指してください。多目的トイレ・オストメイト対応は案内図の記号（車椅子マーク）付近にまとまっていることが多いです。詳細は現地の案内図で確認してください。`;
}

export function isSaOrPa(step: RouteStep): boolean {
  return step.type === 'sa' || step.type === 'pa';
}

/** 参考用スタブ座標（ルート未設定時の「最寄り」表示用・実 API 接続までの仮データ） */
const STUB_SA_PA_POINTS: Array<{
  name: string;
  lat: number;
  lng: number;
  type: 'sa' | 'pa';
}> = [
  { name: '海老名サービスエリア', lat: 35.4519, lng: 139.3925, type: 'sa' },
  { name: '足柄サービスエリア', lat: 35.3156, lng: 139.0189, type: 'sa' },
  { name: '富士川サービスエリア', lat: 35.1478, lng: 138.6224, type: 'sa' },
  { name: '談合坂サービスエリア', lat: 35.9542, lng: 138.9928, type: 'sa' },
  { name: '恵那サービスエリア', lat: 35.4421, lng: 137.3856, type: 'sa' },
  { name: '多賀サービスエリア', lat: 35.2214, lng: 136.2847, type: 'sa' },
  { name: '草津パーキングエリア', lat: 35.0156, lng: 135.9312, type: 'pa' },
  { name: '守山パーキングエリア', lat: 35.2004, lng: 136.9918, type: 'pa' },
  { name: '鮎沢パーキングエリア', lat: 35.4067, lng: 138.8639, type: 'pa' },
  { name: '美合パーキングエリア', lat: 34.9833, lng: 137.1189, type: 'pa' },
  { name: '吉川サービスエリア', lat: 35.8978, lng: 139.8391, type: 'sa' },
  { name: '浦和パーキングエリア', lat: 35.8531, lng: 139.6489, type: 'pa' },
];

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)));
}

/** 現在地から直線距離が最短のスタブ SA/PA（ルート未確定時の表示用） */
export function nearestStubSaPaPoint(user: { lat: number; lng: number }): (typeof STUB_SA_PA_POINTS)[0] {
  let best = STUB_SA_PA_POINTS[0]!;
  let bestKm = haversineKm(user, best);
  for (let i = 1; i < STUB_SA_PA_POINTS.length; i++) {
    const p = STUB_SA_PA_POINTS[i]!;
    const d = haversineKm(user, p);
    if (d < bestKm) {
      bestKm = d;
      best = p;
    }
  }
  return best;
}

/** `RouteStep` 形状に変換（タイムライン表示用） */
export function stubPointToRouteStep(
  p: (typeof STUB_SA_PA_POINTS)[0],
  distanceFromStartKm: number,
): RouteStep {
  return {
    name: p.name,
    lat: p.lat,
    lng: p.lng,
    distanceFromStartKm,
    etaMinutes: 0,
    isToll: true,
    type: p.type,
  };
}
