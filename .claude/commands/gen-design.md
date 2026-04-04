---
description: 機能単位の詳細設計を system-designs に生成する（/project:gen-design）
---

# /project:gen-design

## 目的

確立した **templates** と **rules** をテンプレートエンジンとして使い、新機能の設計を `docs/system-designs/<feature>/design.md` に落とす。

## 推奨サブエージェント / スキル

- **requirements-expert** + `requirements-generator`
- 必要に応じ **spec-reviewer** + `spec-answer`（既存設計との矛盾検知）

## 前提

- 機能名（ディレクトリ名）が決まっていること: `docs/requirements/features/<feature>/requirement.md` が存在するか、同等の入力があること。
- `.claude/rules/` が参照可能であること。

## 手順

1. `docs/templates/system-designs/temp_design.md` を `docs/system-designs/<feature>/design.md` にコピー。
2. `requirement.md` のユーザーストーリー・受け入れ条件を設計にトレース（表または箇条書きで対応関係を明示）。
3. API 変更がある場合は `docs/api.yaml` の差分方針を design に記載（実際の YAML 更新は実装タスクに含めてもよい）。
4. 非機能（性能・権限・ログ）を rules と矛盾なく記述。
5. 未決事項は「Open Questions」に集約し、人間の判断待ちにする。

## 完了条件

- [ ] `docs/system-designs/<feature>/design.md` がテンプレの全必須セクションを埋めている
- [ ] 要件との対応が一目で分かる
- [ ] `spec-answer` で既存 docs との衝突があれば design または要件側に反映または明示

## 次コマンド

設計が固まったら `/project:gen-task`（`gen-task`）でバックログを切る。
