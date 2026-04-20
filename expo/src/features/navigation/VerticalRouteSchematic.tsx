import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { RouteStep } from './navigationApiClient';
import {
  WF_DEST_BG,
  WF_PRIMARY,
  WF_TAG_WORK,
  WF_TEXT,
  WF_TEXT_MUTED,
  WF_WHITE,
} from './wireframeTheme';
import { formatDurationJa } from './routeSummary';
import { formatHighwayStepTitle } from './routeStepDisplay';

const ROW_MIN = 56;
const SPINE_W = 5;

type Props = {
  steps: RouteStep[];
  alongRoute01: number;
  offRoute: boolean;
  segmentLine: string;
  hasGps: boolean;
};

export function VerticalRouteSchematic({
  steps,
  alongRoute01,
  offRoute,
  segmentLine,
  hasGps,
}: Props): React.JSX.Element {
  const h = Math.max(320, steps.length * ROW_MIN + 80);
  const truckTopPct = Math.min(96, Math.max(2, alongRoute01 * 100));

  if (steps.length < 2) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>ルートを検索すると、ここに縦の路線図が表示されます</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>走行位置（イメージ）</Text>
        <Text style={styles.bannerSub} numberOfLines={2}>
          {hasGps
            ? offRoute
              ? 'ルートから離れている可能性があります。地図で確認してください。'
              : segmentLine
            : 'GPS の現在地を取得すると、オレンジの線上でおおよその位置が分かります。'}
        </Text>
      </View>

      <View style={[styles.schematic, { minHeight: h }]}>
        <View
          style={[styles.truckMarker, { top: `${truckTopPct}%` }]}
          pointerEvents="none"
        >
          <View style={styles.truckBubble}>
            <Text style={styles.truckGlyph}>🚛</Text>
          </View>
          <Text style={styles.truckCaption}>現在地付近</Text>
        </View>

        {steps.map((step, index) => {
          const short = formatHighwayStepTitle(step.name, step.type);
          const timeLabel =
            step.etaMinutes > 0
              ? `約${formatDurationJa(step.etaMinutes)}`
              : step.type === 'origin'
                ? '出発'
                : '—';
          const isEnd = index === steps.length - 1;
          return (
            <View key={`sc-${index}-${short}`} style={styles.row}>
              <View style={styles.rowLeft}>
                <Text style={styles.timeText} numberOfLines={1}>
                  {timeLabel}
                </Text>
              </View>
              <View style={styles.rowCenter}>
                <View
                  style={[
                    styles.nodeDot,
                    step.type === 'origin' || step.type === 'destination'
                      ? styles.nodeDotLg
                      : null,
                  ]}
                />
                {!isEnd ? <View style={styles.nodeStem} /> : null}
              </View>
              <View style={styles.rowRight}>
                <Text style={styles.nodeName} numberOfLines={2}>
                  {short}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <Text style={styles.footnote}>
        ※ 駅の「列車走行位置」に近い見え方です。位置はポリラインと GPS からの推定であり、誤差があります。
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  empty: { padding: 24 },
  emptyText: { color: WF_TEXT_MUTED, fontSize: 14, lineHeight: 20 },
  banner: {
    backgroundColor: WF_DEST_BG,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: WF_PRIMARY,
  },
  bannerTitle: { color: WF_PRIMARY, fontWeight: '800', fontSize: 13, marginBottom: 4 },
  bannerSub: { color: WF_TEXT, fontSize: 12, lineHeight: 18 },
  schematic: {
    marginTop: 16,
    marginHorizontal: 8,
    position: 'relative',
    paddingVertical: 8,
  },
  truckMarker: {
    position: 'absolute',
    left: 0,
    right: 0,
    marginTop: -22,
    alignItems: 'center',
    zIndex: 4,
  },
  truckBubble: {
    backgroundColor: WF_WHITE,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: WF_PRIMARY,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  truckGlyph: { fontSize: 22 },
  truckCaption: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: '800',
    color: WF_TEXT_MUTED,
  },
  row: {
    flexDirection: 'row',
    minHeight: ROW_MIN,
    alignItems: 'flex-start',
    zIndex: 2,
  },
  rowLeft: {
    width: '26%',
    paddingRight: 4,
    paddingTop: 4,
    alignItems: 'flex-end',
  },
  timeText: { fontSize: 12, fontWeight: '800', color: WF_TEXT },
  rowCenter: { width: 48, alignItems: 'center' },
  nodeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: WF_PRIMARY,
    borderWidth: 2,
    borderColor: WF_TAG_WORK,
    zIndex: 3,
  },
  nodeDotLg: { width: 16, height: 16, borderRadius: 8 },
  nodeStem: {
    width: SPINE_W,
    flex: 1,
    minHeight: ROW_MIN - 16,
    backgroundColor: WF_PRIMARY,
    marginTop: -1,
    marginBottom: -1,
  },
  rowRight: {
    flex: 1,
    minWidth: 0,
    paddingLeft: 8,
    paddingTop: 2,
    justifyContent: 'center',
  },
  nodeName: { fontSize: 15, fontWeight: '800', color: WF_TEXT },
  footnote: {
    marginHorizontal: 16,
    marginTop: 16,
    fontSize: 11,
    color: WF_TEXT_MUTED,
    lineHeight: 16,
  },
});
