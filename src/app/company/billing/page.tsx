"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { AlertCircle, Check, CreditCard, Loader2, RefreshCw, Zap } from "lucide-react";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { Button, Card, CardContent } from "@/components/ui";
import { paymentService } from "@/services/payment.service";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { fetchPlans } from "@/store/slices/companySlice";
import { cn } from "@/lib/utils";
import type { SubscriptionPlan } from "@/types";

function formatPrice(price: string): string {
  return `${Number.parseFloat(price).toFixed(2)}`;
}

function PlanCard({
  plan,
  selected,
  onSelect,
}: Readonly<{
  plan: SubscriptionPlan;
  selected: boolean;
  onSelect: (id: string) => void;
}>) {
  const price = Number.parseFloat(plan.price);
  const dailyRate = (price / plan.durationDays).toFixed(0);
  const isPopular = plan.durationDays === 30;

  return (
    <button
      type="button"
      onClick={() => onSelect(plan.id)}
      className={cn(
        "relative w-full text-left rounded-2xl border-2 p-5 transition-all duration-200 hover:shadow-md focus:outline-none",
        selected
          ? "border-primary-500 bg-primary-50/50 shadow-[0_0_0_3px_rgba(8,145,178,0.12)]"
          : "border-slate-200 bg-white hover:border-primary-200"
      )}
    >
      {isPopular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full">
          Most Popular
        </span>
      )}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-800">{plan.name}</p>
          <p className="text-xs text-slate-400 mt-0.5">≈ {plan.currency} {dailyRate}/day</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xl font-extrabold text-slate-900">{plan.currency} {formatPrice(plan.price)}</p>
        </div>
      </div>
      {selected && (
        <span className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary-500 flex items-center justify-center">
          <Check className="h-3 w-3 text-white" />
        </span>
      )}
    </button>
  );
}

export default function BillingPage() {
  const dispatch = useAppDispatch();
  const { plans, isLoadingPlans, plansFetchFailed } = useAppSelector((state) => state.company);
  const companyIsActive = useAppSelector((state) => state.auth.companyIsActive);
  const profile = useAppSelector((state) => state.company.profile);

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (plans.length === 0 && !plansFetchFailed) {
      dispatch(fetchPlans());
    }
  }, [dispatch, plans.length, plansFetchFailed]);

  // Pre-select the popular plan once plans load
  useEffect(() => {
    if (plans.length > 0 && !selectedPlanId) {
      const popular = plans.find((p) => p.durationDays === 30) ?? plans[0];
      setSelectedPlanId(popular.id);
    }
  }, [plans, selectedPlanId]);

  const handleSubscribe = async () => {
    if (!selectedPlanId || isRedirecting) return;
    setIsRedirecting(true);
    try {
      const { approvalUrl } = await paymentService.createOrder(selectedPlanId);
      // Hard redirect to PayPal — must NOT use Next.js router (external URL)
      globalThis.location.href = approvalUrl;
    } catch {
      toast.error("Failed to initiate payment. Please try again.");
      setIsRedirecting(false);
    }
  };

  const isPending = companyIsActive === false;
  const isExpired =
    !!profile?.subscriptionExpiresAt &&
    new Date(profile.subscriptionExpiresAt).getTime() < Date.now();

  let bannerMessage: string;
  if (isPending) {
    bannerMessage = "Choose a plan to activate your account and start using KIMates.";
  } else if (isExpired) {
    bannerMessage = "Your subscription has expired. Renew to continue accessing your data.";
  } else {
    bannerMessage = "Manage your KIMates subscription.";
  }

  let planContent: React.ReactNode;
  if (isLoadingPlans) {
    planContent = (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 text-primary-400 animate-spin" />
      </div>
    );
  } else if (plansFetchFailed) {
    planContent = (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <AlertCircle className="h-8 w-8 text-error-400" />
        <p className="text-sm text-slate-500">Could not load plans. Check your connection and try again.</p>
        <button
          type="button"
          onClick={() => dispatch(fetchPlans())}
          className="inline-flex items-center gap-2 text-sm text-primary-600 hover:underline"
        >
          <RefreshCw className="h-4 w-4" /> Retry
        </button>
      </div>
    );
  } else {
    planContent = (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            selected={selectedPlanId === plan.id}
            onSelect={setSelectedPlanId}
          />
        ))}
      </div>
    );
  }

  return (
    <DashboardShell title="Billing & Subscription" requiredRole="company">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Context banner */}
        <div className={cn(
          "rounded-2xl p-4 flex items-start gap-3",
          isPending || isExpired
            ? "bg-accent-50 border border-accent-100"
            : "bg-primary-50 border border-primary-100"
        )}>
          <Zap className={cn("h-5 w-5 mt-0.5 shrink-0", isPending || isExpired ? "text-accent-500" : "text-primary-500")} />
          <p className="text-sm text-slate-700">{bannerMessage}</p>
        </div>

        {/* Plan selection */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-base font-semibold text-slate-800 mb-4">Choose a Plan</h2>

            {planContent}

            <div className="mt-6">
              <Button
                fullWidth
                onClick={handleSubscribe}
                disabled={!selectedPlanId || isRedirecting || isLoadingPlans}
                isLoading={isRedirecting}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                {isRedirecting ? "Redirecting to PayPal…" : "Pay with PayPal"}
              </Button>
              <p className="text-center text-xs text-slate-400 mt-3">
                You will be redirected to PayPal to complete your payment securely.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Current subscription info (if any) */}
        {profile?.currentPlan && (
          <Card>
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Current Subscription</h3>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Plan</span>
                <span className="font-medium text-slate-800">{profile.currentPlan.name}</span>
              </div>
              {profile.subscriptionExpiresAt && (
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-slate-500">Expires</span>
                  <span className={cn("font-medium", isExpired ? "text-error-600" : "text-slate-800")}>
                    {new Date(profile.subscriptionExpiresAt).toLocaleDateString("en-GB", {
                      day: "2-digit", month: "short", year: "numeric"
                    })}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}
