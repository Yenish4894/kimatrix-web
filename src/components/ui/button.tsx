"use client";

import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium rounded-md cursor-pointer transition-all duration-150 ease-out disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "text-white bg-gradient-to-b from-primary-500 to-primary-700 shadow-[0_1px_2px_rgba(13,148,136,0.25),inset_0_1px_0_rgba(255,255,255,0.15)] hover:from-primary-600 hover:to-primary-800 hover:shadow-[0_2px_8px_rgba(13,148,136,0.35),inset_0_1px_0_rgba(255,255,255,0.15)] active:from-primary-700 active:to-primary-800 active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)]",
        secondary:
          "bg-white text-primary-700 border border-slate-200 shadow-sm hover:bg-primary-50 hover:border-primary-300 hover:text-primary-800 hover:shadow-[0_2px_8px_rgba(13,148,136,0.08)]",
        accent:
          "text-white bg-gradient-to-b from-accent-400 to-accent-600 shadow-[0_1px_2px_rgba(249,115,22,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] hover:from-accent-500 hover:to-accent-700 hover:shadow-[0_2px_10px_rgba(249,115,22,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)]",
        ghost: "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-800",
        danger:
          "text-white bg-gradient-to-b from-error-500 to-error-700 shadow-[0_1px_2px_rgba(244,63,94,0.25),inset_0_1px_0_rgba(255,255,255,0.15)] hover:shadow-[0_2px_8px_rgba(244,63,94,0.35),inset_0_1px_0_rgba(255,255,255,0.15)] active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)]",
        link: "bg-transparent text-primary-600 hover:text-primary-700 underline-offset-4 hover:underline p-0 h-auto active:scale-100",
      },
      size: {
        sm: "h-8 px-3 text-[13px]",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
