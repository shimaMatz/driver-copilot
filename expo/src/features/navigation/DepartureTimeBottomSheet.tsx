import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  TD_ACCENT,
  TD_BG,
  TD_SURFACE,
  TD_SURFACE_ELEV,
  TD_TEXT,
  TD_TEXT_MUTED,
} from './transitDarkTheme';

export type DepartureTripKind = 'departure' | 'arrival';

type Props = {
  visible: boolean;
  value: Date;
  onClose: () => void;
  onConfirm: (next: Date, kind: DepartureTripKind) => void;
};

const ITEM_H = 36;
const VISIBLE_ROWS = 5;
const PICKER_H = ITEM_H * VISIBLE_ROWS;
const PAD_Y = (PICKER_H - ITEM_H) / 2;

const SEGMENTS: { key: DepartureTripKind; label: string }[] = [
  { key: 'departure', label: '出発' },
  { key: 'arrival', label: '到着' },
];

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function partsFromDate(selected: Date): { dayOffset: number; hour: number; minute: number } {
  const today0 = startOfLocalDay(new Date());
  const sel0 = startOfLocalDay(selected);
  let dayOffset = Math.round((sel0.getTime() - today0.getTime()) / 86400000);
  dayOffset = Math.max(0, Math.min(29, dayOffset));
  return {
    dayOffset,
    hour: selected.getHours(),
    minute: selected.getMinutes(),
  };
}

function dateFromParts(dayOffset: number, hour: number, minute: number): Date {
  const d = startOfLocalDay(new Date());
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function buildDayLabels(): string[] {
  const labels: string[] = [];
  for (let i = 0; i < 30; i += 1) {
    if (i === 0) {
      labels.push('今日');
      continue;
    }
    const d = startOfLocalDay(new Date());
    d.setDate(d.getDate() + i);
    const mo = d.getMonth() + 1;
    const day = d.getDate();
    const wk = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()] ?? '日';
    labels.push(`${mo}月${day}日 ${wk}`);
  }
  return labels;
}

const DAY_LABELS = buildDayLabels();
const HOUR_LABELS = Array.from({ length: 24 }, (_, h) => String(h));
const MINUTE_LABELS = Array.from({ length: 60 }, (_, m) => (m < 10 ? `0${m}` : String(m)));

type WheelProps = {
  labels: string[];
  selectedIndex: number;
  onSelectIndex: (i: number) => void;
  scrollRef: React.RefObject<ScrollView | null>;
};

function WheelColumn({ labels, selectedIndex, onSelectIndex, scrollRef }: WheelProps): React.JSX.Element {
  const onMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      const idx = Math.round(Math.max(0, Math.min(labels.length - 1, y / ITEM_H)));
      onSelectIndex(idx);
    },
    [labels.length, onSelectIndex],
  );

  return (
    <View style={wheelStyles.wrap}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        nestedScrollEnabled
        contentContainerStyle={{ paddingVertical: PAD_Y }}
        onMomentumScrollEnd={onMomentumEnd}
        scrollEventThrottle={16}
      >
        {labels.map((label, i) => (
          <View key={`${label}-${i}`} style={wheelStyles.cell}>
            <Text
              style={[wheelStyles.cellText, i === selectedIndex ? wheelStyles.cellTextActive : null]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </View>
        ))}
      </ScrollView>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={[wheelStyles.shade, { height: ITEM_H * 2 }]} />
        <View style={{ height: ITEM_H }} />
        <View style={[wheelStyles.shade, { height: ITEM_H * 2 }]} />
      </View>
    </View>
  );
}

const wheelStyles = StyleSheet.create({
  wrap: {
    flex: 1,
    height: PICKER_H,
    position: 'relative',
  },
  cell: {
    height: ITEM_H,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cellText: {
    color: TD_TEXT_MUTED,
    fontSize: 15,
    fontWeight: '600',
  },
  cellTextActive: {
    color: TD_TEXT,
    fontSize: 17,
    fontWeight: '800',
  },
  shade: {
    backgroundColor: 'rgba(28,28,30,0.82)',
  },
});

export function DepartureTimeBottomSheet({
  visible,
  value,
  onClose,
  onConfirm,
}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const sheetHeight = Math.max(380, Math.round(windowHeight * 0.62));

  const translateY = useRef(new Animated.Value(0)).current;
  const dayRef = useRef<ScrollView>(null);
  const hourRef = useRef<ScrollView>(null);
  const minuteRef = useRef<ScrollView>(null);

  const [tripKind, setTripKind] = useState<DepartureTripKind>('departure');
  const [dayOffset, setDayOffset] = useState(0);
  const [hour, setHour] = useState(0);
  const [minute, setMinute] = useState(0);

  const scrollToParts = useCallback((dOff: number, h: number, m: number, animated: boolean) => {
    dayRef.current?.scrollTo({ y: dOff * ITEM_H, animated });
    hourRef.current?.scrollTo({ y: h * ITEM_H, animated });
    minuteRef.current?.scrollTo({ y: m * ITEM_H, animated });
  }, []);

  useLayoutEffect(() => {
    if (!visible) return;
    translateY.setValue(0);
    const p = partsFromDate(value);
    setTripKind('departure');
    setDayOffset(p.dayOffset);
    setHour(p.hour);
    setMinute(p.minute);
    requestAnimationFrame(() => {
      scrollToParts(p.dayOffset, p.hour, p.minute, false);
    });
  }, [visible, value, translateY, scrollToParts]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dy) > 4,
        onMoveShouldSetPanResponderCapture: (_e, g) =>
          Math.abs(g.dy) > 4 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderMove: (_e, g) => {
          if (g.dy > 0) translateY.setValue(g.dy);
        },
        onPanResponderRelease: (_e, g) => {
          if (g.dy > 120 || g.vy > 0.6) {
            Animated.timing(translateY, {
              toValue: sheetHeight,
              duration: 180,
              useNativeDriver: true,
            }).start(() => {
              translateY.setValue(0);
              onClose();
            });
          } else {
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
          }
        },
        onPanResponderTerminate: () => {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        },
      }),
    [sheetHeight, translateY, onClose],
  );

  const applyFullDate = useCallback(
    (d: Date) => {
      const p = partsFromDate(d);
      setDayOffset(p.dayOffset);
      setHour(p.hour);
      setMinute(p.minute);
      requestAnimationFrame(() => {
        scrollToParts(p.dayOffset, p.hour, p.minute, true);
      });
    },
    [scrollToParts],
  );

  const shiftMinutes = useCallback(
    (delta: number) => {
      const base = dateFromParts(dayOffset, hour, minute);
      base.setMinutes(base.getMinutes() + delta);
      applyFullDate(base);
    },
    [dayOffset, hour, minute, applyFullDate],
  );

  const handleConfirm = useCallback(() => {
    onConfirm(dateFromParts(dayOffset, hour, minute), tripKind);
  }, [dayOffset, hour, minute, tripKind, onConfirm]);

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : undefined}
      statusBarTranslucent={Platform.OS === 'android'}
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <Animated.View
          style={[
            styles.sheet,
            {
              height: sheetHeight,
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) }]} {...panResponder.panHandlers}>
            <View style={styles.headerSpacer} />
            <View style={styles.headerCenter}>
              <View style={styles.handle} />
            </View>
            <View style={[styles.headerSpacer, styles.headerSpacerEnd]}>
              <Pressable
                onPress={onClose}
                style={styles.closeBtn}
                accessibilityRole="button"
                accessibilityLabel="閉じる"
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </Pressable>
            </View>
          </View>

          <View style={[styles.body, { paddingBottom: Math.max(insets.bottom, 14) }]}>
            <View style={styles.segmentBar}>
              {SEGMENTS.map(seg => {
                const active = tripKind === seg.key;
                return (
                  <Pressable
                    key={seg.key}
                    onPress={() => setTripKind(seg.key)}
                    style={[styles.segment, active && styles.segmentActive]}
                  >
                    <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{seg.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.pickerRow}>
              <WheelColumn
                labels={DAY_LABELS}
                selectedIndex={dayOffset}
                onSelectIndex={setDayOffset}
                scrollRef={dayRef}
              />
              <WheelColumn
                labels={HOUR_LABELS}
                selectedIndex={hour}
                onSelectIndex={setHour}
                scrollRef={hourRef}
              />
              <WheelColumn
                labels={MINUTE_LABELS}
                selectedIndex={minute}
                onSelectIndex={setMinute}
                scrollRef={minuteRef}
              />
            </View>

            <View style={styles.quickRow}>
              <Pressable onPress={() => shiftMinutes(-5)} hitSlop={6}>
                <Text style={styles.quickLink}>{'< 5分前'}</Text>
              </Pressable>
              <Pressable onPress={() => applyFullDate(new Date())} hitSlop={6}>
                <Text style={styles.quickLink}>現在時刻</Text>
              </Pressable>
              <Pressable onPress={() => shiftMinutes(5)} hitSlop={6}>
                <Text style={styles.quickLink}>{'5分後 >'}</Text>
              </Pressable>
            </View>

            <Pressable style={styles.primaryBtn} onPress={handleConfirm} accessibilityRole="button">
              <Text style={styles.primaryBtnText}>設定する</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  backdrop: StyleSheet.absoluteFillObject,
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: TD_BG,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  headerSpacer: {
    width: 40,
    minHeight: 40,
    justifyContent: 'center',
  },
  headerSpacerEnd: {
    alignItems: 'flex-end',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#58595B',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: TD_SURFACE_ELEV,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: TD_TEXT_MUTED,
    fontSize: 14,
    fontWeight: '700',
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
  },
  segmentBar: {
    flexDirection: 'row',
    backgroundColor: TD_SURFACE,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: TD_ACCENT,
  },
  segmentText: {
    color: TD_TEXT_MUTED,
    fontSize: 13,
    fontWeight: '800',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  pickerRow: {
    flexDirection: 'row',
    marginTop: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#3A3A3C',
  },
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 4,
  },
  quickLink: {
    color: TD_ACCENT,
    fontSize: 14,
    fontWeight: '800',
  },
  primaryBtn: {
    marginTop: 22,
    backgroundColor: TD_ACCENT,
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
});
