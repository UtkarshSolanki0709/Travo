import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, {
  Circle,
  ClipPath,
  Defs,
  G,
  LinearGradient,
  Path,
  Polygon,
  Rect,
  Stop,
} from "react-native-svg";
import Animated, {
  cancelAnimation,
  createAnimatedComponent,
  Easing,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useReducedMotion } from "@/lib/accessibility";
import { analytics } from "@/services/analytics";
import { CATEGORY_COLORS, COLORS } from "@/lib/theme";

const AnimatedG = createAnimatedComponent(G);
const AnimatedRect = createAnimatedComponent(Rect);
const AnimatedCircle = createAnimatedComponent(Circle);

// Matches expo-splash-screen backgroundColor in app.json so the handoff from
// the native splash to this route is a seamless same-color frame.
const SPLASH_BG = "#fdfbf7";
const SEEN_KEY = "intro_v1_seen";

// Pure worklet easing curves (Reanimated's Easing factories aren't directly
// callable inside worklets).
function easeOut(x: number) {
  "worklet";
  return 1 - Math.pow(1 - x, 3);
}
function easeInOut(x: number) {
  "worklet";
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}
function easeOutBack(x: number) {
  "worklet";
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

type Timeline = {
  duration: number;
  dot: [number, number];
  rings: [number, number] | null;
  flight: [number, number];
  dots: [number, number] | null;
  pin: [number, number];
  word: [number, number];
  tag: [number, number];
  skipIn: number; // 0 = no skip UI
};

const TIMELINES: Record<"full" | "micro", Timeline> = {
  full: {
    duration: 3000,
    dot: [0.02, 0.1],
    rings: [0.03, 0.16],
    flight: [0.1, 0.55],
    dots: [0.28, 0.52],
    pin: [0.55, 0.67],
    word: [0.66, 0.8],
    tag: [0.75, 0.89],
    skipIn: 0.16,
  },
  micro: {
    duration: 1150,
    dot: [0, 0.1],
    rings: null,
    flight: [0.06, 0.58],
    dots: null,
    pin: [0.58, 0.7],
    word: [0.68, 0.84],
    tag: [0.8, 0.95],
    skipIn: 0,
  },
};

// Meetup dots along the route: [x fraction, y fraction, category color]
const DOTS: [number, number, string][] = [
  [0.2, 0.46, CATEGORY_COLORS.music.light],
  [0.3, 0.66, CATEGORY_COLORS.food.light],
  [0.47, 0.6, CATEGORY_COLORS.sports.light],
  [0.55, 0.72, CATEGORY_COLORS.nightlife.light],
  [0.56, 0.2, CATEGORY_COLORS.arts.light],
];

function clamp01(x: number) {
  "worklet";
  return Math.min(1, Math.max(0, x));
}
function seg(t: number, a: number, b: number) {
  "worklet";
  return clamp01((t - a) / (b - a || 1));
}

function PopDot({
  t,
  w,
  h,
  fx,
  fy,
  color,
  at,
  dur,
  u,
}: {
  t: SharedValue<number>;
  w: number;
  h: number;
  fx: number;
  fy: number;
  color: string;
  at: number;
  dur: number;
  u: number;
}) {
  const dotProps = useAnimatedProps(() => {
    const e = easeOutBack(clamp01((t.value - at) / dur));
    return { opacity: clamp01(e * 1.4), r: 7 * u * (0.55 + 0.45 * e) };
  });
  return (
    <AnimatedCircle
      cx={w * fx}
      cy={h * fy}
      r={7 * u}
      fill={color}
      stroke="#ffffff"
      strokeWidth={2.5 * u}
      opacity={0}
      animatedProps={dotProps}
    />
  );
}

// Folded Pin geometry: plane pointing +x in local units, nose at (30, 0).
// Facets per ICON spec: gradient upper wing, darkened lower wing, navy keel,
// white spine crease.
const PLANE_UPPER = "M30 0 L-18 -16 L2 2 Z";
const PLANE_LOWER = "M30 0 L2 2 L-16 9 Z";
const PLANE_KEEL = "M2 2 L-8 13 L-13 4 Z";
const PLANE_SPINE = "M30 0 L2 2";

export default function IntroScreen() {
  const router = useRouter();
  const { width: w, height: h } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();

  const [variant, setVariant] = useState<"loading" | "full" | "micro">(
    "loading",
  );

  const t = useSharedValue(0);
  const reveal = useSharedValue(0);
  const doneRef = useRef(false);
  const skippedRef = useRef(false);
  const startRef = useRef(0);
  const variantRef = useRef<"full" | "micro">("full");

  useEffect(() => {
    AsyncStorage.getItem(SEEN_KEY)
      .then((seen) => setVariant(seen ? "micro" : "full"))
      .catch(() => setVariant("full"));
  }, []);

  const navigateAway = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    void analytics.track("intro_complete", {
      variant: variantRef.current,
      skipped: skippedRef.current,
    });
    router.replace("/sign-in");
  }, [router]);

  const TL = TIMELINES[variant === "micro" ? "micro" : "full"];

  useEffect(() => {
    if (variant === "loading") return;
    startRef.current = Date.now();
    variantRef.current = variant === "micro" ? "micro" : "full";
    if (reduced) {
      // Reduced motion: static final frame, opacity-only fade.
      t.value = 1;
      reveal.value = withTiming(1, { duration: 400 });
      const id = setTimeout(navigateAway, 1100);
      return () => {
        clearTimeout(id);
        cancelAnimation(reveal);
      };
    }
    if (variant === "full") {
      AsyncStorage.setItem(SEEN_KEY, "1").catch(() => {});
    }
    reveal.value = 1;
    t.value = withTiming(
      1,
      { duration: TL.duration, easing: Easing.linear },
      (finished) => {
        if (finished) scheduleOnRN(navigateAway);
      },
    );
    return () => {
      cancelAnimation(t);
      cancelAnimation(reveal);
    };
  }, [variant, reduced, t, reveal, navigateAway, TL]);

  const fireLandingHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, []);

  useAnimatedReaction(
    () => t.value >= TL.pin[0] + 0.02,
    (hit, prev) => {
      if (hit && !prev && !reduced) scheduleOnRN(fireLandingHaptic);
    },
    [TL, reduced, fireLandingHaptic],
  );

  const onSkip = useCallback(() => {
    if (Date.now() - startRef.current < 600) return;
    skippedRef.current = true;
    t.value = withTiming(
      1,
      { duration: 350, easing: Easing.linear },
      (finished) => {
        if (finished) scheduleOnRN(navigateAway);
      },
    );
  }, [navigateAway, t]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onSkip();
      return true;
    });
    return () => sub.remove();
  }, [onSkip]);

  // ── Scene geometry (responsive: everything is a fraction of w/h) ──
  const u = Math.min(w, 480) / 390;
  const P0 = { x: w * 0.14, y: h * 0.74 };
  const PC = { x: w * 0.42, y: h * 0.72 };
  const P2 = { x: w * 0.66, y: h * 0.34 };
  const hexR = 15 * u;
  const planeScale = 1.15 * u;
  const wordSize = Math.min(56, w * 0.135);
  const tagSize = Math.min(17, w * 0.042);
  const wordTop = h * 0.62;

  const trailD = `M ${P0.x} ${P0.y} Q ${PC.x} ${PC.y} ${P2.x} ${P2.y}`;
  const hexPoints = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const a = (Math.PI / 3) * i - Math.PI / 2;
        return `${(hexR * Math.cos(a)).toFixed(2)},${(hexR * Math.sin(a)).toFixed(2)}`;
      }).join(" "),
    [hexR],
  );

  // Quadratic flight path: plane and trail reveal share the same parametric
  // curve, so the trail is always revealed exactly under the plane.
  const qx = (s: number) => {
    "worklet";
    return (1 - s) * (1 - s) * P0.x + 2 * (1 - s) * s * PC.x + s * s * P2.x;
  };
  const qy = (s: number) => {
    "worklet";
    return (1 - s) * (1 - s) * P0.y + 2 * (1 - s) * s * PC.y + s * s * P2.y;
  };
  const qdx = (s: number) => {
    "worklet";
    return 2 * (1 - s) * (PC.x - P0.x) + 2 * s * (P2.x - PC.x);
  };
  const qdy = (s: number) => {
    "worklet";
    return 2 * (1 - s) * (PC.y - P0.y) + 2 * s * (P2.y - PC.y);
  };

  const originProps = useAnimatedProps(() => ({
    opacity: seg(t.value, TL.dot[0], TL.dot[1]),
  }));

  const ringsProps = useAnimatedProps(() => ({
    opacity: TL.rings ? 0.07 * seg(t.value, TL.rings[0], TL.rings[1]) : 0,
  }));

  const revealProps = useAnimatedProps(() => {
    const rawT = t.value;
    if (rawT < TL.flight[0]) {
      return { width: 0 };
    }
    const flightT = seg(rawT, TL.flight[0], TL.flight[1]);
    const s = easeInOut(flightT);
    return {
      width: flightT >= 1 ? w : qx(s) + 26 * u,
    };
  });

  const planeProps = useAnimatedProps(() => {
    const s = easeInOut(seg(t.value, TL.flight[0], TL.flight[1]));
    const ang = (Math.atan2(qdy(s), qdx(s)) * 180) / Math.PI;
    const pop = easeOut(seg(t.value, TL.flight[0], TL.flight[0] + 0.07));
    return {
      transform: [
        { translateX: qx(s) },
        { translateY: qy(s) },
        { rotate: `${ang}deg` },
        { scale: planeScale * (0.85 + 0.15 * pop) },
      ],
      opacity: clamp01(pop * 1.6),
    };
  });

  const hexProps = useAnimatedProps(() => {
    const e = easeOutBack(seg(t.value, TL.pin[0], TL.pin[1]));
    return {
      opacity: clamp01(e),
      transform: [
        { translateX: P2.x },
        { translateY: P2.y },
        { scale: 0.6 + 0.4 * e },
      ],
    };
  });

  const wordStyle = useAnimatedStyle(() => {
    const e = easeOut(seg(t.value, TL.word[0], TL.word[1]));
    return { opacity: e, transform: [{ translateY: (1 - e) * 16 }] };
  });
  const tagStyle = useAnimatedStyle(() => {
    const e = easeOut(seg(t.value, TL.tag[0], TL.tag[1]));
    return { opacity: e, transform: [{ translateY: (1 - e) * 12 }] };
  });
  const skipStyle = useAnimatedStyle(() => ({
    opacity: TL.skipIn > 0 ? seg(t.value, TL.skipIn, TL.skipIn + 0.08) : 0,
  }));
  const rootStyle = useAnimatedStyle(() => ({ opacity: reveal.value }));

  const dotsWindow = TL.dots;

  return (
    <>
      <Stack.Screen
        options={{ animation: "fade", animationDuration: 240 }}
      />
      <StatusBar style="dark" />
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, rootStyle]}>
          {variant !== "loading" && (
            <>
              <Svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`}>
                <Defs>
                  <ClipPath id="trailReveal">
                    <AnimatedRect
                      x={0}
                      y={0}
                      height={h}
                      width={0}
                      animatedProps={revealProps}
                    />
                  </ClipPath>
                  <LinearGradient id="planeGrad" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0" stopColor="#14b8a6" />
                    <Stop offset="0.4" stopColor="#14b8a6" />
                    <Stop offset="0.78" stopColor="#f59e0b" />
                    <Stop offset="1" stopColor="#f59e0b" />
                  </LinearGradient>
                </Defs>

                {/* Contour rings, upper-left, paper-map texture */}
                <AnimatedG animatedProps={ringsProps} opacity={0}>
                  <Circle
                    cx={w * 0.13}
                    cy={h * 0.18}
                    r={34 * u}
                    stroke={COLORS.primary}
                    strokeWidth={1.5}
                    fill="none"
                  />
                  <Circle
                    cx={w * 0.13}
                    cy={h * 0.18}
                    r={64 * u}
                    stroke={COLORS.primary}
                    strokeWidth={1.5}
                    fill="none"
                  />
                </AnimatedG>

                {/* Dotted trail, revealed under the plane */}
                <G clipPath="url(#trailReveal)">
                  <Path
                    d={trailD}
                    stroke={COLORS.primary}
                    strokeWidth={3 * u}
                    strokeLinecap="round"
                    strokeDasharray={`0.5 ${12 * u}`}
                    fill="none"
                  />
                </G>

                {/* Origin: "you are here" pin dot */}
                <AnimatedCircle
                  cx={P0.x}
                  cy={P0.y}
                  r={6 * u}
                  fill={COLORS.textPrimary}
                  stroke="#ffffff"
                  strokeWidth={2 * u}
                  opacity={0}
                  animatedProps={originProps}
                />

                {/* Interest meetups along the route */}
                {dotsWindow &&
                  DOTS.map(([fx, fy, color], i) => (
                    <PopDot
                      key={i}
                      t={t}
                      w={w}
                      h={h}
                      fx={fx}
                      fy={fy}
                      color={color}
                      at={dotsWindow[0] + i * 0.045}
                      dur={0.09}
                      u={u}
                    />
                  ))}

                {/* Destination hexagon marker */}
                <AnimatedG animatedProps={hexProps} opacity={0}>
                  <Polygon points={hexPoints} fill={COLORS.textPrimary} />
                  <Circle cx={0} cy={0} r={hexR * 0.32} fill="#ffffff" />
                </AnimatedG>

                {/* The Folded Pin */}
                <AnimatedG animatedProps={planeProps} opacity={0}>
                  <Path d={PLANE_UPPER} fill="url(#planeGrad)" />
                  <Path d={PLANE_LOWER} fill="#0f766e" />
                  <Path d={PLANE_KEEL} fill={COLORS.textPrimary} />
                  <Path
                    d={PLANE_SPINE}
                    stroke="#ffffff"
                    strokeWidth={1.6 * u}
                    strokeLinecap="round"
                    fill="none"
                  />
                </AnimatedG>
              </Svg>

              <Animated.View
                style={[
                  styles.wordBlock,
                  { top: wordTop },
                  wordStyle,
                ]}
                pointerEvents="none"
              >
                <Text
                  style={{
                    fontSize: wordSize,
                    fontFamily: "Poppins_800ExtraBold",
                    color: COLORS.textPrimary,
                    letterSpacing: -1,
                  }}
                >
                  Trav
                  <Text style={{ color: COLORS.secondary }}>o</Text>
                </Text>
              </Animated.View>
              <Animated.View
                style={[styles.wordBlock, { top: wordTop + wordSize * 1.15 + 8 }, tagStyle]}
                pointerEvents="none"
              >
                <Text
                  style={{
                    fontSize: tagSize,
                    fontFamily: "Inter_400Regular",
                    color: COLORS.textSecondary,
                  }}
                >
                  Find your people, wherever.
                </Text>
              </Animated.View>

              {variant === "full" && (
                <Pressable
                  style={StyleSheet.absoluteFill}
                  onPress={onSkip}
                  accessibilityRole="button"
                  accessibilityLabel="Skip intro"
                >
                  {({ pressed }) => (
                    <Animated.View
                      style={[
                        styles.skipPill,
                        {
                          bottom: insets.bottom + 24,
                          backgroundColor: pressed
                            ? "rgba(15, 23, 41, 0.14)"
                            : "rgba(15, 23, 41, 0.07)",
                        },
                        skipStyle,
                      ]}
                    >
                      <Text style={styles.skipText}>Skip</Text>
                    </Animated.View>
                  )}
                </Pressable>
              )}
            </>
          )}
        </Animated.View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: SPLASH_BG,
  },
  wordBlock: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  skipPill: {
    position: "absolute",
    right: 24,
    backgroundColor: "rgba(15, 23, 41, 0.07)",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  skipText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.textSecondary,
  },
});
