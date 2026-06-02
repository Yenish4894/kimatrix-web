"use client";

import { forwardRef, useId } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string | React.ReactNode;
  error?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, id, name, ...props }, ref) => {
    const reactId = useId();
    const checkboxId = id || (name ? `checkbox-${name}` : reactId);

    return (
      <div className="w-full">
        <div className="flex items-start gap-2">
          <div className="relative flex items-center justify-center">
            <input
              id={checkboxId}
              type="checkbox"
              className={cn(
                "peer h-5 w-5 shrink-0 appearance-none rounded border transition-colors duration-100 cursor-pointer",
                "checked:bg-primary-600 checked:border-primary-600",
                error
                  ? "border-error-500"
                  : "border-slate-300 hover:border-slate-400",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                className
              )}
              ref={ref}
              name={name}
              {...props}
            />
            <Check className="absolute h-3.5 w-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" />
          </div>
          {label && (
            <label
              htmlFor={checkboxId}
              className="text-sm text-slate-600 cursor-pointer select-none leading-5"
            >
              {label}
            </label>
          )}
        </div>
        {error && (
          <p className="mt-1 text-[13px] text-error-500" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
