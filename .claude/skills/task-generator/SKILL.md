---
name: task-generator
description: 設計書を読み、docs/tasks/backlog の KBP-*.md チケットに分解する。影響範囲の列挙に強い。
---

# task-generator

## いつ使うか

- `/project:gen-task` 実行時
- spec-reviewer が「修正をタスク分割すべき」と判断したとき
- 大きな PR を避け、並列実装可能な単位にしたいとき

## 手順

1. `docs/system-designs/<feature>/design.md` を読み、作業単位を列挙（API・DB・UI・動画・インフラ）。
2. `docs/templates/tasks/temp_task.md` をコピーし、`docs/tasks/backlog/KBP-<n>-<slug>.md` として保存。
3. 各チケットに含める:
   - タイトル・背景（1〜3文）
   - スコープ（やること／やらないこと）
   - 受け入れ条件（テスト可能な表現）
   - 変更予定パス（推測でよいが「不明」と書く）
   - 依存: 先行 `KBP-*` または人間判断
4. 既存 backlog と番号衝突がないか確認。
5. 動画・音声タスクは `docs/videos/` と `video/src/` の両方への言及を検討。

## アウトプット

- 新規 `KBP-*.md` のリスト
- 推奨実装順（依存関係つき）

## 品質基準

1チケットは**1日以内にレビュー可能な大きさ**を目安に。デカすぎる場合は分割。
