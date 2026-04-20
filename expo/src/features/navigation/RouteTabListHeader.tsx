import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { TopSearchTab } from './routeFlowTypes';
import {
  WF_BG,
  WF_BORDER,
  WF_CARD,
  WF_CHIP_BORDER,
  WF_DEST_BG,
  WF_DEST_BORDER,
  WF_PRIMARY,
  WF_TEXT,
  WF_TEXT_MUTED,
} from './wireframeTheme';

type Props = {
  topSearchTab: TopSearchTab;
  hasDestination: boolean;
  destinationQuery: string;
  isSuggesting: boolean;
  isFetchingRoute: boolean;
  tollRoute: unknown;
  generalRoute: unknown;
  onPressGoProposals: () => void;
  onOpenBottomSheet: (mode: 'destination' | 'waypoint') => void;
  onOpenDepartureBottomSheet: () => void;
  routeTimePrimaryLabel: string;
  routeTimeKindLabel: string;
  selectedWaypoints: string[];
  onRemoveWaypoint: (index: number) => void;
  error: string | null;
  /** 出発地カードに表示する住所（ワイヤーフレーム用・入替対象） */
  originAddressLine: string;
  onSwapOriginDestination: () => void;
  onApplyRecentSearch: (query: string) => void;
};

const MOCK_RECENT = [
  { title: '羽田空港 第1ターミナル', sub: '東京都大田区' },
  { title: '横浜スタジアム', sub: '神奈川県横浜市' },
];

const MOCK_FAVORITES = [
  { title: '横浜物流センター', sub: '神奈川県横浜市' },
  { title: '自宅', sub: '設定から追加' },
];

export function RouteTabListHeader(props: Props): React.JSX.Element {
  const {
    topSearchTab,
    hasDestination,
    destinationQuery,
    isSuggesting,
    isFetchingRoute,
    tollRoute,
    generalRoute,
    onPressGoProposals,
    onOpenBottomSheet,
    onOpenDepartureBottomSheet,
    routeTimePrimaryLabel,
    routeTimeKindLabel,
    selectedWaypoints,
    onRemoveWaypoint,
    error,
    originAddressLine,
    onSwapOriginDestination,
    onApplyRecentSearch,
  } = props;

  const [chipDepartNow, setChipDepartNow] = useState(true);
  const [chipHighway, setChipHighway] = useState(true);
  const [chipEtc, setChipEtc] = useState(true);
  const [chipTollPref, setChipTollPref] = useState(false);

  const goDisabled =
    !hasDestination ||
    isFetchingRoute ||
    isSuggesting ||
    (!tollRoute && !generalRoute);

  const renderHistoryOrFavorites = () => {
    const rows = topSearchTab === 'history' ? MOCK_RECENT : MOCK_FAVORITES;
    return (
      <View style={styles.altTabWrap}>
        <Text style={styles.altTabHint}>
          {topSearchTab === 'history' ? '最近の検索' : 'お気に入り'}
        </Text>
        {rows.map((row, i) => (
          <Pressable
            key={i}
            style={styles.recentRow}
            onPress={() => onApplyRecentSearch(row.title)}
          >
            <Ionicons name="time-outline" size={22} color={WF_PRIMARY} style={styles.recentIcon} />
            <View style={styles.recentMain}>
              <Text style={styles.recentTitle}>{row.title}</Text>
              <Text style={styles.recentSub}>{row.sub}</Text>
            </View>
            <Ionicons name="star-outline" size={22} color={WF_TEXT_MUTED} />
          </Pressable>
        ))}
      </View>
    );
  };

  const renderSearchWireframe = () => (
    <View style={styles.wireRoot}>
      <View style={styles.originCard}>
        <View style={styles.cardRow}>
          <View style={styles.greenDot} />
          <View style={styles.cardTextCol}>
            <Text style={styles.cardLabel}>出発地</Text>
            <Text style={styles.cardTitleGreen}>現在地</Text>
            <Text style={styles.cardSub}>{originAddressLine}</Text>
          </View>
          <Pressable hitSlop={12} accessibilityLabel="音声入力（出発地）">
            <Ionicons name="mic-outline" size={26} color={WF_PRIMARY} />
          </Pressable>
        </View>
      </View>

      <View style={styles.connectorRow}>
        <View style={styles.dottedCol}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
        <Pressable
          style={styles.swapBtn}
          onPress={onSwapOriginDestination}
          accessibilityLabel="出発地と目的地を入れ替え"
        >
          <Ionicons name="swap-vertical" size={22} color={WF_TEXT} />
        </Pressable>
      </View>

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

      {selectedWaypoints.length < 5 ? (
        <Pressable
          style={styles.viaPill}
          onPress={() => onOpenBottomSheet('waypoint')}
        >
          <Text style={styles.viaPillText}>＋ 経由地を追加</Text>
        </Pressable>
      ) : null}

      <View style={styles.viaToDestConnector}>
        <View style={styles.dottedCol}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>

      <View style={styles.destCardOuter}>
        <View style={styles.destCardInner}>
          <View style={styles.cardRow}>
            <Ionicons name="location-outline" size={24} color={WF_PRIMARY} />
            <Pressable
              style={styles.destPressableCol}
              onPress={() => onOpenBottomSheet('destination')}
              accessibilityRole="button"
              accessibilityLabel="目的地を検索"
            >
              <View style={styles.cardTextCol}>
                <Text style={styles.cardLabel}>目的地</Text>
                <Text
                  style={[
                    styles.destInput,
                    destinationQuery.trim().length === 0 && styles.destInputPlaceholder,
                  ]}
                  numberOfLines={2}
                >
                  {destinationQuery.trim().length > 0 ? destinationQuery : 'タップして検索'}
                </Text>
                <Text style={styles.destHint}>住所 施設名 電話番号</Text>
              </View>
            </Pressable>
            <View style={styles.destIcons}>
              <Pressable hitSlop={8} accessibilityLabel="音声入力（目的地）">
                <Ionicons name="mic-outline" size={24} color={WF_PRIMARY} />
              </Pressable>
              <Pressable
                hitSlop={8}
                onPress={() => onOpenBottomSheet('destination')}
                accessibilityLabel="目的地を検索"
              >
                <Ionicons name="search-outline" size={24} color={WF_PRIMARY} />
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.chipRow}>
        <Pressable
          style={[styles.chip, chipDepartNow && styles.chipOn]}
          onPress={() => setChipDepartNow(v => !v)}
        >
          <Text style={[styles.chipText, chipDepartNow && styles.chipTextOn]}>出発今</Text>
        </Pressable>
        <Pressable
          style={[styles.chip, chipHighway && styles.chipOn]}
          onPress={() => setChipHighway(v => !v)}
        >
          <Text style={[styles.chipText, chipHighway && styles.chipTextOn]}>高速</Text>
        </Pressable>
        <Pressable
          style={[styles.chip, chipEtc && styles.chipOn]}
          onPress={() => setChipEtc(v => !v)}
        >
          <Text style={[styles.chipText, chipEtc && styles.chipTextOn]}>ETC</Text>
        </Pressable>
        <Pressable
          style={[styles.chip, chipTollPref && styles.chipOn]}
          onPress={() => setChipTollPref(v => !v)}
        >
          <Text style={[styles.chipText, chipTollPref && styles.chipTextOn]}>有料優先</Text>
        </Pressable>
      </View>

      <Pressable
        style={styles.timeRow}
        onPress={onOpenDepartureBottomSheet}
        accessibilityRole="button"
      >
        <Text>
          <Text style={styles.timeEm}>{routeTimePrimaryLabel}</Text>
          <Text style={styles.timePlain}>　{routeTimeKindLabel}</Text>
        </Text>
      </Pressable>

      <TouchableOpacity
        style={[styles.goBar, goDisabled && styles.goBarOff]}
        disabled={goDisabled}
        onPress={onPressGoProposals}
        accessibilityLabel="ルート検索"
      >
        <Text style={styles.goBarText}>ルート検索</Text>
      </TouchableOpacity>

    </View>
  );

  return (
    <View style={styles.root}>
      {topSearchTab === 'editor' ? renderSearchWireframe() : renderHistoryOrFavorites()}

      {error ? <Text style={styles.errBanner}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: WF_BG },
  wireRoot: {
    backgroundColor: WF_BG,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  originCard: {
    backgroundColor: WF_CARD,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: WF_BORDER,
    padding: 14,
  },
  destPressableCol: { flex: 1, minWidth: 0 },
  destInputPlaceholder: { opacity: 0.45 },
  viaToDestConnector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
    paddingLeft: 8,
  },
  destCardOuter: { marginTop: 0 },
  destCardInner: {
    backgroundColor: WF_DEST_BG,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: WF_DEST_BORDER,
    padding: 14,
  },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  greenDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: WF_PRIMARY,
    marginTop: 6,
  },
  cardTextCol: { flex: 1, minWidth: 0 },
  cardLabel: { color: WF_TEXT_MUTED, fontSize: 12, fontWeight: '700' },
  cardTitleGreen: {
    color: WF_PRIMARY,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 4,
  },
  cardSub: { color: WF_TEXT, fontSize: 13, marginTop: 6, fontWeight: '600' },
  destInput: {
    color: WF_PRIMARY,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 4,
    padding: 0,
    minHeight: 28,
  },
  destHint: { color: WF_PRIMARY, fontSize: 12, fontWeight: '600', marginTop: 6, opacity: 0.85 },
  destIcons: { flexDirection: 'row', gap: 8, marginTop: 4 },
  connectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
    paddingLeft: 8,
    gap: 12,
  },
  dottedCol: { gap: 5, paddingVertical: 4 },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: WF_TEXT_MUTED,
    opacity: 0.45,
  },
  swapBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: WF_CARD,
    borderWidth: 1,
    borderColor: WF_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waypointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
    alignSelf: 'center',
  },
  waypointText: { color: WF_PRIMARY, fontSize: 15, fontWeight: '700' },
  waypointRemove: { color: WF_TEXT_MUTED, fontSize: 16, fontWeight: '700' },
  viaPill: {
    alignSelf: 'center',
    marginTop: 14,
    borderWidth: 1.5,
    borderColor: WF_PRIMARY,
    borderStyle: 'dashed',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: WF_CARD,
  },
  viaPillText: { color: WF_PRIMARY, fontSize: 14, fontWeight: '800' },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WF_CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: WF_BORDER,
    padding: 12,
    marginBottom: 8,
    gap: 10,
  },
  recentIcon: { marginRight: 2 },
  recentMain: { flex: 1, minWidth: 0 },
  recentTitle: { color: WF_TEXT, fontSize: 16, fontWeight: '800' },
  recentSub: { color: WF_TEXT_MUTED, fontSize: 13, marginTop: 4, fontWeight: '600' },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: WF_TEXT_MUTED,
    backgroundColor: WF_CARD,
  },
  chipOn: {
    borderColor: WF_CHIP_BORDER,
    backgroundColor: `${WF_PRIMARY}18`,
  },
  chipText: { color: WF_TEXT_MUTED, fontSize: 13, fontWeight: '800' },
  chipTextOn: { color: WF_PRIMARY },
  timeRow: { marginTop: 44, alignItems: 'center' },
  timeEm: { color: WF_PRIMARY, fontSize: 18, fontWeight: '800' },
  timePlain: { color: WF_TEXT, fontSize: 18, fontWeight: '700' },
  goBar: {
    marginTop: 32,
    backgroundColor: WF_PRIMARY,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  goBarOff: { opacity: 0.4 },
  goBarText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  altTabWrap: { paddingHorizontal: 16, paddingBottom: 16 },
  altTabHint: {
    color: WF_TEXT_MUTED,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 8,
  },
  errBanner: {
    color: '#DC2626',
    textAlign: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: WF_CARD,
  },
});
