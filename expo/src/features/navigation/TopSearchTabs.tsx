import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { TopSearchTab } from './routeFlowTypes';
import {
  WF_BG,
  WF_PRIMARY,
  WF_TEXT,
  WF_TEXT_MUTED,
} from './wireframeTheme';

const TOP_TABS: { key: TopSearchTab; label: string }[] = [
  { key: 'editor', label: '経路' },
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
    backgroundColor: WF_BG,
  },
  topTabHit: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  topTabText: { color: WF_TEXT_MUTED, fontSize: 15, fontWeight: '700' },
  topTabTextOn: { color: WF_TEXT },
  topTabUnderline: {
    marginTop: 6,
    height: 3,
    width: 56,
    backgroundColor: WF_PRIMARY,
    borderRadius: 2,
  },
  topTabUnderlineHidden: { marginTop: 6, height: 3, width: 56 },
});
