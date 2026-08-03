"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Plus, Pencil, Star, Archive, Eye, EyeOff, Info } from "lucide-react";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { Badge, Button, Card, CardContent, QueryErrorState } from "@/components/ui";
import { adminService } from "@/services/admin.service";
import { parseApiError } from "@/lib/errors";
import { PlanFormModal } from "@/components/admin/plan-form-modal";
import { TrialSettingsCard } from "@/components/admin/trial-settings-card";
import type { AdminPlan } from "@/types";

function formatMoney(amount: string, currency: string): string {
  const n = Number.parseFloat(amount);
  if (Number.isNaN(n)) return `${currency} ${amount}`;
  return `${currency} ${n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function planStatus(plan: AdminPlan): { label: string; variant: "success" | "warning" | "error" } {
  if (plan.archivedAt) return { label: "Replaced", variant: "error" };
  if (plan.isActive) return { label: "On sale", variant: "success" };
  return { label: "Hidden", variant: "warning" };
}

export default function AdminPlansPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<AdminPlan | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const plansQ = useQuery({
    queryKey: ["admin", "plans"],
    queryFn: adminService.getPlans,
  });

  const availabilityM = useMutation({
    mutationFn: ({ planId, isActive }: { planId: string; isActive: boolean }) =>
      adminService.setPlanActive(planId, isActive),
    onSuccess: (res) => {
      toast.success(res.message);
      void queryClient.invalidateQueries({ queryKey: ["admin", "plans"] });
    },
    onError: (err) => toast.error(parseApiError(err).message),
  });

  const plans = plansQ.data ?? [];
  const live = plans.filter((p) => !p.archivedAt);
  const archived = plans.filter((p) => p.archivedAt);
  const activeCount = live.filter((p) => p.isActive).length;

  return (
    <DashboardShell title="Plans & Trial" requiredRole="super_admin">
      <TrialSettingsCard />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-8 mb-4">
        <div>
          <h2 className="text-h3 font-heading font-semibold text-slate-800">Subscription plans</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            What companies can buy after their free trial ends.
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
          New plan
        </Button>
      </div>

      {activeCount === 1 && (
        <div
          role="status"
          className="mb-4 flex items-start gap-3 rounded-xl border border-info-100 bg-info-50 p-3.5"
        >
          <Info className="h-4 w-4 text-info-600 mt-0.5 shrink-0" aria-hidden="true" />
          <p className="text-sm text-info-700">
            Only one plan is currently on sale. It can&apos;t be hidden until another is
            available — otherwise companies whose subscription lapses would have no way to
            pay.
          </p>
        </div>
      )}

      {plansQ.isError ? (
        <QueryErrorState
          error={plansQ.error}
          onRetry={() => plansQ.refetch()}
          resource="plans"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {plansQ.isLoading &&
            [1, 2, 3].map((i) => (
              <div key={i} className="h-52 rounded-2xl bg-slate-100 animate-pulse" />
            ))}

          {/* Without this, a fresh install renders a heading, a button and blank
              space — indistinguishable from a rendering failure, on the screen an
              admin lands on during first-time setup. */}
          {!plansQ.isLoading && live.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-300 p-10 text-center">
              <p className="text-sm font-medium text-slate-700">No plans yet</p>
              <p className="text-sm text-slate-500 mt-1">
                Companies can&apos;t subscribe until you create one.
              </p>
              <Button className="mt-4" onClick={() => setIsCreating(true)}>
                Create the first plan
              </Button>
            </div>
          )}

          {live.map((plan) => {
            const status = planStatus(plan);
            const isOnlyActive = plan.isActive && activeCount <= 1;
            return (
              <Card key={plan.id} className={plan.isPopular ? "border-primary-200" : undefined}>
                <CardContent className="py-5">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-heading font-semibold text-slate-800">{plan.name}</h3>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {plan.isPopular && (
                        <Badge variant="brand">
                          <Star className="h-3 w-3 mr-1" aria-hidden="true" />
                          Popular
                        </Badge>
                      )}
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                  </div>

                  {plan.description && (
                    <p className="text-sm text-slate-500 mb-3">{plan.description}</p>
                  )}

                  <p className="text-2xl font-bold font-heading text-slate-800 mt-2">
                    {formatMoney(plan.price, plan.currency)}
                  </p>
                  <p className="text-sm text-slate-500">
                    for {plan.durationDays} {plan.durationDays === 1 ? "day" : "days"}
                  </p>

                  {(plan.hasPayments || plan.hasSubscribers) && (
                    <p className="mt-3 text-xs text-slate-500 leading-relaxed">
                      This plan has been sold. Changing its price or length will create a new
                      version — existing companies keep what they bought.
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                    <Button variant="secondary" size="sm" onClick={() => setEditing(plan)}>
                      <Pencil className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isOnlyActive || availabilityM.isPending}
                      title={
                        isOnlyActive
                          ? "You need at least one plan on sale"
                          : undefined
                      }
                      onClick={() =>
                        availabilityM.mutate({ planId: plan.id, isActive: !plan.isActive })
                      }
                    >
                      {plan.isActive ? (
                        <>
                          <EyeOff className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                          Hide
                        </>
                      ) : (
                        <>
                          <Eye className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                          Put on sale
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {archived.length > 0 && (
        <section className="mt-10">
          <h2 className="text-h4 font-heading font-semibold text-slate-800 flex items-center gap-2">
            <Archive className="h-4 w-4 text-slate-400" aria-hidden="true" />
            Previous versions
          </h2>
          <p className="text-sm text-slate-500 mt-0.5 mb-4">
            Kept so past invoices and companies still on these plans stay accurate. They
            can&apos;t be sold or edited.
          </p>
          <div className="space-y-2">
            {archived.map((plan) => (
              <div
                key={plan.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/60 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-600">{plan.name}</p>
                  <p className="text-xs text-slate-500">
                    {formatMoney(plan.price, plan.currency)} · {plan.durationDays} days
                  </p>
                </div>
                <Badge variant="neutral">Replaced</Badge>
              </div>
            ))}
          </div>
        </section>
      )}

      {(isCreating || editing) && (
        <PlanFormModal
          plan={editing}
          onClose={() => {
            setIsCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setIsCreating(false);
            setEditing(null);
            void queryClient.invalidateQueries({ queryKey: ["admin", "plans"] });
          }}
        />
      )}
    </DashboardShell>
  );
}
