import { useEffect, useId } from "react";
import Svg, {
  Circle,
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
  FadeIn,
  FadeInDown,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { useReducedMotion } from "@/lib/accessibility";
import { CATEGORY_COLORS, COLORS } from "@/lib/theme";

const AnimatedG = createAnimatedComponent(G);
const AnimatedPath = createAnimatedComponent(Path);
const AnimatedCircle = createAnimatedComponent(Circle);


export type EmptyIllustrationVariant = "explore" | "create" | "join" | "chat";

const DASH_PERIOD = 9.5; // strokeDasharray "0.5 9" — one full dash+gap

// Plane pointing +x in local units (same geometry as app/(auth)/intro.tsx).
const PLANE_UPPER = "M30 0 L-18 -16 L2 2 Z";
const PLANE_LOWER = "M30 0 L2 2 L-16 9 Z";
const PLANE_KEEL = "M2 2 L-8 13 L-13 4 Z";
const PLANE_SPINE = "M30 0 L2 2";

function hexPoints(cx: number, cy: number, r: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(" ");
}

function Plane({
  tick,
  reduced,
  id,
  x,
  y,
  rotate,
  scale,
}: {
  tick: SharedValue<number>;
  reduced: boolean;
  id: string;
  x: number;
  y: number;
  rotate: number;
  scale: number;
}) {
  const planeProps = useAnimatedProps(() => {
    const bob = reduced ? 0 : 3 * Math.sin(2 * Math.PI * tick.value);
    const wobble = reduced ? 0 : 3 * Math.sin(2 * Math.PI * tick.value + 0.6);
    return {
      transform: [
        { translateX: x },
        { translateY: y + bob },
        { rotate: `${rotate + wobble}deg` },
        { scale },
      ],
    };
  });
  return (
    <AnimatedG animatedProps={planeProps}>
      <Path d={PLANE_UPPER} fill={`url(#${id})`} />
      <Path d={PLANE_LOWER} fill="#0f766e" />
      <Path d={PLANE_KEEL} fill={COLORS.textPrimary} />
      <Path
        d={PLANE_SPINE}
        stroke="#ffffff"
        strokeWidth={4}
        strokeLinecap="round"
        fill="none"
      />
    </AnimatedG>
  );
}

function Dotted({
  tick,
  reduced,
  d,
}: {
  tick: SharedValue<number>;
  reduced: boolean;
  d: string;
}) {
  const trailProps = useAnimatedProps(() => ({
    // Decreasing offset marches the dashes forward along the drawing direction.
    strokeDashoffset: reduced ? 0 : -DASH_PERIOD * tick.value,
  }));
  return (
    <AnimatedPath
      d={d}
      stroke={COLORS.primary}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeDasharray="0.5 9"
      fill="none"
      animatedProps={trailProps}
    />
  );
}

function MeetupDot({
  tick,
  reduced,
  x,
  y,
  color,
}: {
  tick: SharedValue<number>;
  reduced: boolean;
  x: number;
  y: number;
  color: string;
}) {
  const phase = (x / 160) * 2 * Math.PI;
  const dotProps = useAnimatedProps(() => {
    const s = reduced ? 0 : Math.sin(2 * Math.PI * tick.value + phase);
    return { r: 4.5 + 0.8 * s, opacity: 0.8 + 0.2 * s };
  });
  return (
    <AnimatedCircle
      cx={x}
      cy={y}
      r={4.5}
      fill={color}
      stroke="#ffffff"
      strokeWidth={2}
      animatedProps={dotProps}
    />
  );
}

function Contours({
  tick,
  reduced,
  x,
  y,
  r,
}: {
  tick: SharedValue<number>;
  reduced: boolean;
  x: number;
  y: number;
  r: number;
}) {
  const contoursProps = useAnimatedProps(() => ({
    opacity: reduced ? 0.14 : 0.11 + 0.04 * Math.sin(2 * Math.PI * tick.value),
  }));
  return (
    <AnimatedG animatedProps={contoursProps}>
      <Circle cx={x} cy={y} r={r} stroke={COLORS.primary} strokeWidth={1.5} fill="none" />
      <Circle cx={x} cy={y} r={r * 1.8} stroke={COLORS.primary} strokeWidth={1.5} fill="none" />
    </AnimatedG>
  );
}

function TypingDot({
  tick,
  reduced,
  x,
  phase,
  color,
}: {
  tick: SharedValue<number>;
  reduced: boolean;
  x: number;
  phase: number;
  color: string;
}) {
  const dotProps = useAnimatedProps(() => ({
    // 4× frequency → 1.25s typing cycle from the same 5s master tick.
    opacity: reduced ? 1 : 0.35 + 0.65 * Math.max(0, Math.sin(8 * Math.PI * tick.value + phase)),
  }));
  return (
    <AnimatedCircle cx={x} cy={64} r={3.5} fill={color} animatedProps={dotProps} />
  );
}

function Twinkle({
  tick,
  reduced,
  x,
  y,
}: {
  tick: SharedValue<number>;
  reduced: boolean;
  x: number;
  y: number;
}) {
  const twinkleProps = useAnimatedProps(() => ({
    opacity: reduced ? 1 : 0.5 + 0.5 * Math.sin(4 * Math.PI * tick.value),
  }));
  return (
    <AnimatedCircle cx={x} cy={y} r={2.5} fill={COLORS.accent} animatedProps={twinkleProps} />
  );
}

export function EmptyIllustration({
  variant,
  width = 180,
}: {
  variant: EmptyIllustrationVariant;
  width?: number;
}) {
  const rawId = useId();
  const gradientId = `empty-plane-${rawId.replace(/:/g, "")}`;
  const reduced = useReducedMotion();
  const tick = useSharedValue(0);
  const height = width * 0.75;

  useEffect(() => {
    if (reduced) return;
    tick.value = withRepeat(
      withTiming(1, { duration: 5000, easing: Easing.linear }),
      -1,
      false,
    );
    return () => {
      cancelAnimation(tick);
    };
  }, [reduced, tick]);

  return (
    <Animated.View
      key={variant}
      entering={reduced ? FadeIn.duration(300) : FadeInDown.duration(450)}
    >
      <Svg
        width={width}
        height={height}
        viewBox="0 0 160 120"
        accessibilityElementsHidden
        aria-hidden={true}
      >
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#14b8a6" />
            <Stop offset="0.4" stopColor="#14b8a6" />
            <Stop offset="0.78" stopColor="#f59e0b" />
            <Stop offset="1" stopColor="#f59e0b" />
          </LinearGradient>
        </Defs>

        {variant === "explore" && (
          <>
            <Contours tick={tick} reduced={reduced} x={26} y={22} r={16} />
            <Dotted tick={tick} reduced={reduced} d="M20 95 Q60 90 92 60" />
            <Circle cx={20} cy={95} r={4} fill={COLORS.textPrimary} stroke="#ffffff" strokeWidth={1.8} />
            <MeetupDot tick={tick} reduced={reduced} x={48} y={78} color={CATEGORY_COLORS.sports.light} />
            <MeetupDot tick={tick} reduced={reduced} x={68} y={71} color={CATEGORY_COLORS.food.light} />
            <Dotted tick={tick} reduced={reduced} d="M96 54 Q104 44 112 34" />
            <Plane tick={tick} reduced={reduced} id={gradientId} x={118} y={30} rotate={-52} scale={0.42} />
            <Twinkle tick={tick} reduced={reduced} x={138} y={16} />
          </>
        )}

        {variant === "create" && (
          <>
            <Contours tick={tick} reduced={reduced} x={80} y={70} r={24} />
            <Polygon points={hexPoints(80, 70, 16)} fill={COLORS.textPrimary} />
            <Rect x={72} y={68} width={16} height={4} rx={2} fill="#ffffff" />
            <Rect x={78} y={62} width={4} height={16} rx={2} fill="#ffffff" />
            <Dotted tick={tick} reduced={reduced} d="M88 52 Q104 36 126 26" />
            <Plane tick={tick} reduced={reduced} id={gradientId} x={130} y={24} rotate={-36} scale={0.4} />
            <MeetupDot tick={tick} reduced={reduced} x={44} y={94} color={CATEGORY_COLORS.music.light} />
            <MeetupDot tick={tick} reduced={reduced} x={120} y={92} color={CATEGORY_COLORS.arts.light} />
          </>
        )}

        {variant === "join" && (
          <>
            <Contours tick={tick} reduced={reduced} x={124} y={26} r={12} />
            <Dotted tick={tick} reduced={reduced} d="M60 57 L84 50" />
            <Dotted tick={tick} reduced={reduced} d="M56 70 L79 84" />
            <Polygon points={hexPoints(52, 62, 10)} fill={COLORS.primary} />
            <Circle cx={52} cy={62} r={3.2} fill="#ffffff" />
            <Polygon points={hexPoints(94, 46, 10)} fill={COLORS.secondary} />
            <Circle cx={94} cy={46} r={3.2} fill="#ffffff" />
            <Polygon points={hexPoints(86, 88, 10)} fill={CATEGORY_COLORS.arts.light} />
            <Circle cx={86} cy={88} r={3.2} fill="#ffffff" />
            <Plane tick={tick} reduced={reduced} id={gradientId} x={128} y={78} rotate={-42} scale={0.34} />
          </>
        )}

        {variant === "chat" && (
          <>
            <Contours tick={tick} reduced={reduced} x={132} y={98} r={14} />
            <Path
              d="M46 38 H102 Q116 38 116 52 V76 Q116 90 102 90 H70 L56 104 L58 90 H46 Q32 90 32 76 V52 Q32 38 46 38 Z"
              fill="#ffffff"
              stroke={COLORS.primary}
              strokeWidth={2.5}
            />
            <TypingDot tick={tick} reduced={reduced} x={58} phase={0} color={COLORS.primary} />
            <TypingDot tick={tick} reduced={reduced} x={74} phase={(2 * Math.PI) / 3} color={COLORS.accent} />
            <TypingDot tick={tick} reduced={reduced} x={90} phase={(4 * Math.PI) / 3} color={COLORS.primary} />
            <Dotted tick={tick} reduced={reduced} d="M118 48 Q130 40 136 30" />
            <Plane tick={tick} reduced={reduced} id={gradientId} x={140} y={26} rotate={-48} scale={0.36} />
          </>
        )}
      </Svg>
    </Animated.View>
  );
}
