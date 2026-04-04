---
description: URL・PDF・動画等からテイストを抽出し theme.md / design-system.md を更新する（/project:extract-taste）
---

# /project:extract-taste

## 目的

参照素材（**URL・PDF・動画・画像・既存コード**）から UI テイストを抽出し、`docs/uiux/theme.md` と `docs/uiux/design-system.md` を同期更新する。

## 推奨サブエージェント / スキル

- **taste-extractor** + `taste-extraction`

## 手順

1. 人間から**入力一覧**を受け取る（パス、URL、動画のタイムコード指定可）。
2. `taste-extraction` に従い、各入力をソース表に `Sxx` として登録。
3. 観測ログ → トークン化。`theme.md` を先に数値・タイポ中心で更新し、続けて `design-system.md` でコンポーネント・レイアウトを更新。
4. 推測・未確定は必ずラベル。ライセンス不明のフォント・アセットは断定しない。
5. 変更サマリを会話に返す。

## 完了条件

- [ ] `docs/uiux/theme.md` の「抽出ソース」表が入力と一致
- [ ] `docs/uiux/design-system.md` のトークン対応が `theme.md` の値と矛盾しない
- [ ] URL/PDF/動画のうち少なくとも指定された種別に対応した記述がある

## 注意

自動取得は**公開・許可された範囲**に限定。社内限定 URL やログイン後画面は、人間がエクスポートした PDF / 画像 / 動画を渡す運用に切り替える。
