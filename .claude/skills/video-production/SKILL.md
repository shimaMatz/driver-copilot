---
name: video-production
description: Remotion 構成・台本・絵コンテ・素材仕様・Voicevox 連携を docs と video/src で一貫させる。
---

# video-production

## いつ使うか

- `/project:gen-video` 実行時
- `video/src/` のシーン追加・尺変更
- 音声合成パラメータの記録・再現

## 手順

1. `docs/templates/videos/` の3種（script / storyboard / asset_spec）を `docs/videos/` 配下に複製。
2. **シーン ID** を script・storyboard・Remotion の composition 名で統一する命名規則を決め、文書に書く。
3. `.claude/rules/video-spec.md` に解像度・fps・セーフエリア・ファイル命名があれば遵守。
4. `video/src/compositions/` `scenes/` の変更方針を design または別メモに1段落で残す（後からのレビュー用）。
5. Voicevox: `infra/docker/voicevox/` や MCP の起動前提を asset spec に記載。再現用に話者・速度・抑揚の設定値をテキストで残す。

## アウトプット

- 更新された `docs/videos/*`
- レンダリング手順（コマンド例は `video/package.json` の scripts に合わせる）

## 注意

生成物 `video/out/` はコミットポリシーに従う。コミットしない場合は `.gitignore` を確認し、レビュー手順に「ローカル確認」を書く。
