"use client";

import { Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { StatCard } from "@/components/ui";
import { adminService } from "@/services";

const fmt = (n: unknown) => Number(n ?? 0).toLocaleString("en-US");

/**
 * Landing-page visitors. Its own query and its own failure state: this is a nice-to-have
 * metric, and a missing or failing endpoint must never take the dashboard down with it.
 */
export function VisitorsCard() {
  const q = useQuery({
    queryKey: ["admin", "metrics", "visitors"],
    queryFn: adminService.getVisitorMetrics,
    retry: 1,
  });
  const m = q.data;

  return (
    <StatCard
      title="Visitors today"
      value={q.isLoading || q.isError ? "—" : fmt(m?.today)}
      icon={Eye}
      variant="accent"
    >
      {q.isError ? (
        <p className="text-xs text-slate-500">
          Visitor numbers are unavailable.{" "}
          <button
            type="button"
            onClick={() => q.refetch()}
            className="font-medium text-primary-600 hover:underline"
          >
            Retry
          </button>
        </p>
      ) : (
        <dl className="grid grid-cols-3 gap-2 text-xs">
          {[
            ["7 days", m?.last7Days],
            ["30 days", m?.last30Days],
            ["Total", m?.total],
          ].map(([label, value]) => (
            <div key={label as string} className="min-w-0">
              <dt className="text-slate-500">{label as string}</dt>
              <dd className="font-semibold text-slate-800 truncate">
                {q.isLoading ? "—" : fmt(value)}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </StatCard>
  );
}
