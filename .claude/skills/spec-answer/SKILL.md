---
name: spec-answer
description: 複数の仕様・設計ドキュメント間の矛盾、用語のブレ、抜けを検出し、レビュー可能な形で列挙する。
---

# spec-answer

## いつ使うか

- spec-reviewer が設計整合性をチェックするとき
- `gen-design` 後に既存 `docs/system-designs/` との衝突を確認するとき
- 要件と `docs/api.yaml` のズレを洗い出すとき

## 手順

1. 比較対象を明示（例: `requirements/features/post` vs `system-designs/post/design.md` vs `api.yaml`）。
2. 次の観点で機械的にスキャン:
   - **用語**: 同概念の別名
   - **エンドポイント**: パス・メソッド・ボディの不一致
   - **状態機械**: ステータス値の食い違い
   - **非機能**: 要件の数値と設計の数値
   - **動画**: script の尺と storyboard のコマ数
3. 各問題を **重大度**（Blocker / Major / Minor）と **該当引用**（ファイルパス＋要約）で列挙。
4. 「どちらが正」は推測しない場合は **質問** として残す。
5. 修正が複数ファイルに及ぶ場合は `task-generator` に渡すためのバンドルを提案。

## アウトプット

- 矛盾リスト（表形式推奨）
- 推奨の正規化方針（複数案がある場合は pros/cons）

## 原則

spec-answer は**判定機**であり**改変者**ではない。ドキュメントの直接編集はオーナー合意後に行う。
