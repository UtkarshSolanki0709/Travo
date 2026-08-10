import { cn } from '@/lib/utils';
import { COLORS } from '@/lib/theme';
import * as AvatarPrimitive from '@rn-primitives/avatar';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';

interface AvatarProps extends Omit<React.ComponentProps<typeof AvatarPrimitive.Root>, 'alt'> {
  alt?: string;
  /** If true, renders Sunrise gradient border reserved for current user's self avatar */
  isSelf?: boolean;
}

function Avatar({ className, isSelf = false, alt = '', children, ...props }: AvatarProps) {
  if (isSelf) {
    return (
      <LinearGradient
        colors={COLORS.sunrise.colors}
        start={COLORS.sunrise.start}
        end={COLORS.sunrise.end}
        style={{ borderRadius: 9999, padding: 2 }}
      >
        <AvatarPrimitive.Root
          alt={alt}
          className={cn('relative flex size-10 shrink-0 overflow-hidden rounded-full bg-surface', className)}
          {...props}
        >
          {children}
        </AvatarPrimitive.Root>
      </LinearGradient>
    );
  }

  return (
    <AvatarPrimitive.Root
      alt={alt}
      className={cn('relative flex size-10 shrink-0 overflow-hidden rounded-full border border-border bg-surface', className)}
      {...props}
    >
      {children}
    </AvatarPrimitive.Root>
  );
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return <AvatarPrimitive.Image className={cn('aspect-square size-full', className)} {...props} />;
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      className={cn(
        'bg-surface-elevated flex size-full flex-row items-center justify-center rounded-full',
        className
      )}
      {...props}
    />
  );
}

export { Avatar, AvatarFallback, AvatarImage };
