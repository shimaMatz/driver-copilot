import React, { RefObject } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { RouteStep } from './navigationApiClient';
import { DrivingTimerPanel } from '../driving-timer/DrivingTimerPanel';
import { formatHighwayStepTitle } from './routeStepDisplay';
import type { RouteFlowPhase, TopSearchTab } from './routeFlowTypes';
import {
  TD_ACCENT,
  TD_BG,
  TD_SURFACE,
  TD_TEXT,
  TD_TEXT_MUTED,
} from './transitDarkTheme';
import { VerticalRouteSchematic } from './VerticalRouteSchematic';
import type { RouteProgressView } from './routeProgress';

export type CongestionRowModel = {
  key: string;
  step: RouteStep;
  level: 'empty' | 'normal' | 'busy' | 'full';
  title: string;
  detail: string;
};

type Props = {
  insetsTop: number;
  topSearchTab: TopSearchTab;
  onTopSearchTab: (t: TopSearchTab) => void;
  routeFlowPhase: RouteFlowPhase;
  hasDestination: boolean;
  destinationQuery: string;
  destinationFieldOpen: boolean;
  destinationFieldFocused: boolean;
  destinationSearchInputRef: RefObject<TextInput | null>;
  setDestinationQuery: (q: string) => void;
  onOpenDestinationField: () => void;
  onDestinationFocus: () => void;
  onDestinationBlur: () => void;
  isSuggesting: boolean;
  isFetchingRoute: boolean;
  tollRoute: unknown;
  generalRoute: unknown;
  onPressGoProposals: () => void;
  onOpenMap: () => void;
  truckProfileLoaded: boolean;
  truckLenM: number;
  truckWidM: number;
  truckHgtM: number;
  onChangeDestination: () => void;
  isNavigating: boolean;
  stopNavigation: () => void;
  error: string | null;
  congestionRows: CongestionRowModel[];
  routeProgress: RouteProgressView | null;
  currentLocation: { lat: number; lng: number } | null;
  activeSteps: RouteStep[];
  listDataStepCount: number;
};

function CongestionCardDark({ item }: { item: CongestionRowModel }): React.JSX.Element {
  const color =
    item.level === 'empty' || item.level === 'normal'
      ? TD_ACCENT
      : item.level === 'busy'
        ? '#EA580C'
        : '#DC2626';
  const mark = item.level === 'empty' ? '◎' : item.level === 'normal' ? '○' : item.level === 'busy' ? '△' : '×';
  return (
    <View style={cstyles.congCard}>
      <View style={[cstyles.congIcon, { borderColor: color }]}>
        <Text style={[cstyles.congIconText, { color }]}>{mark}</Text>
      </View>
      <View style={cstyles.congBody}>
        <Text style={cstyles.congName} numberOfLines={1}>
          {formatHighwayStepTitle(item.step.name, item.step.type)}
        </Text>
        <Text style={cstyles.congBadge}>
          {item.step.type === 'sa' ? 'SA' : 'PA'} · 混雑の目安
        </Text>
        <Text style={cstyles.congTitle}>{item.title}</Text>
        <Text style={cstyles.congDetail}>{item.detail}</Text>
      </View>
    </View>
  );
}

const cstyles = StyleSheet.create({
  congCard: {
    flexDirection: 'row',
    backgroundColor: TD_SURFACE,
    marginHorizontal: 12,
    marginTop: 8,
    padding: 12,
    borderRadius: 10,
    gap: 10,
  },
  congIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  congIconText: { fontSize: 16, fontWeight: '900' },
  congBody: { flex: 1, minWidth: 0 },
  congName: { color: TD_TEXT, fontSize: 15, fontWeight: '800' },
  congBadge: { color: TD_TEXT_MUTED, fontSize: 11, fontWeight: '700', marginTop: 2 },
  congTitle: { color: TD_TEXT, fontSize: 14, fontWeight: '800', marginTop: 6 },
  congDetail: { color: TD_TEXT_MUTED, fontSize: 12, lineHeight: 17, marginTop: 4 },
});

const TOP_TABS: { key: TopSearchTab; label: string }[] = [
  { key: 'history', label: '検索履歴' },
  { key: 'search', label: '検索' },
  { key: 'favorites', label: 'よく見る検索' },
];

export function RouteTabListHeader(props: Props): React.JSX.Element {
  const {
    insetsTop,
    topSearchTab,
    onTopSearchTab,
    routeFlowPhase,
    hasDestination,
    destinationQuery,
    destinationFieldOpen,
    destinationFieldFocused,
    destinationSearchInputRef,
    setDestinationQuery,
    onOpenDestinationField,
    onDestinationFocus,
    onDestinationBlur,
    isSuggesting,
    isFetchingRoute,
    tollRoute,
    generalRoute,
    onPressGoProposals,
    onOpenMap,
    truckProfileLoaded,
    truckLenM,
    truckWidM,
    truckHgtM,
    onChangeDestination,
    isNavigating,
    stopNavigation,
    error,
    congestionRows,
    routeProgress,
    currentLocation,
    activeSteps,
    listDataStepCount,
  } = props;

  const goDisabled =
    !hasDestination || isFetchingRoute || (!tollRoute && !generalRoute);

  return (
    <View style={styles.root}>
      <View style={[styles.topTabs, { paddingTop: Math.max(insetsTop, 8) }]}>
        {TOP_TABS.map(t => {
          const on = topSearchTab === t.key;
          return (
            <Pressable
              key={t.key}
              onPress={() => onTopSearchTab(t.key)}
              style={styles.topTabHit}
            >
              <Text style={[styles.topTabText, on && styles.topTabTextOn]}>
                {t.key === 'search' ? '🔍 ' : ''}
                {t.label}
              </Text>
              {on ? <View style={styles.topTabUnderline} /> : <View style={styles.topTabUnderlineHidden} />}
            </Pressable>
          );
        })}
      </View>

      {routeFlowPhase !== 'guidance' ? (
        <View
          style={[
            styles.blackSheet,
            routeFlowPhase === 'minimal' ? styles.blackSheetMinimal : null,
          ]}
        >
          <View style={styles.mapCorner}>
            <TouchableOpacity onPress={onOpenMap} hitSlop={12}>
              <Text style={styles.mapCornerTxt}>地図</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.placeRow}>
            <Text style={styles.placeGreen} numberOfLines={1}>
              現在地
            </Text>
            <Text style={styles.placeKana}>から</Text>
          </View>

          {routeFlowPhase === 'editor' ? (
            <View style={styles.midTools}>
              <TouchableOpacity style={styles.swapOrb} accessibilityLabel="入れ替え">
                <Text style={styles.swapOrbTxt}>⇅</Text>
              </TouchableOpacity>
              <Pressable style={styles.viaPill} onPress={onOpenMap}>
                <Text style={styles.viaPillTxt}>+ 経由</Text>
              </Pressable>
            </View>
          ) : null}

          {hasDestination ? (
            <View style={[styles.placeRow, { marginTop: routeFlowPhase === 'editor' ? 18 : 14 }]}>
              <Text style={styles.placeGreen} numberOfLines={1}>
                {destinationQuery.trim() || '目的地'}
              </Text>
              <Text style={styles.placeKana}>まで</Text>
            </View>
          ) : (
            <Pressable
              onPress={onOpenDestinationField}
              style={styles.unsetWrap}
              accessibilityRole="button"
              accessibilityLabel="目的地を設定"
            >
              <View style={styles.placeRow}>
                <Text style={styles.placeGreenMuted} numberOfLines={1}>
                  未設定
                </Text>
                <Text style={styles.placeKana}>まで</Text>
              </View>
              <Text style={styles.unsetHint}>タップして入力</Text>
            </Pressable>
          )}

          {!hasDestination && destinationFieldOpen ? (
            <View style={styles.searchBox}>
              <Text style={styles.searchLabel}>目的地</Text>
              <TextInput
                ref={destinationSearchInputRef}
                value={destinationQuery}
                onChangeText={setDestinationQuery}
                placeholder=""
                placeholderTextColor={TD_TEXT_MUTED}
                style={[
                  styles.searchInput,
                  destinationFieldFocused && styles.searchInputOn,
                ]}
                returnKeyType="search"
                clearButtonMode="while-editing"
                onFocus={onDestinationFocus}
                onBlur={onDestinationBlur}
              />
              {isSuggesting ? <Text style={styles.searchStatus}>候補を検索中…</Text> : null}
              {isFetchingRoute ? <Text style={styles.searchStatus}>ルートを取得中…</Text> : null}
            </View>
          ) : null}

          {routeFlowPhase === 'editor' && hasDestination ? (
            <>
              <View style={styles.timeRow}>
                <Text>
                  <Text style={styles.timeEm}>現在時刻</Text>
                  <Text style={styles.timePlain}> 出発</Text>
                </Text>
              </View>
              <View style={styles.goWrap}>
                <TouchableOpacity
                  style={[styles.goDisc, goDisabled && styles.goDiscOff]}
                  disabled={goDisabled}
                  onPress={onPressGoProposals}
                  accessibilityLabel="経路を検索"
                >
                  <Text style={styles.goDiscTxt}>GO!</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.filterRow}>
                {[
                  ['RT', 'オフ'],
                  ['JRのみ', 'オフ'],
                  ['🚶', 'ふつう'],
                  ['運賃', '設定'],
                  ['交通', '手段'],
                ].map(([a, b], i) => (
                  <View key={i} style={styles.filterSq}>
                    <Text style={styles.filterSqTop} numberOfLines={1}>
                      {a}
                    </Text>
                    <Text style={styles.filterSqBot} numberOfLines={1}>
                      {b}
                    </Text>
                  </View>
                ))}
              </View>
              <View style={styles.dotRow}>
                <View style={styles.dot} />
                <View style={[styles.dot, styles.dotOn]} />
                <View style={styles.dot} />
              </View>
            </>
          ) : null}
        </View>
      ) : (
        <View style={styles.guidanceBlock}>
          <View style={styles.guidanceBar}>
            <TouchableOpacity onPress={onOpenMap}>
              <Text style={styles.guidanceLink}>地図</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={stopNavigation}>
              <Text style={[styles.guidanceLink, styles.guidanceStop]}>停止</Text>
            </TouchableOpacity>
          </View>
          <DrivingTimerPanel isNavigating={isNavigating} />
          <Text style={styles.secTitle}>運行状況</Text>
          <Text style={styles.secSub}>このルート上の SA/PA の混み目安（参考）</Text>
          {congestionRows.length === 0 ? (
            <Text style={styles.secEmpty}>表示できる SA/PA がありません</Text>
          ) : (
            congestionRows.map(row => <CongestionCardDark key={row.key} item={row} />)
          )}
          <Text style={[styles.secTitle, { marginTop: 16 }]}>走行位置</Text>
          <View style={styles.schematicPad}>
            <VerticalRouteSchematic
              steps={activeSteps}
              alongRoute01={routeProgress?.alongRoute01 ?? 0}
              offRoute={!currentLocation ? true : (routeProgress?.offRoute ?? false)}
              segmentLine={
                routeProgress && currentLocation && !routeProgress.offRoute
                  ? `${routeProgress.fromShort} → ${routeProgress.toShort}`
                  : '—'
              }
              hasGps={!!currentLocation}
            />
          </View>
          {listDataStepCount > 0 ? (
            <Text style={[styles.secTitle, { marginTop: 8 }]}>経路詳細</Text>
          ) : null}
        </View>
      )}

      {truckProfileLoaded && routeFlowPhase === 'editor' ? (
        <View style={styles.truckStrip}>
          <Text style={styles.truckStripTxt} numberOfLines={1}>
            車両 {truckLenM} × {truckWidM} × {truckHgtM} m
          </Text>
        </View>
      ) : null}

      {hasDestination && routeFlowPhase === 'editor' && !isNavigating ? (
        <View style={styles.destBar}>
          <View style={{ flex: 1 }}>
            <Text style={styles.destBarLbl}>目的地</Text>
            <Text style={styles.destBarName} numberOfLines={1}>
              {destinationQuery}
            </Text>
          </View>
          <TouchableOpacity style={styles.destChange} onPress={onChangeDestination}>
            <Text style={styles.destChangeTxt}>変更</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {error ? <Text style={styles.errBanner}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: TD_BG },
  topTabs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 6,
    backgroundColor: TD_BG,
  },
  topTabHit: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  topTabText: { color: TD_TEXT_MUTED, fontSize: 12, fontWeight: '700' },
  topTabTextOn: { color: TD_TEXT },
  topTabUnderline: {
    marginTop: 6,
    height: 2,
    width: 36,
    backgroundColor: TD_ACCENT,
    borderRadius: 1,
  },
  topTabUnderlineHidden: { marginTop: 6, height: 2, width: 36 },
  blackSheet: {
    backgroundColor: TD_BG,
    minHeight: 420,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  blackSheetMinimal: {
    minHeight: 200,
    paddingBottom: 16,
  },
  mapCorner: { alignItems: 'flex-end', marginBottom: 4 },
  mapCornerTxt: { color: TD_ACCENT, fontSize: 14, fontWeight: '800' },
  placeRow: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', marginTop: 8 },
  placeGreen: {
    color: TD_ACCENT,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
    maxWidth: '88%',
  },
  placeGreenMuted: {
    color: TD_ACCENT,
    fontSize: 32,
    fontWeight: '900',
    opacity: 0.85,
  },
  placeKana: {
    color: TD_TEXT,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  midTools: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  swapOrb: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: TD_SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swapOrbTxt: { color: TD_TEXT, fontSize: 18 },
  viaPill: {
    backgroundColor: TD_SURFACE,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  viaPillTxt: { color: TD_TEXT, fontSize: 14, fontWeight: '800' },
  unsetWrap: { marginTop: 14, alignSelf: 'flex-start' },
  unsetHint: { color: TD_TEXT_MUTED, fontSize: 12, marginTop: 6, fontWeight: '600' },
  searchBox: { marginTop: 18 },
  searchLabel: { color: TD_TEXT, fontSize: 12, fontWeight: '800', marginBottom: 8 },
  searchInput: {
    backgroundColor: TD_SURFACE,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#3A3A3C',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: TD_TEXT,
    fontSize: 16,
  },
  searchInputOn: { borderColor: TD_ACCENT },
  searchStatus: { color: TD_TEXT_MUTED, fontSize: 12, marginTop: 8 },
  timeRow: { marginTop: 20, alignItems: 'center' },
  timeEm: { color: TD_ACCENT, fontSize: 14, fontWeight: '800' },
  timePlain: { color: TD_TEXT, fontSize: 14, fontWeight: '700' },
  goWrap: { flex: 1, minHeight: 140, justifyContent: 'center', alignItems: 'center', marginVertical: 8 },
  goDisc: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: TD_ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goDiscOff: { opacity: 0.35 },
  goDiscTxt: { color: '#000', fontSize: 22, fontWeight: '900' },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 6,
  },
  filterSq: {
    flex: 1,
    backgroundColor: TD_SURFACE,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    minWidth: 0,
  },
  filterSqTop: { color: TD_ACCENT, fontSize: 11, fontWeight: '800' },
  filterSqBot: { color: TD_TEXT_MUTED, fontSize: 10, fontWeight: '700', marginTop: 4 },
  dotRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 14 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#3A3A3C' },
  dotOn: { backgroundColor: TD_ACCENT },
  guidanceBlock: { backgroundColor: TD_BG, paddingBottom: 12 },
  guidanceBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  guidanceLink: { color: TD_ACCENT, fontSize: 16, fontWeight: '800' },
  guidanceStop: { color: '#FF6B6B' },
  secTitle: {
    color: TD_TEXT,
    fontSize: 17,
    fontWeight: '800',
    marginHorizontal: 16,
    marginTop: 8,
  },
  secSub: {
    color: TD_TEXT_MUTED,
    fontSize: 12,
    marginHorizontal: 16,
    marginTop: 4,
    fontWeight: '600',
  },
  secEmpty: {
    color: TD_TEXT_MUTED,
    fontSize: 13,
    marginHorizontal: 16,
    marginTop: 8,
  },
  schematicPad: { marginHorizontal: 8, marginTop: 8 },
  truckStrip: {
    backgroundColor: TD_SURFACE,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#3A3A3C',
  },
  truckStripTxt: { color: TD_ACCENT, fontSize: 12, fontWeight: '700' },
  destBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: TD_SURFACE,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#3A3A3C',
    gap: 10,
  },
  destBarLbl: { color: TD_TEXT_MUTED, fontSize: 10, fontWeight: '700' },
  destBarName: { color: TD_TEXT, fontSize: 15, fontWeight: '700' },
  destChange: {
    backgroundColor: '#3A3A3C',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  destChangeTxt: { color: TD_TEXT, fontSize: 13, fontWeight: '800' },
  errBanner: {
    color: '#FF6B6B',
    textAlign: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: TD_SURFACE,
  },
});
