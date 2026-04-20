import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import type {
  NavigationMapRef,
  NavigationMapViewProps,
} from './navigationMapTypes';
import { WF_LINE_CYAN, WF_PRIMARY } from './wireframeTheme';

const markerStyles = StyleSheet.create({
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

export const NavigationMapView = forwardRef<NavigationMapRef, NavigationMapViewProps>(
  function NavigationMapView(
    {
      mapType,
      mapRegion,
      onRegionChangeComplete,
      onLongPress,
      currentLocation,
      destination,
      waypoints,
      activeRoute,
      selectedRouteId,
    },
    ref,
  ) {
    const innerRef = useRef<MapView>(null);

    useImperativeHandle(ref, () => ({
      animateToRegion: (region, duration = 0) => {
        innerRef.current?.animateToRegion(region, duration);
      },
      fitToCoordinates: (coordinates, options) => {
        innerRef.current?.fitToCoordinates(coordinates, options);
      },
    }));

    return (
      <MapView
        ref={innerRef}
        style={StyleSheet.absoluteFillObject}
        mapType={mapType}
        showsUserLocation
        region={mapRegion}
        onRegionChangeComplete={onRegionChangeComplete}
        onLongPress={onLongPress}
      >
        {currentLocation && (
          <Marker
            coordinate={{ latitude: currentLocation.lat, longitude: currentLocation.lng }}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            <View style={markerStyles.vehicleArrow}>
              <Text style={markerStyles.vehicleArrowGlyph}>▲</Text>
            </View>
          </Marker>
        )}
        {destination && (
          <Marker
            coordinate={{ latitude: destination.lat, longitude: destination.lng }}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            <View style={markerStyles.goalBubble}>
              <Text style={markerStyles.goalLetter}>G</Text>
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
                strokeColor={seg.isToll ? WF_PRIMARY : WF_LINE_CYAN}
          />
        ))}
      </MapView>
    );
  },
);
