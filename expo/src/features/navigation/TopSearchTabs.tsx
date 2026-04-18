import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { TopSearchTab } from './routeFlowTypes';
import { TD_ACCENT, TD_BG, TD_TEXT, TD_TEXT_MUTED } from './transitDarkTheme';

const TOP_TABS: { key: TopSearchTab; label: string }[] = [
  { key: 'search', label: '目的地検索' },
  { key: 'history', label: '検索履歴' },
  { key: 'favorites', label: 'お気に入り' },
];

type Props = {
  insetsTop: number;
  topSearchTab: TopSearchTab;
  onTopSearchTab: (t: TopSearchTab) => void;
};

export function TopSearchTabs({
  insetsTop,
  topSearchTab,
  onTopSearchTab,
}: Props): React.JSX.Element {
  return (
    <View style={[styles.topTabs, { paddingTop: Math.max(insetsTop, 8) }]}>
      {TOP_TABS.map(t => {
        const on = topSearchTab === t.key;
        return (
          <Pressable
            key={t.key}
            onPress={() => onTopSearchTab(t.key)}
            style={styles.topTabHit}
          >
            <Text style={[styles.topTabText, on && styles.topTabTextOn]}>
              {t.label}
            </Text>
            {on ? (
              <View style={styles.topTabUnderline} />
            ) : (
              <View style={styles.topTabUnderlineHidden} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  topTabs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 6,
    backgroundColor: TD_BG,
  },
  topTabHit: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  topTabText: { color: TD_TEXT_MUTED, fontSize: 20, fontWeight: '700' },
  topTabTextOn: { color: TD_TEXT },
  topTabUnderline: {
    marginTop: 6,
    height: 2,
    width: 36,
    backgroundColor: TD_ACCENT,
    borderRadius: 1,
  },
  topTabUnderlineHidden: { marginTop: 6, height: 2, width: 36 },
});
