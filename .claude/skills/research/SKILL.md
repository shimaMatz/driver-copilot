---
name: research
description: 調査クエリに対し、出典付きでレポート・ソースメモ・データセット情報を docs/research に整理する。
---

# research

## いつ使うか

- `/project:research` 実行時
- 新ツール・ライブラリ・ホスティング比較
- 素材・ライセンス・トレンドの確認（video-expert / infra-expert と共通）

## 手順

1. 調査の目的と「答えが出たら何が決まるか」を1文で書く。
2. 成果物タイプを選ぶ:
   - **report**: 比較表・推奨案・リスク
   - **source**: 1ソースずつの要約と引用理由
   - **dataset**: 利用条件・取得方法・更新頻度
3. `docs/templates/research/` の該当テンプレを `docs/research/reports|sources|datasets/` にコピーして記入。
4. 各主張に出典（URL）とアクセス日付を付ける。一次情報を優先。
5. 不確実性が高い場合は「検証タスク」を `KBP-*` 形式で提案（任意）。

## アウトプット

- テンプレ準拠の Markdown
- 次のアクション（要件更新・ADR・実装スパイクのどれか）

## 禁止

出典のない断定、他者のライセンスを侵害するコピペ、そのまま仕様確定の宣言。
