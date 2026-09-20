"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Gift, Trophy, Users, Ticket, CalendarRange, MonitorPlay } from "lucide-react";

import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { Button, Card, CardContent, QueryErrorState } from "@/components/ui";
import { PageLoader } from "@/components/ui/loader";
import { Wheel } from "@/components/lucky-draw/wheel";
import { DrawMode } from "@/components/lucky-draw/draw-mode";
import { companyService } from "@/services";
import { parseApiError } from "@/lib/errors";
import { formatDate, formatDateTime, formatNumber } from "@/lib/utils";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";
import { useCompanyProfile } from "@/hooks/useCompanyProfile";
import type { LuckyDrawSpinResult } from "@/types";

/** Long enough to feel like a draw, short enough that nobody taps away. */
const SPIN_MS = 4500;

/**
 * Lucky draw for the current plan window.
 *
 * The winner is chosen on the server before the wheel moves. The wheel is theatre:
 * it spins for a fixed time and the result is revealed when it stops. That ordering is
 * what makes the draw trustworthy — there is nothing in this page that could steer,
 * repeat or re-roll the outcome.
 */
export default function LuckyDrawPage() {
  const qc = useQueryClient();
  const fmtCurrency = useCurrencyFormatter();
  const drawsQ = useQuery({ queryKey: ["company", "draws"], queryFn: companyService.getDraws });

  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<LuckyDrawSpinResult | null>(null);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const companyName = useCompanyProfile().data?.name ?? "";
  // Customer-facing presentation of the same draw (TV/monitor). Presentation only.
  const [drawMode, setDrawMode] = useState(false);
  const closeDrawMode = useCallback(() => setDrawMode(false), []);

  // Leaving mid-spin cancels the reveal, and with it the refresh that was waiting for
  // the wheel to stop — so the cache kept the pre-spin count and history, and coming
  // back showed a spin that had already been used (FE-11). Refresh on the way out.
  useEffect(() => () => {
    if (revealTimer.current) {
      clearTimeout(revealTimer.current);
      void qc.invalidateQueries({ queryKey: ["company", "draws"] });
    }
  }, [qc]);

  const spinM = useMutation({
    mutationFn: () => companyService.spinDraw(),
    onMutate: () => {
      setResult(null);
      setSpinning(true);
      // Several full turns plus a random landing angle, so consecutive spins don't
      // stop on the same segment and look scripted.
      setRotation((r) => r + 360 * 6 + Math.floor(Math.random() * 360));
    },
    onSuccess: (res) => {
      revealTimer.current = setTimeout(() => {
        revealTimer.current = null;
        setSpinning(false);
        setResult(res.data);
        toast.success(res.message);
        void qc.invalidateQueries({ queryKey: ["company", "draws"] });
      }, SPIN_MS);
    },
    onError: (err) => {
      setSpinning(false);
      toast.error(parseApiError(err).message);
      // A refused spin ("no spins left", "no eligible purchases") means this page's
      // counts were stale — typically another tab spun. Re-read them.
      void qc.invalidateQueries({ queryKey: ["company", "draws"] });
    },
  });

  if (drawsQ.isLoading) return <PageLoader />;
  // Without this a failed request fell through to "no spins available", which tells
  // the owner they have nothing when the truth is we couldn't check.
  if (drawsQ.isError) {
    return (
      <DashboardShell title="Lucky Draw" requiredRole="company">
        <QueryErrorState error={drawsQ.error} onRetry={() => drawsQ.refetch()} resource="your lucky draw" />
      </DashboardShell>
    );
  }
  const status = drawsQ.data;
  const current = status?.periods.find((p) => p.remaining > 0) ?? status?.periods[0];
  const canSpin = Boolean(current && current.remaining > 0 && current.entries > 0) && !spinning;

  const blocker = !current
    ? null
    : current.remaining === 0
      ? "You've used every spin in this plan period."
      : current.entries === 0
        ? "No eligible purchases yet in this plan period. Spins stay available until the plan ends."
        : null;

  return (
    <DashboardShell title="Lucky Draw" requiredRole="company">
      {!current ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-50">
              <Gift className="h-7 w-7 text-primary-600" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800">
              No lucky draw spins available
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              While a paid plan is active, you can buy spins from the billing page. Each
              spin picks a random winner from the customers who bought from you during
              your current plan period.
            </p>
            <Link href="/company/billing" className="mt-5 inline-block">
              <Button>Buy spins</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
          {/* ── Stats ── */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Stat icon={Ticket} label="Spins left" value={formatNumber(status!.totalRemaining)} />
              <Stat icon={Trophy} label="Winners so far" value={formatNumber(current.used)} />
              <Stat icon={Gift} label="Entries in the draw" value={formatNumber(current.entries)} />
              <Stat icon={Users} label="Eligible customers" value={formatNumber(current.eligibleCustomers)} />
            </div>
            <Card>
              <CardContent className="flex items-start gap-3 py-4">
                <CalendarRange className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
                <p className="text-sm text-slate-600">
                  Drawing from purchases made{" "}
                  <strong>from {formatDate(String(current.periodStart))}</strong>
                  {current.periodEnd ? (
                    <> until <strong>{formatDate(String(current.periodEnd))}</strong></>
                  ) : null}
                  . Each purchase is one entry, and anyone who has already won this
                  period is left out of later spins.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* ── Wheel ── */}
          <Card>
            <CardContent className="flex flex-col items-center py-8">
              <Wheel
                rotation={rotation}
                durationMs={SPIN_MS}
                className="h-64 w-64 sm:h-72 sm:w-72"
              />

              <Button
                size="lg"
                className="mt-7"
                onClick={() => spinM.mutate()}
                disabled={!canSpin}
                isLoading={spinning}
              >
                <Gift className="h-5 w-5" aria-hidden="true" />
                {spinning ? "Drawing…" : "Spin the wheel"}
              </Button>
              {blocker && !spinning && (
                <p className="mt-3 max-w-xs text-center text-sm text-slate-500">{blocker}</p>
              )}
              <Button
                variant="secondary"
                size="sm"
                className="mt-4"
                onClick={() => setDrawMode(true)}
                title="Full-screen draw for a customer-facing screen"
              >
                <MonitorPlay className="h-4 w-4" aria-hidden="true" />
                Draw mode
              </Button>

              {/* Announced to screen readers too — the wheel itself is decorative. */}
              <div aria-live="polite" className="w-full">
                {result && (
                  <div className="mt-6 w-full rounded-xl border border-success-200 bg-success-50 p-5 text-center">
                    <Trophy className="mx-auto h-8 w-8 text-success-600" aria-hidden="true" />
                    <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-success-700">
                      Winner
                    </p>
                    <p className="mt-1 text-xl font-bold text-slate-900">{result.winner.fullName}</p>
                    <p className="text-sm text-slate-600">{result.winner.mobile}</p>
                    {result.winner.vehicleNumber && (
                      <p className="text-sm text-slate-600">Vehicle {result.winner.vehicleNumber}</p>
                    )}
                    <p className="mt-3 text-sm text-slate-600">
                      Invoice <strong>{result.winner.invoiceNumber}</strong> ·{" "}
                      {fmtCurrency(result.winner.invoiceAmount)} ·{" "}
                      {formatDate(String(result.winner.submittedAt))}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      Picked from {formatNumber(result.entriesCount)} {result.entriesCount === 1 ? "entry" : "entries"} by{" "}
                      {formatNumber(result.eligibleCustomers)} {result.eligibleCustomers === 1 ? "customer" : "customers"}.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {current && drawMode && (
        <DrawMode
          onClose={closeDrawMode}
          companyName={companyName}
          rotation={rotation}
          spinDurationMs={SPIN_MS}
          spinning={spinning}
          result={result}
          spinsLeft={status!.totalRemaining}
          canSpin={canSpin}
          blocker={blocker}
          onSpin={() => spinM.mutate()}
        />
      )}

      {/* ── History ── */}
      {status && status.history.length > 0 && (
        <Card className="mt-5">
          <CardContent className="py-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-800">Past winners</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="py-2 pr-4 font-medium">Drawn</th>
                    <th className="py-2 pr-4 font-medium">Winner</th>
                    <th className="py-2 pr-4 font-medium">Mobile</th>
                    <th className="py-2 pr-4 font-medium">Invoice</th>
                    <th className="py-2 pr-4 font-medium text-right">Amount</th>
                    <th className="py-2 font-medium text-right">Entries</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {status.history.map((h) => (
                    <tr key={h.id}>
                      <td className="py-2.5 pr-4 whitespace-nowrap text-slate-600">{formatDateTime(String(h.drawnAt))}</td>
                      <td className="py-2.5 pr-4 font-medium text-slate-800">{h.fullName}</td>
                      <td className="py-2.5 pr-4 whitespace-nowrap text-slate-600">{h.mobile}</td>
                      <td className="py-2.5 pr-4 text-slate-600">{h.invoiceNumber}</td>
                      <td className="py-2.5 pr-4 text-right whitespace-nowrap text-slate-800">{fmtCurrency(h.invoiceAmount)}</td>
                      <td className="py-2.5 text-right text-slate-600">{formatNumber(h.entriesCount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardShell>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: Readonly<{ icon: typeof Gift; label: string; value: string }>) {
  return (
    <Card>
      <CardContent className="py-4">
        <Icon className="h-4 w-4 text-primary-600" aria-hidden="true" />
        <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </CardContent>
    </Card>
  );
}
