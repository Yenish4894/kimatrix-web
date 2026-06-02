import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    positive: boolean;
  };
  variant?: "primary" | "accent" | "success";
  className?: string;
}

const orbStyles: Record<NonNullable<StatCardProps["variant"]>, string> = {
  primary:
    "bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-[0_4px_12px_rgba(13,148,136,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]",
  accent:
    "bg-gradient-to-br from-accent-400 to-accent-600 text-white shadow-[0_4px_12px_rgba(249,115,22,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]",
  success:
    "bg-gradient-to-br from-success-500 to-success-700 text-white shadow-[0_4px_12px_rgba(16,185,129,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]",
};

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  variant = "primary",
  className,
}: Readonly<StatCardProps>) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden bg-white border border-slate-200/80 rounded-xl p-5",
        "shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
        "transition-all duration-200 ease-out",
        "hover:shadow-[0_8px_24px_rgba(15,23,42,0.08),0_2px_4px_rgba(15,23,42,0.04)] hover:-translate-y-0.5 hover:border-slate-200",
        className
      )}
    >
      {/* Subtle gradient wash matching the orb tint */}
      <div
        className={cn(
          "absolute -top-12 -right-12 h-40 w-40 rounded-full opacity-[0.07] blur-2xl pointer-events-none transition-opacity duration-300 group-hover:opacity-[0.12]",
          variant === "primary" && "bg-primary-500",
          variant === "accent" && "bg-accent-500",
          variant === "success" && "bg-success-500"
        )}
      />

      <div className="relative flex items-start justify-between mb-4">
        <div
          className={cn(
            "h-11 w-11 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105",
            orbStyles[variant]
          )}
        >
          <Icon className="h-[22px] w-[22px]" strokeWidth={2} />
        </div>
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold",
              trend.positive
                ? "bg-success-50 text-success-700"
                : "bg-error-50 text-error-700"
            )}
          >
            {trend.positive ? (
              <TrendingUp className="h-3 w-3" strokeWidth={2.5} />
            ) : (
              <TrendingDown className="h-3 w-3" strokeWidth={2.5} />
            )}
            {trend.value}
          </span>
        )}
      </div>

      <p className="relative text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em]">
        {title}
      </p>
      <p className="relative text-[26px] font-bold text-slate-900 font-heading mt-1 tracking-tight leading-tight">
        {value}
      </p>
    </div>
  );
}
