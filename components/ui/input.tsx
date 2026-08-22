import { cn } from '@/lib/utils';
import { COLORS } from '@/lib/theme';
import { AlertCircle } from 'lucide-react-native';
import * as React from 'react';
import { Platform, Text, TextInput, View } from 'react-native';

export interface InputProps extends React.ComponentProps<typeof TextInput> {
  error?: string;
  label?: string;
}

const Input = React.forwardRef<React.ElementRef<typeof TextInput>, InputProps>(
  ({ className, error, label, editable, placeholderTextColor, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const isDisabled = editable === false;

    return (
      <View className="w-full">
        {label ? (
          <Text className="text-body-sm text-foreground font-medium mb-1.5 font-body">
            {label}
          </Text>
        ) : null}

        <View
          className={cn(
            'flex-row items-center border bg-surface px-4 min-h-[44px] rounded-radius-md',
            isFocused && 'border-secondary ring-2 ring-secondary/20',
            error ? 'border-destructive' : 'border-border',
            isDisabled && 'opacity-40 bg-surface-elevated',
            className
          )}
        >
          <TextInput
            ref={ref}
            editable={editable}
            accessibilityLabel={label}
            aria-label={label}
            placeholderTextColor={placeholderTextColor || COLORS.textSecondary}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            className={cn(
              'flex-1 text-body-md text-foreground font-body py-2.5',
              Platform.select({
                web: 'outline-0 selection:bg-primary selection:text-white',
              })
            )}
            {...props}
          />
        </View>

        {error ? (
          <View className="flex-row items-center gap-1 mt-1.5">
            <AlertCircle size={14} color={COLORS.destructive} />
            <Text className="text-body-sm text-destructive font-body">{error}</Text>
          </View>
        ) : null}
      </View>
    );
  }
);

Input.displayName = 'Input';

export { Input };
