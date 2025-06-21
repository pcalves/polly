import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-body-sm font-ui transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 text-optimized",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        tropical:
          "bg-gradient-tropical text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300",
        coral:
          "bg-accent-coral text-white dark:text-white shadow-md hover:bg-accent-coral/90 hover:shadow-lg transition-all duration-200",
        emerald:
          "bg-accent-emerald text-white dark:text-white shadow-md hover:bg-accent-emerald/90 hover:shadow-lg hover:scale-105 transition-all duration-300",
        yellow:
          "bg-accent-yellow text-slate-800 dark:text-slate-800 shadow-md hover:bg-accent-yellow/90 hover:shadow-lg transition-all duration-200",
        purple:
          "bg-accent-purple text-white dark:text-white shadow-md hover:bg-accent-purple/90 hover:shadow-lg transition-all duration-200",
        blue: "bg-accent-blue text-white shadow-md hover:bg-accent-blue/90 hover:shadow-lg hover:scale-105 transition-all duration-300",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-caption",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
        "icon-sm": "h-8 w-8 p-0",
        full: "h-9 px-4 py-2 w-full",
        "full-lg": "h-10 px-8 w-full",
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

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
