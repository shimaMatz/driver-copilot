import React, { forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NavigationMapRef, NavigationMapViewProps } from './navigationMapTypes';
import { WF_BG, WF_PRIMARY, WF_TEXT_MUTED } from './wireframeTheme';

export const NavigationMapView = forwardRef<NavigationMapRef, NavigationMapViewProps>(
  function NavigationMapView(_props, ref) {
    useImperativeHandle(ref, () => ({
      animateToRegion: () => {},
      fitToCoordinates: () => {},
    }));

    return (
      <View style={[StyleSheet.absoluteFillObject, styles.wrap]}>
        <Text style={styles.title}>地図は Web 未対応</Text>
        <Text style={styles.body}>
          react-native-maps はネイティブ専用のため、ブラウザでは表示できません。iOS / Android
          ビルドで地図をご利用ください。
        </Text>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: WF_BG,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: WF_PRIMARY,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  body: {
    color: WF_TEXT_MUTED,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 320,
  },
});
