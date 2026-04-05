# システム設計: トラックCopilot

## メタ情報

| 項目 | 内容 |
|------|------|
| 要件 | `docs/requirements/features/truck-copilot/requirement.md` |
| ステータス | 草案 |
| 最終更新 | 2026-04-05 |

## 1. 概要

430ルール違反リスクの排除と快適な休憩確保を目的とした、トラックドライバー向けモバイルアプリ。

3つの機能柱をMVP優先度順に実装する：
1. **混雑回避・マッチング** — VICS + 走行データでSA/PA混雑を予測し空き施設へ誘導
2. **QOL施設検索** — 大型車対応施設（銭湯・飲食・コインランドリー）を地図上でリコメンド
3. **430リアルタイム監視** — 連続運転時間を計測し残り走行可能時間をリアルタイム表示

オフライン耐性（タイマー + キャッシュ地図）と1タップUIを共通基盤として全機能に適用する。

## 2. 要件トレース

| 要件 ID / 節 | 設計での対応 |
|----------------|--------------|
| §2 In Scope 1: 混雑回避・マッチング | CongestionService + VICSAdapter（§4）|
| §2 In Scope 2: QOL施設検索 | FacilitySearchService + FacilityRepository（§4）|
| §2 In Scope 3: 430リアルタイム監視 | DrivingTimerService（§4）|
| §5 AC-1: 5分ごとタイマー更新 | DrivingTimerService のバックグラウンドタスク（5分インターバル）|
| §5 AC-2: 30分・10分アラート | NotificationService のしきい値トリガー |
| §5 AC-3: 半径20km施設表示 | FacilitySearchService の近傍クエリ |
| §5 AC-5: 混雑レベル色分け | CongestionLevel enum（空き/やや混雑/満車）|
| §5 AC-6: オフライン動作 | タイマー状態はMMKVローカル保存、施設はSupabaseからMMKVにキャッシュ + オフライン地図タイル |
| §5 AC-7: 到着予測誤差±5分 | ETACalculator（MapMatchingとVICS速度を合算）|
| §6 非機能: iOS/Android両対応 | React Native（Expo）採用（§4 設計判断）|
| §6 非機能: 検索3秒以内 | 施設データはSupabaseからMMKVにキャッシュ、オフライン時はキャッシュから即時応答 |

## 3. コンテキスト

```text
┌────────────────────────────────────────────────────────┐
│                   モバイルアプリ (RN/Expo)               │
│                                                        │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Timer UI │  │ Facility Map │  │ Congestion   │     │
│  │  Screen  │  │   Screen     │  │  Screen      │     │
│  └────┬─────┘  └──────┬───────┘  └──────┬───────┘     │
│       │               │                 │              │
│  ┌────▼───────────────▼─────────────────▼──────────┐  │
│  │               Application Layer                 │  │
│  │  DrivingTimerService   FacilitySearchService    │  │
│  │  NotificationService   CongestionService        │  │
│  │  ETACalculator                                  │  │
│  └────┬──────────────┬──────────────────┬──────────┘  │
│       │              │                  │              │
│  ┌────▼─────┐  ┌─────▼──────┐  ┌────────▼──────────┐  │
│  │  MMKV    │  │ Offline Map│  │   SupabaseClient   │  │
│  │(タイマー  │  │Tiles Cache │  │  (施設/混雑キャッシュ)│  │
│  │ /施設 ) │  │            │  │   VICSAdapter      │  │
│  └──────────┘  └────────────┘  └────────────────────┘  │
└────────────────────────────────────────────────────────┘
                                         │
                      ┌──────────────────┴──────────────────┐
                      ▼                                     ▼
              Supabase (PostgreSQL)                  VICS WIDE API
          施設マスタ・走行セッション・混雑キャッシュ        (混雑・速度情報)
                      │
                      ▼
              Google Places API
              (施設基本情報 取得元)
```

## 4. 設計判断

| 論点 | 選択 | 理由 | 却下案 |
|------|------|------|--------|
| モバイルフレームワーク | React Native (Expo) | iOS/Android 同時対応、オフライン対応実績、OTA更新 | Flutter（Dart学習コスト）/ ネイティブ個別開発（コスト2倍）|
| クラウドDB | Supabase (PostgreSQL) | 施設マスタ・走行セッション・混雑キャッシュを一元管理。RLS・Auth・Realtimeが標準装備 | Firebase（NoSQL、地理クエリが複雑）/ 自前PostgreSQL（運用コスト大）|
| オフラインキャッシュ | MMKV (react-native-mmkv) | Supabase取得データのローカルキャッシュとタイマー状態の永続化。SQLiteより高速、KVSで十分 | SQLite（スキーマ管理コスト）/ AsyncStorage（同期APIなし、速度遅い）|
| 地図ライブラリ | react-native-maps + MapLibre | Google Maps SDKとOSMの切替可能、オフラインタイル対応 | Google Maps SDK単体（オフライン非対応）|
| 施設データソース | Google Places API（MVP）+ Supabase独自大型車フラグ | Places APIで施設基本情報を取得し、大型車対応フラグはSupabaseで補完・管理 | トラックカーナビ提携（交渉期間長）/ 完全自前DB（初期コスト大）|
| VICS連携 | VICS WIDE API（REST）| 公式API、リアルタイム混雑・速度情報を提供 | スクレイピング（利用規約違反リスク）|
| オフライン地図 | 事前DLタイル（主要幹線道路 ±50km） | ドライバーの走行ルート傾向から幹線道路カバーで90%対応 | 全国DL（容量数GB、端末負荷大）|
| タイマー計測方式 | 速度センサー（GPS速度）> 手動フォールバック | GPS速度0が一定継続 = 停車と判定し自動停止、精度と手間のバランス | エンジンON/OFF（OBD2連携が必要）|

## 5. インターフェース

### API

**外部API（消費側）**

| API | エンドポイント例 | 用途 |
|-----|----------------|------|
| VICS WIDE | `GET /traffic/road-info` | SA/PA周辺の混雑・速度情報取得 |
| Google Places | `GET /maps/api/place/nearbysearch` | 施設検索（銭湯・飲食・SA/PA）|
| 独自施設DB | `GET /api/v1/facilities?lat=&lng=&r=` | 大型車駐車可フラグ・独自施設情報 |

**内部サービスインターフェース**

```typescript
// 連続運転タイマー
interface DrivingTimerService {
  start(): void
  pause(): void             // 休憩開始
  reset(): void             // 30分休憩完了後
  getElapsed(): number      // 経過秒数
  getRemaining(): number    // 残り走行可能秒数（14400 - elapsed）
}

// 施設検索
interface FacilitySearchService {
  search(params: { lat: number; lng: number; radius: number; types: FacilityType[] }): Promise<Facility[]>
}

// 混雑予測
interface CongestionService {
  predict(facilityId: string): Promise<CongestionLevel>  // LOW / MEDIUM / HIGH
}
```

### イベント / ジョブ

| イベント | トリガー | アクション |
|---------|---------|----------|
| `timer.warning.30min` | 残り走行可能時間が1800秒 | ローカルプッシュ通知発火 |
| `timer.warning.10min` | 残り走行可能時間が600秒 | 緊急ローカルプッシュ通知発火 |
| `location.update` | GPS更新（1分インターバル） | 速度0継続60秒でタイマー自動一時停止 |
| `facility.cache.refresh` | アプリ起動時 / Wi-Fi接続時 | 半径100km圏内の施設データをバックグラウンド更新 |
| `vics.fetch` | 5分インターバル（オンライン時） | SA/PA混雑情報をキャッシュ更新 |

### 動画・音声

- 該当なし（MVP範囲外）

## 6. データモデル

### Supabase テーブル（PostgreSQL）

```sql
-- 走行セッション（430ルール管理）
CREATE TABLE driving_session (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users,   -- 将来の認証連携用（MVP は null 許容）
  started_at    TIMESTAMPTZ NOT NULL,
  paused_at     TIMESTAMPTZ,
  elapsed_sec   INTEGER DEFAULT 0,
  status        TEXT CHECK(status IN ('driving', 'resting', 'completed')),
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 施設マスタ（大型車フラグ管理・SupabaseはPostGIS拡張で地理クエリ対応）
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE facility (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id      TEXT UNIQUE,                  -- Google Places ID
  name          TEXT NOT NULL,
  location      GEOGRAPHY(POINT, 4326),       -- PostGIS地理型
  type          TEXT CHECK(type IN ('onsen', 'restaurant', 'laundry', 'sa', 'pa')),
  truck_ok      BOOLEAN DEFAULT false,        -- 大型車駐車可フラグ
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- 半径検索インデックス
CREATE INDEX facility_location_idx ON facility USING GIST(location);

-- 混雑予測キャッシュ
CREATE TABLE congestion_cache (
  facility_id   UUID REFERENCES facility(id) ON DELETE CASCADE,
  level         TEXT CHECK(level IN ('low', 'medium', 'high')),
  fetched_at    TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (facility_id)
);
```

### MMKVローカルキャッシュ（オフライン用）

```typescript
// タイマー状態（端末ローカル、オフライン保証）
mmkv.set('timer.state', JSON.stringify({
  elapsedSec: number,
  status: 'driving' | 'resting' | 'completed',
  lastUpdatedAt: number   // Unix timestamp
}))

// 施設キャッシュ（Supabaseから取得後に保存）
mmkv.set('facility.cache', JSON.stringify({
  items: Facility[],
  cachedAt: number,
  radiusKm: number
}))
```

### マイグレーション方針

- Supabase Dashboard または `supabase/migrations/` ディレクトリでバージョン管理
- スキーマ変更は必ず `supabase db diff` で差分確認後にマイグレーションファイルを生成
- RLS（Row Level Security）ポリシーはマイグレーションファイルに含める

## 7. セキュリティ・権限

- **認可モデル**: MVP段階はSupabase Authの匿名認証（anon key）で端末識別。将来的に運行管理会社アカウント連携を検討
- **RLS**: `driving_session` は `user_id = auth.uid()` のポリシーで他ユーザーのデータを保護
- **位置情報**: 端末内で処理、外部送信は混雑情報改善のための統計データのみ（明示同意取得後）
- **APIキー管理**: VICS・Google Places・Supabase のAPIキーは EAS Secret（環境変数）で管理、ビルド時注入。Supabase anon keyは公開可だがRLSで保護
- **HTTPS強制**: 全外部API通信はTLS 1.2以上

## 8. 可観測性

- **ログ**: Expo内蔵ロガー + クラッシュは Sentry（expo-sentry）で収集
- **メトリクス**: タイマー計測精度（誤差分布）、施設検索レスポンスタイム、VICS取得失敗率
- **アラート**: VICS取得失敗率が5分間で50%超えた場合にSlack通知（将来対応）

## 9. ロールアウト

- **フィーチャーフラグ**: `CONGESTION_ENABLED` / `FACILITY_SEARCH_ENABLED`（初期はfalse、段階的にON）
- **後方互換**: MVPはSQLiteローカルのみ、データ移行不要
- **配布**: TestFlight（iOS）/ Google Play 内部テスト → 段階的公開

## 10. テスト方針

| レベル | 対象 | ツール |
|-------|------|-------|
| 単体 | DrivingTimerService・ETACalculator・CongestionService | Jest |
| 結合 | SQLite読み書き・API Adapter（MSWでモック）| Jest + MSW |
| E2E | タイマー開始→アラート→施設検索の主要フロー | Detox |

- `testing.md` の方針に従い、タイマーの境界値（3時間50分・4時間）は必ず単体テストでカバー

## 11. Open Questions

- VICS WIDE API の契約形態・レート制限の確認（要問い合わせ）
- 大型車駐車可フラグの独自DBをどのソースで整備するか（国交省データ / クラウドソーシング）
- GPS速度ゼロ判定の閾値（現在: 60秒連続）は実走テストで調整が必要
- 多重休憩カウント仕様（30分未満の休憩複数回の合算可否）の法的確認
- 混雑予測モデルの精度目標（±何%を合格とするか）
