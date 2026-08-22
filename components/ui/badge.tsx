import { TextClassContext } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { Slot } from '@rn-primitives/slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { Platform, View } from 'react-native';

const badgeVariants = cva(
  cn(
    'group shrink-0 flex-row items-center justify-center gap-1.5 overflow-hidden rounded-radius-full border border-transparent px-3 py-1',
    Platform.select({
      web: 'w-fit whitespace-nowrap transition-colors [&>svg]:pointer-events-none [&>svg]:size-3.5',
    })
  ),
  {
    variants: {
      variant: {
        default: 'bg-primary',
        secondary: 'bg-secondary',
        accent: 'bg-accent',
        destructive: 'bg-destructive',
        outline: 'border-border bg-transparent',
        food: 'bg-category-food',
        sports: 'bg-category-sports',
        arts: 'bg-category-arts',
        nightlife: 'bg-category-nightlife',
        music: 'bg-category-music',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const badgeTextVariants = cva('text-body-sm font-medium font-body', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      secondary: 'text-secondary-foreground',
      accent: 'text-accent-foreground',
      destructive: 'text-white',
      outline: 'text-foreground',
      food: 'text-white',
      sports: 'text-white',
      arts: 'text-white',
      nightlife: 'text-foreground', // #84cc16 has dark text per contrast check
      music: 'text-white',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

type BadgeProps = React.ComponentProps<typeof View> &
  React.RefAttributes<View> & {
    asChild?: boolean;
    category?: string;
  } & VariantProps<typeof badgeVariants>;

function Badge({ className, variant, category, asChild, style, ...props }: BadgeProps) {
  const Component = asChild ? Slot : View;
  const resolvedVariant = (category ? category.toLowerCase() : variant) as VariantProps<typeof badgeVariants>['variant'];

  return (
    <TextClassContext.Provider value={badgeTextVariants({ variant: resolvedVariant })}>
      <Component
        className={cn(badgeVariants({ variant: resolvedVariant }), className)}
        style={style}
        {...props}
      />
    </TextClassContext.Provider>
  );
}

export { Badge, badgeTextVariants, badgeVariants };
export type { BadgeProps };
