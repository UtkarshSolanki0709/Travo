import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { CATEGORY_COLORS, COLORS } from '@/lib/theme';
import { useReducedMotion } from '@/lib/accessibility';

export interface MapMarkerProps {
  category?: string;
  isSelected?: boolean;
  isCluster?: boolean;
  clusterCount?: number;
  isUserLocation?: boolean;
  IconComponent?: React.ComponentType<{ size: number; color: string }>;
}

export function MapMarker({
  category = 'food',
  isSelected = false,
  isCluster = false,
  clusterCount = 1,
  isUserLocation = false,
  IconComponent,
}: MapMarkerProps) {
  const reduceMotion = useReducedMotion();

  const scale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.4);
  const pulseScale = useSharedValue(1);

  // Selected state spring scale
  useEffect(() => {
    if (reduceMotion) {
      scale.value = isSelected ? 1.15 : 1;
      return;
    }
    scale.value = withSpring(isSelected ? 1.15 : 1, {
      stiffness: 200,
      damping: 15,
    });
  }, [isSelected, reduceMotion, scale]);

  // User location pulse animation
  useEffect(() => {
    if (!isUserLocation || reduceMotion) {
      pulseOpacity.value = 0.4;
      pulseScale.value = 1;
      return;
    }

    pulseOpacity.value = withRepeat(
      withTiming(0, { duration: 1500 }),
      -1,
      false
    );
    pulseScale.value = withRepeat(
      withTiming(2.2, { duration: 1500 }),
      -1,
      false
    );
  }, [isUserLocation, reduceMotion, pulseOpacity, pulseScale]);

  const animatedMarkerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedPulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
    transform: [{ scale: pulseScale.value }],
  }));

  // User location pulsing marker
  if (isUserLocation) {
    return (
      <View style={styles.userLocationContainer}>
        <Animated.View style={[styles.userLocationPulse, animatedPulseStyle]} />
        <View style={styles.userLocationDot} />
      </View>
    );
  }

  // Cluster marker
  if (isCluster) {
    return (
      <Animated.View style={[styles.markerContainer, animatedMarkerStyle]}>
        <View style={styles.clusterBadge}>
          <Text style={styles.clusterText}>{clusterCount}</Text>
        </View>
      </Animated.View>
    );
  }

  // Category Hexagon Marker
  const catColor = CATEGORY_COLORS[category.toLowerCase()]?.light ?? COLORS.primary;
  const textColor = CATEGORY_COLORS[category.toLowerCase()]?.text ?? '#ffffff';

  return (
    <Animated.View style={[styles.markerContainer, animatedMarkerStyle]}>
      <Svg width={44} height={50} viewBox="0 0 44 50">
        {/* Hexagon points: (22,2) top, (42,13), (42,35), (22,48) bottom point, (2,35), (2,13) */}
        <Polygon
          points="22,2 42,13 42,35 22,48 2,35 2,13"
          fill={catColor}
          stroke={isSelected ? COLORS.accent : COLORS.surface}
          strokeWidth={isSelected ? 3 : 2}
        />
      </Svg>

      {/* Center Icon */}
      {IconComponent ? (
        <View style={styles.iconContainer}>
          <IconComponent size={18} color={textColor} />
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  markerContainer: {
    width: 44,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    position: 'absolute',
    top: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clusterBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.textPrimary,
    borderWidth: 3,
    borderColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  clusterText: {
    color: COLORS.surface,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  userLocationContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userLocationPulse: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  userLocationDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.primary,
    borderWidth: 2.5,
    borderColor: COLORS.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
});
