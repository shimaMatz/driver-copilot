---
name: requirements-generator
description: docs/templates を用いて要件・機能設計のドラフトを一貫した形式で生成する。
---

# requirements-generator

## いつ使うか

- 新機能の `docs/requirements/features/<feature>/requirement.md` を新規作成するとき
- `/project:gen-design` の前に要件を整えるとき
- 既存要件のバージョンアップ（差分セクションの追加）

## 手順

1. `docs/templates/temp_requirements.md` をコピーして対象パスに置く。
2. 次を必ず埋める:
   - 概要・背景
   - ユーザーとゴール
   - スコープ（In / Out）
   - ユーザーストーリーまたはユースケース
   - 受け入れ条件（Given-When-Then 推奨）
   - 非機能（性能・セキュリティ・可用性）— 不明は「TBD」と理由
3. 用語は `.claude/rules/` と `docs/architecture.md` に合わせる。新語は「用語」節で定義。
4. API が絡む場合は `docs/api.yaml` との整合を要件側に一言メモ（エンドポイント名レベルで可）。

## アウトプット

- 完成した `requirement.md`
- 設計・実装に渡す「優先順位」と「MVP 範囲」

## 禁止

実装詳細（関数名・DB カラム名）に要件を縛り付けすぎない。設計フェーズで決める。
