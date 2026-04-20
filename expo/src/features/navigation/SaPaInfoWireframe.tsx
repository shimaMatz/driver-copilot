import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { RouteStep } from './navigationApiClient';
import { formatHighwayStepTitle } from './routeStepDisplay';
import {
  isSaOrPa,
  nearestStubSaPaPoint,
  stubPointToRouteStep,
} from './saPaStubInfo';
import {
  WF_BG,
  WF_BORDER,
  WF_CARD,
  WF_FACILITY_EV,
  WF_FACILITY_FOOD,
  WF_FACILITY_GAS,
  WF_FACILITY_LODGE,
  WF_FACILITY_SHOP,
  WF_PRIMARY,
  WF_TEXT,
  WF_TEXT_MUTED,
} from './wireframeTheme';

type SaPaSubTab = 'onRoute' | 'favorites' | 'all';

type FacilityBadge = { key: string; label: string; bg: string };

const SUB_TABS: { key: SaPaSubTab; label: string }[] = [
  { key: 'onRoute', label: 'ルート上' },
  { key: 'favorites', label: 'お気に入り' },
  { key: 'all', label: '全SA/PA' },
];

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)));
}

function stubBadges(seed: string): FacilityBadge[] {
  const pool: FacilityBadge[] = [
    { key: 'food', label: '食', bg: WF_FACILITY_FOOD },
    { key: 'gas', label: 'G', bg: WF_FACILITY_GAS },
    { key: 'ev', label: 'EV', bg: WF_FACILITY_EV },
    { key: 'lod', label: '宿', bg: WF_FACILITY_LODGE },
    { key: 'shop', label: '売', bg: WF_FACILITY_SHOP },
  ];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h + seed.charCodeAt(i) * (i + 1)) % 997;
  const n = 3 + (h % 3);
  const out: FacilityBadge[] = [];
  for (let i = 0; i < n; i++) out.push(pool[(h + i * 2) % pool.length]);
  return out;
}

type Props = {
  insetsTop: number;
  insetsBottom: number;
  currentLocation: { lat: number; lng: number } | null;
  routeSteps: RouteStep[];
};

export function SaPaInfoWireframe({
  insetsTop,
  insetsBottom,
  currentLocation,
  routeSteps,
}: Props): React.JSX.Element {
  const [subTab, setSubTab] = useState<SaPaSubTab>('onRoute');

  const saPaSteps = useMemo(() => routeSteps.filter(isSaOrPa), [routeSteps]);

  const { rows, sectionMode } = useMemo(() => {
    if (subTab !== 'onRoute') {
      return { rows: [] as RouteStep[], sectionMode: 'off' as const };
    }
    if (saPaSteps.length > 0) {
      return { rows: saPaSteps, sectionMode: 'route' as const };
    }
    if (currentLocation != null) {
      const p = nearestStubSaPaPoint(currentLocation);
      const km = Math.round(haversineKm(currentLocation, p) * 10) / 10;
      return {
        rows: [stubPointToRouteStep(p, km)],
        sectionMode: 'nearest' as const,
      };
    }
    return { rows: [] as RouteStep[], sectionMode: 'empty' as const };
  }, [subTab, saPaSteps, currentLocation]);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingTop: Math.max(insetsTop, 8), paddingBottom: insetsBottom + 24 },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.subTabRow}>
        {SUB_TABS.map(t => {
          const on = subTab === t.key;
          return (
            <Pressable key={t.key} style={styles.subTabHit} onPress={() => setSubTab(t.key)}>
              <Text style={[styles.subTabText, on && styles.subTabTextOn]}>{t.label}</Text>
              {on ? <View style={styles.subTabUnderline} /> : <View style={styles.subTabUnderlineHidden} />}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.sectionHeadRow}>
        <Text style={styles.zigzag}>〰</Text>
        <Text style={styles.sectionTitle}>
          {sectionMode === 'nearest' ? '最寄りのSA/PA' : 'ルート上のSA/PA'}
        </Text>
      </View>

      {sectionMode === 'nearest' ? (
        <Text style={styles.nearestHint}>
          ルートが未確定のため、現在地からの直線距離で最も近い SA/PA を表示しています。
        </Text>
      ) : null}

      {subTab !== 'onRoute' ? (
        <View style={styles.placeholderCard}>
          <Text style={styles.placeholderText}>
            {subTab === 'favorites'
              ? 'お気に入りの SA/PA は今後のバージョンで表示予定です。'
              : '全 SA/PA 一覧は今後のバージョンで表示予定です。'}
          </Text>
        </View>
      ) : rows.length === 0 ? (
        <View style={styles.placeholderCard}>
          <Text style={styles.placeholderText}>
            位置情報を取得すると、最寄りの SA/PA を表示します。ルート確定後はルート上の SA/PA を表示します。
          </Text>
        </View>
      ) : (
        <View style={styles.timeline}>
          <View style={styles.timelineRail}>
            <View style={styles.timelineDotStart} />
            <View style={styles.timelineDash} />
          </View>
          <View style={styles.timelineBody}>
            <View style={styles.currentLocRow}>
              <Text style={styles.currentLocLabel}>現在地</Text>
            </View>
            {rows.map((step, idx) => {
              const dist =
                currentLocation != null
                  ? Math.max(1, Math.round(haversineKm(currentLocation, step)))
                  : Math.max(1, Math.round(step.distanceFromStartKm * 10) / 10);
              const badges = stubBadges(step.name);
              return (
                <View key={`${step.name}-${idx}`} style={styles.timelineItem}>
                  <View style={styles.timelineNumberCol}>
                    <View style={styles.timelineNumberCircle}>
                      <Text style={styles.timelineNumber}>{idx + 1}</Text>
                    </View>
                    {idx < rows.length - 1 ? <View style={styles.timelineDashSmall} /> : null}
                  </View>
                  <View style={styles.saCard}>
                    <View style={styles.saCardTop}>
                      <Text style={styles.saName} numberOfLines={1}>
                        {formatHighwayStepTitle(step.name, step.type)}
                      </Text>
                      <Text style={styles.saDist}>{dist}km</Text>
                    </View>
                    <View style={styles.badgeRow}>
                      {badges.map(b => (
                        <View key={b.key} style={[styles.facilityBadge, { backgroundColor: b.bg }]}>
                          <Text style={styles.facilityBadgeTxt}>{b.label}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: WF_BG },
  scrollContent: { paddingHorizontal: 16 },
  subTabRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  subTabHit: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  subTabText: { color: WF_TEXT_MUTED, fontSize: 15, fontWeight: '700' },
  subTabTextOn: { color: WF_TEXT },
  subTabUnderline: {
    marginTop: 6,
    height: 3,
    width: 48,
    backgroundColor: WF_PRIMARY,
    borderRadius: 2,
  },
  subTabUnderlineHidden: { marginTop: 6, height: 3, width: 48 },
  sectionHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  zigzag: { color: WF_PRIMARY, fontSize: 18, fontWeight: '800' },
  sectionTitle: { color: WF_TEXT, fontSize: 17, fontWeight: '800' },
  nearestHint: {
    color: WF_TEXT_MUTED,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
    marginBottom: 12,
  },
  placeholderCard: {
    backgroundColor: WF_CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: WF_BORDER,
    padding: 20,
  },
  placeholderText: { color: WF_TEXT_MUTED, fontSize: 14, lineHeight: 22 },
  timeline: { flexDirection: 'row', alignItems: 'flex-start' },
  timelineRail: { width: 24, alignItems: 'center', marginRight: 4 },
  timelineDotStart: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: WF_PRIMARY,
  },
  timelineDash: {
    width: 2,
    flex: 1,
    minHeight: 40,
    borderLeftWidth: 2,
    borderStyle: 'dashed',
    borderColor: WF_TEXT_MUTED,
    marginVertical: 4,
    opacity: 0.5,
  },
  timelineBody: { flex: 1, minWidth: 0 },
  currentLocRow: { marginBottom: 12, paddingLeft: 4 },
  currentLocLabel: { color: WF_PRIMARY, fontSize: 14, fontWeight: '800' },
  timelineItem: { flexDirection: 'row', marginBottom: 12 },
  timelineNumberCol: { width: 28, alignItems: 'center', marginRight: 8 },
  timelineNumberCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: WF_TEXT,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WF_CARD,
  },
  timelineNumber: { fontSize: 11, fontWeight: '900', color: WF_TEXT },
  timelineDashSmall: {
    width: 2,
    flex: 1,
    minHeight: 16,
    borderLeftWidth: 2,
    borderStyle: 'dashed',
    borderColor: WF_TEXT_MUTED,
    marginTop: 4,
    opacity: 0.5,
  },
  saCard: {
    flex: 1,
    backgroundColor: WF_CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: WF_BORDER,
    padding: 12,
    minWidth: 0,
  },
  saCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  saName: { flex: 1, color: WF_TEXT, fontSize: 16, fontWeight: '800' },
  saDist: { color: WF_TEXT_MUTED, fontSize: 14, fontWeight: '700' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  facilityBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  facilityBadgeTxt: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
});
