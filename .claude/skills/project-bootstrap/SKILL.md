---
name: project-bootstrap
description: リポジトリの垂直立ち上げ時に、要件の骨子・アーキテクチャ素地・rules 方針・起動手順の整合を取る。
---

# project-bootstrap

## いつ使うか

- `/project:bootstrap` 実行時
- 新規クローン後の「最初の一歩」を AI に任せるとき
- `docs/` と `infra/` と `.claude/rules/` のパスが食い違っているときの是正

## 手順

1. `docs/requirements/global/` の `concept.md` / `constraints.md` が空なら、`docs/templates/temp_requirements.md` の章立てを参考に最小限を埋める。
2. `docs/architecture.md` を `docs/templates/temp_architecture.md` から生成し、主要コンポーネント（アプリ・API・動画・音声・インフラ）を図示または箇条書き。
3. `docs/api.yaml` を `docs/templates/temp_api.yaml` で初期化。
4. `.claude/rules/` に「このリポで必ず守ること」を3〜7項目で提案（既存があれば重複しないよう追記案のみ）。
5. `README.md` / `scripts/setup.sh` / `infra/env/.env.example` の相互参照を確認。

## アウトプット

- 更新されたパスの一覧
- 人間が決めるべき未決事項リスト
- 次に呼ぶべきコマンド（例: `gen-design` 前に feature 要件を切る）

## 注意

bootstrap で実装の細部まで完璧にしようとしない。**再現可能なドキュメントとルール**を優先する。
