import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  WF_BG,
  WF_BORDER,
  WF_CARD,
  WF_PRIMARY,
  WF_TAG_WORK,
  WF_TEXT,
  WF_TEXT_MUTED,
} from './wireframeTheme';

type SearchMode = 'destination' | 'waypoint';
type SearchTab = 'all' | 'station' | 'address';

const SEARCH_TABS: { key: SearchTab; label: string }[] = [
  { key: 'all', label: 'すべて' },
  { key: 'station', label: '駅' },
  { key: 'address', label: '場所/住所' },
];

const STUB_HISTORY = ['大阪駅', '名古屋IC', '東名高速 海老名SA', '東京駅'];

type Props = {
  visible: boolean;
  mode: SearchMode;
  onClose: () => void;
  onSelect: (name: string) => void;
};

export function SearchBottomSheet({ visible, mode, onClose, onSelect }: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const translateY = useRef(new Animated.Value(0)).current;
  const [query, setQuery] = useState('');
  const [searchTab, setSearchTab] = useState<SearchTab>('all');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const resetState = useCallback(() => {
    setQuery('');
    setSearchTab('all');
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [onClose, resetState]);

  const handleSelect = useCallback(
    (name: string) => {
      resetState();
      onSelect(name);
    },
    [onSelect, resetState],
  );

  const toggleFavorite = useCallback((name: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

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
              toValue: windowHeight,
              duration: 180,
              useNativeDriver: true,
            }).start(() => {
              translateY.setValue(0);
              handleClose();
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
    [windowHeight, translateY, handleClose],
  );

  const title = mode === 'waypoint' ? '経由地を追加' : '目的地を設定';

  const filteredHistory = query
    ? STUB_HISTORY.filter(h => h.includes(query))
    : STUB_HISTORY;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : undefined}
      statusBarTranslucent={Platform.OS === 'android'}
      onRequestClose={handleClose}
    >
      <View style={s.root}>
        <Pressable style={s.backdrop} onPress={handleClose} />
        <Animated.View
          style={[
            s.sheet,
            {
              height: windowHeight,
              transform: [{ translateY }],
            },
          ]}
        >
          <View
            style={[s.handleArea, { paddingTop: Math.max(insets.top, 12) }]}
            {...panResponder.panHandlers}
          >
            <View style={s.handle} />
            <Text style={s.title}>{title}</Text>
          </View>

          <View style={[s.body, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <View style={s.searchRow}>
              <View style={s.inputWrap}>
                <Text style={s.searchIcon}>🔍</Text>
                <TextInput
                  style={s.input}
                  placeholder="場所や住所など"
                  placeholderTextColor={WF_TEXT_MUTED}
                  value={query}
                  onChangeText={setQuery}
                  autoFocus
                />
              </View>
              {query.length > 0 && (
                <Pressable style={s.clearBtn} onPress={() => setQuery('')}>
                  <Text style={s.clearText}>✕</Text>
                </Pressable>
              )}
            </View>

            {query.length > 0 ? (
              <>
                <View style={s.tabRow}>
                  {SEARCH_TABS.map(tab => {
                    const active = searchTab === tab.key;
                    return (
                      <Pressable
                        key={tab.key}
                        style={[s.tab, active && s.tabActive]}
                        onPress={() => setSearchTab(tab.key)}
                      >
                        <Text style={[s.tabText, active && s.tabTextActive]}>
                          {tab.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <ScrollView style={s.list} keyboardShouldPersistTaps="handled">
                  {filteredHistory.map(item => (
                    <TouchableOpacity
                      key={item}
                      style={s.listItem}
                      activeOpacity={0.6}
                      onPress={() => handleSelect(item)}
                    >
                      <Text style={s.listText}>{item}</Text>
                      <TouchableOpacity onPress={() => toggleFavorite(item)} hitSlop={8}>
                        <Text style={[s.star, favorites.has(item) && s.starOn]}>
                          {favorites.has(item) ? '★' : '☆'}
                        </Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            ) : (
              <ScrollView style={s.list} keyboardShouldPersistTaps="handled">
                <Text style={s.sectionTitle}>検索履歴</Text>
                {filteredHistory.map(item => (
                  <TouchableOpacity
                    key={item}
                    style={s.listItem}
                    activeOpacity={0.6}
                    onPress={() => handleSelect(item)}
                  >
                    <Text style={s.listText}>{item}</Text>
                    <TouchableOpacity onPress={() => toggleFavorite(item)} hitSlop={8}>
                      <Text style={[s.star, favorites.has(item) && s.starOn]}>
                        {favorites.has(item) ? '★' : '☆'}
                      </Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  backdrop: StyleSheet.absoluteFillObject,
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: WF_BG,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  handleArea: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: WF_BORDER,
  },
  handle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: WF_BORDER,
    marginBottom: 10,
  },
  title: { color: WF_TEXT, fontSize: 18, fontWeight: '800' },
  body: { flex: 1, padding: 20 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WF_CARD,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: WF_BORDER,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  input: { flex: 1, color: WF_TEXT, fontSize: 16 },
  clearBtn: { padding: 8 },
  clearText: { color: WF_TEXT_MUTED, fontSize: 18, fontWeight: '700' },
  tabRow: {
    flexDirection: 'row',
    marginTop: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: WF_BORDER,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: WF_PRIMARY },
  tabText: { color: WF_TEXT_MUTED, fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: WF_TEXT },
  list: { marginTop: 16 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: WF_BORDER,
  },
  listText: { color: WF_TEXT, fontSize: 16 },
  sectionTitle: { color: WF_TEXT_MUTED, fontSize: 13, fontWeight: '700', marginBottom: 4, marginTop: 8 },
  star: { color: WF_TEXT_MUTED, fontSize: 22 },
  starOn: { color: WF_TAG_WORK },
});
