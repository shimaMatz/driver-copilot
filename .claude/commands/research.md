---
description: ドメイン・ツール・素材などの調査結果を research テンプレートに沿って記録する
---

# /project:research

## 目的

判断材料となる事実・出典・比較表を `docs/research/` に残し、要件・設計・インフラの意思決定を支援する。

## 推奨スキル

- `research`

## 手順

1. 調査クエリとスコープ（期限・対象外）を明記。
2. 成果物の型を選ぶ:
   - 総括レポート → `docs/templates/research/temp_report.md` を `docs/research/reports/` に
   - 出典メモ → `temp_source.md` を `docs/research/sources/` に
   - データセット情報 → `temp_dataset.md` を `docs/research/datasets/` に
3. **出典必須**: URL・取得日・ライセンス・信頼度メモ。
4. 推奨アクションを「So What」で1〜3行にまとめる（決定は人間または ADR）。

## 完了条件

- [ ] テンプレの必須セクションが埋まっている
- [ ] 要件・設計へのリンク（どの判断に効くか）がある
- [ ] 推測と事実が区別されている

## 注意

調査結果だけで仕様を勝手に確定しない。`docs/decisions/` または要件オーナー確認を経る。
