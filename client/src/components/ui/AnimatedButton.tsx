
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors disabled:opacity-50 relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-gold text-white hover:bg-gold-dark active:bg-gold-dark",
        outline: "border border-gold text-gold hover:bg-gold/10 active:bg-gold/20",
        ghost: "text-gold hover:bg-gold/10 active:bg-gold/20",
        link: "text-gold underline-offset-4 hover:underline",
        premium: "bg-gradient-to-r from-gold to-gold-light text-white hover:opacity-90",
      },
      size: {
        default: "h-10 px-6 py-2",
        sm: "h-9 px-4 py-1.5",
        lg: "h-12 px-8 py-3 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const AnimatedButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(
          buttonVariants({ variant, size }),
          "button-animated",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

AnimatedButton.displayName = "AnimatedButton";

export { AnimatedButton, buttonVariants };
