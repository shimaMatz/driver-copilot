import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useDrivingTimer } from './useDrivingTimer';

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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E4E4EA',
  },
  wrapWarn: {
    borderColor: '#E3596E',
    backgroundColor: 'rgba(227, 89, 110, 0.06)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitle: { color: '#34525F', fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },
  hint: { color: '#9CA3AF', fontSize: 10 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  cell: { flex: 1 },
  cellHighlight: {
    backgroundColor: '#EFEFF4',
    borderRadius: 8,
    padding: 6,
  },
  label: { color: '#9CA3AF', fontSize: 10, fontWeight: '700', marginBottom: 4 },
  value: { color: '#34525F', fontSize: 15, fontWeight: '800' },
  valueHighlight: { color: '#34525F', fontSize: 17, fontWeight: '900' },
  warn: { color: '#E3596E' },
  actions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  btn: {
    flex: 1,
    backgroundColor: '#EFEFF4',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E4E4EA',
  },
  btnDriving: { borderColor: '#1D9EBF', backgroundColor: 'rgba(29, 158, 191, 0.08)' },
  btnResting: { borderColor: '#35A86E', backgroundColor: 'rgba(53, 168, 110, 0.08)' },
  btnText: { color: '#34525F', fontWeight: '800', fontSize: 12, letterSpacing: 0.3 },
  btnReset: { paddingHorizontal: 10, paddingVertical: 9 },
  btnResetText: { color: '#9CA3AF', fontSize: 12, fontWeight: '700' },
});
