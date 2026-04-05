/**
 * iPhone 15 Pro の論理解像度（pt、ポートレート）。
 * 物理 6.1" / 1179×2556 px @3x に対応するポイント座標は 393×852。
 *
 * 注意: DESIGN.md の `max-width: 430px` は Web の SP ブレークポイントであり、
 * iPhone 15 Pro の幅（393pt）とは一致しない。レイアウトの基準幅に 430 を使わないこと。
 *
 * @see https://developer.apple.com/design/human-interface-guidelines/layout
 */
export const IPHONE_15_PRO = Object.freeze({
  widthPt: 393,
  heightPt: 852,
} as const);

/** ルート候補カードなど、画面幅に追従させる幅（pt）。iPhone 15 Pro で約 148 前後になるスケール */
export function routeOptionCardWidth(windowWidthPt: number): number {
  const w = Math.max(280, Math.min(windowWidthPt, IPHONE_15_PRO.widthPt * 1.2));
  return Math.round(Math.min(156, (w - 24) * 0.38));
}
