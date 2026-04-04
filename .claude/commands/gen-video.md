---
description: 動画ドキュメントと Remotion / Voicevox 連携のたたき台を生成・更新する
---

# /project:gen-video

## 目的

`docs/videos/` 配下の台本・絵コンテ・素材仕様をテンプレート準拠で整え、`video/src/` 実装・音声生成に渡せる状態にする。

## 推奨サブエージェント / スキル

- **video-expert** + `video-production`
- 参考調査が必要なら `research`

## 手順

1. `docs/templates/videos/temp_script.md` → `docs/videos/scripts/` に配置（命名はプロジェクト規約に従う）。
2. `temp_storyboard.md` → `docs/videos/storyboards/`
3. `temp_asset_spec.md` → `docs/videos/assets/` または同等パス
4. `.claude/rules/video-spec.md` の解像度・尺・ファイル形式を満たすようチェックリスト化。
5. Voicevox 利用時は `scripts/generate-voice.py` / MCP 前提のパラメータを asset spec または別メモに記載。

## 完了条件

- [ ] script / storyboard / asset spec が相互参照可能（シーン ID 等で対応）
- [ ] 要件にない演出がコード側だけに存在しない
- [ ] レンダリング確認手順（`video/out/` の見方）がタスクまたは docs にある

## 備考

本コマンドは **制作ドキュメント生成** が主。Remotion の大規模リファクタは `gen-task` でチケット化すること。
