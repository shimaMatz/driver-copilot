import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import {
  DirectionsRoute,
  fetchDirectionsRoute,
  fetchPlaceSuggestions,
  resolvePlaceToLatLng,
} from './navigationApiClient';
export interface LatLng {
  lat: number;
  lng: number;
}

export function useNavigation() {
  const [isLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LatLng | null>(null);
  const [destination, setDestinationState] = useState<LatLng | null>(null);
  const [waypoints, setWaypoints] = useState<LatLng[]>([]);
  const [destinationQuery, setDestinationQuery] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [generalRoute, setGeneralRoute] = useState<DirectionsRoute | null>(null);
  const [tollRoute, setTollRoute] = useState<DirectionsRoute | null>(null);
  const [isFetchingRoute, setIsFetchingRoute] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    void (async () => {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') return;
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCurrentLocation({ lat: current.coords.latitude, lng: current.coords.longitude });
    })();
  }, []);

  useEffect(() => {
    return () => {
      locationSubscription.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!currentLocation || !destination) {
      setGeneralRoute(null);
      setTollRoute(null);
      return;
    }
    setIsFetchingRoute(true);
    void (async () => {
      try {
        const [general, toll] = await Promise.all([
          fetchDirectionsRoute(currentLocation, destination, waypoints, true),
          fetchDirectionsRoute(currentLocation, destination, waypoints, false),
        ]);
        setGeneralRoute(general);
        setTollRoute(toll);
      } catch {
        setGeneralRoute(null);
        setTollRoute(null);
      } finally {
        setIsFetchingRoute(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination, waypoints]);

  const setDestination = useCallback((latlng: LatLng | null) => {
    setDestinationState(latlng);
  }, []);

  const addWaypoint = useCallback((point: LatLng) => {
    setWaypoints(prev => [...prev, point]);
  }, []);

  /** 入力文字列から候補 API の先頭をジオコーディングし、目的地を確定（一覧は出さない） */
  useEffect(() => {
    const q = destinationQuery.trim();
    if (q.length < 2) {
      setIsSuggesting(false);
      return;
    }
    if (destination !== null) {
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        setIsSuggesting(true);
        try {
          const list = await fetchPlaceSuggestions(q);
          if (cancelled) return;
          const first = list[0];
          if (!first) return;
          const latlng = await resolvePlaceToLatLng(first.placeId);
          if (cancelled) return;
          if (!latlng) return;
          setDestinationState(latlng);
          setDestinationQuery(first.description);
        } finally {
          if (!cancelled) setIsSuggesting(false);
        }
      })();
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [destinationQuery, destination]);

  const startNavigation = useCallback(async (): Promise<boolean> => {
    if (!destination) return false;
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') {
      setError('位置情報の権限が必要です');
      return false;
    }
    locationSubscription.current?.remove();
    locationSubscription.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 10 },
      pos => {
        setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
    );
    setIsNavigating(true);
    setError(null);
    return true;
  }, [destination]);

  const stopNavigation = useCallback(() => {
    locationSubscription.current?.remove();
    locationSubscription.current = null;
    setIsNavigating(false);
  }, []);

  return {
    isLoading,
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
    isSuggesting,
    waypoints,
    addWaypoint,
    generalRoute,
    tollRoute,
  };
}
