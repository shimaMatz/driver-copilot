import type { DirectionsRoute } from './navigationApiClient';

export type NavigationMapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

/** react-native-maps の LongPress と同形（Web バンドルから maps を除外するためここで定義） */
export type MapLongPressNativeEvent = {
  nativeEvent: { coordinate: { latitude: number; longitude: number } };
};

export type NavigationMapRef = {
  animateToRegion: (region: NavigationMapRegion, duration?: number) => void;
  fitToCoordinates: (
    coordinates: Array<{ latitude: number; longitude: number }>,
    options: {
      edgePadding: { top: number; right: number; bottom: number; left: number };
      animated: boolean;
    },
  ) => void;
};

export type NavigationMapViewProps = {
  mapType: 'standard' | 'satellite';
  mapRegion: NavigationMapRegion;
  onRegionChangeComplete: (region: NavigationMapRegion) => void;
  onLongPress: (event: MapLongPressNativeEvent) => void;
  currentLocation: { lat: number; lng: number } | null;
  destination: { lat: number; lng: number } | null;
  waypoints: Array<{ lat: number; lng: number }>;
  activeRoute: DirectionsRoute | null;
  selectedRouteId: 'general' | 'toll';
};
