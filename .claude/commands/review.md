---
description: 成果物確認と仕様・規約レビュー（/project:review）
---

# /project:review

## 目的

実装・生成物が **設計・要件・rules** と整合しているかを確認する。人間が `video/out/` 等を見る前提の**確認観点**と、**spec-reviewer** による静的レビューを束ねる。

## 推奨サブエージェント / スキル

- **spec-reviewer** + `spec-answer` + `task-generator`（修正タスク化が必要な場合）

## 手順

1. **スコープ確認**: 対象の `docs/tasks/backlog/` または in-progress の `KBP-*.md` を特定。
2. **要件トレース**: `docs/requirements/features/` と `docs/system-designs/` に対し、変更コード・API・UI を突き合わせる。
3. **rules**: `.claude/rules/` 全般（特に `code-style.md` `api-conventions.md` `testing.md` `video-spec.md`）。
4. **成果物**: 動画プロジェクトでは `video/out/` のサンプルと `video/src/` の対応。
5. **出力**: レビュー報告（要約、重大度、該当パス、推奨アクション）。修正が大きい場合は新規 `KBP-*.md` を提案。

## 完了条件

- [ ] ブロッカー / 非ブロッカーが区別されている
- [ ] 次アクション（マージ可・修正必須・設計戻し）が一文で明確
- [ ] 再利用すべき「新ルール」があれば `.claude/rules/` への追記案がある

## 学習ループ

レビューで得た共通知見は **rules にフィードバック**し、次スプリントの再現性を上げる。
