import { useEffect } from 'react';
import { COLORS } from '@/lib/theme';
import { useReducedMotion } from '@/lib/accessibility';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { Map, CalendarDays, MessageCircle, Users, UserRound } from 'lucide-react-native';
import { Pressable, View, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const TAB_ICONS = {
  'map/index': Map,
  activities: CalendarDays,
  chats: MessageCircle,
  community: Users,
  profile: UserRound,
} as const;

const TAB_LABELS: Record<string, string> = {
  'map/index': 'Map',
  activities: 'Activities',
  chats: 'Chats',
  community: 'Community',
  profile: 'Profile',
};

function TabBarItem({
  route,
  isFocused,
  onPress,
  onLongPress,
  reduceMotion,
}: {
  route: string;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  reduceMotion: boolean;
}) {
  const scale = useSharedValue(1);
  const progress = useSharedValue(isFocused ? 1 : 0);

  // Update progress when focus changes safely inside useEffect
  useEffect(() => {
    if (isFocused) {
      progress.value = reduceMotion ? 1 : withTiming(1, { duration: 250 });
    } else {
      progress.value = reduceMotion ? 0 : withTiming(0, { duration: 250 });
    }
  }, [isFocused, reduceMotion, progress]);

  const IconComponent = TAB_ICONS[route as keyof typeof TAB_ICONS];
  const label = TAB_LABELS[route] || route;

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const iconColor = isFocused ? COLORS.primary : COLORS.textSecondary;

  const handlePressIn = () => {
    scale.value = reduceMotion ? 0.9 : withSpring(0.9, { stiffness: 300, damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = reduceMotion ? 1 : withSpring(1, { stiffness: 300, damping: 15 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={`${label} tab`}
      onPress={handlePress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        minHeight: 44, // DESIGN.md: 44px min touch target
        minWidth: 44,
      }}
    >
      <Animated.View style={animatedIconStyle}>
        {IconComponent && (
          <IconComponent
            size={24}
            color={iconColor}
            strokeWidth={isFocused ? 2.5 : 2}
          />
        )}
      </Animated.View>
      <Text
        style={{
          fontFamily: isFocused ? 'Inter_600SemiBold' : 'Inter_500Medium',
          fontSize: 11,
          color: iconColor,
          marginTop: 4,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Custom animated bottom tab bar per DESIGN.md Section 5 + 6b.
 *
 * Features:
 * - Lucide icons with scale + color transitions
 * - Haptic feedback on tab press
 * - 44×44px minimum touch targets
 * - Reduced-motion support
 * - Teal-700 active color, text-secondary inactive
 */
export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const reduceMotion = useReducedMotion();

  // Hide tabs that have href: null or route name 'index'
  const visibleRoutes = state.routes.filter((route) => {
    if (route.name === 'index') return false;
    const options = descriptors[route.key]?.options;
    return (options as any)?.href !== null;
  });

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: COLORS.surface,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingBottom: 20, // safe area padding
        paddingTop: 4,
      }}
    >
      {visibleRoutes.map((route) => {
        const isFocused = state.index === state.routes.indexOf(route);

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TabBarItem
            key={route.key}
            route={route.name}
            isFocused={isFocused}
            onPress={onPress}
            onLongPress={onLongPress}
            reduceMotion={reduceMotion}
          />
        );
      })}
    </View>
  );
}
