> **由来・取得元**: 公開サイト [JR東日本アプリ](https://www.jreast-app.jp/) およびスタイルシート `https://www.jreast-app.jp/css/common.css` から観測（取得日: 2026-04-05）。本ドキュメントはマーケティング LP の見た目をエージェント実装向けに整理したもの。

## 抽出ソース

| ID | 種別 | 参照 | 日付 | 備考 |
|----|------|------|------|------|
| S01 | URL | https://www.jreast-app.jp/ | 2026-04-05 | 本文・構造はフェッチ、色・タイポ・余白は `common.css` を正とした |

# Design System: JR東日本アプリ（公式サイト）

## 1. Visual Theme & Atmosphere

鉄道公式アプリの**信頼感・清潔感**を、白背景・濃い青緑系テキスト（`#34525F`）と **JR 系グリーン**（`#35A86E`）のアクセントで表現する。ヒーローは大きな角丸のビジュアルブロック（`border-radius: 30px`）と写真背景上の白抜き見出しで、移動支援アプリらしい**落ち着いた親しみやすさ**を優先する。

ニュース欄はライトグレー床（`#EFEFF4`）の上に白いカードを載せ、機能紹介は番号付きリストと吹き出し（`.balloon`）で**対話的・案内調**のトーンを足す。

**Key Characteristics:**
- フォント: `Noto Sans JP`（`BIZ UDPGothic` を先に宣言しているが実質 Noto 系）、`letter-spacing: 0.3px`
- ブランドグリーン `#35A86E`: ナビリンク、下線アクセント、ラベル「機能紹介」、「もっと見る」系 CTA 背景
- 本文・見出しのベーステキスト色 `#34525F`（濃い青緑グレー）
- ニュースセクション背景 `#EFEFF4`、カードは白（`#FFFFFF`）
- 吹き出し: 白地 + `#58A573` の 3px 実枠 + 大きめ角丸（20px）
- ヒーロー見出し: 白文字 + `text-shadow: #373940 1px 0 50px`
- インタラクション: 主要ホバーで `opacity: 60%`（画像・一覧行・ロゴ等）

## 2. Color Palette & Roles

### Primary & Brand
- **JR Green** (`#35A86E`): ナビゲーションリンク、ホバー下線、ニュースラベル「機能紹介」、Primary 系 CTA（`.more_btn` 背景）
- **Deep Navy Text** (`#34525F`): 見出し・ニュースタイトル・機能説明・フッタータイトルなど本文系の主色
- **White** (`#FFFFFF` / `#ffffff`): ヘッダー背景、カード面、ページ主背景、ラベル文字（カラー帯上）

### Secondary & UI
- **Muted Green** (`#58A573`): 本文内リンク（`.text_URL a`）、吹き出し枠・「例えば…」強調
- **Link Visited** (`#8AC79F`): 訪問済みリンク（`.text_URL a:visited`）
- **Info Cyan** (`#1D9EBF`): ニュースラベル「機能紹介」（情報系バッジ `.label_info`）
- **Important Coral** (`#E3596E`): ニュースラベル「重要」（`.label_important`）
- **Section Muted** (`#EFEFF4`): お知らせブロック（`#news`）背景
- **Hairline Border** (`#E4E4EA`): ニュース一覧テーブル行の 1px ボーダー（`.news_list_table .news_item`）
- **Copyright Gray** (`#848484`): フッターコピーライト
- **Shadow Tone** (`#373940`): ヒーロー白文字のテキストシャドウ色

## 3. Typography Rules

### Font Family
- **Sans**: `'BIZ UDPGothic', sans-serif` の後に `'Noto Sans JP', sans-serif` を指定（実装では Noto を主とみなしてよい）
- **Letter spacing**: 全体 `0.3px`（`body`）

### Hierarchy（観測値・ビューポート依存あり）

| 役割 | 目安 | 色 | 備考 |
|------|------|-----|------|
| ニュースブロック見出し `#news .title` | `3.6vw` → 1280px+ で `40px` | `#34525F` | 中央揃え |
| ヒーローキャッチ `.main_image` | `5vw` → 1500px+ で `70px`、`font-weight: 700` | `#FFFFFF`（影付き） | 左寄せ → SP で中央 |
| 機能サブタイトル `.sub_title` | `1.7vw`、`bold` | `#34525F` | |
| 機能本文 `.text` | `1.2vw`、`font-weight: 500`、`line-height: 2.0` | `#34525F` | |
| ナビリンク | `1.4vw` → 1280px+ で `18px`、`font-weight: 800` | `#35A86E` | 下に 4px 角丸の下線アニメ |
| もっと見るボタン文字 | `1.3vw` → 1280px+ で `16px`、`font-weight: 700` | `#ffffff` | 背景 `#35A86E` |
| ラベル pill 内 | `0.8vw` → 1280px+ で `14px`、`font-weight: 600` | `#ffffff` | |
| フッターダウンロード見出し `.ttl` | `3.6vw` → 1500px+ で `60px`、`font-weight: 800` | `#34525F` | |
| 著作権表示 | `1vw` → 1280px+ で `13px` | `#848484` | |

### Principles
- **vw ベースが多い**: 430 / 960 / 1280 / 1500px 付近で固定 px に寄せるブレークポイントがある。エージェント実装では `clamp()` やコンテナクエリへの置換を検討してよい（本書は観測ソースに忠実）。
- **フォーカス**: `*:focus { outline: none; }` が指定されている。**キーボード操作向けには別途フォーカスリングを設計すること**（アクセシビリティ上の注意）。

## 4. Component Stylings

### Header / Navigation
- 固定ヘッダー: `position: fixed`、`z-index: 980`、白背景、高さ `6vw`（1500px+ で `4.5vw`）、横パディング `5vw`〜`6vw`
- ロゴ左・ナビ右のフレックス。リンクは `#35A86E`、下線は `::after` で `height: 4px`、`border-radius: 2px`、背景 `#35A86E`、`transform: scale` でアニメ
- **430px 以下**: ハンバーガー表示、全画面オーバーレイメニュー（`z-index: 999`）、リンク `font-size: 20px` など

### Buttons
- **Primary（緑塗り）** `.more_btn`: 背景 `#35A86E`、文字白、`border-radius: 1.5vw`（大画面で幅 230px・高さ 50px 相当）
- **ストアボタン**: App Store / Google Play 画像（`.store_btn img`）、ホバーで `opacity: 60%`

### News Card
- 白背景、角丸 `1.5vw`、行高さ `min-height: 4.5vw`、フレックス配置
- 一覧ページ variant は `border: 1px solid #E4E4EA`

### Labels（お知らせカテゴリ）
- `.label_info` / `.label_important` / `.label_feature`: 角丸 `6px`、白文字、幅 `5vw` 前後（レスポンシブで調整）
- 色: `#1D9EBF` / `#E3596E` / `#35A86E`

### Balloon（ユーザーボイス）
- 白背景、`border: solid 3px #58A573`、`border-radius: 20px`（一部ブレークポイントで 16px）
- 下向き三角形は `::before` / `::after` の二重ボーダーで表現
- 「例えば…」は `.balloon .example` で `#58A573`、`font-size: 1.3vw`

### Feature / User Voice
- 機能画像カード周りに `border-radius: 20px` 前後の指定あり（セクションにより 16〜20px）
- ユーザーボイス枠 `.user_voice_back`: 大きな角丸（50px → 狭い画面で 30px）、アバター画像は `border-radius: 50%`

### Footer
- 白背景、ダウンロード訴求＋スマホ画像＋ストアバッジ。サポート文言は `#34525F`、`font-weight: 600`

## 5. Layout Principles

### Spacing
- 多くの余白・サイズが **vw** 指定（例: `margin: 1vw 5vw`、`padding-bottom: 4vw`）
- `.wrapper`: `min-height: 100vh`、`padding-bottom: 80px`（430px 以下で `50px`）

### Grid & Container
- ニューステーブル幅 `65vw` 中央寄せ
- ヒーロー `.catchimage`: `height: 60vh`、`min-height: 550px`、全幅、`background-size: cover`、`border-radius: 30px`
- 960px 以下: ヒーロー `min-height: 400px`、430px 以下: SP 用背景画像に切替、`min-height: 500px` など

### Whitespace Philosophy
- **セクション分割**: ニュースはグレー床でページ中段を区切る。前後は白ベースで連続性を保つ。
- **ヒーロー重視**: ファーストビューでアプリ価値を一言＋ストア誘導に集約。

## 6. Depth & Elevation

| レベル | 表現 | 用途 |
|--------|------|------|
| フラット | 背景色の切替（白 / `#EFEFF4`） | セクション区切り |
| 線 | `1px solid #E4E4EA` | ニュース一覧行 |
| 実ボーダー | `3px solid #58A573` | 吹き出し |
| テキスト深度 | `text-shadow: #373940 1px 0 50px` | ヒーロー白文字の可読性 |

重いドロップシャドウは使わず、**色面と細いボーダー、写真**で階層を作る。

## 7. Do's and Don'ts

### Do
- プライマリアクセントは **`#35A86E`** を基準に統一する（リンク・CTA・「機能紹介」ラベル）。
- 本文・見出しのデフォルトテキストは **`#34525F`** を優先する。
- ニュースカテゴリは **info / important / feature** の3色（`#1D9EBF` / `#E3596E` / `#35A86E`）で意味を固定する。
- ヒーローは **角丸 30px** の画像ブロック＋白文字＋長めの `text-shadow` を踏襲する。
- ホバーは **`opacity: 60%`** を主要パターンとして揃える。

### Don't
- サイトに無い **ネオン・高彩度グラデーション**をデフォルト UI に混ぜない（ヒーロー写真内のグラデは可）。
- **フォーカス可視化を消したまま**にしない（ソースは `outline: none` のため、実装時は必ず代替フォーカスを追加）。
- ラベル色を装飾目的でランダムに変えない（意味と色の対応を維持）。

## 8. Responsive Behavior

### Breakpoints（`common.css` より）

| 条件 | 主な変化 |
|------|-----------|
| `max-width: 320px` | ヒーロー `min-height` をさらに拡大 |
| `max-width: 430px` | SP レイアウト、ハンバーガー、ヒーロー画像差替、フォント vw 中心 |
| `max-width: 768px` | `.pc_visual` 非表示 など |
| `max-width: 960px` | ヘッダー高・フォント調整、ニュース余白増 |
| `min-width: 1280px` | ナビ 18px 固定、ニュースタイトル 20px、もっと見るボタン寸法固定 |
| `min-width: 1500px` | ロゴ幅 300px、ヒーロー 70vh、キャッチ 70px、フッター余白 px 指定 |

### Touch / Tap
- ハンバーガー・閉じるボタンに `padding: 3vw` など広めのタップ領域（430px 以下）。

## 9. Agent Prompt Guide

### Quick Color Reference
- ブランド / Primary 緑: `#35A86E`
- 本文・見出し: `#34525F`
- ページ白: `#FFFFFF`
- ニュース床: `#EFEFF4`
- リンク（本文）: `#58A573`（visited: `#8AC79F`）
- ラベル: info `#1D9EBF` / important `#E3596E` / feature `#35A86E`
- 区切り線: `#E4E4EA`

### Example Prompts
- 「固定ヘッダーは白背景。ナビは Noto Sans JP、太字で `#35A86E`。ホバーで下に 4px の `#35A86E` バーが伸びるアニメ。」
- 「お知らせセクションは背景 `#EFEFF4`。各行は白カード、角丸 1.5vw、タイトルは `#34525F` の extrabold。カテゴリは角丸 6px の pill、info=`#1D9EBF`、important=`#E3596E`。」
- 「ヒーローは角丸 30px のフル幅ブロック。キャッチは白・太字、影 `1px 0 50px #373940`。下に App Store / Google Play 画像ボタン。ホバーは opacity 60%。」
- 「ユーザーの声は白吹き出し、3px の `#58A573` 枠、角丸 20px。『例えば…』だけ `#58A573` で小さめ。」

### Iteration Guide
1. まず **緑 + 濃紺緑グレー + ライトグレー床** の三色帯でページを構成できるか確認する。
2. vw 指定はそのままコピーせず、**ブレークポイント表**に沿って px / `clamp` に落とす。
3. アクセシビリティ: コントラストと **キーボードフォーカス**を必ず追加検証する。
