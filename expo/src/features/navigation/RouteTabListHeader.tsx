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
  onOpenBottomSheet: (mode: 'destination' | 'waypoint') => void;
  onOpenDepartureBottomSheet: () => void;
  /** 経路ヘッダー「現在時刻」相当の左側（確定後は時刻文字列） */
  routeTimePrimaryLabel: string;
  /** 経路ヘッダー右側の「出発」または「到着」 */
  routeTimeKindLabel: string;
  selectedDestinationLabel: string | null;
  selectedWaypoints: string[];
  onRemoveWaypoint: (index: number) => void;
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

export function RouteTabListHeader(props: Props): React.JSX.Element {
  const {
    insetsTop: _insetsTop,
    topSearchTab: _topSearchTab,
    onTopSearchTab: _onTopSearchTab,
    routeFlowPhase,
    hasDestination: _hasDestination,
    destinationQuery: _destinationQuery,
    destinationFieldOpen: _destinationFieldOpen,
    destinationFieldFocused: _destinationFieldFocused,
    destinationSearchInputRef: _destinationSearchInputRef,
    setDestinationQuery: _setDestinationQuery,
    onOpenDestinationField: _onOpenDestinationField,
    onDestinationFocus: _onDestinationFocus,
    onDestinationBlur: _onDestinationBlur,
    isSuggesting: _isSuggesting,
    isFetchingRoute,
    tollRoute,
    generalRoute,
    onPressGoProposals,
    onOpenMap,
    onOpenBottomSheet,
    onOpenDepartureBottomSheet,
    routeTimePrimaryLabel,
    routeTimeKindLabel,
    selectedDestinationLabel,
    selectedWaypoints,
    onRemoveWaypoint,
    truckProfileLoaded: _truckProfileLoaded,
    truckLenM: _truckLenM,
    truckWidM: _truckWidM,
    truckHgtM: _truckHgtM,
    onChangeDestination: _onChangeDestination,
    isNavigating,
    stopNavigation,
    error,
    congestionRows,
    routeProgress,
    currentLocation,
    activeSteps,
    listDataStepCount,
  } = props;

  void _insetsTop;
  void _topSearchTab;
  void _onTopSearchTab;
  void _hasDestination;
  void _destinationQuery;
  void _destinationFieldOpen;
  void _destinationFieldFocused;
  void _destinationSearchInputRef;
  void _setDestinationQuery;
  void _onOpenDestinationField;
  void _onDestinationFocus;
  void _onDestinationBlur;
  void _isSuggesting;
  void _truckProfileLoaded;
  void _truckLenM;
  void _truckWidM;
  void _truckHgtM;
  void _onChangeDestination;
  const hasDestination = true;

  const goDisabled =
    !hasDestination || isFetchingRoute || (!tollRoute && !generalRoute);

  return (
    <View style={styles.root}>
      {routeFlowPhase !== 'guidance' ? (
        <View
          style={[
            styles.blackSheet,
            routeFlowPhase === 'minimal' ? styles.blackSheetMinimal : null,
          ]}
        >
          <View style={[styles.placeStack, styles.placeStackCentered]}>
            <Text style={styles.placeGreen} numberOfLines={1}>
              現在地
            </Text>
            <Text style={styles.placeKanaLine}>から</Text>

            {selectedWaypoints.map((wp, idx) => (
              <View key={idx} style={styles.waypointRow}>
                <Text style={styles.waypointText} numberOfLines={1}>
                  {wp}
                </Text>
                <Pressable onPress={() => onRemoveWaypoint(idx)} hitSlop={8}>
                  <Text style={styles.waypointRemove}>✕</Text>
                </Pressable>
              </View>
            ))}

            {selectedWaypoints.length < 5 && (
              <Pressable
                style={styles.viaPillCenter}
                onPress={() => {
                  onOpenBottomSheet('waypoint');
                }}
              >
                <Text style={styles.viaPillTxt}>＋ 経由</Text>
              </Pressable>
            )}

            <Pressable
              onPress={() => {
                onOpenBottomSheet('destination');
              }}
              accessibilityRole="button"
              accessibilityLabel="目的地を設定"
              style={styles.destPressable}
            >
              <Text
                style={[styles.placeGreen, styles.placeGreenLine]}
                numberOfLines={1}
              >
                {selectedDestinationLabel ?? '目的地'}
              </Text>
              <Text style={styles.placeKanaLine}>まで</Text>
            </Pressable>

            <Pressable
              style={styles.timeRow}
              onPress={onOpenDepartureBottomSheet}
              accessibilityRole="button"
              accessibilityLabel={`出発・到着時刻: ${routeTimePrimaryLabel}、${routeTimeKindLabel}`}
            >
              <Text>
                <Text style={styles.timeEm}>{routeTimePrimaryLabel}</Text>
                <Text style={styles.timePlain}>　{routeTimeKindLabel}</Text>
              </Text>
            </Pressable>
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

            <View style={styles.optionRow}>
              <TouchableOpacity style={styles.optionBtn}>
                <Text style={styles.optionBtnTop}>高速道路</Text>
                <Text style={styles.optionBtnBot}>オン</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.optionBtn}>
                <Text style={styles.optionBtnTop}>ETC</Text>
                <Text style={styles.optionBtnBot}>オン</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  topTabText: { color: TD_TEXT_MUTED, fontSize: 20, fontWeight: '700' },
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
  placeStack: {},
  placeStackCentered: {
    minHeight: 580,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 24,
  },
  placeRow: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', marginTop: 8 },
  placeRowCenter: { justifyContent: 'center' },
  placeGreen: {
    color: TD_ACCENT,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  placeGreenLine: { marginTop: 24 },
  placeGreenMuted: {
    color: TD_ACCENT,
    fontSize: 32,
    fontWeight: '900',
    opacity: 0.85,
    textAlign: 'center',
  },
  placeKana: {
    color: TD_TEXT,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  placeKanaLine: {
    color: TD_TEXT,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 12,
    textAlign: 'center',
  },
  waypointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 8,
    gap: 10,
  },
  waypointText: {
    color: TD_ACCENT,
    fontSize: 16,
    fontWeight: '600',
  },
  waypointRemove: {
    color: TD_TEXT_MUTED,
    fontSize: 16,
    fontWeight: '700',
  },
  viaPillCenter: {
    marginTop: 24,
    alignSelf: 'center',
    backgroundColor: TD_SURFACE,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  unsetCenterWrap: {
    marginTop: 6,
    alignSelf: 'center',
    alignItems: 'center',
  },
  destPressable: { alignSelf: 'center', alignItems: 'center' },
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
  unsetWrapCentered: { alignSelf: 'center', alignItems: 'center' },
  unsetHint: { color: TD_TEXT_MUTED, fontSize: 12, marginTop: 6, fontWeight: '600' },
  unsetHintCentered: { textAlign: 'center' },
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
  timeRow: { marginTop: 32, alignItems: 'center' },
  timeEm: { color: TD_ACCENT, fontSize: 20, fontWeight: '800' },
  timePlain: { color: TD_TEXT, fontSize: 20, fontWeight: '700' },
  goWrap: { justifyContent: 'center', alignItems: 'center', marginTop: 32 },
  goDisc: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: TD_ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goDiscOff: { opacity: 0.35 },
  goDiscTxt: { color: '#000', fontSize: 24, fontWeight: '900' },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 20,
  },
  optionBtn: {
    backgroundColor: TD_SURFACE,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    minWidth: 120,
    alignItems: 'center',
  },
  optionBtnTop: {
    color: TD_ACCENT,
    fontSize: 14,
    fontWeight: '800',
  },
  optionBtnBot: {
    color: TD_TEXT,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
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
