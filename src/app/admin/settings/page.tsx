"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { Card, CardContent, CardHeader, Button, Input, QueryErrorState } from "@/components/ui";
import { PasswordChangeCard } from "@/components/settings/password-change-card";
import { LoginEmailCard } from "@/components/settings/login-email-card";
import { useAppSelector } from "@/store/hooks";
import { adminService } from "@/services/admin.service";
import { parseApiError } from "@/lib/errors";
import type { PlatformSettings } from "@/types";

const SPIN_PRICE_MIN = 0.01;
const SPIN_PRICE_MAX = 100;
const TRIAL_SPINS_MAX = 100;

export default function AdminSettingsPage() {
  const user = useAppSelector((state) => state.auth.user);
  const queryClient = useQueryClient();

  // Only the lucky draw settings are edited here. Trial length and currency already
  // have a home on Plans & Trial (TrialSettingsCard); a second editor for them showed
  // stale values after the other one saved.
  const settingsQ = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: adminService.getSettings,
  });

  // null = untouched, so each field shows the saved value without an effect copying it
  // into state (which also meant a background refetch could overwrite typing).
  const [spinPrice, setSpinPrice] = useState<string | null>(null);
  const [trialSpins, setTrialSpins] = useState<string | null>(null);

  const shownPrice = spinPrice ?? settingsQ.data?.spinAddonPriceUsd.toFixed(2) ?? "";
  const parsedPrice = Number.parseFloat(shownPrice);
  const priceValid =
    Number.isFinite(parsedPrice) && parsedPrice >= SPIN_PRICE_MIN && parsedPrice <= SPIN_PRICE_MAX;

  const shownTrialSpins =
    trialSpins ?? (settingsQ.data ? String(settingsQ.data.trialDrawSpins ?? 0) : "");
  const parsedTrialSpins = Number(shownTrialSpins);
  const trialSpinsValid =
    shownTrialSpins.trim() !== "" &&
    Number.isInteger(parsedTrialSpins) &&
    parsedTrialSpins >= 0 &&
    parsedTrialSpins <= TRIAL_SPINS_MAX;

  const dirty = spinPrice !== null || trialSpins !== null;

  const saveM = useMutation({
    mutationFn: (payload: Partial<PlatformSettings>) => adminService.updateSettings(payload),
    onSuccess: (res) => {
      toast.success(res.message ?? "Lucky draw settings saved.");
      setSpinPrice(null);
      setTrialSpins(null);
      void queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
    },
    onError: (err) => toast.error(parseApiError(err).message),
  });

  const handleSave = () => {
    // Only what changed, so saving one field can't overwrite the other with a stale value.
    const payload: Partial<PlatformSettings> = {};
    if (spinPrice !== null) payload.spinAddonPriceUsd = parsedPrice;
    if (trialSpins !== null) payload.trialDrawSpins = parsedTrialSpins;
    saveM.mutate(payload);
  };

  return (
    <DashboardShell title="Settings" requiredRole="super_admin">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <h3 className="text-h4 font-heading font-semibold text-slate-800">Account</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-sm text-slate-500">Username</span>
              <span className="text-sm font-medium text-slate-800 font-mono">{user?.username ?? "—"}</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-sm text-slate-500">Role</span>
              <span className="text-sm font-medium text-slate-800">
                {user?.userType === "super_admin" ? "Super Admin" : user?.userType ?? "—"}
              </span>
            </div>
          </CardContent>
        </Card>

        <LoginEmailCard />

        <Card>
          <CardHeader>
            <h3 className="text-h4 font-heading font-semibold text-slate-800">Lucky draw spins</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            {settingsQ.isError ? (
              <QueryErrorState
                error={settingsQ.error}
                onRetry={() => settingsQ.refetch()}
                resource="settings"
              />
            ) : (
              <>
                <Input
                  label="Free spins per trial"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={TRIAL_SPINS_MAX}
                  step={1}
                  value={shownTrialSpins}
                  disabled={settingsQ.isLoading}
                  onChange={(e) => setTrialSpins(e.target.value)}
                  error={
                    shownTrialSpins !== "" && !trialSpinsValid
                      ? `Enter a whole number from 0 to ${TRIAL_SPINS_MAX}.`
                      : undefined
                  }
                  helperText="Every company on a free trial gets this many draws. A change applies to trials already running. 0 = none."
                />
                <Input
                  label="Price per extra spin (USD)"
                  type="number"
                  inputMode="decimal"
                  min={SPIN_PRICE_MIN}
                  max={SPIN_PRICE_MAX}
                  step={0.01}
                  value={shownPrice}
                  disabled={settingsQ.isLoading}
                  onChange={(e) => setSpinPrice(e.target.value)}
                  error={
                    shownPrice !== "" && !priceValid
                      ? `Enter a price between ${SPIN_PRICE_MIN} and ${SPIN_PRICE_MAX}.`
                      : undefined
                  }
                  helperText="What a company on a paid plan pays for each extra spin. Changes apply to new purchases only."
                />
                <Button
                  onClick={handleSave}
                  disabled={!dirty || !priceValid || !trialSpinsValid || saveM.isPending}
                  isLoading={saveM.isPending}
                >
                  Save
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <PasswordChangeCard />
      </div>
    </DashboardShell>
  );
}
