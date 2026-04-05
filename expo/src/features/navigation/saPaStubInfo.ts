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
