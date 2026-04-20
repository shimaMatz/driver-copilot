import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  WF_BG,
  WF_BORDER,
  WF_CARD,
  WF_DANGER,
  WF_PRIMARY,
  WF_TAG_HOME,
  WF_TAG_OFFICE,
  WF_TAG_WORK,
  WF_TEXT,
  WF_TEXT_MUTED,
} from './wireframeTheme';

type FavoriteRow = {
  key: string;
  name: string;
  tag: string;
  tagColor: string;
};

const MOCK_FAVORITES: FavoriteRow[] = [
  { key: '1', name: '横浜物流センター', tag: '職場', tagColor: WF_TAG_WORK },
  { key: '2', name: '自宅', tag: '自宅', tagColor: WF_TAG_HOME },
  { key: '3', name: '厚木営業所', tag: '営業所', tagColor: WF_TAG_OFFICE },
  { key: '4', name: 'セブン-イレブン 港南台店', tag: 'その他', tagColor: WF_TEXT_MUTED },
];

type Props = {
  insetsTop: number;
  insetsBottom: number;
  truckLen: string;
  truckWid: string;
  truckHgt: string;
  setTruckLen: (v: string) => void;
  setTruckWid: (v: string) => void;
  setTruckHgt: (v: string) => void;
  truckSaveHint: string | null;
  onSaveTruck: () => void;
};

export function SettingsWireframe({
  insetsTop,
  insetsBottom,
  truckLen,
  truckWid,
  truckHgt,
  setTruckLen,
  setTruckWid,
  setTruckHgt,
  truckSaveHint,
  onSaveTruck,
}: Props): React.JSX.Element {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        { paddingTop: Math.max(insetsTop, 12), paddingBottom: insetsBottom + 32 },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.screenTitle}>設定</Text>

      <Text style={styles.sectionLabel}>アカウント</Text>
      <View style={styles.card}>
        <Pressable style={styles.accountRow} onPress={() => {}}>
          <View style={styles.avatar}>
            <Text style={styles.avatarGlyph}>田</Text>
          </View>
          <View style={styles.accountMain}>
            <Text style={styles.accountName}>田中 太郎</Text>
            <Text style={styles.accountSub}>プロドライバー ・ t.tanaka@ex.jp</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
        <View style={styles.divider} />
        <Pressable style={styles.menuRow} onPress={() => {}}>
          <Text style={styles.menuText}>プロフィール編集</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
        <Pressable style={styles.menuRow} onPress={() => {}}>
          <Text style={styles.menuText}>パスワード変更</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
        <Pressable style={styles.logoutRow} onPress={() => {}}>
          <Text style={styles.logoutText}>ログアウト</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionLabel}>車両情報</Text>
      <View style={styles.card}>
        <View style={styles.vehicleHead}>
          <Text style={styles.truckIcon}>🚛</Text>
          <View style={styles.vehicleTitles}>
            <Text style={styles.vehicleTitle}>4tトラック ・ 大型</Text>
            <Text style={styles.vehicleSub}>いすゞ フォワード</Text>
          </View>
          <View style={styles.editPill}>
            <Text style={styles.editPillText}>編集</Text>
          </View>
        </View>
        <View style={styles.specGrid}>
          <View style={styles.specCol}>
            <Text style={styles.specLine}>
              <Text style={styles.specKey}>全長 </Text>
              <Text style={styles.specVal}>{truckLen || '—'}m</Text>
            </Text>
            <Text style={styles.specLine}>
              <Text style={styles.specKey}>全高 </Text>
              <Text style={styles.specVal}>{truckHgt || '—'}m</Text>
            </Text>
            <Text style={styles.specLine}>
              <Text style={styles.specKey}>最大積載 </Text>
              <Text style={styles.specVal}>4.0t</Text>
            </Text>
          </View>
          <View style={styles.specCol}>
            <Text style={styles.specLine}>
              <Text style={styles.specKey}>全幅 </Text>
              <Text style={styles.specVal}>{truckWid || '—'}m</Text>
            </Text>
            <Text style={styles.specLine}>
              <Text style={styles.specKey}>車両重量 </Text>
              <Text style={styles.specVal}>4.0t</Text>
            </Text>
            <Text style={styles.specLine}>
              <Text style={styles.specKey}>燃料 </Text>
              <Text style={styles.specVal}>軽油</Text>
            </Text>
          </View>
        </View>
        <Text style={styles.editHint}>下欄で寸法を編集し保存できます。</Text>
        <View style={styles.dimRow}>
          <Text style={styles.dimLabel}>全長（m）</Text>
          <TextInput
            value={truckLen}
            onChangeText={setTruckLen}
            keyboardType="decimal-pad"
            placeholder="8.5"
            placeholderTextColor={WF_TEXT_MUTED}
            style={styles.dimInput}
          />
        </View>
        <View style={styles.dimRow}>
          <Text style={styles.dimLabel}>全幅（m）</Text>
          <TextInput
            value={truckWid}
            onChangeText={setTruckWid}
            keyboardType="decimal-pad"
            placeholder="2.2"
            placeholderTextColor={WF_TEXT_MUTED}
            style={styles.dimInput}
          />
        </View>
        <View style={styles.dimRow}>
          <Text style={styles.dimLabel}>全高（m）</Text>
          <TextInput
            value={truckHgt}
            onChangeText={setTruckHgt}
            keyboardType="decimal-pad"
            placeholder="3.1"
            placeholderTextColor={WF_TEXT_MUTED}
            style={styles.dimInput}
          />
        </View>
        {truckSaveHint ? <Text style={styles.saveHint}>{truckSaveHint}</Text> : null}
        <TouchableOpacity style={styles.saveBtn} onPress={() => void onSaveTruck()}>
          <Text style={styles.saveBtnText}>寸法を保存</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.favHeaderRow}>
        <Text style={styles.sectionLabelInline}>お気に入り地点（{MOCK_FAVORITES.length}件）</Text>
        <TouchableOpacity style={styles.addBtn}>
          <Text style={styles.addBtnText}>＋ 追加</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.card}>
        {MOCK_FAVORITES.map(item => (
          <View key={item.key} style={styles.favRow}>
            <Text style={styles.favStar}>★</Text>
            <View style={styles.favBody}>
              <Text style={styles.favName}>{item.name}</Text>
              <View style={[styles.tagPill, { backgroundColor: `${item.tagColor}22` }]}>
                <Text style={[styles.tagPillText, { color: item.tagColor }]}>{item.tag}</Text>
              </View>
            </View>
            <View style={styles.favActions}>
              <Pressable style={styles.iconBtn} onPress={() => {}}>
                <Text style={styles.iconBtnText}>✎</Text>
              </Pressable>
              <Pressable style={styles.iconBtn} onPress={() => {}}>
                <Text style={[styles.iconBtnText, styles.iconBtnDanger]}>🗑</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: WF_BG },
  content: { paddingHorizontal: 16 },
  screenTitle: {
    color: WF_TEXT,
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 20,
  },
  sectionLabel: {
    color: WF_TEXT_MUTED,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 4,
  },
  sectionLabelInline: {
    color: WF_TEXT,
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
  },
  card: {
    backgroundColor: WF_CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: WF_BORDER,
    paddingVertical: 8,
    marginBottom: 20,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${WF_PRIMARY}33`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGlyph: { color: WF_PRIMARY, fontSize: 18, fontWeight: '900' },
  accountMain: { flex: 1, minWidth: 0 },
  accountName: { color: WF_TEXT, fontSize: 17, fontWeight: '800' },
  accountSub: { color: WF_TEXT_MUTED, fontSize: 12, marginTop: 4, fontWeight: '600' },
  chevron: { color: WF_TEXT_MUTED, fontSize: 22, fontWeight: '300' },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: WF_BORDER,
    marginHorizontal: 16,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuText: { color: WF_TEXT, fontSize: 16, fontWeight: '600' },
  logoutRow: { paddingHorizontal: 16, paddingVertical: 14 },
  logoutText: { color: WF_DANGER, fontSize: 16, fontWeight: '700' },
  vehicleHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 10,
  },
  truckIcon: { fontSize: 28 },
  vehicleTitles: { flex: 1, minWidth: 0 },
  vehicleTitle: { color: WF_TEXT, fontSize: 16, fontWeight: '800' },
  vehicleSub: { color: WF_TEXT_MUTED, fontSize: 13, marginTop: 4, fontWeight: '600' },
  editPill: {
    borderWidth: 1,
    borderColor: WF_PRIMARY,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  editPillText: { color: WF_PRIMARY, fontSize: 12, fontWeight: '800' },
  specGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 16,
  },
  specCol: { flex: 1, gap: 6 },
  specLine: { fontSize: 13 },
  specKey: { color: WF_TEXT_MUTED, fontWeight: '600' },
  specVal: { color: WF_TEXT, fontWeight: '800' },
  editHint: {
    color: WF_TEXT_MUTED,
    fontSize: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  dimRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
    gap: 12,
  },
  dimLabel: { width: 96, color: WF_TEXT, fontSize: 14, fontWeight: '700' },
  dimInput: {
    flex: 1,
    backgroundColor: WF_BG,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: WF_BORDER,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: WF_TEXT,
    fontSize: 16,
  },
  saveHint: {
    color: WF_PRIMARY,
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  saveBtn: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: WF_PRIMARY,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  favHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  addBtn: {
    backgroundColor: WF_PRIMARY,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  favRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: WF_BORDER,
    gap: 10,
  },
  favStar: { color: WF_TAG_WORK, fontSize: 18 },
  favBody: { flex: 1, minWidth: 0 },
  favName: { color: WF_TEXT, fontSize: 15, fontWeight: '700' },
  tagPill: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagPillText: { fontSize: 11, fontWeight: '800' },
  favActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: WF_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WF_BG,
  },
  iconBtnText: { fontSize: 16, color: WF_TEXT },
  iconBtnDanger: { color: WF_DANGER },
});
