import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BackHandler,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
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
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import Animated, {
  cancelAnimation,
  createAnimatedComponent,
  Easing,
  FadeIn,
  runOnJS,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { ArrowRight, Compass, MapPin, Sparkles, Users } from "lucide-react-native";
import { useReducedMotion } from "@/lib/accessibility";
import { analytics } from "@/services/analytics";
import { CATEGORY_COLORS, COLORS } from "@/lib/theme";

const AnimatedG = createAnimatedComponent(G);
const AnimatedRect = createAnimatedComponent(Rect);
const AnimatedCircle = createAnimatedComponent(Circle);

const SEEN_KEY = "intro_v1_seen";

// Worklet easing curves
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
function clamp01(x: number) {
  "worklet";
  return Math.min(1, Math.max(0, x));
}
function seg(t: number, a: number, b: number) {
  "worklet";
  return clamp01((t - a) / (b - a || 1));
}

// Sculpted Origami Jet Geometry (nose at 36, 0)
const PLANE_UPPER = "M 36 0 L -22 -24 L 4 3 Z";
const PLANE_LOWER = "M 36 0 L 4 3 L -20 13 Z";
const PLANE_KEEL = "M 4 3 L -10 18 L -16 6 Z";
const PLANE_SPINE = "M 36 0 L 4 3";

export default function IntroScreen() {
  const router = useRouter();
  const { width: w, height: h } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();

  const [hasStarted, setHasStarted] = useState(false);
  const t = useSharedValue(0);
  const pulse = useSharedValue(0);
  const cardReveal = useSharedValue(0);

  const doneRef = useRef(false);
  const skippedRef = useRef(false);

  // Layout scale units
  const u = Math.min(w, 480) / 390;
  const canvasH = Math.round(h * 0.50);

  // Responsive Flight Geometry across the upper canvas
  const P0 = { x: Math.round(w * 0.12), y: Math.round(canvasH * 0.76) }; // Origin
  const PC = { x: Math.round(w * 0.44), y: Math.round(canvasH * 0.68) }; // Curve peak control
  const P2 = { x: Math.round(w * 0.82), y: Math.round(canvasH * 0.22) }; // Destination

  // Waypoints placed naturally along the flight arc
  const waypoints = useMemo(
    () => [
      {
        id: "sports",
        name: "Mountain Trek",
        attendees: "+4",
        color: CATEGORY_COLORS.sports.light,
        atProgress: 0.28,
        pos: { x: Math.round(w * 0.28), y: Math.round(canvasH * 0.62) },
      },
      {
        id: "food",
        name: "Street Food Tour",
        attendees: "+6",
        color: CATEGORY_COLORS.food.light,
        atProgress: 0.48,
        pos: { x: Math.round(w * 0.48), y: Math.round(canvasH * 0.44) },
      },
      {
        id: "music",
        name: "Sunset Jam",
        attendees: "+8",
        color: CATEGORY_COLORS.music.light,
        atProgress: 0.70,
        pos: { x: Math.round(w * 0.68), y: Math.round(canvasH * 0.32) },
      },
    ],
    [w, canvasH],
  );

  // Quadratic flight equations
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

  const trailD = `M ${P0.x} ${P0.y} Q ${PC.x} ${PC.y} ${P2.x} ${P2.y}`;

  const navigateAway = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    AsyncStorage.setItem(SEEN_KEY, "1").catch(() => {});
    void analytics.track("intro_complete", {
      skipped: skippedRef.current,
    });
    router.replace("/sign-in");
  }, [router]);

  // Main animation orchestrator
  useEffect(() => {
    setHasStarted(true);

    if (reduced) {
      t.value = 1;
      cardReveal.value = withTiming(1, { duration: 400 });
      return;
    }

    // Continuous ambient pulse (radar ripples, breathing beacon)
    pulse.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.linear }),
      -1,
      false,
    );

    // Flight progression from 0 to 1 over 3.2 seconds
    t.value = withTiming(
      1,
      { duration: 3200, easing: Easing.bezier(0.25, 0.1, 0.25, 1) },
      (finished) => {
        if (finished) {
          cardReveal.value = withTiming(1, { duration: 400 });
        }
      },
    );

    // Bottom card slides in at landing
    cardReveal.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });

    return () => {
      cancelAnimation(t);
      cancelAnimation(pulse);
      cancelAnimation(cardReveal);
    };
  }, [reduced, t, pulse, cardReveal]);

  // Haptic feedback when the jet touches down at destination
  const fireLandingHaptic = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {},
    );
  }, []);

  useAnimatedReaction(
    () => t.value >= 0.90,
    (hit, prev) => {
      if (hit && !prev && !reduced) {
        runOnJS(fireLandingHaptic)();
      }
    },
    [reduced, fireLandingHaptic],
  );

  const onSkip = useCallback(() => {
    skippedRef.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    navigateAway();
  }, [navigateAway]);

  // Android hardware back button skips intro
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onSkip();
      return true;
    });
    return () => sub.remove();
  }, [onSkip]);

  // Animated SVG props
  const revealProps = useAnimatedProps(() => {
    const currentT = t.value;
    if (currentT <= 0.05) {
      return { width: 0 };
    }
    const flightT = seg(currentT, 0.05, 0.90);
    const s = easeInOut(flightT);
    return {
      width: flightT >= 1 ? w : Math.round(qx(s) + 36 * u),
    };
  });

  const planeProps = useAnimatedProps(() => {
    const currentT = t.value;
    const flightT = seg(currentT, 0.05, 0.90);
    const s = easeInOut(flightT);
    const ang = (Math.atan2(qdy(s), qdx(s)) * 180) / Math.PI;
    const pop = easeOut(seg(currentT, 0.02, 0.12));
    const bob = 2.5 * Math.sin(Math.PI * 4 * currentT);

    return {
      transform: [
        { translateX: qx(s) },
        { translateY: qy(s) + bob },
        { rotate: `${ang}deg` },
        { scale: (1.25 * u) * (0.85 + 0.15 * pop) },
      ],
      opacity: clamp01(pop * 2),
    };
  });

  const destProps = useAnimatedProps(() => {
    const e = easeOutBack(seg(t.value, 0.82, 0.98));
    return {
      opacity: clamp01(e * 1.5),
      transform: [
        { translateX: P2.x },
        { translateY: P2.y },
        { scale: (1.2 * u) * (0.6 + 0.4 * e) },
      ],
    };
  });

  const radarRingsProps = useAnimatedProps(() => {
    const p = pulse.value;
    return {
      r: 12 + p * 28,
      opacity: (1 - p) * 0.45,
    };
  });

  const destRadarProps = useAnimatedProps(() => {
    const active = t.value >= 0.85 ? 1 : 0;
    const p = pulse.value;
    return {
      r: (14 + p * 34) * active,
      opacity: (1 - p) * 0.5 * active,
    };
  });

  const bottomCardStyle = useAnimatedStyle(() => {
    const e = easeOut(cardReveal.value);
    return {
      opacity: e,
      transform: [{ translateY: (1 - e) * 28 }],
    };
  });

  return (
    <>
      <Stack.Screen options={{ animation: "fade", animationDuration: 240 }} />
      <StatusBar style="dark" />

      <ImageBackground
        source={require("@/assets/textures/paper-texture.png")}
        resizeMode="repeat"
        style={styles.root}
      >
        {/* Top Header Controls */}
        <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
          <View style={styles.badgeAirspace}>
            <Compass size={14} color={COLORS.primary} />
            <Text style={styles.badgeAirspaceText}>TRAVO EXPEDITION</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onSkip}
            accessibilityRole="button"
            accessibilityLabel="Skip intro"
            style={styles.skipButton}
          >
            <Text style={styles.skipText}>Skip</Text>
            <ArrowRight size={13} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Upper Animated Flight Arena */}
        <View style={{ height: canvasH, width: w }}>
          <Svg width={w} height={canvasH} viewBox={`0 0 ${w} ${canvasH}`}>
            <Defs>
              <ClipPath id="flightClip">
                <AnimatedRect
                  x={0}
                  y={0}
                  height={canvasH}
                  width={0}
                  animatedProps={revealProps}
                />
              </ClipPath>

              {/* Sunrise gradient for wings */}
              <LinearGradient id="planeSunrise" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor="#0d9488" />
                <Stop offset="0.45" stopColor="#14b8a6" />
                <Stop offset="0.82" stopColor="#f59e0b" />
                <Stop offset="1" stopColor="#ea580c" />
              </LinearGradient>

              {/* Atmosphere Glow Radial Gradients */}
              <RadialGradient id="tealAura" cx="20%" cy="40%" r="50%">
                <Stop offset="0" stopColor="#14b8a6" stopOpacity="0.18" />
                <Stop offset="1" stopColor="#14b8a6" stopOpacity="0" />
              </RadialGradient>

              <RadialGradient id="amberAura" cx="80%" cy="30%" r="50%">
                <Stop offset="0" stopColor="#f59e0b" stopOpacity="0.16" />
                <Stop offset="1" stopColor="#f59e0b" stopOpacity="0" />
              </RadialGradient>
            </Defs>

            {/* Ambient Aurora Glows */}
            <Rect x={0} y={0} width={w} height={canvasH} fill="url(#tealAura)" />
            <Rect x={0} y={0} width={w} height={canvasH} fill="url(#amberAura)" />

            {/* Stylized Flight Latitude/Longitude Arcs & Map Grid */}
            <G opacity={0.35}>
              <Path
                d={`M 0 ${canvasH * 0.35} Q ${w * 0.5} ${canvasH * 0.20} ${w} ${canvasH * 0.40}`}
                stroke={COLORS.primary}
                strokeWidth={1}
                strokeDasharray="4 6"
                fill="none"
              />
              <Path
                d={`M 0 ${canvasH * 0.65} Q ${w * 0.5} ${canvasH * 0.50} ${w} ${canvasH * 0.70}`}
                stroke={COLORS.primary}
                strokeWidth={1}
                strokeDasharray="4 6"
                fill="none"
              />
              <Circle
                cx={w * 0.88}
                cy={canvasH * 0.18}
                r={45}
                stroke={COLORS.primary}
                strokeWidth={1}
                strokeDasharray="2 4"
                fill="none"
              />
            </G>

            {/* Origin Radar Pulse Rings */}
            <AnimatedCircle
              cx={P0.x}
              cy={P0.y}
              r={12}
              stroke={COLORS.primary}
              strokeWidth={1.8}
              fill="none"
              animatedProps={radarRingsProps}
            />

            {/* Destination Radar Pulse Rings */}
            <AnimatedCircle
              cx={P2.x}
              cy={P2.y}
              r={14}
              stroke={COLORS.secondary}
              strokeWidth={2}
              fill="none"
              animatedProps={destRadarProps}
            />

            {/* Flight Trail Glow + Dashed Flight Line */}
            <G clipPath="url(#flightClip)">
              {/* Soft neon underglow */}
              <Path
                d={trailD}
                stroke="#14b8a6"
                strokeWidth={8 * u}
                strokeOpacity={0.25}
                strokeLinecap="round"
                fill="none"
              />
              {/* Crisp high-visibility vector dash */}
              <Path
                d={trailD}
                stroke={COLORS.primary}
                strokeWidth={3 * u}
                strokeLinecap="round"
                strokeDasharray={`0.5 ${10 * u}`}
                fill="none"
              />
            </G>

            {/* Origin Departure Hub */}
            <G>
              <Circle
                cx={P0.x}
                cy={P0.y}
                r={7 * u}
                fill={COLORS.primary}
                stroke="#ffffff"
                strokeWidth={2.5 * u}
              />
              <Circle cx={P0.x} cy={P0.y} r={2.5 * u} fill="#ffffff" />
            </G>

            {/* Social Activity Waypoint Beacons */}
            {waypoints.map((wp) => {
              const active = hasStarted && (reduced || t.value >= wp.atProgress);
              return (
                <G key={wp.id}>
                  {/* Outer ripple halo */}
                  <Circle
                    cx={wp.pos.x}
                    cy={wp.pos.y}
                    r={14 * u}
                    fill={wp.color}
                    fillOpacity={active ? 0.18 : 0.08}
                  />
                  {/* Waypoint center dot */}
                  <Circle
                    cx={wp.pos.x}
                    cy={wp.pos.y}
                    r={6 * u}
                    fill={wp.color}
                    stroke="#ffffff"
                    strokeWidth={2 * u}
                  />
                </G>
              );
            })}

            {/* Destination Hub Hexagon Marker */}
            <AnimatedG animatedProps={destProps} opacity={0}>
              <Polygon
                points={Array.from({ length: 6 }, (_, i) => {
                  const a = (Math.PI / 3) * i - Math.PI / 2;
                  return `${(16 * Math.cos(a)).toFixed(2)},${(16 * Math.sin(a)).toFixed(2)}`;
                }).join(" ")}
                fill={COLORS.textPrimary}
              />
              <Circle cx={0} cy={0} r={5} fill={COLORS.secondary} />
              <Circle cx={0} cy={0} r={2} fill="#ffffff" />
            </AnimatedG>

            {/* The Hero Supersonic Jet */}
            <AnimatedG animatedProps={planeProps} opacity={0}>
              <Path d={PLANE_UPPER} fill="url(#planeSunrise)" />
              <Path d={PLANE_LOWER} fill="#0f766e" />
              <Path d={PLANE_KEEL} fill={COLORS.textPrimary} />
              <Path
                d={PLANE_SPINE}
                stroke="#ffffff"
                strokeWidth={2.2 * u}
                strokeLinecap="round"
                fill="none"
              />
              {/* Wingtip strobe light */}
              <Circle cx={-22} cy={-24} r={2.5} fill="#fef08a" />
            </AnimatedG>
          </Svg>

          {/* Floating Waypoint Micro-Pills (HTML Overlay for crisp rendering) */}
          {waypoints.map((wp) => (
            <Animated.View
              key={wp.id}
              entering={FadeIn.delay(Math.round(wp.atProgress * 2800)).duration(400)}
              style={[
                styles.waypointPill,
                {
                  left: wp.pos.x - 38,
                  top: wp.pos.y + 14,
                  borderColor: wp.color + "44",
                },
              ]}
              pointerEvents="none"
            >
              <View style={[styles.waypointDot, { backgroundColor: wp.color }]} />
              <Text style={styles.waypointText}>{wp.name}</Text>
              <View style={styles.attendeeTag}>
                <Text style={styles.attendeeText}>{wp.attendees}</Text>
              </View>
            </Animated.View>
          ))}
        </View>

        {/* Lower Content Presentation Card */}
        <Animated.View
          style={[
            styles.bottomCard,
            { paddingBottom: insets.bottom > 0 ? insets.bottom + 12 : 24 },
            bottomCardStyle,
          ]}
        >
          {/* Tagline Pill */}
          <View style={styles.heroPill}>
            <Sparkles size={13} color={COLORS.primary} />
            <Text style={styles.heroPillText}>DISCOVER TRAVEL EXPERIENCES</Text>
          </View>

          {/* Bold Brand Title */}
          <Text style={styles.brandTitle}>
            Trav<Text style={{ color: COLORS.secondary }}>o</Text>
          </Text>

          <Text style={styles.tagline}>Find your people, wherever you go.</Text>

          <Text style={styles.description}>
            Join nearby travelers for spontaneous hikes, food tours, live shows,
            and shared journeys around the globe.
          </Text>

          {/* Feature Highlights Row */}
          <View style={styles.featuresRow}>
            <View style={styles.featureItem}>
              <View style={[styles.featureIconWrap, { backgroundColor: "#0d948814" }]}>
                <MapPin size={16} color={COLORS.primary} />
              </View>
              <Text style={styles.featureText}>Live Map</Text>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIconWrap, { backgroundColor: "#f9731614" }]}>
                <Users size={16} color="#f97316" />
              </View>
              <Text style={styles.featureText}>Activities</Text>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIconWrap, { backgroundColor: "#8b5cf614" }]}>
                <Sparkles size={16} color="#8b5cf6" />
              </View>
              <Text style={styles.featureText}>Group Hangouts</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={navigateAway}
              style={styles.primaryButton}
              accessibilityRole="button"
              accessibilityLabel="Get Started with Travo"
            >
              <Text style={styles.primaryButtonText}>Get Started</Text>
              <View style={styles.arrowCircle}>
                <ArrowRight size={18} color="#ffffff" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={navigateAway}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryText}>
                Already have an account?{" "}
                <Text style={{ color: COLORS.primary, fontFamily: "Inter_600SemiBold" }}>
                  Sign In
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ImageBackground>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#fdfbf7",
    justifyContent: "space-between",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    zIndex: 20,
  },
  badgeAirspace: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(13, 148, 136, 0.08)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(13, 148, 136, 0.15)",
  },
  badgeAirspaceText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  skipButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(15, 23, 41, 0.06)",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(15, 23, 41, 0.08)",
  },
  skipText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.textSecondary,
  },
  waypointPill: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    gap: 5,
    shadowColor: "#0f1729",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  waypointDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  waypointText: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    color: COLORS.textPrimary,
  },
  attendeeTag: {
    backgroundColor: "rgba(15, 23, 41, 0.06)",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  attendeeText: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.textSecondary,
  },
  bottomCard: {
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "rgba(226, 232, 240, 0.8)",
    shadowColor: "#0f1729",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 8,
  },
  heroPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    backgroundColor: "rgba(13, 148, 136, 0.09)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 10,
  },
  heroPillText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  brandTitle: {
    fontSize: 42,
    fontFamily: "Poppins_800ExtraBold",
    color: COLORS.textPrimary,
    letterSpacing: -1,
    lineHeight: 48,
  },
  tagline: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: COLORS.textPrimary,
    marginTop: 4,
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: COLORS.textSecondary,
    lineHeight: 19,
    marginBottom: 16,
  },
  featuresRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    backgroundColor: "rgba(248, 250, 252, 0.9)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.6)",
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  featureIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.textPrimary,
  },
  actionContainer: {
    gap: 10,
  },
  primaryButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
    paddingHorizontal: 20,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#ffffff",
    letterSpacing: 0.2,
  },
  arrowCircle: {
    marginLeft: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButton: {
    alignItems: "center",
    paddingVertical: 6,
  },
  secondaryText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: COLORS.textSecondary,
  },
});
