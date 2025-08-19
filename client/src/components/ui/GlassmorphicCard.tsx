
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const cardVariants = cva(
  "rounded-lg border backdrop-blur-md transition-all duration-300",
  {
    variants: {
      variant: {
        default: "bg-white/50 dark:bg-charcoal/50 border-white/20 dark:border-charcoal-light/20",
        premium: "bg-white/60 dark:bg-charcoal/60 border-gold/30 dark:border-gold/20",
        subtle: "bg-white/30 dark:bg-charcoal/30 border-white/10 dark:border-charcoal-light/10",
      },
      hover: {
        none: "",
        lift: "hover:-translate-y-1 hover:shadow-elevated",
        glow: "hover:border-gold/50 hover:shadow-[0_0_15px_rgba(212,175,55,0.15)]",
      },
      shadow: {
        none: "",
        sm: "shadow-subtle",
        md: "shadow-elevated",
        lg: "shadow-premium",
      }
    },
    defaultVariants: {
      variant: "default",
      hover: "none",
      shadow: "sm",
    },
  }
);

export interface GlassmorphicCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const GlassmorphicCard = React.forwardRef<HTMLDivElement, GlassmorphicCardProps>(
  ({ className, variant, hover, shadow, ...props }, ref) => {
    return (
      <div
        className={cn(cardVariants({ variant, hover, shadow }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);

GlassmorphicCard.displayName = "GlassmorphicCard";

export { GlassmorphicCard, cardVariants };
