---
description: 垂直立ち上げ（初期フロー）— アイディアを要件とアーキ土台に変換する
---

# /project:bootstrap

## 目的

アイディアを「仕様」と「アーキテクチャのたたき台」に変換し、以降の AI 作業が **同じルール・同じパス** で回せる土台を作る。

**既存プロジェクトへの導入**（コード・CI・別形式のドキュメントがすでにある場合）は、本コマンドより **adoption-expert**（`.claude/agents/adoption-expert.md`）を先に起動し、ギャップ分析と段階的移行計画から入る。

## 推奨サブエージェント / スキル

- **requirements-expert** + `project-bootstrap` / `requirements-generator`
- **infra-expert**（並行または直後）+ `project-bootstrap`

## 手順

1. **アイディアの言語化**  
   人間の入力を、requirements-expert が `docs/requirements/global/concept.md` および `docs/requirements/global/constraints.md` に構造化して記入する（`docs/templates/temp_requirements.md` をコピーして feature 用を切る場合も可）。

2. **アーキテクチャと API 素地**  
   infra-expert と連携し、`docs/architecture.md` と `docs/api.yaml` を `docs/templates/temp_architecture.md` / `temp_api.yaml` から生成・埋める。

3. **プロジェクト固有 rules（重要）**  
   `.claude/rules/` に「このリポジトリの正解」を書く。少なくとも以下を検討:
   - `code-style.md` … 言語・フォーマッタ・命名
   - `api-conventions.md` … エラー形式・バージョニング
   - `testing.md` … 必須テスト範囲
   - `video-spec.md` … 解像度・尺・ファイル命名（動画を扱う場合）

4. **プロトタイプの置き場**  
   `video/` `voicevox/` の最小スキャフォールドがあれば、起動確認可能な範囲まで繋ぐ（詳細実装は別タスク可）。

5. **ADR**  
   主要な技術選定は人間の確認のうえ `docs/decisions/` に残すよう促す（テンプレ: `docs/templates/decisions/temp_decision.md`）。

## 完了条件

- [ ] `docs/requirements/global/` が読み取り可能な状態
- [ ] `docs/architecture.md` と `docs/api.yaml` が初版として存在
- [ ] `.claude/rules/` に再現性に効くルールが1件以上ある
- [ ] README または `scripts/setup.sh` と矛盾しない

## 参照

「初期フロー」と「タスクサイクル」をつなぐ鍵は **`.claude/rules/`**。ここに書いた内容がスプリント時の品質の基準になる。
