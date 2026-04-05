import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  ListRenderItem,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { LongPressEvent, Marker, Polyline, Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from './useNavigation';
import type { RouteStep } from './navigationApiClient';
import { computeRouteProgress } from './routeProgress';
import { formatDurationJa } from './routeSummary';
import { formatHighwayStepTitle } from './routeStepDisplay';
import type { PlaceSuggestion } from './types';
import { JR_HEADER_GREEN, JR_MUTED_ON_GREEN, JR_TEXT_ON_GREEN } from './jrNavTheme';
import type { RouteFlowPhase, TopSearchTab } from './routeFlowTypes';
import {
  RouteProposalView,
  type ProposalColumnModel,
  type ProposalFilterTab,
} from './RouteProposalView';
import { RouteTabListHeader } from './RouteTabListHeader';
import {
  TD_ACCENT,
  TD_BG,
  TD_TAB_BAR,
  TD_TEXT,
  TD_TEXT_MUTED,
} from './transitDarkTheme';
import {
  isSaOrPa,
  stubParkingGuide,
  stubSaPaCongestion,
  stubToiletGuide,
} from './saPaStubInfo';
import { useTruckProfile } from './useTruckProfile';

type BottomTab = 'route' | 'facility' | 'more';

const TAB_ITEMS: { key: BottomTab; label: string; sub: string }[] = [
  { key: 'route', label: '経路', sub: '検索・案内' },
  { key: 'facility', label: '駅情報', sub: 'SA/PA' },
  { key: 'more', label: 'もっと見る', sub: '設定など' },
];

function formatJapaneseDepartureLine(d = new Date()): string {
  const wk = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()] ?? '日';
  const mo = d.getMonth() + 1;
  const day = d.getDate();
  const h = d.getHours();
  const mi = d.getMinutes();
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${mo}月${day}日(${wk}) ${pad(h)}:${pad(mi)} 出発`;
}

const ZOOM_FACTOR = 0.55;

type SuggestionRow = { key: string; kind: 'suggestion'; suggestion: PlaceSuggestion };
type StepRow = { key: string; kind: 'step'; step: RouteStep; index: number };

type MainListItem = SuggestionRow | StepRow;

type CongestionRow = {
  key: string;
  step: RouteStep;
  level: 'empty' | 'normal' | 'busy' | 'full';
  title: string;
  detail: string;
};

type FacilityRow = { key: string; step: RouteStep };

function stepTypeLabel(type: RouteStep['type']): string | null {
  switch (type) {
    case 'origin':
      return '出発';
    case 'destination':
      return '到着';
    case 'ic':
      return 'IC';
    case 'sa':
      return 'SA';
    case 'pa':
      return 'PA';
    case 'jct':
      return 'JCT';
    default:
      return null;
  }
}

export function NavigationScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const destinationSearchInputRef = useRef<TextInput>(null);
  const destinationQueryRef = useRef('');
  const destinationBlurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [destinationFieldOpen, setDestinationFieldOpen] = useState(false);
  const [destinationFieldFocused, setDestinationFieldFocused] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 35.681236,
    longitude: 139.767125,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [selectedRouteId, setSelectedRouteId] = useState<'general' | 'toll'>('toll');
  const [bottomTab, setBottomTab] = useState<BottomTab>('route');
  const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard');
  const [topSearchTab, setTopSearchTab] = useState<TopSearchTab>('search');
  const [routeFlowPhase, setRouteFlowPhase] = useState<RouteFlowPhase>('minimal');
  const [proposalFilter, setProposalFilter] = useState<ProposalFilterTab>('all');

  const {
    isFetchingRoute,
    isNavigating,
    error,
    startNavigation,
    stopNavigation,
    currentLocation,
    destination,
    setDestination,
    destinationQuery,
    setDestinationQuery,
    suggestions,
    isSuggesting,
    chooseSuggestion,
    waypoints,
    addWaypoint,
    generalRoute,
    tollRoute,
  } = useNavigation();

  const { profile: truckProfile, loaded: truckProfileLoaded, setProfile: setTruckProfile } =
    useTruckProfile();
  const [truckLen, setTruckLen] = useState('');
  const [truckWid, setTruckWid] = useState('');
  const [truckHgt, setTruckHgt] = useState('');
  const [truckSaveHint, setTruckSaveHint] = useState<string | null>(null);

  useEffect(() => {
    if (!truckProfileLoaded) return;
    setTruckLen(String(truckProfile.lengthM));
    setTruckWid(String(truckProfile.widthM));
    setTruckHgt(String(truckProfile.heightM));
  }, [truckProfileLoaded, truckProfile.lengthM, truckProfile.widthM, truckProfile.heightM]);

  const handleSaveTruckProfile = useCallback(async () => {
    const lengthM = Number(truckLen.replace(',', '.'));
    const widthM = Number(truckWid.replace(',', '.'));
    const heightM = Number(truckHgt.replace(',', '.'));
    if (![lengthM, widthM, heightM].every(n => Number.isFinite(n))) {
      setTruckSaveHint('数値を入力してください');
      return;
    }
    await setTruckProfile({ lengthM, widthM, heightM });
    setTruckSaveHint('保存しました');
    setTimeout(() => setTruckSaveHint(null), 2000);
  }, [truckLen, truckWid, truckHgt, setTruckProfile]);

  const activeRoute = selectedRouteId === 'general' ? generalRoute : tollRoute;
  const activePolyline = activeRoute?.polylinePoints ?? [];

  const listData: MainListItem[] = useMemo(() => {
    if (bottomTab !== 'route') {
      return [];
    }
    if (routeFlowPhase === 'guidance' && destination) {
      const steps = activeRoute?.steps ?? [];
      return steps.map((step, index) => ({
        key: `step-${index}-${step.name}`,
        kind: 'step' as const,
        step,
        index,
      }));
    }
    if (!destination) {
      if (routeFlowPhase === 'minimal' && !destinationFieldOpen) {
        return [];
      }
      return suggestions.map(s => ({
        key: s.placeId,
        kind: 'suggestion' as const,
        suggestion: s,
      }));
    }
    return [];
  }, [
    bottomTab,
    routeFlowPhase,
    destination,
    destinationFieldOpen,
    suggestions,
    activeRoute?.steps,
  ]);

  const proposalColumns: ProposalColumnModel[] = useMemo(() => {
    const tollMin = tollRoute
      ? Math.max(1, Math.round(tollRoute.durationSeconds / 60))
      : 0;
    const genMin = generalRoute
      ? Math.max(1, Math.round(generalRoute.durationSeconds / 60))
      : 0;
    const tollKm = tollRoute ? tollRoute.distanceMeters / 1000 : 0;
    const tollYen = tollKm > 0 ? Math.round(tollKm * 28 + 320) : null;
    const tollTransfers = tollRoute
      ? tollRoute.steps.filter(s => s.type === 'jct' || s.type === 'ic').length
      : 0;
    const genTransfers = generalRoute
      ? generalRoute.steps.filter(s => s.type === 'jct' || s.type === 'ic').length
      : 0;
    const cols: ProposalColumnModel[] = [];
    if (tollRoute) {
      cols.push({
        id: 'toll',
        title: '高速優先',
        route: tollRoute,
        durationMin: tollMin,
        fareYen: tollYen,
        badges: [
          ...(tollMin > 0 && genMin > 0 && tollMin <= genMin ? (['早'] as const) : []),
          ...(tollTransfers <= genTransfers ? (['楽'] as const) : []),
        ],
      });
    }
    if (generalRoute) {
      cols.push({
        id: 'general',
        title: '一般優先',
        route: generalRoute,
        durationMin: genMin,
        fareYen: 0,
        badges: ['安'],
      });
    }
    return cols;
  }, [tollRoute, generalRoute]);

  const handleSelectProposalColumn = useCallback(
    async (id: 'toll' | 'general') => {
      setSelectedRouteId(id);
      const ok = await startNavigation();
      if (ok) {
        setRouteFlowPhase('guidance');
      }
    },
    [startNavigation],
  );

  useEffect(() => {
    if (!destination) {
      setRouteFlowPhase('minimal');
      return;
    }
    setRouteFlowPhase(prev =>
      prev === 'proposals' || prev === 'guidance' ? prev : 'editor',
    );
  }, [destination]);

  useEffect(() => {
    if (!isNavigating && routeFlowPhase === 'guidance') {
      setRouteFlowPhase('editor');
    }
  }, [isNavigating, routeFlowPhase]);

  useEffect(() => {
    if (!mapVisible) return;
    if (currentLocation) {
      mapRef.current?.animateToRegion(
        {
          latitude: currentLocation.lat,
          longitude: currentLocation.lng,
          latitudeDelta: 0.025,
          longitudeDelta: 0.025,
        },
        300,
      );
    }
  }, [mapVisible, currentLocation]);

  useEffect(() => {
    if (!mapVisible) return;
    if (activePolyline.length >= 2) {
      mapRef.current?.fitToCoordinates(
        activePolyline.map(p => ({ latitude: p.lat, longitude: p.lng })),
        { edgePadding: { top: 100, right: 40, bottom: 100, left: 40 }, animated: true },
      );
    }
  }, [mapVisible, activePolyline, selectedRouteId]);

  useEffect(() => {
    if (!mapVisible || !isNavigating || !currentLocation) return;
    mapRef.current?.animateToRegion(
      {
        latitude: currentLocation.lat,
        longitude: currentLocation.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      250,
    );
  }, [mapVisible, isNavigating, currentLocation]);

  const handleMapLongPress = useCallback(
    (event: LongPressEvent) => {
      const p = event.nativeEvent.coordinate;
      addWaypoint({ lat: p.latitude, lng: p.longitude });
    },
    [addWaypoint],
  );

  const zoomBy = useCallback(
    (factor: number) => {
      const next = {
        ...mapRegion,
        latitudeDelta: Math.max(0.002, mapRegion.latitudeDelta * factor),
        longitudeDelta: Math.max(0.002, mapRegion.longitudeDelta * factor),
      };
      mapRef.current?.animateToRegion(next, 200);
    },
    [mapRegion],
  );

  const recenterOnUser = useCallback(() => {
    if (!currentLocation) return;
    mapRef.current?.animateToRegion(
      {
        latitude: currentLocation.lat,
        longitude: currentLocation.lng,
        latitudeDelta: 0.025,
        longitudeDelta: 0.025,
      },
      350,
    );
  }, [currentLocation]);

  const hasDestination = destination !== null;
  destinationQueryRef.current = destinationQuery;

  const clearDestinationBlurTimer = useCallback(() => {
    if (destinationBlurTimerRef.current) {
      clearTimeout(destinationBlurTimerRef.current);
      destinationBlurTimerRef.current = null;
    }
  }, []);

  const scheduleCloseDestinationFieldIfEmpty = useCallback(() => {
    clearDestinationBlurTimer();
    destinationBlurTimerRef.current = setTimeout(() => {
      destinationBlurTimerRef.current = null;
      if (destinationQueryRef.current.trim() === '') {
        setDestinationFieldOpen(false);
      }
    }, 220);
  }, [clearDestinationBlurTimer]);

  useEffect(
    () => () => {
      clearDestinationBlurTimer();
    },
    [clearDestinationBlurTimer],
  );

  useEffect(() => {
    if (destinationQuery.trim().length > 0) {
      setDestinationFieldOpen(true);
    }
  }, [destinationQuery]);

  const routeProgress = useMemo(
    () =>
      computeRouteProgress(
        currentLocation,
        activeRoute?.steps ?? [],
        activeRoute?.polylinePoints ?? [],
      ),
    [currentLocation, activeRoute?.steps, activeRoute?.polylinePoints],
  );

  const congestionRows: CongestionRow[] = useMemo(() => {
    const steps = activeRoute?.steps ?? [];
    return steps.filter(isSaOrPa).map((step, i) => {
      const c = stubSaPaCongestion(step.name);
      return {
        key: `cong-${i}-${step.name}`,
        step,
        level: c.level,
        title: c.title,
        detail: c.detail,
      };
    });
  }, [activeRoute?.steps]);

  const facilityRows: FacilityRow[] = useMemo(() => {
    const steps = activeRoute?.steps ?? [];
    return steps.filter(isSaOrPa).map((step, i) => ({
      key: `fac-${i}-${step.name}`,
      step,
    }));
  }, [activeRoute?.steps]);

  const routeListHeader = useMemo(
    () => (
      <RouteTabListHeader
        insetsTop={insets.top}
        topSearchTab={topSearchTab}
        onTopSearchTab={setTopSearchTab}
        routeFlowPhase={routeFlowPhase}
        hasDestination={hasDestination}
        destinationQuery={destinationQuery}
        destinationFieldOpen={destinationFieldOpen}
        destinationFieldFocused={destinationFieldFocused}
        destinationSearchInputRef={destinationSearchInputRef}
        setDestinationQuery={setDestinationQuery}
        onOpenDestinationField={() => {
          clearDestinationBlurTimer();
          setDestinationFieldOpen(true);
          requestAnimationFrame(() => destinationSearchInputRef.current?.focus());
        }}
        onDestinationFocus={() => {
          clearDestinationBlurTimer();
          setDestinationFieldOpen(true);
          setDestinationFieldFocused(true);
        }}
        onDestinationBlur={() => {
          setDestinationFieldFocused(false);
          scheduleCloseDestinationFieldIfEmpty();
        }}
        isSuggesting={isSuggesting}
        isFetchingRoute={isFetchingRoute}
        tollRoute={tollRoute}
        generalRoute={generalRoute}
        onPressGoProposals={() => setRouteFlowPhase('proposals')}
        onOpenMap={() => setMapVisible(true)}
        truckProfileLoaded={truckProfileLoaded}
        truckLenM={truckProfile.lengthM}
        truckWidM={truckProfile.widthM}
        truckHgtM={truckProfile.heightM}
        onChangeDestination={() => {
          setDestination(null);
          setDestinationQuery('');
          clearDestinationBlurTimer();
          setDestinationFieldOpen(true);
          requestAnimationFrame(() => destinationSearchInputRef.current?.focus());
        }}
        isNavigating={isNavigating}
        stopNavigation={stopNavigation}
        error={error}
        congestionRows={congestionRows}
        routeProgress={routeProgress ?? null}
        currentLocation={currentLocation}
        activeSteps={activeRoute?.steps ?? []}
        listDataStepCount={listData.filter(i => i.kind === 'step').length}
      />
    ),
    [
      hasDestination,
      destinationQuery,
      destinationFieldOpen,
      destinationFieldFocused,
      isNavigating,
      isSuggesting,
      isFetchingRoute,
      error,
      activeRoute,
      stopNavigation,
      listData,
      setDestination,
      setDestinationQuery,
      truckProfileLoaded,
      truckProfile.lengthM,
      truckProfile.widthM,
      truckProfile.heightM,
      insets.top,
      clearDestinationBlurTimer,
      scheduleCloseDestinationFieldIfEmpty,
      topSearchTab,
      routeFlowPhase,
      tollRoute,
      generalRoute,
      congestionRows,
      routeProgress,
      currentLocation,
    ],
  );

  const settingsListHeader = useMemo(
    () => (
      <View>
        <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 8) }]}>
          <View style={styles.topBarTitles}>
            <Text style={styles.brandLine}>もっと見る</Text>
            <Text style={styles.brandSub}>車両サイズ・位置情報・API</Text>
          </View>
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.settingsSectionTitle}>トラックのサイズ</Text>
          <Text style={styles.settingsSectionLead}>
            制限道路の判定などに使う想定の車両寸法です（現状は保存のみ。ルート API 連携は今後拡張可能）。
          </Text>
          <View style={styles.dimRow}>
            <Text style={styles.dimLabel}>全長（m）</Text>
            <TextInput
              value={truckLen}
              onChangeText={setTruckLen}
              keyboardType="decimal-pad"
              placeholder="12"
              placeholderTextColor="#9CA3AF"
              style={styles.dimInput}
            />
          </View>
          <View style={styles.dimRow}>
            <Text style={styles.dimLabel}>車幅（m）</Text>
            <TextInput
              value={truckWid}
              onChangeText={setTruckWid}
              keyboardType="decimal-pad"
              placeholder="2.5"
              placeholderTextColor="#9CA3AF"
              style={styles.dimInput}
            />
          </View>
          <View style={styles.dimRow}>
            <Text style={styles.dimLabel}>車高（m）</Text>
            <TextInput
              value={truckHgt}
              onChangeText={setTruckHgt}
              keyboardType="decimal-pad"
              placeholder="3.8"
              placeholderTextColor="#9CA3AF"
              style={styles.dimInput}
            />
          </View>
          {truckSaveHint ? <Text style={styles.saveHint}>{truckSaveHint}</Text> : null}
          <TouchableOpacity style={styles.saveTruckBtn} onPress={() => void handleSaveTruckProfile()}>
            <Text style={styles.saveTruckBtnText}>寸法を保存</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.settingsSectionMuted}>
          <Text style={styles.settingsSectionTitle}>位置情報・API</Text>
          <Text style={styles.settingsBody}>
            位置情報は現在地表示・ルート案内に使用します。Google Maps API キーはプロジェクトの .env に
            EXPO_PUBLIC_GOOGLE_MAPS_API_KEY を設定してください。
          </Text>
        </View>
      </View>
    ),
    [truckLen, truckWid, truckHgt, truckSaveHint, handleSaveTruckProfile, insets.top],
  );

  const renderItem: ListRenderItem<MainListItem> = useCallback(
    ({ item }) => {
      if (item.kind === 'suggestion') {
        return (
          <TouchableOpacity
            style={bottomTab === 'route' ? styles.listRowOnDark : styles.listRow}
            onPress={() => void chooseSuggestion(item.suggestion)}
            accessibilityRole="button"
          >
            <View style={styles.listRowMain}>
              <Text
                style={bottomTab === 'route' ? styles.listRowTitleOnDark : styles.listRowTitle}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.suggestion.description}
              </Text>
            </View>
            <Text
              style={bottomTab === 'route' ? styles.listRowChevronOnDark : styles.listRowChevron}
              accessibilityLabel=""
            >
              ›
            </Text>
          </TouchableOpacity>
        );
      }
      const { step, index } = item;
      const steps = activeRoute?.steps ?? [];
      const next = steps[index + 1];
      const segKm =
        next != null
          ? Math.round((next.distanceFromStartKm - step.distanceFromStartKm) * 10) / 10
          : null;
      const segMin = next != null ? next.etaMinutes - step.etaMinutes : null;
      const label = stepTypeLabel(step.type);
      const shortTitle = formatHighwayStepTitle(step.name, step.type);
      const etaLabel =
        step.etaMinutes > 0 ? `約${formatDurationJa(step.etaMinutes)}` : step.type === 'origin' ? '出発' : '—';
      const onCurrentLeg =
        routeProgress &&
        !routeProgress.offRoute &&
        (index === routeProgress.legIndex || index === routeProgress.legIndex + 1);
      const isNextFocus =
        routeProgress && !routeProgress.offRoute && index === routeProgress.legIndex + 1;
      return (
        <View
          style={[
            styles.stepRow,
            onCurrentLeg ? styles.stepRowOnLeg : null,
            isNextFocus ? styles.stepRowNext : null,
          ]}
        >
          <View style={styles.stepTimeCol}>
            <Text style={styles.stepTimeMain} numberOfLines={1} ellipsizeMode="tail">
              {etaLabel}
            </Text>
          </View>
          <View style={styles.stepRail}>
            <View style={[styles.stepDot, step.type === 'origin' || step.type === 'destination' ? styles.stepDotLg : null]}>
              <Text style={styles.stepDotText}>{index + 1}</Text>
            </View>
            {index < steps.length - 1 ? <View style={styles.stepLine} /> : null}
          </View>
          <View style={styles.stepBody}>
            <Text
              style={styles.stepName}
              numberOfLines={1}
              ellipsizeMode="tail"
              accessibilityLabel={step.name}
            >
              {shortTitle}
            </Text>
            <View style={styles.stepBadgeRow}>
              {label ? (
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>{label}</Text>
                </View>
              ) : null}
              {step.isToll && step.type !== 'origin' && step.type !== 'destination' ? (
                <View style={styles.tollBadge}>
                  <Text style={styles.tollBadgeText}>有料</Text>
                </View>
              ) : null}
              {step.isPlannedRest ? (
                <View style={styles.restPlanBadge}>
                  <Text style={styles.restPlanBadgeText}>休憩（暫定）</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.stepMeta} numberOfLines={1}>
              {step.distanceFromStartKm > 0 ? `起点から ${step.distanceFromStartKm} km` : ' '}
            </Text>
            {segKm != null && segMin != null && index < steps.length - 1 ? (
              <Text style={styles.stepSegment} numberOfLines={1} ellipsizeMode="tail">
                次まで {segKm} km · 約{formatDurationJa(segMin)}
              </Text>
            ) : null}
          </View>
        </View>
      );
    },
    [activeRoute?.steps, bottomTab, chooseSuggestion, routeProgress],
  );

  const facilityListEmpty = useMemo(
    () => (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyText}>
          「経路」でルートを表示すると、休憩所ごとの「駐車場の見方」「トイレの探し方」を案内します。
        </Text>
      </View>
    ),
    [],
  );

  const renderFacilityRow = useCallback(({ item }: { item: FacilityRow }) => {
    const short = formatHighwayStepTitle(item.step.name, item.step.type);
    return (
      <View style={styles.facilityCard}>
        <Text style={styles.facilityCardTitle}>{short}</Text>
        <Text style={styles.facilitySectionHead}>はじめに（迷わないために）</Text>
        <Text style={styles.facilityBody}>
          SA/PA は施設ごとに建物の位置が違います。まずは「トイレ棟」と「給油所」のどちら側かを意識すると分かりやすいです。以下はあくまで目安で、必ず現地の案内図・表示を確認してください。
        </Text>
        <Text style={styles.facilitySectionHead}>大型車の駐車の考え方</Text>
        <Text style={styles.facilityBody}>{stubParkingGuide(item.step.name, item.step.type)}</Text>
        <Text style={styles.facilitySectionHead}>トイレの探し方</Text>
        <Text style={styles.facilityBody}>{stubToiletGuide(item.step.name)}</Text>
      </View>
    );
  }, []);

  const facilityHeader = useMemo(
    () => (
      <View style={[styles.jrTabScreenHeader, { paddingTop: Math.max(insets.top, 12) }]}>
        <Text style={styles.jrTabScreenTitle}>駅情報</Text>
        <Text style={styles.jrTabScreenSub}>
          SA/PA の駐車・トイレの探し方を案内します（テンプレ＋ダミー。現地案内が正です）。
        </Text>
      </View>
    ),
    [insets.top],
  );

  const listEmpty = useMemo(() => {
    if (!hasDestination) {
      return (
        <View style={styles.emptyBoxTransit}>
          <Text style={styles.emptyTextTransit}>
            {!destinationFieldOpen
              ? '上の「未設定」をタップして入力を始めると、候補がここに表示されます'
              : 'キーワードを入力すると、候補がここに表示されます'}
          </Text>
        </View>
      );
    }
    if (routeFlowPhase === 'editor') {
      return (
        <View style={styles.emptyBoxTransit}>
          <Text style={styles.emptyTextTransit}>
            GO! を押すと、高速優先と一般優先の経路を比較できます。
          </Text>
        </View>
      );
    }
    if (isFetchingRoute) {
      return (
        <View style={styles.emptyBoxTransit}>
          <Text style={styles.emptyTextTransit}>ルートを取得しています…</Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyBoxTransit}>
        <Text style={styles.emptyTextTransit}>
          インター・JCT・SA/PA の地点が取得できませんでした（API の指示文に依存します）
        </Text>
      </View>
    );
  }, [hasDestination, isFetchingRoute, destinationFieldOpen, routeFlowPhase]);

  const hasProposalRoutes = proposalColumns.some(c => c.route);

  return (
    <View style={styles.screenRoot}>
      <View
        style={[
          styles.contentFill,
          bottomTab === 'route' ? styles.contentFillDark : null,
        ]}
      >
        {bottomTab === 'route' && routeFlowPhase === 'proposals' ? (
          hasProposalRoutes ? (
            <RouteProposalView
              originLabel="現在地"
              destLabel={destinationQuery.trim() || '目的地'}
              departureLine={formatJapaneseDepartureLine()}
              columns={proposalColumns}
              filter={proposalFilter}
              onFilterChange={setProposalFilter}
              onSelectColumn={id => void handleSelectProposalColumn(id)}
              onBack={() => setRouteFlowPhase('editor')}
              paddingTop={insets.top}
              paddingBottom={Math.max(insets.bottom, 6)}
            />
          ) : (
            <View style={[styles.proposalFallback, { paddingTop: insets.top }]}>
              <Text style={styles.proposalFallbackText}>ルートを取得できませんでした</Text>
              <TouchableOpacity
                style={styles.proposalFallbackBtn}
                onPress={() => setRouteFlowPhase('editor')}
              >
                <Text style={styles.proposalFallbackBtnText}>戻る</Text>
              </TouchableOpacity>
            </View>
          )
        ) : null}

        {bottomTab === 'route' && routeFlowPhase !== 'proposals' ? (
          <FlatList
            style={styles.flatList}
            contentContainerStyle={styles.flatListContent}
            data={listData}
            keyExtractor={i => i.key}
            extraData={routeProgress}
            renderItem={renderItem}
            ListHeaderComponent={routeListHeader}
            ListEmptyComponent={listData.length === 0 ? listEmpty : undefined}
            keyboardShouldPersistTaps="handled"
          />
        ) : null}

        {bottomTab === 'facility' ? (
          <FlatList
            style={styles.flatList}
            contentContainerStyle={styles.flatListContent}
            data={facilityRows}
            keyExtractor={i => i.key}
            renderItem={renderFacilityRow}
            ListHeaderComponent={facilityHeader}
            ListEmptyComponent={facilityListEmpty}
          />
        ) : null}

        {bottomTab === 'more' ? (
          <ScrollView
            style={styles.flatList}
            contentContainerStyle={styles.flatListContent}
            keyboardShouldPersistTaps="handled"
          >
            {settingsListHeader}
          </ScrollView>
        ) : null}
      </View>

      <View style={[styles.fixedFooter, { paddingBottom: Math.max(insets.bottom, 6) }]}>
        <View style={styles.tabBar}>
          {TAB_ITEMS.map(t => {
            const active = bottomTab === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                style={styles.tabItem}
                onPress={() => setBottomTab(t.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <View style={styles.tabItemInner}>
                  <Text style={[styles.tabLabelJr, active && styles.tabLabelJrActive]}>{t.label}</Text>
                  <Text style={[styles.tabSubJr, active && styles.tabSubJrActive]}>{t.sub}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <Modal visible={mapVisible} animationType="slide" onRequestClose={() => setMapVisible(false)}>
        <View style={styles.mapModalRoot}>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFillObject}
            mapType={mapType}
            showsUserLocation
            region={mapRegion}
            onRegionChangeComplete={setMapRegion}
            onLongPress={handleMapLongPress}
          >
            {currentLocation && (
              <Marker
                coordinate={{ latitude: currentLocation.lat, longitude: currentLocation.lng }}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={false}
              >
                <View style={styles.vehicleArrow}>
                  <Text style={styles.vehicleArrowGlyph}>▲</Text>
                </View>
              </Marker>
            )}
            {destination && (
              <Marker
                coordinate={{ latitude: destination.lat, longitude: destination.lng }}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={false}
              >
                <View style={styles.goalBubble}>
                  <Text style={styles.goalLetter}>G</Text>
                </View>
              </Marker>
            )}
            {waypoints.map((w, idx) => (
              <Marker
                key={`wp-${idx}`}
                coordinate={{ latitude: w.lat, longitude: w.lng }}
                pinColor="#FB8C00"
                title={`経由地 ${idx + 1}`}
              />
            ))}
            {activeRoute?.segments.map((seg, i) => (
              <Polyline
                key={`seg-${selectedRouteId}-${i}`}
                coordinates={seg.points.map(p => ({ latitude: p.lat, longitude: p.lng }))}
                strokeWidth={5}
                strokeColor={seg.isToll ? '#35A86E' : '#1D9EBF'}
              />
            ))}
          </MapView>

          <View
            style={[styles.mapModalTopChrome, { paddingTop: insets.top }]}
            pointerEvents="box-none"
          >
            <View style={styles.mapModalHeader} pointerEvents="auto">
              <TouchableOpacity
                style={styles.mapCloseBtn}
                onPress={() => setMapVisible(false)}
                hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                accessibilityRole="button"
                accessibilityLabel="地図を閉じる"
              >
                <Text style={styles.mapCloseBtnText}>閉じる</Text>
              </TouchableOpacity>
              <Text style={styles.mapModalTitle}>地図</Text>
              <View style={styles.mapHeaderSpacer} />
            </View>
            <View style={styles.mapHintBar} pointerEvents="auto">
              <Text style={styles.mapHintModalText}>長押しで経由地を追加</Text>
            </View>
          </View>

          <View style={styles.leftRail} pointerEvents="box-none">
            <View style={styles.railCluster}>
              <TouchableOpacity style={styles.railBtn} onPress={() => zoomBy(ZOOM_FACTOR)}>
                <Text style={styles.railBtnText}>＋</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.railBtn} onPress={() => zoomBy(1 / ZOOM_FACTOR)}>
                <Text style={styles.railBtnText}>－</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.compass} onPress={recenterOnUser}>
              <Text style={styles.compassN}>N</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.layersBtn}
              onPress={() => setMapType(m => (m === 'standard' ? 'satellite' : 'standard'))}
            >
              <Text style={styles.layersBtnText}>層</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.rightRail} pointerEvents="box-none">
            <TouchableOpacity style={styles.locateFab} onPress={recenterOnUser}>
              <Text style={styles.locateFabText}>⌖</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: { flex: 1, backgroundColor: TD_TAB_BAR },
  contentFill: { flex: 1, backgroundColor: '#EFEFF4' },
  contentFillDark: { flex: 1, backgroundColor: TD_BG },
  proposalFallback: {
    flex: 1,
    backgroundColor: TD_BG,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  proposalFallbackText: { color: TD_TEXT_MUTED, fontSize: 15, textAlign: 'center', fontWeight: '600' },
  proposalFallbackBtn: {
    marginTop: 20,
    backgroundColor: TD_ACCENT,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 10,
  },
  proposalFallbackBtnText: { color: '#000', fontSize: 16, fontWeight: '900' },
  flatList: { flex: 1 },
  flatListContent: { paddingBottom: 8 },
  flatListFill: { flexGrow: 1, justifyContent: 'center' },
  tabBody: { flex: 1, backgroundColor: '#EFEFF4' },
  jrHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: JR_HEADER_GREEN,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  jrHeaderTextCol: { flex: 1, paddingRight: 10 },
  jrHeaderTitle: { color: JR_TEXT_ON_GREEN, fontSize: 18, fontWeight: '800' },
  jrHeaderSub: { color: JR_MUTED_ON_GREEN, fontSize: 11, marginTop: 4, fontWeight: '600' },
  jrMapBtn: {
    borderWidth: 1,
    borderColor: JR_TEXT_ON_GREEN,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  jrMapBtnText: { color: JR_TEXT_ON_GREEN, fontWeight: '800', fontSize: 13 },
  jrHeroCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E4E4EA',
  },
  jrHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  jrHeroCol: { flex: 1, minWidth: 0 },
  jrHeroColEnd: { alignItems: 'flex-end' },
  jrHeroKana: { color: '#6B7280', fontSize: 11, fontWeight: '700' },
  jrHeroPlace: { color: JR_HEADER_GREEN, fontSize: 20, fontWeight: '800', marginTop: 2 },
  jrHeroDestTap: {
    maxWidth: '100%',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 77, 46, 0.35)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(53, 168, 110, 0.06)',
  },
  jrHeroDestTapPressed: {
    backgroundColor: 'rgba(53, 168, 110, 0.14)',
    borderColor: JR_HEADER_GREEN,
    borderStyle: 'solid',
  },
  jrHeroPlaceUnset: {
    color: JR_HEADER_GREEN,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
  },
  jrHeroDestHint: {
    color: '#35A86E',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  jrGoBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: JR_HEADER_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jrGoBtnText: { color: JR_TEXT_ON_GREEN, fontSize: 18, fontWeight: '900' },
  jrHeroHint: { color: '#6B7280', fontSize: 12, marginTop: 12, lineHeight: 18 },
  jrHeroSearchInline: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E4E4EA',
  },
  jrHeroSearchLabel: {
    color: '#34525F',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
  },
  jrHeroSearchInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E4E4EA',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#34525F',
    fontSize: 17,
  },
  jrHeroSearchInputFocused: {
    borderColor: JR_HEADER_GREEN,
    backgroundColor: '#FFFFFF',
  },
  jrHeroSearchStatus: { color: '#6B7280', fontSize: 12, marginTop: 8, fontWeight: '600' },
  jrHeroSearchFoot: { color: '#6B7280', fontSize: 12, marginTop: 10, lineHeight: 18 },
  jrChipStrip: { paddingHorizontal: 12, paddingVertical: 10, gap: 10 },
  jrChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
    borderWidth: 2,
    borderColor: '#E4E4EA',
    maxWidth: 200,
  },
  jrChipActive: {
    borderColor: JR_HEADER_GREEN,
    backgroundColor: 'rgba(0, 100, 50, 0.06)',
  },
  jrChipTitle: { color: '#34525F', fontSize: 14, fontWeight: '800' },
  jrChipTitleActive: { color: JR_HEADER_GREEN },
  jrChipSub: { color: '#6B7280', fontSize: 11, marginTop: 4, fontWeight: '600' },
  jrChipSubActive: { color: '#34525F' },
  jrChipMeta: { color: '#6B7280', fontSize: 11, marginTop: 6, fontWeight: '700' },
  jrChipMetaActive: { color: JR_HEADER_GREEN },
  jrTabScreenHeader: {
    backgroundColor: JR_HEADER_GREEN,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  jrTabScreenTitle: { color: JR_TEXT_ON_GREEN, fontSize: 18, fontWeight: '800' },
  jrTabScreenSub: { color: JR_MUTED_ON_GREEN, fontSize: 12, marginTop: 6, lineHeight: 17 },
  statusCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginTop: 10,
    padding: 14,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E4E4EA',
    gap: 12,
  },
  statusIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIconText: { fontSize: 18, fontWeight: '900' },
  statusBody: { flex: 1, minWidth: 0 },
  statusName: { color: '#34525F', fontSize: 16, fontWeight: '800' },
  statusBadge: { color: '#6B7280', fontSize: 11, fontWeight: '700', marginTop: 2 },
  statusTitle: { color: '#111827', fontSize: 15, fontWeight: '800', marginTop: 6 },
  statusDetail: { color: '#6B7280', fontSize: 12, lineHeight: 18, marginTop: 4 },
  facilityCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginTop: 12,
    padding: 16,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E4E4EA',
  },
  facilityCardTitle: { color: JR_HEADER_GREEN, fontSize: 17, fontWeight: '800', marginBottom: 10 },
  facilitySectionHead: { color: '#34525F', fontSize: 14, fontWeight: '800', marginTop: 12 },
  facilityBody: { color: '#4B5563', fontSize: 13, lineHeight: 21, marginTop: 6 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E4E4EA',
  },
  topBarTitles: { flex: 1, paddingRight: 8 },
  brandLine: { color: '#34525F', fontSize: 17, fontWeight: '800', letterSpacing: 0.3 },
  brandSub: { color: '#6B7280', fontSize: 11, fontWeight: '600', marginTop: 2, letterSpacing: 0.3 },
  vehicleStrip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E4E4EA',
  },
  vehicleStripText: { color: '#58A573', fontSize: 12, fontWeight: '700' },
  mapOpenBtn: {
    backgroundColor: '#35A86E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 52,
    alignItems: 'center',
  },
  mapOpenBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  destinationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E4E4EA',
    gap: 10,
  },
  destinationBarLeft: { flex: 1 },
  destinationBarLabel: { color: '#9CA3AF', fontSize: 10, fontWeight: '700', marginBottom: 2 },
  destinationBarName: { color: '#34525F', fontSize: 15, fontWeight: '700' },
  destinationChangeBtn: {
    backgroundColor: '#EFEFF4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E4E4EA',
  },
  destinationChangeBtnText: { color: '#34525F', fontSize: 13, fontWeight: '700' },
  errorBanner: {
    color: '#E3596E',
    textAlign: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  legendRow: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendLine: { width: 24, height: 4, borderRadius: 2 },
  legendLabel: { color: '#6B7280', fontSize: 11 },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E4E4EA',
  },
  summaryMain: { flex: 1 },
  summaryEta: { color: '#34525F', fontSize: 28, fontWeight: '800' },
  summaryDetail: { color: '#6B7280', fontSize: 13, marginTop: 4 },
  summaryRoads: { color: '#34525F', fontSize: 14 },
  departBtn: {
    backgroundColor: '#35A86E',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
  },
  departBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  stopBtn: { backgroundColor: '#E3596E' },
  listSectionTitle: {
    color: '#34525F',
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: '#EFEFF4',
    letterSpacing: 0.3,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E4E4EA',
  },
  listRowMain: { flex: 1, paddingRight: 8 },
  listRowTitle: { color: '#34525F', fontSize: 16, lineHeight: 22, fontWeight: '600' },
  listRowChevron: { color: '#C7C7CC', fontSize: 22, fontWeight: '300' },
  listRowOnDark: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    marginHorizontal: 12,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
  },
  listRowTitleOnDark: { color: TD_TEXT, fontSize: 16, lineHeight: 22, fontWeight: '600' },
  listRowChevronOnDark: { color: TD_TEXT_MUTED, fontSize: 22, fontWeight: '300' },
  stepRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingRight: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E4E4EA',
  },
  stepRowOnLeg: {
    backgroundColor: 'rgba(53, 168, 110, 0.06)',
  },
  stepRowNext: {
    borderLeftWidth: 3,
    borderLeftColor: '#35A86E',
    paddingLeft: 9,
  },
  stepTimeCol: {
    width: 56,
    paddingLeft: 12,
    paddingRight: 4,
    justifyContent: 'flex-start',
  },
  stepTimeMain: { color: '#34525F', fontSize: 14, fontWeight: '800', textAlign: 'right' },
  stepRail: { width: 36, alignItems: 'center' },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#35A86E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotLg: { width: 30, height: 30, borderRadius: 15 },
  stepDotText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  stepLine: {
    width: 3,
    flex: 1,
    minHeight: 24,
    backgroundColor: '#E4E4EA',
    marginVertical: 2,
  },
  stepBody: { flex: 1, paddingBottom: 4, minWidth: 0 },
  stepName: { color: '#34525F', fontSize: 15, fontWeight: '700' },
  stepBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  stepBadge: {
    backgroundColor: '#1D9EBF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stepBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  tollBadge: {
    backgroundColor: 'rgba(53, 168, 110, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tollBadgeText: { color: '#35A86E', fontSize: 10, fontWeight: '700' },
  restPlanBadge: {
    backgroundColor: 'rgba(29, 158, 191, 0.18)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  restPlanBadgeText: { color: '#1D9EBF', fontSize: 10, fontWeight: '800' },
  stepMeta: { color: '#6B7280', fontSize: 12, marginTop: 4 },
  stepSegment: { color: '#58A573', fontSize: 11, marginTop: 6 },
  emptyBox: { padding: 32, alignItems: 'center' },
  emptyText: { color: '#9CA3AF', fontSize: 14, textAlign: 'center' },
  emptyBoxTransit: { padding: 28, alignItems: 'center', backgroundColor: TD_BG },
  emptyTextTransit: { color: TD_TEXT_MUTED, fontSize: 14, textAlign: 'center', lineHeight: 21 },
  settingsSection: {
    marginHorizontal: 12,
    marginTop: 10,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E4E4EA',
  },
  settingsSectionMuted: {
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#EFEFF4',
    borderRadius: 8,
  },
  settingsSectionTitle: { color: '#34525F', fontSize: 15, fontWeight: '800', marginBottom: 8 },
  settingsSectionLead: { color: '#6B7280', fontSize: 12, lineHeight: 18, marginBottom: 12 },
  settingsBody: { color: '#6B7280', fontSize: 13, lineHeight: 20 },
  dimRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  dimLabel: { width: 88, color: '#34525F', fontSize: 14, fontWeight: '700' },
  dimInput: {
    flex: 1,
    backgroundColor: '#EFEFF4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E4E4EA',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#34525F',
    fontSize: 16,
  },
  saveHint: { color: '#35A86E', fontSize: 12, fontWeight: '700', marginBottom: 8 },
  saveTruckBtn: {
    marginTop: 4,
    backgroundColor: '#35A86E',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveTruckBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  fixedFooter: {
    backgroundColor: TD_TAB_BAR,
  },
  tabBar: {
    flexDirection: 'row',
    paddingTop: 2,
  },
  tabItem: { flex: 1, alignItems: 'center', minWidth: 0 },
  tabItemInner: { alignItems: 'center', paddingVertical: 6 },
  tabLabelJr: {
    color: TD_TEXT_MUTED,
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
  },
  tabLabelJrActive: { color: TD_ACCENT },
  tabSubJr: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 8,
    fontWeight: '600',
    marginTop: 1,
    textAlign: 'center',
  },
  tabSubJrActive: { color: TD_TEXT },
  mapModalRoot: { flex: 1, backgroundColor: '#000' },
  mapModalTopChrome: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    elevation: 20,
    backgroundColor: '#FFFFFF',
  },
  mapModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FFFFFF',
  },
  mapCloseBtn: { padding: 12 },
  mapCloseBtnText: { color: '#35A86E', fontSize: 16, fontWeight: '700' },
  mapModalTitle: { color: '#34525F', fontSize: 16, fontWeight: '800' },
  mapHeaderSpacer: { width: 60 },
  mapHintBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  mapHintModalText: { color: '#6B7280', fontSize: 12 },
  leftRail: { position: 'absolute', left: 10, top: '38%', zIndex: 30, elevation: 30 },
  railCluster: {
    backgroundColor: 'rgba(17,24,39,0.9)',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 10,
  },
  railBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  railBtnText: { color: '#fff', fontSize: 22, fontWeight: '300' },
  compass: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  compassN: { color: '#dc2626', fontWeight: '900', fontSize: 16 },
  layersBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(17,24,39,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  layersBtnText: { color: '#e5e7eb', fontSize: 13, fontWeight: '700' },
  rightRail: { position: 'absolute', right: 12, bottom: 48, zIndex: 30, elevation: 30 },
  locateFab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#35A86E',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  locateFabText: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
  vehicleArrow: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  vehicleArrowGlyph: {
    color: '#ef4444',
    fontSize: 26,
    marginTop: -4,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  goalBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ec4899',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  goalLetter: { color: '#fff', fontWeight: '900', fontSize: 16 },
});
