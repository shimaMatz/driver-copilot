# デザインシステム: AI-DLC テンプレート

コンポーネント種別・状態・レイアウト・フォーム順序を定義する。**色・フォントサイズの一次ソース**は `docs/uiux/theme.md`。本書のトークン表は theme の名前を参照する。

## 抽出ソース（theme と同期）

テイスト抽出では **theme.md と同じソース表**を正とする。ここでは差分のみ記載する場合、必ず theme の `Sxx` を参照。

| 備考 |
|------|
| 詳細は `docs/uiux/theme.md` の「抽出ソース」表を見る。本ファイル更新時はその表も併せて更新すること。 |

## 要素 → 本ファイルの更新箇所

| 抽出できる要素 | 更新する節 |
|----------------|------------|
| ブレークポイント、最大幅 | §2 レイアウト |
| ボタン・入力・カード等のパターン | §3 コンポーネント一覧、§4 仕様 |
| ラベル順・エラー表示 | §5 フォーム |
| アイコン線幅・スタイル | §6 アイコン・イラスト |
| 実装変数名 | §7 トークンとコードの対応 |

---

## 1. 原則

- **一貫性**: 同じ操作は同じコンポーネントで表す（例: 保存は常に primary Button）。
- **シンプルさ**: 1画面の主アクションは 1つ。二次アクションは `secondary` / `ghost`。
- **アクセシビリティ**: フォーカス順序は視覚順と一致。エラーは入力近傍にテキストで示す。

## 2. レイアウト

- **ブレークポイント**: `sm` 640px / `md` 768px / `lg` 1024px / `xl` 1280px（必要に応じて Tailwind 既定に合わせて変更）。
- **コンテナ最大幅**: 文書・ダッシュボード本文は `max-width: 72rem`（1152px）目安。フルブリードヒーローのみ例外可。

## 3. コンポーネント一覧

| コンポーネント | 用途 | バリアント | 備考 |
|----------------|------|------------|------|
| Button | 主操作・副操作 | primary / secondary / ghost / danger | primary は 1画面 1つ推奨 |
| LinkButton | ナビ内の軽い操作 | inline | 通常リンクとの差は下線の有無で調整 |
| Input | テキスト入力 | default / error / disabled | ラベル必須 |
| TextArea | 長文 | 同上 | |
| Select | 選択 | searchable（任意） | |
| Card | 情報のかたまり | default / interactive | interactive は hover で `surface-raised` |
| Modal | 強制注意・フォーム | sm / md / lg | 閉じる操作を明示 |
| Navigation | サイド・トップ | — | アクティブ項目は `primary` 系 |
| Toast | 一時フィードバック | success / error / info | 自動消去時間を統一 |
| Table | 一覧 | striped（任意） | ヘッダ固定を検討 |

## 4. コンポーネント仕様（Button）

### Anatomy

- ラベル（必須）／任意で左アイコン／ローディング時はスピナー＋`aria-busy`

### States

- default / hover / active / disabled / loading  
- **色**: 背景・文字は `theme.md` の `color-primary` 系および `color-surface` 系にマッピング。

### 実装メモ

- `video/` 等フロントの実装パスはプロダクトに合わせて追記。未確定なら「TBD」。

## 5. フォーム

- **ラベル → 入力 → 説明文 → エラー** の順。エラーは `color-danger`（theme）で、入力に `aria-invalid`。
- **バリデーションタイミング**: submit 時必須。onBlur での軽い検証は任意（プロダクトで統一）。

## 6. アイコン・イラスト

- **セット**: Lucide / Heroicons 等、線幅と角の丸みを統一（抽出で別スタイルが指定されたらソース ID を添える）。
- **ライセンス**: 利用セットのライセンスをここに1行で記録（再抽出で更新）。

## 7. トークンとコードの対応

| トークン（theme 参照） | CSS / Tailwind 変数（例） |
|------------------------|---------------------------|
| `color-bg` | `--color-bg` / `bg-[var(--color-bg)]` |
| `color-surface` | `--color-surface` | 
| `color-primary` | `--color-primary` |
| `color-text` | `--color-text` |
| `color-border` | `--color-border` |
| 角丸 `md` | `--radius-md` |

`video/tailwind.config.js` 等に実体を定義する場合はパスを追記すること。

## 8. 変更フロー

- **正**: `docs/uiux/theme.md` のトークン値 → 本ファイルのコンポーネント規約。
- **テイスト再抽出**: `/project:extract-taste` で URL / PDF / 動画を渡し、`taste-extractor` が両ファイルを更新。

## 9. 参照

- トークン詳細: `docs/uiux/theme.md`
- テンプレ（複製元）: `docs/templates/uiux/temp_design-system.md`
