import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from "react-native";

import ModeOfTransport from "./ModeOfTransport";
import GlassCard from "./ui/GlassCard";

interface LocationInfoCardProps {
  name: string;
  address?: string;
  eta?: string;
  distance?: string;
  distanceKm?: number;
  driveDurationMin?: number;
  onCreateActivity: () => void;
  onClearRoute?: () => void;
  isLoading?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = (SCREEN_WIDTH - 64) * 0.35;

function SwipeButton({
  onSwipeLeft,
  onSwipeRight,
  isLoading,
}: {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  isLoading?: boolean;
}) {
  const pan = useRef(new Animated.Value(0)).current;
  const activated = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => !isLoading,
      onPanResponderMove: (_, gestureState) => {
        const newValue = Math.max(
          -SWIPE_THRESHOLD * 1.2,
          Math.min(SWIPE_THRESHOLD * 1.2, gestureState.dx),
        );
        pan.setValue(newValue);

        if (!activated.current) {
          if (Math.abs(gestureState.dx) >= SWIPE_THRESHOLD) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            activated.current = true;
          }
        } else if (Math.abs(gestureState.dx) < SWIPE_THRESHOLD) {
          activated.current = false;
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx >= SWIPE_THRESHOLD) {
          onSwipeRight();
        } else if (gestureState.dx <= -SWIPE_THRESHOLD) {
          onSwipeLeft();
        }

        Animated.spring(pan, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 8,
        }).start();
        activated.current = false;
      },
    }),
  ).current;

  const translateX = pan;
  const rotate = pan.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD],
    outputRange: ["-15deg", "0deg", "15deg"],
    extrapolate: "clamp",
  });

  const leftOpacity = pan.interpolate({
    inputRange: [-SWIPE_THRESHOLD, -SWIPE_THRESHOLD / 2, 0],
    outputRange: [1, 0.5, 0],
    extrapolate: "clamp",
  });

  const rightOpacity = pan.interpolate({
    inputRange: [0, SWIPE_THRESHOLD / 2, SWIPE_THRESHOLD],
    outputRange: [0, 0.5, 1],
    extrapolate: "clamp",
  });

  return (
    <View className="h-16 w-full bg-white/10 rounded-2xl mt-4 overflow-hidden border border-white/10 justify-center">
      <View className="absolute inset-0 flex-row items-center justify-between px-6">
        <Animated.View
          style={{ opacity: leftOpacity }}
          className="flex-row items-center"
        >
          <Ionicons name="trash-outline" size={20} color="#f87171" />
          <Text className="text-red-400 font-bold ml-2">Cancel</Text>
        </Animated.View>
        <Animated.View
          style={{ opacity: rightOpacity }}
          className="flex-row items-center"
        >
          <Text className="text-blue-400 font-bold mr-2">Create</Text>
          <Ionicons name="checkmark-circle-outline" size={20} color="#60a5fa" />
        </Animated.View>
      </View>

      <Animated.View
        {...panResponder.panHandlers}
        style={{
          transform: [{ translateX }, { rotate }],
        }}
        className="absolute self-center"
      >
        <View className="bg-brand-primary h-14 w-[160px] rounded-xl flex-row items-center justify-center shadow-lg border border-white/20">
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="swap-horizontal" size={20} color="white" />
              <Text className="text-white font-extrabold ml-2">
                Swipe to Act
              </Text>
            </>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

export default function LocationInfoCard({
  name,
  address,
  eta,
  distance,
  distanceKm,
  driveDurationMin,
  onCreateActivity,
  onClearRoute,
  isLoading,
}: LocationInfoCardProps) {
  // Slide-up entrance animation
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        speed: 14,
        bounciness: 6,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [translateY, opacity]);

  return (
    <Animated.View
      style={[styles.wrapper, { transform: [{ translateY }], opacity }]}
    >
      <GlassCard style={styles.card} variant="dark">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-1 mr-4">
            <Text
              className="text-xl font-bold text-white mb-1"
              numberOfLines={1}
            >
              {name}
            </Text>
            {address && (
              <Text
                className="text-white/80 text-sm font-medium"
                numberOfLines={2}
              >
                {address}
              </Text>
            )}
          </View>
          {(eta || distance) && (
            <View className="items-end">
              {eta && (
                <Text className="text-white font-extrabold text-lg">{eta}</Text>
              )}
              {distance && (
                <Text className="text-white/60 text-xs font-bold uppercase tracking-tight">
                  {distance}
                </Text>
              )}
            </View>
          )}
        </View>

        {distanceKm !== undefined && driveDurationMin !== undefined && (
          <ModeOfTransport
            distanceKm={distanceKm}
            driveDurationMin={driveDurationMin}
            variant="dark"
          />
        )}

        <SwipeButton
          onSwipeLeft={onClearRoute || (() => {})}
          onSwipeRight={onCreateActivity}
          isLoading={isLoading}
        />
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    zIndex: 50,
  },
  card: {
    borderRadius: 24,
    padding: 20,
    elevation: 8,
  },
});
