import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DrivingTimerPanel } from '../driving-timer/DrivingTimerPanel';
import type { RouteStep } from './navigationApiClient';
import type { RouteProgressView } from './routeProgress';
import { formatHighwayStepTitle } from './routeStepDisplay';
import { formatDurationJa, haversineKm } from './routeSummary';
import {
  WF_BG,
  WF_BORDER,
  WF_CARD,
  WF_PRIMARY,
  WF_TEXT,
  WF_TEXT_MUTED,
  WF_WHITE,
} from './wireframeTheme';

export type HighwayGuidanceShellProps = {
  steps: RouteStep[];
  routeProgress: RouteProgressView | null;
  currentLocation: { lat: number; lng: number } | null;
  distanceMeters: number;
  durationSeconds: number;
  destinationLabel: string;
  isNavigating: boolean;
  insetsTop: number;
  insetsBottom: number;
  onOpenMap: () => void;
  onStopNavigation: () => void;
  error: string | null;
};

function isHighwayMilestone(t: RouteStep['type']): boolean {
  return t === 'ic' || t === 'jct' || t === 'sa' || t === 'pa' || t === 'destination';
}

/** ナビ風の案内レイヤー（Yahoo カーナビ系の情報密度を参考にした Phase1 シェル） */
export function HighwayGuidanceShell({
  steps,
  routeProgress,
  currentLocation,
  distanceMeters,
  durationSeconds,
  destinationLabel,
  isNavigating,
  insetsTop,
  insetsBottom,
  onOpenMap,
  onStopNavigation,
  error,
}: HighwayGuidanceShellProps): React.JSX.Element {
  const legIndex = routeProgress?.legIndex ?? 0;
  const along = routeProgress?.alongRoute01 ?? 0;
  const offRoute = routeProgress?.offRoute ?? !currentLocation;

  const milestones = useMemo(
    () => steps.map((step, index) => ({ step, index })).filter(({ step }) => isHighwayMilestone(step.type)),
    [steps],
  );

  const curDistKm = steps[legIndex]?.distanceFromStartKm ?? 0;
  const curEtaMin = steps[legIndex]?.etaMinutes ?? 0;

  const { upcoming, passed } = useMemo(() => {
    const up: typeof milestones = [];
    const pa: typeof milestones = [];
    for (const m of milestones) {
      if (m.index <= legIndex) pa.push(m);
      else up.push(m);
    }
    up.sort((a, b) => b.step.etaMinutes - a.step.etaMinutes);
    pa.sort((a, b) => a.step.etaMinutes - b.step.etaMinutes);
    return { upcoming: up, passed: pa };
  }, [milestones, legIndex]);

  const distToNextBannerKm = useMemo(() => {
    const toIdx = Math.min(legIndex + 1, steps.length - 1);
    const to = steps[toIdx];
    if (!to || !currentLocation) return null;
    if (Math.abs(to.lat) < 1e-5 && Math.abs(to.lng) < 1e-5) return null;
    return Math.max(0.1, Math.round(haversineKm(currentLocation, to) * 10) / 10);
  }, [steps, legIndex, currentLocation]);

  const remainingKm = Math.max(0, Math.round(((1 - along) * distanceMeters) / 100) / 10);
  const remainSec = Math.max(0, (1 - along) * durationSeconds);
  const etaDate = new Date(Date.now() + remainSec * 1000);
  const etaHm = `${etaDate.getHours()}:${String(etaDate.getMinutes()).padStart(2, '0')}`;
  const goalMin = Math.max(1, Math.round(remainSec / 60));

  const toTitle = routeProgress?.toShort ?? '—';
  const fromTitle = routeProgress?.fromShort ?? '—';

  const bottomBarPad = Math.max(insetsBottom, 12) + 56;

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insetsTop, 8), paddingBottom: bottomBarPad },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {error ? (
          <Text style={styles.errLine}>{error}</Text>
        ) : null}
        <View style={styles.nextBanner}>
          <View style={styles.nextIconBox}>
            <Ionicons name="arrow-up" size={28} color={WF_WHITE} />
          </View>
          <View style={styles.nextBannerTextCol}>
            <Text style={styles.nextPrimary} numberOfLines={1}>
              {toTitle}
            </Text>
            <Text style={styles.nextDist}>
              {distToNextBannerKm != null ? `約 ${distToNextBannerKm} km` : offRoute ? 'ルートから離れています' : '—'}
            </Text>
          </View>
        </View>

        <View style={styles.subBanner}>
          <View style={styles.exitBadge}>
            <Text style={styles.exitBadgeText}>方面</Text>
          </View>
          <Text style={styles.subBannerText} numberOfLines={1}>
            {fromTitle}
          </Text>
        </View>

        <View style={styles.floatRow}>
          <Pressable style={styles.floatChip} onPress={onOpenMap}>
            <Ionicons name="map-outline" size={18} color={WF_TEXT} />
            <Text style={styles.floatChipText}>地図</Text>
          </Pressable>
          <Text style={styles.trafficStub}>交通情報（参考）</Text>
          <View style={styles.speedCircle}>
            <Text style={styles.speedCircleText}>—</Text>
          </View>
        </View>

        <View style={styles.railSection}>
          <Text style={styles.sectionLabel}>この先の高速ポイント</Text>
          <View style={styles.timelineWrap}>
            <View style={styles.railLine} />
            <View style={styles.timelineCol}>
              {upcoming.map(({ step, index }) => {
                const distAhead = Math.max(0, step.distanceFromStartKm - curDistKm);
                const etaAhead = Math.max(0, step.etaMinutes - curEtaMin);
                const title = formatHighwayStepTitle(step.name, step.type);
                return (
                  <View key={`up-${index}-${step.name}`} style={styles.cardRow}>
                    <View style={styles.cardRailDot} />
                    <View style={styles.milestoneCard}>
                      <Text style={styles.milestoneName} numberOfLines={2}>
                        {title}
                      </Text>
                      <View style={styles.milestoneMeta}>
                        <Text style={styles.milestoneMetaText}>{formatDurationJa(etaAhead)}</Text>
                        <Text style={styles.milestoneMetaSep}>·</Text>
                        <Text style={styles.milestoneMetaText}>
                          {Math.round(distAhead * 10) / 10} km
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}

              <View style={styles.hereRow}>
                <View style={[styles.cardRailDot, styles.hereDot]} />
                <Text style={styles.hereLabel}>現在地付近</Text>
              </View>

              {passed
                .slice()
                .reverse()
                .map(({ step, index }) => {
                  const title = formatHighwayStepTitle(step.name, step.type);
                  return (
                    <View key={`pa-${index}-${step.name}`} style={styles.cardRow}>
                      <View style={[styles.cardRailDot, styles.passedDot]} />
                      <View style={[styles.milestoneCard, styles.milestoneCardPassed]}>
                        <View style={styles.passedBadge}>
                          <Text style={styles.passedBadgeText}>通過</Text>
                        </View>
                        <Text style={styles.milestoneNameMuted} numberOfLines={2}>
                          {title}
                        </Text>
                      </View>
                    </View>
                  );
                })}
            </View>
          </View>
        </View>

        <DrivingTimerPanel isNavigating={isNavigating} />

        <Text style={styles.destFoot}>
          目的地：{destinationLabel || '—'}
        </Text>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insetsBottom, 10) }]}>
        <Pressable style={styles.routePill} onPress={onOpenMap}>
          <Text style={styles.routePillText}>経路</Text>
        </Pressable>
        <View style={styles.bottomCenter}>
          <Text style={styles.bottomKm}>{remainingKm} km</Text>
          <Text style={styles.bottomEta}>
            {etaHm}着 · あと{formatDurationJa(goalMin)}
          </Text>
        </View>
        <Pressable style={styles.endBtn} onPress={onStopNavigation}>
          <Text style={styles.endBtnText}>終了</Text>
        </Pressable>
      </View>
    </View>
  );
}

const NAV_GREEN = '#2E7D32';
const RAIL_BLUE = '#64B5F6';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: WF_BG },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 12 },
  errLine: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  nextBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: NAV_GREEN,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  nextIconBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBannerTextCol: { flex: 1, minWidth: 0 },
  nextPrimary: { color: WF_WHITE, fontSize: 20, fontWeight: '900' },
  nextDist: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '700', marginTop: 4 },
  subBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WF_PRIMARY,
    marginTop: 8,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
  },
  exitBadge: {
    backgroundColor: '#1565C0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  exitBadgeText: { color: WF_WHITE, fontSize: 12, fontWeight: '800' },
  subBannerText: { flex: 1, color: WF_WHITE, fontSize: 16, fontWeight: '800' },
  floatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 8,
  },
  floatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: WF_CARD,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: WF_BORDER,
  },
  floatChipText: { color: WF_TEXT, fontSize: 13, fontWeight: '700' },
  trafficStub: { color: WF_TEXT_MUTED, fontSize: 11, fontWeight: '600' },
  speedCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WF_CARD,
  },
  speedCircleText: { color: WF_TEXT, fontSize: 12, fontWeight: '900' },
  railSection: { marginTop: 8 },
  sectionLabel: {
    color: WF_TEXT_MUTED,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 10,
  },
  timelineWrap: { flexDirection: 'row', position: 'relative' },
  railLine: {
    position: 'absolute',
    left: 15,
    top: 8,
    bottom: 8,
    width: 4,
    backgroundColor: RAIL_BLUE,
    borderRadius: 2,
  },
  timelineCol: { flex: 1, paddingLeft: 36 },
  cardRow: { marginBottom: 10, position: 'relative' },
  cardRailDot: {
    position: 'absolute',
    left: -28,
    top: 18,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: WF_CARD,
    borderWidth: 2,
    borderColor: RAIL_BLUE,
  },
  hereRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8, marginBottom: 14 },
  hereDot: {
    left: -28,
    top: 4,
    backgroundColor: '#1565C0',
    borderColor: WF_WHITE,
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  hereLabel: { color: WF_PRIMARY, fontSize: 13, fontWeight: '900' },
  passedDot: { backgroundColor: WF_TEXT_MUTED, borderColor: WF_BORDER },
  milestoneCard: {
    backgroundColor: WF_CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: WF_BORDER,
    padding: 12,
  },
  milestoneCardPassed: { opacity: 0.85 },
  milestoneName: { color: WF_TEXT, fontSize: 16, fontWeight: '800' },
  milestoneNameMuted: { color: WF_TEXT_MUTED, fontSize: 15, fontWeight: '700' },
  milestoneMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 },
  milestoneMetaText: { color: WF_TEXT, fontSize: 14, fontWeight: '700' },
  milestoneMetaSep: { color: WF_TEXT_MUTED },
  passedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: `${WF_PRIMARY}22`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 6,
  },
  passedBadgeText: { color: WF_PRIMARY, fontSize: 11, fontWeight: '800' },
  destFoot: {
    color: WF_TEXT_MUTED,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: WF_CARD,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: WF_BORDER,
    gap: 8,
  },
  routePill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: WF_BORDER,
    backgroundColor: WF_WHITE,
  },
  routePillText: { color: WF_TEXT, fontSize: 14, fontWeight: '800' },
  bottomCenter: { flex: 1, alignItems: 'center', minWidth: 0 },
  bottomKm: { color: WF_TEXT, fontSize: 20, fontWeight: '900' },
  bottomEta: { color: WF_TEXT_MUTED, fontSize: 12, fontWeight: '600', marginTop: 2 },
  endBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#DC2626',
  },
  endBtnText: { color: WF_WHITE, fontSize: 14, fontWeight: '900' },
});
