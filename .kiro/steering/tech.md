# Technology Stack

## Architecture

モノレポ構成のマルチサーフェス構成。

- **クライアント**: Expo (React Native) の単一アプリ `expo/`
- **API スタブ**: Express (ESM) のローカル開発用サーバ `server/`
- **音声合成**: VOICEVOX をローカル Docker で起動し、MCP サーバ経由で利用（`infra/docker/voicevox/`, `voicevox/mcp/`）
- **映像生成**: Remotion ベースのデモ・LP 動画プロジェクト `video/`
- **インフラ雛形**: `infra/terraform`, `infra/env`（中身は今後追加予定）

クライアントは API からのレスポンスをそのまま UI モデルに落とし込む薄いアダプタ層（`features/navigation/navigationApiClient.ts` 等）を持ち、ドメインロジックは `features/*` 内にコロケーションする。

## Core Technologies

- **Language**: TypeScript（strict 指向）
- **Mobile**: Expo `^54`, React Native `0.81`, React `19.1`
- **Server**: Node.js (ESM, `type: "module"`), Express `^4.21`
- **Video**: Remotion + Tailwind
- **Voice I/O**: `@react-native-voice/voice`（STT）, `expo-speech` / VOICEVOX（TTS）
- **Maps / Location**: `react-native-maps`, `expo-location`
- **Networking / Storage**: `axios`, `@react-native-async-storage/async-storage`, `@react-native-community/netinfo`

## Key Libraries

重要度の高い選択のみ挙げる。追加ライブラリは原則既存パターンに従って導入する。

- `react-native-safe-area-context` — SafeArea ラップは `App.tsx` で一度だけ行う。
- `axios` — API クライアントは `features/*/**ApiClient.ts` に閉じ込め、直接 `axios` を叩くコンポーネントを書かない。
- `@testing-library/react-native` + `jest` — UI ロジックのテストはコンポーネント隣接の `__tests__/` に置く。

## Development Standards

### Type Safety
- TypeScript strict。`any` は避け、API レスポンス型は `features/*/types.ts` もしくは `routeFlowTypes.ts` などフィーチャ直下で定義する。
- パスエイリアス `@/*` → `expo/src/*`（Jest `moduleNameMapper` と同期）。

### Code Quality
- `@react-native/eslint-config` を基準に `npm run lint`（`expo/`）でチェック。
- 型チェックは `npm run typecheck`（= `tsc --noEmit`）。
- UI の見た目・トーンは `DESIGN.md` を正とする。新規画面の色・角丸・タイポは原則そこに揃える。

### Testing
- フレームワーク: Jest + `@testing-library/react-native`（`preset: react-native`）。
- セットアップ: `expo/jest.setup.ts`。
- 配置: 対象モジュールと同階層の `__tests__/`（例: `features/navigation/__tests__/`）。
- カバレッジ閾値は未設定。まずは主要ユースケースの回帰を優先する。

## Development Environment

### Required Tools
- Node.js 20+（Expo 54 / React Native 0.81 推奨環境）
- Expo CLI（`npx expo`）
- Docker（VOICEVOX 起動: `infra/docker/voicevox/docker-compose.yml`）
- iOS ビルドに Xcode、Android ビルドに Android Studio

### Common Commands
```bash
# Expo 開発サーバ
cd expo && npm run start

# iOS / Android ネイティブ起動
cd expo && npm run ios
cd expo && npm run android

# 品質チェック
cd expo && npm run lint
cd expo && npm run typecheck
cd expo && npm test

# API スタブ（既定 :8080）
cd server && npm install && npm start

# VOICEVOX 起動
docker compose -f infra/docker/voicevox/docker-compose.yml up -d
```

## Key Technical Decisions

- **API はスタブファースト**: `server/server.mjs` は `docs/api.yaml` の契約を満たす最小実装。本番 API へ差し替え可能にするため、クライアント側は `navigationApiClient` で接続先を切替えられる構造を維持する。
- **音声 UX は「TTS 読み上げ + 物理ボタン相当の大きい音声トリガ」**: 画面注視を避けるため、新規操作は音声導線を第一選択肢として設計する。
- **テーマは JR 東日本アプリ系**: グリーン `#35A86E` × 濃紺グレー `#34525F` × ライトグレー床 `#EFEFF4` を基本三色に据える（詳細は `DESIGN.md`）。
- **Kiro Spec-Driven Development**: 仕様は `.kiro/specs/`、プロジェクト知識は `.kiro/steering/`。新機能は原則 Requirements → Design → Tasks → Implementation の 4 段で進める。

---
_依存を網羅するのではなく、意思決定と標準を残す_
