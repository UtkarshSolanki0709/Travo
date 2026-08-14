import { TextClassContext } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { COLORS } from '@/lib/theme';
import { cva, type VariantProps } from 'class-variance-authority';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as React from 'react';
import { ActivityIndicator, Platform, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const buttonVariants = cva(
  cn(
    'group shrink-0 flex-row items-center justify-center gap-2 rounded-radius-full overflow-hidden',
    Platform.select({
      web: "focus-visible:ring-ring/50 outline-none transition-all focus-visible:ring-[3px] disabled:pointer-events-none",
    })
  ),
  {
    variants: {
      variant: {
        default: '',
        destructive: cn(
          'bg-destructive active:opacity-90',
          Platform.select({ web: 'hover:opacity-90' })
        ),
        secondary: cn(
          'border-2 border-primary bg-transparent active:bg-primary/10',
          Platform.select({ web: 'hover:bg-primary/10' })
        ),
        outline: cn(
          'border border-border bg-transparent active:bg-muted',
          Platform.select({ web: 'hover:bg-muted' })
        ),
        ghost: cn(
          'active:bg-muted',
          Platform.select({ web: 'hover:bg-muted' })
        ),
      },
      size: {
        sm: 'h-9 px-4',
        default: 'h-11 px-5',
        lg: 'h-13 px-6',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const buttonTextVariants = cva(
  cn(
    'text-foreground font-medium',
    Platform.select({ web: 'pointer-events-none transition-colors select-none' })
  ),
  {
    variants: {
      variant: {
        default: 'text-white',
        destructive: 'text-white',
        secondary: 'text-primary',
        outline: 'text-foreground',
        ghost: 'text-foreground',
      },
      size: {
        sm: 'text-body-sm',
        default: 'text-body-md',
        lg: 'text-heading-md',
        icon: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

type ButtonProps = React.ComponentProps<typeof Pressable> &
  React.RefAttributes<typeof Pressable> &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean;
    children?: React.ReactNode;
  };

function Button({ className, variant = 'default', size = 'default', loading, children, disabled, onPressIn, onPressOut, onPress, style, ...props }: ButtonProps) {
  const scale = useSharedValue(1);
  const [layoutWidth, setLayoutWidth] = React.useState<number | undefined>(undefined);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = (e: any) => {
    scale.value = withTiming(0.97, { duration: 150 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    scale.value = withTiming(1, { duration: 150 });
    onPressOut?.(e);
  };

  const isDisabled = disabled || loading;

  const resolvedStyle: any[] = [
    animatedStyle,
    loading && layoutWidth ? { width: layoutWidth } : undefined,
    style,
  ].filter(Boolean);

  const renderChildren = () => {
    if (loading) {
      return (
        <ActivityIndicator
          size="small"
          color={variant === 'secondary' || variant === 'ghost' || variant === 'outline' ? COLORS.primary : '#ffffff'}
        />
      );
    }
    return children;
  };

  if (variant === 'default' && !isDisabled) {
    return (
      <Animated.View style={animatedStyle}>
        <LinearGradient
          colors={COLORS.sunrise.colors}
          start={COLORS.sunrise.start}
          end={COLORS.sunrise.end}
          style={{ borderRadius: 9999 }}
        >
          <AnimatedPressable
            className={cn(
              'shrink-0 flex-row items-center justify-center gap-2',
              size === 'sm' && 'h-9 px-4',
              size === 'default' && 'h-11 px-5',
              size === 'lg' && 'h-13 px-6',
              size === 'icon' && 'h-11 w-11',
            )}
            role="button"
            disabled={isDisabled}
            accessibilityState={{ disabled: isDisabled }}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={onPress}
            onLayout={(e) => {
              if (!layoutWidth) {
                setLayoutWidth(e.nativeEvent.layout.width);
              }
            }}
            hitSlop={size === 'sm' ? { top: 4, bottom: 4 } : undefined}
            {...props}
          >
            <TextClassContext.Provider value={buttonTextVariants({ variant, size })}>
              {renderChildren()}
            </TextClassContext.Provider>
          </AnimatedPressable>
        </LinearGradient>
      </Animated.View>
    );
  }

  return (
    <AnimatedPressable
      className={cn(
        isDisabled && 'opacity-40',
        buttonVariants({ variant, size }),
        className
      )}
      role="button"
      disabled={isDisabled}
      accessibilityState={{ disabled: isDisabled }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      onLayout={(e) => {
        if (!layoutWidth) {
          setLayoutWidth(e.nativeEvent.layout.width);
        }
      }}
      style={resolvedStyle}
      hitSlop={size === 'sm' ? { top: 4, bottom: 4 } : undefined}
      {...props}
    >
      <TextClassContext.Provider value={buttonTextVariants({ variant, size })}>
        {renderChildren()}
      </TextClassContext.Provider>
    </AnimatedPressable>
  );
}

export { Button, buttonTextVariants, buttonVariants };
export type { ButtonProps };
