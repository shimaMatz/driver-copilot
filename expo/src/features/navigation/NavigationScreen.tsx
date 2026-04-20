import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  ListRenderItem,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationMapView } from './NavigationMapView';
import type { MapLongPressNativeEvent, NavigationMapRef, NavigationMapRegion } from './navigationMapTypes';
import { useNavigation } from './useNavigation';
import type { RouteStep } from './navigationApiClient';
import { computeRouteProgress } from './routeProgress';
import { formatDurationJa } from './routeSummary';
import { formatHighwayStepTitle } from './routeStepDisplay';
import type { RouteFlowPhase, TopSearchTab } from './routeFlowTypes';
import {
  RouteProposalView,
  type ProposalColumnModel,
  type ProposalFilterTab,
} from './RouteProposalView';
import { DepartureTimeBottomSheet, type DepartureTripKind } from './DepartureTimeBottomSheet';
import { HighwayGuidanceShell } from './HighwayGuidanceShell';
import { RouteTabListHeader } from './RouteTabListHeader';
import { SearchBottomSheet } from './SearchBottomSheet';
import { TopSearchTabs } from './TopSearchTabs';
import { SaPaInfoWireframe } from './SaPaInfoWireframe';
import { SettingsWireframe } from './SettingsWireframe';
import {
  WF_BG,
  WF_BORDER,
  WF_CARD,
  WF_ERROR,
  WF_LINE_CYAN,
  WF_PRIMARY,
  WF_PRIMARY_FADE,
  WF_PRIMARY_FADE_STRONG,
  WF_SECTION_BG,
  WF_TEXT,
  WF_TEXT_MUTED,
  WF_WHITE,
} from './wireframeTheme';
import { useTruckProfile } from './useTruckProfile';

type BottomTab = 'route' | 'facility' | 'more';
type BottomSheetMode = 'destination' | 'waypoint' | 'departureTime' | null;

type IonName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ITEMS: { key: BottomTab; label: string; iconOutline: IonName; iconFilled: IonName }[] = [
  { key: 'route', label: '経路', iconOutline: 'map-outline', iconFilled: 'map' },
  { key: 'facility', label: 'SA/PA情報', iconOutline: 'storefront-outline', iconFilled: 'storefront' },
  { key: 'more', label: '設定', iconOutline: 'settings-outline', iconFilled: 'settings' },
];

function formatJapaneseDepartureLine(d: Date, kind: DepartureTripKind = 'departure'): string {
  const wk = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()] ?? '日';
  const mo = d.getMonth() + 1;
  const day = d.getDate();
  const h = d.getHours();
  const mi = d.getMinutes();
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  const tail = kind === 'arrival' ? '到着' : '出発';
  return `${mo}月${day}日(${wk}) ${pad(h)}:${pad(mi)} ${tail}`;
}

/** 経路ヘッダー（現在時刻行）用の短い時刻表記 */
function formatRouteHeaderTimeLine(d: Date): string {
  const pad2 = (n: number) => (n < 10 ? `0${n}` : String(n));
  const now = new Date();
  const sameCalendarDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const hm = `${d.getHours()}:${pad2(d.getMinutes())}`;
  if (sameCalendarDay) return hm;
  return `${d.getMonth() + 1}/${d.getDate()} ${hm}`;
}

const ZOOM_FACTOR = 0.55;

type StepRow = { key: string; kind: 'step'; step: RouteStep; index: number };

type MainListItem = StepRow;

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
  const mapRef = useRef<NavigationMapRef>(null);
  const [mapVisible, setMapVisible] = useState(false);
  const [originAddressLine, setOriginAddressLine] = useState('東京都港区六本木 1-6-1');
  const [selectedWaypoints, setSelectedWaypoints] = useState<string[]>([]);
  const [selectedDepartureAt, setSelectedDepartureAt] = useState(() => new Date());
  const [departureTripKind, setDepartureTripKind] = useState<DepartureTripKind>('departure');
  /** 出発時刻シートで「設定する」を押したあと、ヘッダーを数値時刻＋出発/到着に切り替える */
  const [departureTimeCommitted, setDepartureTimeCommitted] = useState(false);
  const [bottomSheetMode, setBottomSheetMode] = useState<BottomSheetMode>(null);
  const bottomSheetModeRef = useRef<BottomSheetMode>(null);
  const openBottomSheet = useCallback((mode: Exclude<BottomSheetMode, null>) => {
    setBottomSheetMode(mode);
  }, []);
  const closeBottomSheet = useCallback(() => {
    setBottomSheetMode(null);
  }, []);
  const onDepartureTimeConfirm = useCallback((next: Date, kind: DepartureTripKind) => {
    setSelectedDepartureAt(next);
    setDepartureTripKind(kind);
    setDepartureTimeCommitted(true);
    setBottomSheetMode(null);
  }, []);
  const onSearchBottomSheetSelect = useCallback((name: string) => {
    const mode = bottomSheetModeRef.current;
    if (mode === 'waypoint') {
      setSelectedWaypoints(prev => {
        if (prev.length >= 5) return prev;
        return [...prev, name];
      });
    } else if (mode === 'destination') {
      setDestinationQuery(name);
    }
    setBottomSheetMode(null);
  }, []);
  const onRemoveWaypoint = useCallback((index: number) => {
    setSelectedWaypoints(prev => prev.filter((_, i) => i !== index));
  }, []);

  useEffect(() => {
    bottomSheetModeRef.current = bottomSheetMode;
  }, [bottomSheetMode]);
  const [mapRegion, setMapRegion] = useState<NavigationMapRegion>({
    latitude: 35.681236,
    longitude: 139.767125,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [selectedRouteId, setSelectedRouteId] = useState<'general' | 'toll'>('toll');
  const [bottomTab, setBottomTab] = useState<BottomTab>('route');
  const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard');
  const [topSearchTab, setTopSearchTab] = useState<TopSearchTab>('editor');
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
    destinationQuery,
    setDestinationQuery,
    isSuggesting,
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
      return [];
    }
    return [];
  }, [bottomTab, routeFlowPhase, destination]);

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
    (event: MapLongPressNativeEvent) => {
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

  const swapOriginDestination = useCallback(() => {
    const q = destinationQuery.trim();
    const o = originAddressLine;
    setOriginAddressLine(q || '現在地付近');
    setDestinationQuery(o);
    openBottomSheet('destination');
  }, [destinationQuery, originAddressLine, openBottomSheet, setDestinationQuery]);

  const onApplyRecentSearch = useCallback(
    (query: string) => {
      setTopSearchTab('editor');
      setDestinationQuery(query);
    },
    [setDestinationQuery],
  );

  const routeProgress = useMemo(
    () =>
      computeRouteProgress(
        currentLocation,
        activeRoute?.steps ?? [],
        activeRoute?.polylinePoints ?? [],
      ),
    [currentLocation, activeRoute?.steps, activeRoute?.polylinePoints],
  );

  const routeListHeader = useMemo(
    () => (
      <RouteTabListHeader
        topSearchTab={topSearchTab}
        hasDestination={hasDestination}
        destinationQuery={destinationQuery}
        isSuggesting={isSuggesting}
        isFetchingRoute={isFetchingRoute}
        tollRoute={tollRoute}
        generalRoute={generalRoute}
        onPressGoProposals={() => setRouteFlowPhase('proposals')}
        onOpenBottomSheet={(mode: 'destination' | 'waypoint') => openBottomSheet(mode)}
        onOpenDepartureBottomSheet={() => openBottomSheet('departureTime')}
        routeTimePrimaryLabel={
          departureTimeCommitted ? formatRouteHeaderTimeLine(selectedDepartureAt) : '現在時刻'
        }
        routeTimeKindLabel={
          departureTimeCommitted ? (departureTripKind === 'arrival' ? '到着' : '出発') : '出発'
        }
        selectedWaypoints={selectedWaypoints}
        onRemoveWaypoint={onRemoveWaypoint}
        originAddressLine={originAddressLine}
        onSwapOriginDestination={swapOriginDestination}
        onApplyRecentSearch={onApplyRecentSearch}
        error={error}
      />
    ),
    [
      hasDestination,
      destinationQuery,
      isSuggesting,
      isFetchingRoute,
      error,
      setDestinationQuery,
      insets.top,
      topSearchTab,
      tollRoute,
      generalRoute,
      openBottomSheet,
      originAddressLine,
      swapOriginDestination,
      onApplyRecentSearch,
      selectedWaypoints,
      onRemoveWaypoint,
      departureTimeCommitted,
      selectedDepartureAt,
      departureTripKind,
    ],
  );

  const renderItem: ListRenderItem<MainListItem> = useCallback(
    ({ item }) => {
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
    [activeRoute?.steps, routeProgress],
  );

  const listEmpty = useMemo(() => {
    return null;
  }, [hasDestination, isFetchingRoute, routeFlowPhase]);

  const hasProposalRoutes = proposalColumns.some(c => c.route);

  return (
    <View style={styles.screenRoot}>
      <View style={styles.contentFill}>
        {bottomTab === 'route' && routeFlowPhase !== 'guidance' ? (
          <TopSearchTabs
            insetsTop={insets.top}
            topSearchTab={topSearchTab}
            onTopSearchTab={setTopSearchTab}
          />
        ) : null}

        {bottomTab === 'route' && routeFlowPhase === 'guidance' && destination ? (
          <HighwayGuidanceShell
            steps={activeRoute?.steps ?? []}
            routeProgress={routeProgress ?? null}
            currentLocation={currentLocation}
            distanceMeters={activeRoute?.distanceMeters ?? 0}
            durationSeconds={activeRoute?.durationSeconds ?? 0}
            destinationLabel={destinationQuery.trim() || '目的地'}
            isNavigating={isNavigating}
            insetsTop={insets.top}
            insetsBottom={insets.bottom}
            onOpenMap={() => setMapVisible(true)}
            onStopNavigation={stopNavigation}
            error={error}
          />
        ) : null}

        {bottomTab === 'route' && routeFlowPhase === 'proposals' ? (
          hasProposalRoutes ? (
            <RouteProposalView
              originLabel="現在地"
              destLabel={destinationQuery.trim() || '目的地'}
              departureLine={formatJapaneseDepartureLine(selectedDepartureAt, departureTripKind)}
              departureBase={selectedDepartureAt}
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

        {bottomTab === 'route' && routeFlowPhase !== 'proposals' && routeFlowPhase !== 'guidance' ? (
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
          <SaPaInfoWireframe
            insetsTop={insets.top}
            insetsBottom={insets.bottom}
            currentLocation={currentLocation}
            routeSteps={activeRoute?.steps ?? []}
          />
        ) : null}

        {bottomTab === 'more' ? (
          <SettingsWireframe
            insetsTop={insets.top}
            insetsBottom={insets.bottom}
            truckLen={truckLen}
            truckWid={truckWid}
            truckHgt={truckHgt}
            setTruckLen={setTruckLen}
            setTruckWid={setTruckWid}
            setTruckHgt={setTruckHgt}
            truckSaveHint={truckSaveHint}
            onSaveTruck={() => void handleSaveTruckProfile()}
          />
        ) : null}
      </View>

      <View style={[styles.fixedFooter, { paddingBottom: Math.max(insets.bottom, 6) }]}>
        <View style={styles.tabBar}>
          {TAB_ITEMS.map(t => {
            const active = bottomTab === t.key;
            const color = active ? WF_PRIMARY : WF_TEXT_MUTED;
            return (
              <TouchableOpacity
                key={t.key}
                style={styles.tabItem}
                onPress={() => setBottomTab(t.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={t.label}
              >
                <View style={styles.tabItemInner}>
                  <Ionicons name={active ? t.iconFilled : t.iconOutline} size={22} color={color} />
                  <Text style={[styles.tabBarLabel, active && styles.tabBarLabelActive]} numberOfLines={1}>
                    {t.label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <SearchBottomSheet
        visible={bottomSheetMode === 'destination' || bottomSheetMode === 'waypoint'}
        mode={bottomSheetMode === 'waypoint' ? 'waypoint' : 'destination'}
        onClose={() => setBottomSheetMode(null)}
        onSelect={onSearchBottomSheetSelect}
      />

      <DepartureTimeBottomSheet
        visible={bottomSheetMode === 'departureTime'}
        value={selectedDepartureAt}
        onClose={closeBottomSheet}
        onConfirm={onDepartureTimeConfirm}
      />

      <Modal visible={mapVisible} animationType="slide" onRequestClose={() => setMapVisible(false)}>
        <View style={styles.mapModalRoot}>
          <NavigationMapView
            ref={mapRef}
            mapType={mapType}
            mapRegion={mapRegion}
            onRegionChangeComplete={setMapRegion}
            onLongPress={handleMapLongPress}
            currentLocation={currentLocation}
            destination={destination}
            waypoints={waypoints}
            activeRoute={activeRoute}
            selectedRouteId={selectedRouteId}
          />

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
  screenRoot: { flex: 1, backgroundColor: WF_BG },
  contentFill: { flex: 1, backgroundColor: WF_BG },
  proposalFallback: {
    flex: 1,
    backgroundColor: WF_BG,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  proposalFallbackText: { color: WF_TEXT_MUTED, fontSize: 15, textAlign: 'center', fontWeight: '600' },
  proposalFallbackBtn: {
    marginTop: 20,
    backgroundColor: WF_PRIMARY,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 10,
  },
  proposalFallbackBtnText: { color: WF_WHITE, fontSize: 16, fontWeight: '900' },
  flatList: { flex: 1 },
  flatListContent: { paddingBottom: 8 },
  flatListFill: { flexGrow: 1, justifyContent: 'center' },
  tabBody: { flex: 1, backgroundColor: WF_BG },
  jrHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: WF_PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  jrHeaderTextCol: { flex: 1, paddingRight: 10 },
  jrHeaderTitle: { color: WF_WHITE, fontSize: 18, fontWeight: '800' },
  jrHeaderSub: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 4, fontWeight: '600' },
  jrMapBtn: {
    borderWidth: 1,
    borderColor: WF_WHITE,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  jrMapBtnText: { color: WF_WHITE, fontWeight: '800', fontSize: 13 },
  jrHeroCard: {
    backgroundColor: WF_CARD,
    marginHorizontal: 12,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: WF_BORDER,
  },
  jrHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  jrHeroCol: { flex: 1, minWidth: 0 },
  jrHeroColEnd: { alignItems: 'flex-end' },
  jrHeroKana: { color: WF_TEXT_MUTED, fontSize: 11, fontWeight: '700' },
  jrHeroPlace: { color: WF_PRIMARY, fontSize: 20, fontWeight: '800', marginTop: 2 },
  jrHeroDestTap: {
    maxWidth: '100%',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(74, 119, 60, 0.35)',
    borderStyle: 'dashed',
    backgroundColor: WF_PRIMARY_FADE,
  },
  jrHeroDestTapPressed: {
    backgroundColor: WF_PRIMARY_FADE_STRONG,
    borderColor: WF_PRIMARY,
    borderStyle: 'solid',
  },
  jrHeroPlaceUnset: {
    color: WF_PRIMARY,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
  },
  jrHeroDestHint: {
    color: WF_PRIMARY,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  jrGoBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: WF_PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jrGoBtnText: { color: WF_WHITE, fontSize: 18, fontWeight: '900' },
  jrHeroHint: { color: WF_TEXT_MUTED, fontSize: 12, marginTop: 12, lineHeight: 18 },
  jrHeroSearchInline: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: WF_BORDER,
  },
  jrHeroSearchLabel: {
    color: WF_TEXT,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
  },
  jrHeroSearchInput: {
    backgroundColor: WF_SECTION_BG,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: WF_BORDER,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: WF_TEXT,
    fontSize: 17,
  },
  jrHeroSearchInputFocused: {
    borderColor: WF_PRIMARY,
    backgroundColor: WF_CARD,
  },
  jrHeroSearchStatus: { color: WF_TEXT_MUTED, fontSize: 12, marginTop: 8, fontWeight: '600' },
  jrHeroSearchFoot: { color: WF_TEXT_MUTED, fontSize: 12, marginTop: 10, lineHeight: 18 },
  jrChipStrip: { paddingHorizontal: 12, paddingVertical: 10, gap: 10 },
  jrChip: {
    backgroundColor: WF_CARD,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
    borderWidth: 2,
    borderColor: WF_BORDER,
    maxWidth: 200,
  },
  jrChipActive: {
    borderColor: WF_PRIMARY,
    backgroundColor: WF_PRIMARY_FADE,
  },
  jrChipTitle: { color: WF_TEXT, fontSize: 14, fontWeight: '800' },
  jrChipTitleActive: { color: WF_PRIMARY },
  jrChipSub: { color: WF_TEXT_MUTED, fontSize: 11, marginTop: 4, fontWeight: '600' },
  jrChipSubActive: { color: WF_TEXT },
  jrChipMeta: { color: WF_TEXT_MUTED, fontSize: 11, marginTop: 6, fontWeight: '700' },
  jrChipMetaActive: { color: WF_PRIMARY },
  jrTabScreenHeader: {
    backgroundColor: WF_PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  jrTabScreenTitle: { color: WF_WHITE, fontSize: 18, fontWeight: '800' },
  jrTabScreenSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 6, lineHeight: 17 },
  statusCard: {
    flexDirection: 'row',
    backgroundColor: WF_CARD,
    marginHorizontal: 12,
    marginTop: 10,
    padding: 14,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: WF_BORDER,
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
  statusName: { color: WF_TEXT, fontSize: 16, fontWeight: '800' },
  statusBadge: { color: WF_TEXT_MUTED, fontSize: 11, fontWeight: '700', marginTop: 2 },
  statusTitle: { color: WF_TEXT, fontSize: 15, fontWeight: '800', marginTop: 6 },
  statusDetail: { color: WF_TEXT_MUTED, fontSize: 12, lineHeight: 18, marginTop: 4 },
  facilityCard: {
    backgroundColor: WF_CARD,
    marginHorizontal: 12,
    marginTop: 12,
    padding: 16,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: WF_BORDER,
  },
  facilityCardTitle: { color: WF_PRIMARY, fontSize: 17, fontWeight: '800', marginBottom: 10 },
  facilitySectionHead: { color: WF_TEXT, fontSize: 14, fontWeight: '800', marginTop: 12 },
  facilityBody: { color: WF_TEXT_MUTED, fontSize: 13, lineHeight: 21, marginTop: 6 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
    backgroundColor: WF_CARD,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: WF_BORDER,
  },
  topBarTitles: { flex: 1, paddingRight: 8 },
  brandLine: { color: WF_TEXT, fontSize: 17, fontWeight: '800', letterSpacing: 0.3 },
  brandSub: { color: WF_TEXT_MUTED, fontSize: 11, fontWeight: '600', marginTop: 2, letterSpacing: 0.3 },
  vehicleStrip: {
    backgroundColor: WF_CARD,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: WF_BORDER,
  },
  vehicleStripText: { color: WF_PRIMARY, fontSize: 12, fontWeight: '700' },
  mapOpenBtn: {
    backgroundColor: WF_PRIMARY,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 52,
    alignItems: 'center',
  },
  mapOpenBtnText: { color: WF_WHITE, fontWeight: '800', fontSize: 13 },
  destinationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: WF_CARD,
    borderBottomWidth: 1,
    borderBottomColor: WF_BORDER,
    gap: 10,
  },
  destinationBarLeft: { flex: 1 },
  destinationBarLabel: { color: WF_TEXT_MUTED, fontSize: 10, fontWeight: '700', marginBottom: 2 },
  destinationBarName: { color: WF_TEXT, fontSize: 15, fontWeight: '700' },
  destinationChangeBtn: {
    backgroundColor: WF_SECTION_BG,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: WF_BORDER,
  },
  destinationChangeBtnText: { color: WF_TEXT, fontSize: 13, fontWeight: '700' },
  errorBanner: {
    color: WF_ERROR,
    textAlign: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: WF_CARD,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: WF_CARD,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendLine: { width: 24, height: 4, borderRadius: 2 },
  legendLabel: { color: WF_TEXT_MUTED, fontSize: 11 },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: WF_CARD,
    borderBottomWidth: 1,
    borderBottomColor: WF_BORDER,
  },
  summaryMain: { flex: 1 },
  summaryEta: { color: WF_TEXT, fontSize: 28, fontWeight: '800' },
  summaryDetail: { color: WF_TEXT_MUTED, fontSize: 13, marginTop: 4 },
  summaryRoads: { color: WF_TEXT, fontSize: 14 },
  departBtn: {
    backgroundColor: WF_PRIMARY,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
  },
  departBtnText: { color: WF_WHITE, fontWeight: '800', fontSize: 15 },
  stopBtn: { backgroundColor: WF_ERROR },
  listSectionTitle: {
    color: WF_TEXT,
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: WF_SECTION_BG,
    letterSpacing: 0.3,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WF_CARD,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: WF_BORDER,
  },
  listRowMain: { flex: 1, paddingRight: 8 },
  listRowTitle: { color: WF_TEXT, fontSize: 16, lineHeight: 22, fontWeight: '600' },
  listRowChevron: { color: WF_BORDER, fontSize: 22, fontWeight: '300' },
  stepRow: {
    flexDirection: 'row',
    backgroundColor: WF_CARD,
    paddingVertical: 10,
    paddingRight: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: WF_BORDER,
  },
  stepRowOnLeg: {
    backgroundColor: WF_PRIMARY_FADE,
  },
  stepRowNext: {
    borderLeftWidth: 3,
    borderLeftColor: WF_PRIMARY,
    paddingLeft: 9,
  },
  stepTimeCol: {
    width: 56,
    paddingLeft: 12,
    paddingRight: 4,
    justifyContent: 'flex-start',
  },
  stepTimeMain: { color: WF_TEXT, fontSize: 14, fontWeight: '800', textAlign: 'right' },
  stepRail: { width: 36, alignItems: 'center' },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: WF_PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotLg: { width: 30, height: 30, borderRadius: 15 },
  stepDotText: { color: WF_WHITE, fontSize: 11, fontWeight: '800' },
  stepLine: {
    width: 3,
    flex: 1,
    minHeight: 24,
    backgroundColor: WF_BORDER,
    marginVertical: 2,
  },
  stepBody: { flex: 1, paddingBottom: 4, minWidth: 0 },
  stepName: { color: WF_TEXT, fontSize: 15, fontWeight: '700' },
  stepBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  stepBadge: {
    backgroundColor: WF_LINE_CYAN,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stepBadgeText: { color: WF_WHITE, fontSize: 10, fontWeight: '700' },
  tollBadge: {
    backgroundColor: WF_PRIMARY_FADE_STRONG,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tollBadgeText: { color: WF_PRIMARY, fontSize: 10, fontWeight: '700' },
  restPlanBadge: {
    backgroundColor: 'rgba(29, 158, 191, 0.18)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  restPlanBadgeText: { color: WF_LINE_CYAN, fontSize: 10, fontWeight: '800' },
  stepMeta: { color: WF_TEXT_MUTED, fontSize: 12, marginTop: 4 },
  stepSegment: { color: WF_PRIMARY, fontSize: 11, marginTop: 6 },
  emptyBox: { padding: 32, alignItems: 'center' },
  emptyText: { color: WF_TEXT_MUTED, fontSize: 14, textAlign: 'center' },
  emptyBoxTransit: { padding: 28, alignItems: 'center', backgroundColor: WF_BG },
  emptyTextTransit: { color: WF_TEXT_MUTED, fontSize: 14, textAlign: 'center', lineHeight: 21 },
  settingsSection: {
    marginHorizontal: 12,
    marginTop: 10,
    padding: 16,
    backgroundColor: WF_CARD,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: WF_BORDER,
  },
  settingsSectionMuted: {
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 24,
    padding: 16,
    backgroundColor: WF_SECTION_BG,
    borderRadius: 8,
  },
  settingsSectionTitle: { color: WF_TEXT, fontSize: 15, fontWeight: '800', marginBottom: 8 },
  settingsSectionLead: { color: WF_TEXT_MUTED, fontSize: 12, lineHeight: 18, marginBottom: 12 },
  settingsBody: { color: WF_TEXT_MUTED, fontSize: 13, lineHeight: 20 },
  dimRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  dimLabel: { width: 88, color: WF_TEXT, fontSize: 14, fontWeight: '700' },
  dimInput: {
    flex: 1,
    backgroundColor: WF_SECTION_BG,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: WF_BORDER,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: WF_TEXT,
    fontSize: 16,
  },
  saveHint: { color: WF_PRIMARY, fontSize: 12, fontWeight: '700', marginBottom: 8 },
  saveTruckBtn: {
    marginTop: 4,
    backgroundColor: WF_PRIMARY,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveTruckBtnText: { color: WF_WHITE, fontWeight: '800', fontSize: 15 },
  fixedFooter: {
    backgroundColor: WF_CARD,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: WF_BORDER,
  },
  tabBar: {
    flexDirection: 'row',
    paddingTop: 3,
    paddingBottom: 0,
  },
  tabItem: { flex: 1, alignItems: 'center', minWidth: 0 },
  tabItemInner: { alignItems: 'center', justifyContent: 'center', paddingVertical: 2 },
  tabBarLabel: {
    marginTop: 4,
    color: WF_TEXT_MUTED,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  tabBarLabelActive: { color: WF_PRIMARY },
  mapModalRoot: { flex: 1, backgroundColor: '#000' },
  mapModalTopChrome: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    elevation: 20,
    backgroundColor: WF_CARD,
  },
  mapModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: WF_CARD,
  },
  mapCloseBtn: { padding: 12 },
  mapCloseBtnText: { color: WF_PRIMARY, fontSize: 16, fontWeight: '700' },
  mapModalTitle: { color: WF_TEXT, fontSize: 16, fontWeight: '800' },
  mapHeaderSpacer: { width: 60 },
  mapHintBar: {
    backgroundColor: WF_CARD,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  mapHintModalText: { color: WF_TEXT_MUTED, fontSize: 12 },
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
    backgroundColor: WF_PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  locateFabText: { color: WF_WHITE, fontSize: 22, fontWeight: '800' },
});
