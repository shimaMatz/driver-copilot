# Project Structure

## Organization Philosophy

**モノレポ × フィーチャーファースト**。最上位はサーフェス（クライアント / サーバ / 動画 / 音声基盤 / インフラ）で分割し、クライアント内はレイヤーではなくフィーチャー単位でコロケーションする。画面・状態・型・API クライアント・テストを 1 つのフィーチャーに集約し、横断コードだけを `shared/` に切り出す。

## Top-Level Layout

```
driver-copilot/
├── expo/        # React Native (Expo) クライアント本体
├── server/      # Express スタブ API（契約は docs/api.yaml）
├── video/       # Remotion の動画プロジェクト（LP/デモ用）
├── voicevox/    # VOICEVOX 連携（MCP サーバ等）
├── infra/       # docker / terraform / env 雛形
├── scripts/     # セットアップ・音声生成スクリプト
├── DESIGN.md    # UI トーンの正（JR 東日本アプリ系）
├── AGENTS.md    # エージェント向け運用メモ
└── .kiro/       # steering（本ファイル群）と specs
```

## Directory Patterns

### Feature Modules（クライアント）
**Location**: `expo/src/features/<feature>/`  
**Purpose**: 1 フィーチャーに必要な画面・ロジック・型・API クライアント・テストをコロケーションする。  
**Example**:
```
features/navigation/
  NavigationScreen.tsx         # 画面コンポーネント
  RouteTimeline.tsx            # 画面内パーツ
  useNavigation.ts             # 画面用フック（状態・副作用）
  navigationApiClient.ts       # API 呼び出しの薄いアダプタ
  routeFlowTypes.ts            # フィーチャ固有の型
  jrNavTheme.ts                # フィーチャ固有のテーマ派生
  __tests__/                   # 隣接配置のユニットテスト
  index.ts                     # 外部公開エクスポート
```

フィーチャー間の直接インポートは避け、必要なら `shared/` に昇格させる。

### Shared Layer
**Location**: `expo/src/shared/{api,components,hooks}/`  
**Purpose**: 複数フィーチャーから使う汎用 API ラッパー・UI 部品・フック。各サブディレクトリは `index.ts` 経由で公開する。  
**Example**: `shared/api/index.ts` から axios インスタンスを一元公開する等。

### Config & Constants
**Location**: `expo/src/config/`, `expo/src/constants/`  
**Purpose**: 環境変数アクセス (`config/env.ts`)、端末レイアウト定数 (`constants/iphoneLayout.ts`) などアプリ全体で共有する値。ロジックを持たせず、定数と読み取り専用アクセサのみ置く。

### Server Stub
**Location**: `server/`  
**Purpose**: `docs/api.yaml` の契約を最小限満たすローカル開発用 API。単一ファイル `server.mjs` に集約し、本番実装に差し替える前提で肥大化させない。

### Video Project
**Location**: `video/src/{compositions,scenes,assets}/`  
**Purpose**: Remotion のコンポジション・シーン・素材。`compositions/` がエントリ、`scenes/` に画面単位の部品、`assets/` に静的素材を置く。

### Infra / Scripts
**Location**: `infra/`, `scripts/`  
**Purpose**: `infra/docker/` はローカル依存（例: `voicevox/docker-compose.yml`）、`infra/terraform/` と `infra/env/` は将来のクラウド構成の置き場。`scripts/` はワンショットの運用スクリプト（`setup.sh`, `generate-voice.py`）。

## Naming Conventions

- **React コンポーネント・画面**: PascalCase (`NavigationScreen.tsx`, `RouteTimeline.tsx`)
- **フック**: `use` プレフィックス + camelCase (`useNavigation.ts`, `useTts.ts`)
- **API クライアント**: `<feature>ApiClient.ts`
- **型モジュール**: `types.ts` または `<topic>Types.ts`（例: `routeFlowTypes.ts`）
- **テーマ派生**: `<scope>Theme.ts`（例: `jrNavTheme.ts`, `transitDarkTheme.ts`）
- **テストディレクトリ**: 対象モジュールと同階層の `__tests__/`
- **定数ファイル**: camelCase（`iphoneLayout.ts`）

## Import Organization

```typescript
// 1) React / RN ランタイム
import React from 'react';
import { View } from 'react-native';

// 2) サードパーティ
import axios from 'axios';

// 3) 絶対パス（@/*）で shared / config / constants
import { env } from '@/config/env';

// 4) 同一フィーチャー内は相対
import { useNavigation } from './useNavigation';
```

**Path Aliases**:
- `@/` → `expo/src/`（`tsconfig.json` + Jest `moduleNameMapper` で共有）

## Code Organization Principles

- **フィーチャーは閉じて公開は `index.ts` 経由**。フィーチャー内部ファイルを他フィーチャーから直接参照しない。
- **API 呼び出しはフィーチャー内のアダプタに閉じ込める**。コンポーネントから `axios` を直接呼ばない。
- **型はフィーチャー直下にコロケート**。汎用化したくなった段階で `shared/` に昇格させる。
- **テストは隣接配置**。`src` ツリー外のグローバル `tests/` を新設しない。
- **UI の見た目は `DESIGN.md` に従う**。色・角丸・タイポをフィーチャー固有に発明しない。
- **サーフェスを跨ぐ依存は禁止**。`expo/` から `server/` や `video/` のコードを import しない（契約は `docs/api.yaml` と型のみで共有）。

---
_パターンを書き、ファイルツリーを書かない。新規ファイルがパターンに従う限り本書の更新は不要_
