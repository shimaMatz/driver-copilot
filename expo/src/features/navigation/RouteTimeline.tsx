import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { RouteStep } from './navigationApiClient';
import { formatDurationJa } from './routeSummary';
import {
  WF_BORDER,
  WF_CARD,
  WF_ERROR,
  WF_LINE_CYAN,
  WF_PRIMARY,
  WF_PRIMARY_FADE,
  WF_PRIMARY_FADE_STRONG,
  WF_TEXT,
  WF_TEXT_MUTED,
  WF_WHITE,
} from './wireframeTheme';

interface Props {
  steps: RouteStep[];
  /** 現在地から最も近いステップの index（ナビ中のハイライト用） */
  currentStepIndex?: number;
}

function stepTypeLabel(type: RouteStep['type']): string | null {
  switch (type) {
    case 'origin': return '出発';
    case 'destination': return '到着';
    case 'ic': return 'IC';
    case 'sa': return 'SA';
    case 'pa': return 'PA';
    case 'jct': return 'JCT';
    default: return null;
  }
}

function stepTypeIcon(type: RouteStep['type']): string {
  switch (type) {
    case 'origin': return '\u25C9';  // ◉
    case 'destination': return '\u25C9';
    case 'sa': return 'P';
    case 'pa': return 'P';
    case 'jct': return '\u25CB';  // ○
    case 'ic': return '\u25CF';  // ●
    default: return '\u25CF';  // ●
  }
}

export function RouteTimeline({ steps, currentStepIndex }: Props): React.JSX.Element {
  if (steps.length === 0) {
    return (
      <View style={s.emptyWrap}>
        <Text style={s.emptyText}>ルート情報がありません</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>ルート案内</Text>
        <Text style={s.headerSub}>
          {steps.length > 1
            ? `${steps[0].name} → ${steps[steps.length - 1].name}`
            : ''}
        </Text>
      </View>
      <ScrollView
        style={s.scrollArea}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        {steps.map((step, i) => {
          const isFirst = i === 0;
          const isLast = i === steps.length - 1;
          const isCurrent = currentStepIndex === i;
          const isPassed = currentStepIndex !== undefined && i < currentStepIndex;
          const isTerminal = step.type === 'origin' || step.type === 'destination';
          const label = stepTypeLabel(step.type);
          const nextStep = steps[i + 1];
          const segmentDistKm = nextStep
            ? Math.round((nextStep.distanceFromStartKm - step.distanceFromStartKm) * 10) / 10
            : null;
          const segmentMin = nextStep
            ? nextStep.etaMinutes - step.etaMinutes
            : null;

          return (
            <View key={`${step.name}-${i}`} style={s.row}>
              {/* 左: タイムラインレール */}
              <View style={s.rail}>
                {/* 上半分の線 */}
                {!isFirst && (
                  <View
                    style={[
                      s.lineTop,
                      isPassed ? s.linePassed : s.lineUpcoming,
                    ]}
                  />
                )}
                {/* ドット */}
                <View
                  style={[
                    isTerminal ? s.dotTerminal : s.dot,
                    isCurrent && s.dotCurrent,
                    isPassed && s.dotPassed,
                  ]}
                >
                  <Text
                    style={[
                      isTerminal ? s.dotTerminalText : s.dotText,
                      isCurrent && s.dotCurrentText,
                      isPassed && s.dotPassedText,
                    ]}
                  >
                    {stepTypeIcon(step.type)}
                  </Text>
                </View>
                {/* 下半分の線 */}
                {!isLast && (
                  <View
                    style={[
                      s.lineBottom,
                      isPassed ? s.linePassed : s.lineUpcoming,
                      step.isToll && s.lineToll,
                    ]}
                  />
                )}
              </View>

              {/* 右: 駅情報 */}
              <View style={[s.info, isCurrent && s.infoCurrent]}>
                <View style={s.nameRow}>
                  <Text
                    style={[
                      s.stepName,
                      isTerminal && s.stepNameTerminal,
                      isCurrent && s.stepNameCurrent,
                      isPassed && s.stepNamePassed,
                    ]}
                    numberOfLines={1}
                  >
                    {step.name}
                  </Text>
                  {label && (
                    <View
                      style={[
                        s.badge,
                        step.type === 'sa' && s.badgeSa,
                        step.type === 'jct' && s.badgeJct,
                        isTerminal && s.badgeTerminal,
                      ]}
                    >
                      <Text style={s.badgeText}>{label}</Text>
                    </View>
                  )}
                  {step.isToll && !isTerminal && (
                    <View style={s.tollBadge}>
                      <Text style={s.tollBadgeText}>有料</Text>
                    </View>
                  )}
                </View>
                <View style={s.metaRow}>
                  {step.etaMinutes > 0 && (
                    <Text style={[s.meta, isPassed && s.metaPassed]}>
                      {formatDurationJa(step.etaMinutes)}
                    </Text>
                  )}
                  {step.distanceFromStartKm > 0 && (
                    <Text style={[s.meta, isPassed && s.metaPassed]}>
                      {step.distanceFromStartKm} km
                    </Text>
                  )}
                </View>
                {/* 次のステップまでの区間情報 */}
                {segmentDistKm !== null && segmentMin !== null && !isLast && (
                  <View style={s.segmentInfo}>
                    <View style={s.segmentLine} />
                    <Text style={s.segmentText}>
                      {segmentDistKm} km / 約{segmentMin}分
                    </Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const RAIL_WIDTH = 40;
const DOT_SIZE = 14;
const DOT_TERMINAL_SIZE = 22;

const s = StyleSheet.create({
  container: {
    backgroundColor: WF_CARD,
    borderRadius: 16,
    marginHorizontal: 12,
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: WF_BORDER,
  },
  header: {
    backgroundColor: WF_CARD,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: WF_BORDER,
  },
  headerTitle: {
    color: WF_TEXT,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  headerSub: {
    color: WF_TEXT_MUTED,
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  scrollArea: {
    maxHeight: 340,
  },
  scrollContent: {
    paddingVertical: 8,
    paddingRight: 16,
  },
  emptyWrap: {
    backgroundColor: WF_CARD,
    borderRadius: 16,
    marginHorizontal: 12,
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: WF_TEXT_MUTED,
    fontSize: 13,
  },

  // --- 行 ---
  row: {
    flexDirection: 'row',
    minHeight: 52,
  },

  // --- レール ---
  rail: {
    width: RAIL_WIDTH,
    alignItems: 'center',
    position: 'relative',
  },
  lineTop: {
    position: 'absolute',
    top: 0,
    width: 3,
    height: '50%',
    borderRadius: 1.5,
  },
  lineBottom: {
    position: 'absolute',
    bottom: 0,
    width: 3,
    height: '50%',
    borderRadius: 1.5,
  },
  lineUpcoming: {
    backgroundColor: WF_PRIMARY,
  },
  linePassed: {
    backgroundColor: WF_BORDER,
  },
  lineToll: {
    backgroundColor: WF_PRIMARY,
  },

  // --- ドット ---
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: WF_CARD,
    borderWidth: 3,
    borderColor: WF_PRIMARY,
    position: 'absolute',
    top: '50%',
    marginTop: -DOT_SIZE / 2,
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotTerminal: {
    width: DOT_TERMINAL_SIZE,
    height: DOT_TERMINAL_SIZE,
    borderRadius: DOT_TERMINAL_SIZE / 2,
    backgroundColor: WF_PRIMARY,
    position: 'absolute',
    top: '50%',
    marginTop: -DOT_TERMINAL_SIZE / 2,
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotCurrent: {
    borderColor: WF_ERROR,
    backgroundColor: WF_ERROR,
  },
  dotPassed: {
    borderColor: WF_BORDER,
    backgroundColor: WF_BORDER,
  },
  dotText: {
    fontSize: 6,
    color: WF_PRIMARY,
    fontWeight: '900',
  },
  dotTerminalText: {
    fontSize: 10,
    color: WF_WHITE,
    fontWeight: '900',
  },
  dotCurrentText: {
    color: WF_WHITE,
  },
  dotPassedText: {
    color: WF_WHITE,
  },

  // --- 情報エリア ---
  info: {
    flex: 1,
    paddingVertical: 8,
    paddingLeft: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: WF_BORDER,
  },
  infoCurrent: {
    backgroundColor: 'rgba(227, 89, 110, 0.06)',
    borderRadius: 8,
    marginRight: -8,
    paddingRight: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepName: {
    color: WF_TEXT,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
    flex: 1,
  },
  stepNameTerminal: {
    fontWeight: '800',
    fontSize: 15,
  },
  stepNameCurrent: {
    color: WF_ERROR,
    fontWeight: '800',
  },
  stepNamePassed: {
    color: WF_TEXT_MUTED,
  },

  // --- バッジ ---
  badge: {
    backgroundColor: WF_PRIMARY,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeSa: {
    backgroundColor: WF_LINE_CYAN,
  },
  badgeJct: {
    backgroundColor: WF_TEXT_MUTED,
  },
  badgeTerminal: {
    backgroundColor: WF_PRIMARY,
  },
  badgeText: {
    color: WF_WHITE,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  tollBadge: {
    backgroundColor: WF_PRIMARY_FADE,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: WF_PRIMARY_FADE_STRONG,
  },
  tollBadgeText: {
    color: WF_PRIMARY,
    fontSize: 9,
    fontWeight: '700',
  },

  // --- メタ情報 ---
  metaRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 2,
  },
  meta: {
    color: WF_TEXT_MUTED,
    fontSize: 11,
    fontWeight: '500',
  },
  metaPassed: {
    color: WF_BORDER,
  },

  // --- 区間情報 ---
  segmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  segmentLine: {
    width: 16,
    height: 1,
    backgroundColor: WF_BORDER,
  },
  segmentText: {
    color: WF_TEXT_MUTED,
    fontSize: 10,
    fontWeight: '500',
  },
});
