# Architecture

本ドキュメントは `expo/` ディレクトリに実装されている Expo モバイルアプリのアーキテクチャを記述する。

## 技術スタック

| カテゴリ | 技術 | バージョン |
|----------|------|-----------|
| フレームワーク | Expo SDK | 54 |
| UI | React Native | 0.81.5 |
| 言語 | TypeScript | 5.9 |
| 地図 | react-native-maps | 1.20.1 |
| 位置情報 | expo-location | 19.x |
| 音声読み上げ | expo-speech | 14.x (v0.2 で使用予定、MVP 不使用) |
| 音声認識 | @react-native-voice/voice | 3.x (v0.2 で使用予定、MVP 不使用) |
| HTTP | axios | 1.7.x |
| ストレージ | @react-native-async-storage/async-storage | 2.2 |
| ネットワーク | @react-native-community/netinfo | 11.4 |
| テスト | Jest + @testing-library/react-native | - |
| ビルド | babel-preset-expo, @react-native/metro-config | - |

## ディレクトリ構成

Feature-based（機能別）ディレクトリ構成を採用している。

```
expo/src/
  config/
    env.ts              # 環境変数ヘルパー（isDemoMode 等）
  features/
    navigation/          # ナビゲーション機能
      NavigationScreen   # メイン画面
      RouteTimeline      # ルートタイムライン表示
      useNavigation      # ナビゲーション状態管理フック
      navigationApiClient # 外部API呼び出し
      types              # 型定義
    driving-timer/       # 運転時間管理
      DrivingTimerPanel  # タイマー表示パネル
      useDrivingTimer    # 430ルール準拠タイマーフック
      types
    voice/               # 音声入出力
      VoiceCommandButton # 音声コマンドUI
      useVoiceCommand    # 音声認識フック
      useTts             # 読み上げフック
    demo/                # デモモード
      DemoContext         # デモ状態コンテキスト
      demoBridge          # シナリオ切替・購読
      demoScenarios       # 固定シナリオデータ
  shared/
    api/                 # 共通APIユーティリティ
    components/          # 共通UIコンポーネント
    hooks/               # 共通フック
```

## 外部API依存関係

```
+-------------------+
|   Expo アプリ     |
+-------------------+
        |
        +---> Google Directions API (ルート検索)
        |         |
        |         +--[フォールバック]--> OSRM (無料ルート検索)
        |
        +---> Google Places API (目的地サジェスト)
        |         |
        |         +--[フォールバック]--> Nominatim (OSM 場所検索)
        |
        +---> Google Places Nearby API (QOLスポット検索)
        |         |
        |         +--[フォールバック]--> Overpass API (OSM POI検索)
        |
        +---> 自前バックエンド /api/v1/navigation/recommend-rest
                  (休憩スポット推薦)
```

### フォールバック戦略

全ての外部API呼び出しは Google Maps API を優先し、失敗時または APIキー未設定時にオープンソースの代替へ自動フォールバックする。

| 機能 | プライマリ | フォールバック | 切替条件 |
|------|-----------|--------------|---------|
| ルート検索 | Google Directions API | OSRM | APIキー未設定 or リクエスト失敗 |
| 目的地サジェスト | Google Places Autocomplete | Nominatim | APIキー未設定 or リクエスト失敗 |
| QOLスポット検索 | Google Places Nearby | Overpass API | APIキー未設定 or リクエスト失敗 |
| 休憩推薦 | 自前バックエンド | (デモモードのみ) | - |

全APIリクエストには 10秒のタイムアウトが設定されている (`API_TIMEOUT_MS = 10_000`)。

## デモモード

環境変数 `EXPO_PUBLIC_DEMO_MODE=true` でデモモードが有効になる。

```
isDemoMode() === true
    |
    v
navigationApiClient の各関数
    |
    +--> fetchDirectionsRoute: デモシナリオの固定ルートを返す
    +--> recommendRest: デモシナリオの固定推薦を返す
    +--> fetchPlaceSuggestions: デモシナリオの目的地名を返す
    +--> resolvePlaceToLatLng: デモシナリオの座標を返す
    +--> fetchQolSpots: デモシナリオのQOLスポットを返す
```

- `demoBridge.ts` がグローバルなシナリオIDを管理し、購読パターンで変更を通知する。
- `demoScenarios.ts` に複数のシナリオ（ルート、推薦、スポット等）が定義されている。
- 外部APIへのリクエストは一切発生しない。

## データフロー

```
[ユーザー操作]
    |
    v
[NavigationScreen] --- useNavigation フック
    |
    +--- 目的地入力 ---> fetchPlaceSuggestions
    |                        |
    |                        v
    |                    resolvePlaceToLatLng
    |                        |
    +--- ルート検索 -----> fetchDirectionsRoute
    |                        |
    |                        v
    |                    MapView (Polyline/Marker 描画)
    |                    RouteTimeline (ステップ表示)
    |
    +--- 休憩推薦 -----> recommendRest (バックエンド)
    |                        |
    |                        v
    |                    RestSpotCandidate[] 表示
    |
    +--- QOLスポット ---> fetchQolSpots
    |
    +--- 運転タイマー --> useDrivingTimer (430ルール管理)
    |
    +--- 音声操作 -----> useVoiceCommand / useTts
```

## 有料道路 / 一般道切替

`navigationApiClient.ts` はルート検索時に `avoidTolls` パラメータを受け取り、有料道路と一般道を切り替える。Google Directions API の `avoid: 'tolls'` パラメータを使用する。

日本の高速道路名パターン（高速、自動車道、首都高、東名、E番号等）を正規表現で判定し、ルートセグメントを有料/無料に分類。MapView 上で色分け表示される。

## 環境変数

| 変数名 | 用途 | 必須 |
|--------|------|------|
| `EXPO_PUBLIC_DEMO_MODE` | `true` でデモモード有効化 | No |
| `EXPO_PUBLIC_API_BASE_URL` | バックエンドURL（デフォルト: `http://192.168.1.2:8080`） | No |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps Platform APIキー | No（未設定時はOSMフォールバック） |

## デザインシステム

DESIGN.md に定義された JR東日本アプリ風のデザインシステムを採用。

- プライマリカラー: `#35A86E` (JR Green)
- テキストカラー: `#34525F` (Deep Navy)
- 背景: `#FFFFFF` (白)
- フォント: Noto Sans JP
