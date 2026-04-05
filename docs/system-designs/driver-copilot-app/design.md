# システム設計: Driver Copilot モバイルアプリ

> `docs/system-designs/driver-copilot-app/design.md` として保存する。

## メタ情報

| 項目 | 内容 |
|------|------|
| 要件 | `docs/requirements/features/driver-copilot-app/requirement.md` |
| ステータス | 確定 |
| 最終更新 | 2026-04-06 |

## 1. 概要

長距離トラックドライバー向けの Expo モバイルアプリケーションである。MVP スコープとして以下の機能を提供する。

- **地図表示・ナビゲーション**: react-native-maps による地図描画、目的地検索（テキスト入力）、一般道/有料道路の2ルート比較表示
- **430ルール運転タイマー**: 連続運転4時間・休憩30分の法令基準に基づくリアルタイムカウントダウン
- **休憩所推薦**: SA/PA の混雑度・空き台数予測の基本一覧表示
- **デモモード**: 外部API接続なしで standard シナリオ1本を再生可能

### v0.2 以降の拡張予定

- **QOLスポット検索**: 銭湯・24hレストラン・コインランドリーの周辺検索
- **音声操作**: `@react-native-voice/voice` による音声コマンド、`expo-speech` による TTS フィードバック
- **SA全滅時の代替提案**: 満車時のコンビニ・道の駅への代替提案
- **デモモード追加シナリオ**: 430限界直前・SA全滅・QOL優先・本末転倒防止の4シナリオ追加

## 2. 要件トレース

| 要件 ID / 節 | 設計での対応 |
|----------------|--------------|
| US-1: 目的地設定と2ルート比較 | `useNavigation` フックが `fetchDirectionsRoute` を `avoidTolls=true/false` で並列呼び出し。`NavigationScreen` で地図上に2本のポリラインを描画 |
| US-2: 連続運転時間のリアルタイム確認 | `useDrivingTimer` フックが `DrivingTimerState` を管理。5分単位で表示更新（バッテリー抑制） |
| US-3: SA/PA混雑状況と空き台数予測 | `recommendRest` API が `NavigationRecommendation.candidates` を返却。混雑度・空き台数・ETA・推薦理由を表示 |
| US-4: 430限界警告 | `DrivingTimerPanel` で残り30分以下時に赤色警告表示 |
| US-5: ルートIC一覧確認 | `RouteTimeline` コンポーネントで IC名・距離を縦一列タイムライン表示 |
| AC-7: デモモード | `isDemoMode()` フラグで全 API をスタブ化。`demoScenarios.ts` に standard シナリオ定義 |

### v0.2 対応予定（MVP スコープ外）

| 要件 ID / 節 | 設計での対応 |
|----------------|--------------|
| v0.2: SA全滅時の代替提案 | バックエンドが `avoidedReasons` 付きでコンビニ・道の駅候補を返却 |
| v0.2: QOLスポット検索 | `fetchQolSpots` が Google Places → Overpass API のフォールバックで検索 |
| v0.2: 音声操作 | `useVoiceCommand` フックで音声認識、`useTts` フックで音声フィードバック |
| v0.2: デモモード追加シナリオ | 5シナリオ構成（standard + 4追加シナリオ） |
| NFR: フォールバック | Google → OSRM（ルート）、Google Places → Nominatim（検索）、Google Places → Overpass（QOL）の2段構え |

## 3. コンテキスト

```text
┌─────────────────────────────────────────────────────────┐
│                  Driver Copilot App (Expo)               │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ Navigation   │  │ DrivingTimer │  │ Voice         │  │
│  │ Screen       │  │ Panel        │  │ Command/TTS   │  │
│  └──────┬───────┘  └──────┬───────┘  └───────────────┘  │
│         │                 │                              │
│  ┌──────┴───────┐  ┌──────┴───────┐                     │
│  │ useNavigation│  │useDrivingTimer│                    │
│  └──────┬───────┘  └──────────────┘                     │
│         │                                                │
│  ┌──────┴──────────────────────────┐                     │
│  │   navigationApiClient.ts        │                     │
│  │   (API層: フォールバック制御)     │                     │
│  └──┬──────┬──────┬──────┬─────────┘                     │
└─────┼──────┼──────┼──────┼───────────────────────────────┘
      │      │      │      │
      ▼      ▼      ▼      ▼
┌────────┐┌──────┐┌────────┐┌──────────────────┐
│Google  ││OSRM  ││Overpass││自前バックエンド    │
│Maps API││(OSS) ││API     ││/api/v1/navigation │
│        ││      ││(OSS)   ││/recommend-rest    │
│- Direct.││      ││        ││                   │
│- Places││      ││        ││                   │
│- Geocode│      ││        ││                   │
└────────┘└──────┘└────────┘└──────────────────┘
                             ▲
                  ┌──────────┘
                  │Nominatim (OSS)
                  │(Places フォールバック)
                  └──────────
```

## 4. 設計判断

| 論点 | 選択 | 理由 | 却下案 |
|------|------|------|--------|
| フレームワーク | Expo SDK 54 + React Native 0.81 | クロスプラットフォーム対応、OTA更新、Expo Go での即時開発 | Flutter（チームの React 経験を活かす） |
| 地図ライブラリ | react-native-maps 1.20 | iOS/Android 両対応、Google Maps / Apple Maps 自動切替 | Mapbox（コスト、ライセンス複雑） |
| HTTP クライアント | axios 1.7 | タイムアウト・インターセプタ設定の容易さ | fetch API（タイムアウト制御が煩雑） |
| ルーティング API | Google Directions → OSRM フォールバック | Google は日本語のIC/JCT名を返却。OSRM はOSSで無料 | Google のみ（障害時にルート取得不可） |
| 場所検索 API | Google Places Autocomplete → Nominatim フォールバック | Google は精度高。Nominatim はOSSで無料 | Google のみ |
| QOLスポット検索 | Google Places Nearby → Overpass API フォールバック | Google は営業時間・口コミ。Overpass は OSM データで無料 | Overpass のみ（データの鮮度が劣る） |
| デモモード | `EXPO_PUBLIC_DEMO_MODE=true` 環境変数で全APIをスタブ化 | オフライン展示・営業デモ・テストに対応 | モックサーバー（セットアップ負荷） |
| UIデザイン | JR東日本風グリーン基調（`#35A86E`）、ダークテーマ固定 | 夜間運転時の視認性、鉄道路線図的なIC一覧表示の親和性 | マテリアルデザイン（トラック業界に馴染みにくい） |
| タイマー表示更新 | 5分単位丸め・5分間隔の `setInterval` | バッテリー消費抑制。430ルールの粒度として十分 | 1秒単位（バッテリー消費大） |
| 位置情報追従 | `expo-location` の `watchPositionAsync`（ナビ中のみ） | ナビ開始前は `getCurrentPositionAsync` 1回で節電 | 常時ウォッチ（バッテリー消費大） |
| 音声認識 | `@react-native-voice/voice` | React Native 向けの定番ライブラリ、開発ビルドで動作 | expo-speech-recognition（Expo Go 非対応） |

## 5. インターフェース

### 外部 API

| API | 用途 | エンドポイント | フォールバック先 |
|-----|------|----------------|------------------|
| Google Directions API | ルート検索（一般道/有料道路） | `https://maps.googleapis.com/maps/api/directions/json` | OSRM |
| Google Places Autocomplete | 目的地テキスト検索 | `https://maps.googleapis.com/maps/api/place/autocomplete/json` | Nominatim |
| Google Place Details | placeId → 座標解決 | `https://maps.googleapis.com/maps/api/place/details/json` | Nominatim（placeIdに緯度経度を埋め込み） |
| Google Places Nearby | QOLスポット検索 | `https://maps.googleapis.com/maps/api/place/nearbysearch/json` | Overpass API |
| OSRM | ルート検索（OSS フォールバック） | `https://router.project-osrm.org/route/v1/driving/{coords}` | — |
| Nominatim | 場所検索（OSS フォールバック） | `https://nominatim.openstreetmap.org/search` | — |
| Overpass API | QOLスポット検索（OSS フォールバック） | `https://overpass-api.de/api/interpreter` | — |

### 自前バックエンド API

| メソッド | エンドポイント | リクエスト | レスポンス |
|----------|----------------|------------|------------|
| POST | `/api/v1/navigation/recommend-rest` | `RecommendRestRequest { originLat, originLng, destLat, destLng, remainingDrivingSeconds }` | `NavigationRecommendation { remainingDrivingSeconds, candidates[], avoidedReasons[], emergency? }` |

バックエンド未起動時はクライアント側でモック休憩所データを生成する（`generateMockRestSpots`）。

### イベント / ジョブ

- なし（現在は全てクライアント側の同期/非同期処理）

## 6. データモデル

### DrivingTimerState

```typescript
type DriverStatus = 'idle' | 'driving' | 'resting';

interface DrivingTimerState {
  status: DriverStatus;
  drivingStartedAt: number | null;    // 運転ブロック開始時刻（ms epoch）
  restStartedAt: number | null;       // 休憩開始時刻（ms epoch）
  previousDrivingSeconds: number;     // 累積連続運転秒
}
```

- 連続運転上限: `MAX_CONTINUOUS_DRIVING_SECONDS = 14,400`（4時間）
- 最小休憩時間: `MIN_REST_SECONDS = 1,800`（30分）
- 30分以上の休憩で累積運転秒がリセットされる

### NavigationRecommendation

```typescript
interface NavigationRecommendation {
  remainingDrivingSeconds: number;
  candidates: RestSpotCandidate[];
  avoidedReasons: string[];
  emergency?: EmergencySuggestion;
}

interface RestSpotCandidate {
  id: string;
  name: string;
  lat: number; lng: number;
  etaMinutes: number;
  congestionLevel: 'low' | 'medium' | 'high';
  predictedAvailableLots: number;
  confidence: 'high' | 'medium' | 'low';
  isRecommended: boolean;
  reason: string;
}
```

### DirectionsRoute

```typescript
interface DirectionsRoute {
  segments: RouteSegment[];           // 有料/一般道セグメント群
  polylinePoints: Array<{ lat; lng }>; // バウンディングボックス用
  distanceMeters: number;
  durationSeconds: number;
  steps: RouteStep[];                 // IC/JCT/SA一覧
}

interface RouteStep {
  name: string;
  lat: number; lng: number;
  distanceFromStartKm: number;
  etaMinutes: number;
  isToll: boolean;
  type: 'origin' | 'ic' | 'jct' | 'sa' | 'destination';
}

interface RouteSegment {
  points: Array<{ lat: number; lng: number }>;
  isToll: boolean;
}
```

### QolSpot

```typescript
type QolSpotType = 'sento' | 'restaurant_24h' | 'laundry';

interface QolSpot {
  id: string;
  name: string;
  lat: number; lng: number;
  type: QolSpotType;
  address?: string;
  openNow?: boolean;
}
```

## 7. セキュリティ・権限

- **API キー管理**: Google Maps API キーは `.env` ファイルで管理し、`EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` として参照。`EXPO_PUBLIC_` プレフィックスにより Expo のバンドルに含まれるため、本番ではキー制限（HTTP リファラ/アプリバンドルID）を設定すること
- **バックエンド URL**: `EXPO_PUBLIC_API_BASE_URL` で環境ごとに切替。デフォルトは `http://192.168.1.2:8080`（ローカル開発用）
- **位置情報権限**: `expo-location` による `requestForegroundPermissionsAsync` で明示的に許可を取得。iOS の `NSLocationWhenInUseUsageDescription`、Android の `ACCESS_FINE_LOCATION` を設定済み
- **マイク権限**: 音声コマンド用。`NSMicrophoneUsageDescription` / `NSSpeechRecognitionUsageDescription` / `RECORD_AUDIO` を設定済み
- **認証**: 現時点では未実装（MVP スコープ外）。バックエンド API は認証なしで呼び出し可能

## 8. 可観測性

- **ログ**: 現状はコンソールログのみ（`console.log` / `console.error`）
- **メトリクス**: 未実装
- **エラー追跡**: 将来的に Sentry（`@sentry/react-native`）を導入予定
- **API タイムアウト**: 全外部 API 呼び出しに `API_TIMEOUT_MS = 10,000`（10秒）を設定。タイムアウト時はフォールバック API に自動切替

## 9. ロールアウト

- **Phase 1（現在）**: Expo Go でのプロトタイプ開発・デモ。`expo start` / `expo start --tunnel` で即時確認
- **Phase 2**: 開発ビルド（`expo run:ios` / `expo run:android`）。音声認識（`@react-native-voice/voice`）などネイティブモジュール依存の機能を有効化
- **Phase 3**: EAS Build によるストア配布用ビルド。TestFlight / Google Play 内部テストトラック
- **フィーチャーフラグ**: `EXPO_PUBLIC_DEMO_MODE` 環境変数でデモモードを切替
- **後方互換**: バックエンド未起動時はモックデータで動作するため、クライアント単体でも機能する

## 10. テスト方針

- **単体テスト**: Jest 29 + `@testing-library/react-native` 13。`useDrivingTimer` のタイマーロジック、`roundToFiveMinutes` のような純粋関数が主な対象
- **結合テスト**: `useNavigation` フックのフォールバック挙動、デモモード時の API スタブ化をモック差し替えでテスト
- **E2E テスト**: 現時点では未導入（将来的に Detox または Maestro を検討）
- **Jest 設定**: `react-native` プリセット使用、`transformIgnorePatterns` でネイティブモジュールを適切に除外。`moduleNameMapper` で `@/` エイリアスを設定済み
- **デモモードによる手動テスト**: MVP では standard シナリオ1本で基本機能パスを確認。v0.2 で5シナリオ（SA空きあり / 430限界直前 / SA全滅→代替提案 / QOLスポット優先 / 本末転倒防止）に拡張予定

## 11. Open Questions

- Sentry 導入のタイミングとプラン選定（Phase 2 以降か）
- オフライン地図キャッシュの必要性（山間部走行時の対応）
- バックエンド `recommend-rest` API の認証方式（JWT / API キー）
- プッシュ通知による 430 限界アラートの実装可否（バックグラウンド処理の制約）
- `react-native-maps` から Mapbox への将来的な移行検討（カスタムスタイル・オフライン対応）
