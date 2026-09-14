"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { Card, CardContent, CardHeader, Button, Input, QueryErrorState } from "@/components/ui";
import { adminService } from "@/services/admin.service";
import { parseApiError } from "@/lib/errors";
import type { PlatformSettings } from "@/types";

const SPIN_PRICE_MIN = 0.01;
const SPIN_PRICE_MAX = 100;
const TRIAL_SPINS_MAX = 100;

/**
 * Lucky draw pricing and allowances. Moved out of Settings into its own menu item
 * (2026-09-15) — Settings is the admin's own account; these are platform-wide knobs.
 * Saves through the same /admin/settings endpoint, so nothing server-side changed.
 */
export default function AdminLuckyDrawPage() {
  const queryClient = useQueryClient();

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
    <DashboardShell title="Lucky Draw" requiredRole="super_admin">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <h3 className="text-h4 font-heading font-semibold text-slate-800">Lucky draw spins</h3>
            <p className="text-sm text-slate-500 mt-1">
              Spin pricing and free allowances for every company on the platform.
            </p>
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
      </div>
    </DashboardShell>
  );
}
