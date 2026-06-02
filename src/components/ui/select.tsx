"use client";

import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, options, placeholder, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className={cn(
              "block text-sm font-medium mb-1",
              error ? "text-error-500" : "text-slate-600"
            )}
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            className={cn(
              "flex h-11 w-full appearance-none rounded-md border bg-white px-3 pr-10 text-base text-slate-800 transition-colors duration-150",
              "focus:outline-none focus:ring-[3px]",
              error
                ? "border-error-500 focus:border-error-500 focus:ring-error-500/15"
                : "border-slate-200 hover:border-slate-300 focus:border-primary-500 focus:ring-primary-500/15",
              "disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed",
              className
            )}
            ref={ref}
            aria-invalid={!!error}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
        </div>
        {error && (
          <p className="mt-1 text-[13px] text-error-500" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-[13px] text-slate-400">{helperText}</p>
        )}
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };
