import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { DirectionsRoute, RouteStep } from './navigationApiClient';
import { formatDurationJa } from './routeSummary';
import {
  TD_ACCENT,
  TD_BG,
  TD_LINE_BLUE,
  TD_SURFACE_ELEV,
  TD_TEXT,
  TD_TEXT_MUTED,
} from './transitDarkTheme';

export type ProposalFilterTab = 'all' | 'fast' | 'easy' | 'cheap';

export type ProposalColumnModel = {
  id: 'toll' | 'general';
  title: string;
  route: DirectionsRoute | null;
  durationMin: number;
  fareYen: number | null;
  badges: Array<'安' | '楽' | '早'>;
};

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function addMinutesBaseHm(base: Date, addMin: number): string {
  const d = new Date(base.getTime() + addMin * 60_000);
  return `${d.getHours()}:${pad2(d.getMinutes())}`;
}

function countTransfers(steps: RouteStep[]): number {
  return Math.max(0, steps.filter(s => s.type === 'jct' || s.type === 'ic').length);
}

function pickDisplaySteps(steps: RouteStep[], max: number): RouteStep[] {
  if (steps.length <= max) return steps;
  const head = steps.slice(0, 2);
  const tail = steps.slice(-2);
  const merged = [...head, ...tail];
  return merged.filter((s, i, a) => a.findIndex(x => x === s) === i);
}

const BADGE_PALETTE: Array<{ bg: string; fg: string }> = [
  { bg: '#F5D000', fg: '#111' },
  { bg: '#0A84FF', fg: '#fff' },
  { bg: '#BF5AF2', fg: '#fff' },
  { bg: '#34C759', fg: '#111' },
];

function abbrForStep(step: RouteStep, index: number): string {
  const raw = step.name.replace(/\s+/g, '').slice(0, 2);
  if (raw.length >= 2) return raw.toUpperCase();
  const fallbacks = ['A', 'B', 'C', 'D', 'E'];
  return fallbacks[index % fallbacks.length] ?? 'IC';
}

function ProposalCapsuleColumn({
  column,
  onPress,
  departureBase,
}: {
  column: ProposalColumnModel;
  onPress: () => void;
  departureBase: Date;
}): React.JSX.Element | null {
  const route = column.route;
  if (!route) return null;
  const steps = route.steps;
  const displaySteps = pickDisplaySteps(steps, 5);
  const transfers = countTransfers(steps);
  const dur = column.durationMin;
  const topArrival = addMinutesBaseHm(departureBase, dur);
  const footArrival = addMinutesBaseHm(departureBase, dur + 8);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.colWrap, pressed && styles.colPressed]}
      accessibilityRole="button"
      accessibilityLabel={`${column.title}の経路を選択`}
    >
      <Text style={styles.colDurTop}>{formatDurationJa(dur)}</Text>
      <Text style={styles.colArriveTop}>{topArrival}</Text>
      <View style={styles.pill}>
        <View style={styles.startBadge}>
          <Text style={styles.startBadgeText}>始</Text>
        </View>
        <View style={styles.pillInner}>
          {displaySteps.map((step, i) => {
            const pal = BADGE_PALETTE[i % BADGE_PALETTE.length];
            const isLast = i === displaySteps.length - 1;
            return (
              <View key={`${step.name}-${i}`}>
                <View style={styles.stepLineRow}>
                  <View style={[styles.lineBadge, { backgroundColor: pal.bg }]}>
                    <Text style={[styles.lineBadgeText, { color: pal.fg }]}>
                      {abbrForStep(step, i)}
                    </Text>
                  </View>
                  <Text style={styles.stationName} numberOfLines={2}>
                    {step.name}
                  </Text>
                </View>
                {!isLast ? (
                  <View
                    style={[
                      styles.connector,
                      { backgroundColor: step.isToll ? TD_ACCENT : TD_LINE_BLUE },
                    ]}
                  />
                ) : null}
              </View>
            );
          })}
        </View>
        <View style={styles.transferChip}>
          <Text style={styles.transferChipText}>乗換 {transfers}回</Text>
        </View>
      </View>
      <Text style={styles.footTime}>{footArrival}</Text>
      <Text style={styles.footFare}>
        {column.fareYen != null && column.fareYen > 0
          ? `${column.fareYen.toLocaleString('ja-JP')}円`
          : '通行料は無料寄り'}
      </Text>
      <View style={styles.badgeRow}>
        {column.badges.includes('安') ? (
          <View style={[styles.roundBadge, { backgroundColor: '#FF9F0A' }]}>
            <Text style={styles.roundBadgeText}>安</Text>
          </View>
        ) : null}
        {column.badges.includes('楽') ? (
          <View style={[styles.roundBadge, { backgroundColor: TD_ACCENT }]}>
            <Text style={[styles.roundBadgeText, { color: '#000' }]}>楽</Text>
          </View>
        ) : null}
        {column.badges.includes('早') ? (
          <View style={[styles.roundBadge, { backgroundColor: TD_LINE_BLUE }]}>
            <Text style={styles.roundBadgeText}>早</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const FILTER_ITEMS: { key: ProposalFilterTab; label: string }[] = [
  { key: 'all', label: 'すべて' },
  { key: 'fast', label: '早' },
  { key: 'easy', label: '楽' },
  { key: 'cheap', label: '安' },
];

export function RouteProposalView({
  originLabel,
  destLabel,
  departureLine,
  columns,
  filter,
  onFilterChange,
  onSelectColumn,
  onBack,
  paddingTop,
  paddingBottom,
}: {
  originLabel: string;
  destLabel: string;
  departureLine: string;
  columns: ProposalColumnModel[];
  filter: ProposalFilterTab;
  onFilterChange: (f: ProposalFilterTab) => void;
  onSelectColumn: (id: 'toll' | 'general') => void;
  onBack: () => void;
  paddingTop: number;
  paddingBottom: number;
}): React.JSX.Element {
  const departureBase = useMemo(() => new Date(), []);
  const withRoutes = columns.filter(c => c.route);

  return (
    <View style={[styles.root, { paddingTop, paddingBottom }]}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={onBack}
          hitSlop={14}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="戻る"
        >
          <Text style={styles.backGlyph}>‹</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerRoute} numberOfLines={1}>
            {originLabel} → {destLabel}
          </Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {departureLine}
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.hScroll}
      >
        {withRoutes.map(c => (
          <ProposalCapsuleColumn
            key={c.id}
            column={c}
            departureBase={departureBase}
            onPress={() => onSelectColumn(c.id)}
          />
        ))}
      </ScrollView>

      <View style={styles.filterBar}>
        {FILTER_ITEMS.map(it => {
          const on = filter === it.key;
          return (
            <Pressable
              key={it.key}
              onPress={() => onFilterChange(it.key)}
              style={styles.filterItem}
            >
              <Text style={[styles.filterLabel, on && styles.filterLabelOn]}>
                {it.label}
              </Text>
              {on ? <View style={styles.filterUnderline} /> : <View style={styles.filterUnderlineHidden} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: TD_BG },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingBottom: 10,
  },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  backGlyph: { color: TD_TEXT, fontSize: 36, fontWeight: '300', marginTop: -6 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerRoute: { color: TD_TEXT, fontSize: 17, fontWeight: '800' },
  headerSub: { color: TD_TEXT_MUTED, fontSize: 12, marginTop: 4, fontWeight: '600' },
  headerSpacer: { width: 44 },
  hScroll: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 16,
    alignItems: 'flex-start',
  },
  colWrap: {
    width: 118,
    marginRight: 12,
  },
  colPressed: { opacity: 0.88 },
  colDurTop: {
    color: TD_TEXT,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  colArriveTop: {
    color: TD_TEXT,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 2,
  },
  pill: {
    marginTop: 10,
    backgroundColor: TD_SURFACE_ELEV,
    borderRadius: 14,
    paddingTop: 10,
    paddingBottom: 12,
    paddingHorizontal: 8,
    minHeight: 260,
  },
  startBadge: {
    alignSelf: 'flex-start',
    backgroundColor: TD_LINE_BLUE,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginBottom: 8,
  },
  startBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  pillInner: { flex: 1 },
  stepLineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  lineBadge: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineBadgeText: { fontSize: 11, fontWeight: '900' },
  stationName: {
    flex: 1,
    color: TD_TEXT,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
    paddingTop: 4,
  },
  connector: {
    width: 3,
    height: 12,
    borderRadius: 2,
    marginLeft: 12,
    marginTop: 2,
    marginBottom: 4,
  },
  transferChip: {
    alignSelf: 'center',
    marginTop: 8,
    backgroundColor: '#3A3A3C',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  transferChipText: { color: TD_TEXT_MUTED, fontSize: 11, fontWeight: '700' },
  footTime: {
    color: TD_TEXT,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 10,
  },
  footFare: {
    color: TD_TEXT_MUTED,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  roundBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundBadgeText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#3A3A3C',
    backgroundColor: TD_BG,
  },
  filterItem: { alignItems: 'center', minWidth: 56 },
  filterLabel: { color: TD_TEXT_MUTED, fontSize: 13, fontWeight: '700' },
  filterLabelOn: { color: TD_ACCENT },
  filterUnderline: {
    marginTop: 6,
    height: 3,
    width: 28,
    borderRadius: 2,
    backgroundColor: TD_ACCENT,
  },
  filterUnderlineHidden: { marginTop: 6, height: 3, width: 28 },
});
