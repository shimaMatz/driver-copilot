---
description: 設計書から実装タスク（KBP-*.md）を backlog に分解する（/project:gen-task）
---

# /project:gen-task

## 目的

`docs/system-designs/` の詳細設計を読み、**細分化したチケット**を `docs/tasks/backlog/` に発行する。以降の「自律実装」が rules に沿って迷わない粒度を目指す。

## 推奨サブエージェント / スキル

- **task-generator** スキルに従う
- 影響範囲が広い場合 **spec-reviewer** + `task-generator` で分割案を検証

## 手順

1. 対象: `docs/system-designs/<feature>/design.md` と関連 `docs/api.yaml` 差分。
2. `docs/templates/tasks/temp_task.md` を基に、1タスク＝1 PR 目安（またはプロジェクト合意の単位）でファイルを分割。
3. ファイル名: `KBP-<番号>-<短いスラッグ>.md`（例: `KBP-1-auth-login.md`）。番号は既存 backlog と重複しないように採番。
4. 各タスクに含める: 背景、スコープ、受け入れ条件、触るパス予定、依存タスク、テスト方針（`testing.md` 参照）。
5. 動画・音声が絡む場合は **video-expert** 観点のサブタスクやパスを明記。

## 完了条件

- [ ] `docs/tasks/backlog/` に新規 `KBP-*.md` が追加されている
- [ ] 各タスクに受け入れ条件がある
- [ ] 設計書の未決事項をタスクに持ち込んでいない（未決は design に戻す）

## 次のフェーズ

実装後は `/project:review`。完了タスクは `docs/tasks/done/` へ移動。
