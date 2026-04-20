import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useDrivingTimer } from './useDrivingTimer';
import {
  WF_BORDER,
  WF_CARD,
  WF_ERROR,
  WF_LINE_CYAN,
  WF_PRIMARY,
  WF_SECTION_BG,
  WF_TEXT,
  WF_TEXT_MUTED,
} from '../navigation/wireframeTheme';

interface Props {
  isNavigating: boolean;
  onRemainingSecondsChange?: (seconds: number) => void;
}

export function DrivingTimerPanel({ isNavigating, onRemainingSecondsChange }: Props): React.JSX.Element {
  const {
    status,
    displayContinuousDrivingSeconds,
    displayCumulativeRestSeconds,
    displayRemainingBeforeViolationSeconds,
    formatDuration,
    startDriving,
    startRest,
    reset,
  } = useDrivingTimer();

  useEffect(() => {
    onRemainingSecondsChange?.(displayRemainingBeforeViolationSeconds);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayRemainingBeforeViolationSeconds]);

  useEffect(() => {
    if (isNavigating) {
      startDriving();
    } else {
      startRest();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNavigating]);

  const isNearLimit = displayRemainingBeforeViolationSeconds <= 30 * 60;

  return (
    <View style={[styles.wrap, isNearLimit && styles.wrapWarn]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>430ステータス</Text>
        <Text style={styles.hint}>5分単位で更新</Text>
      </View>
      <View style={styles.row}>
        <View style={styles.cell}>
          <Text style={styles.label}>連続運転</Text>
          <Text style={styles.value}>{formatDuration(displayContinuousDrivingSeconds)}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.label}>累積休憩</Text>
          <Text style={styles.value}>{formatDuration(displayCumulativeRestSeconds)}</Text>
        </View>
        <View style={[styles.cell, styles.cellHighlight]}>
          <Text style={styles.label}>休憩まであと</Text>
          <Text style={[styles.valueHighlight, isNearLimit && styles.warn]}>
            {formatDuration(displayRemainingBeforeViolationSeconds)}
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <Pressable
          style={[styles.btn, status === 'driving' && styles.btnDriving]}
          onPress={startDriving}
        >
          <Text style={styles.btnText}>運転中</Text>
        </Pressable>
        <Pressable
          style={[styles.btn, status === 'resting' && styles.btnResting]}
          onPress={startRest}
        >
          <Text style={styles.btnText}>休憩中</Text>
        </Pressable>
        <Pressable style={styles.btnReset} onPress={reset}>
          <Text style={styles.btnResetText}>リセット</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: WF_CARD,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: WF_BORDER,
  },
  wrapWarn: {
    borderColor: WF_ERROR,
    backgroundColor: 'rgba(227, 89, 110, 0.06)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitle: { color: WF_TEXT, fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },
  hint: { color: WF_TEXT_MUTED, fontSize: 10 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  cell: { flex: 1 },
  cellHighlight: {
    backgroundColor: WF_SECTION_BG,
    borderRadius: 8,
    padding: 6,
  },
  label: { color: WF_TEXT_MUTED, fontSize: 10, fontWeight: '700', marginBottom: 4 },
  value: { color: WF_TEXT, fontSize: 15, fontWeight: '800' },
  valueHighlight: { color: WF_TEXT, fontSize: 17, fontWeight: '900' },
  warn: { color: WF_ERROR },
  actions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  btn: {
    flex: 1,
    backgroundColor: WF_SECTION_BG,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: WF_BORDER,
  },
  btnDriving: { borderColor: WF_LINE_CYAN, backgroundColor: 'rgba(29, 158, 191, 0.08)' },
  btnResting: { borderColor: WF_PRIMARY, backgroundColor: 'rgba(74, 119, 60, 0.1)' },
  btnText: { color: WF_TEXT, fontWeight: '800', fontSize: 12, letterSpacing: 0.3 },
  btnReset: { paddingHorizontal: 10, paddingVertical: 9 },
  btnResetText: { color: WF_TEXT_MUTED, fontSize: 12, fontWeight: '700' },
});
