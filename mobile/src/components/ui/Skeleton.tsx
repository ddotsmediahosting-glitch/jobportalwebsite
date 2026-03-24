import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.base,
        { width: width as ViewStyle['width'], height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

export function JobCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Skeleton width={44} height={44} borderRadius={10} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Skeleton height={14} width="60%" style={{ marginBottom: 6 }} />
          <Skeleton height={12} width="40%" />
        </View>
      </View>
      <Skeleton height={18} style={{ marginTop: 12, marginBottom: 8 }} />
      <Skeleton height={12} width="70%" />
    </View>
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: '#e5e7eb' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
});
