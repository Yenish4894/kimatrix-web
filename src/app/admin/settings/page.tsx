"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { Card, CardContent, CardHeader, Button, Input, QueryErrorState } from "@/components/ui";
import { PasswordChangeCard } from "@/components/settings/password-change-card";
import { useAppSelector } from "@/store/hooks";
import { adminService } from "@/services/admin.service";
import { parseApiError } from "@/lib/errors";

const SPIN_PRICE_MIN = 0.01;
const SPIN_PRICE_MAX = 100;

export default function AdminSettingsPage() {
  const user = useAppSelector((state) => state.auth.user);
  const queryClient = useQueryClient();

  // Only the spin price is edited here. Trial length and currency already have a home
  // on Plans & Trial (TrialSettingsCard); a second editor for them showed stale values
  // after the other one saved.
  const settingsQ = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: adminService.getSettings,
  });

  // null = untouched, so the field shows the saved value without an effect copying it
  // into state (which also meant a background refetch could overwrite typing).
  const [spinPrice, setSpinPrice] = useState<string | null>(null);
  const shownPrice = spinPrice ?? settingsQ.data?.spinAddonPriceUsd.toFixed(2) ?? "";
  const parsedPrice = Number.parseFloat(shownPrice);
  const priceValid =
    Number.isFinite(parsedPrice) && parsedPrice >= SPIN_PRICE_MIN && parsedPrice <= SPIN_PRICE_MAX;

  const saveM = useMutation({
    mutationFn: (price: number) => adminService.updateSettings({ spinAddonPriceUsd: price }),
    onSuccess: (res) => {
      toast.success(res.message ?? "Spin price saved.");
      setSpinPrice(null);
      void queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
    },
    onError: (err) => toast.error(parseApiError(err).message),
  });

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
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-sm text-slate-500">Email</span>
              <span className="text-sm font-medium text-slate-800">{user?.email ?? "—"}</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-sm text-slate-500">Role</span>
              <span className="text-sm font-medium text-slate-800">
                {user?.userType === "super_admin" ? "Super Admin" : user?.userType ?? "—"}
              </span>
            </div>
          </CardContent>
        </Card>

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
                  label="Price per spin (USD)"
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
                  helperText="What a company pays for each extra spin. Changes apply to new purchases only."
                />
                <Button
                  onClick={() => saveM.mutate(parsedPrice)}
                  disabled={!priceValid || spinPrice === null || saveM.isPending}
                  isLoading={saveM.isPending}
                >
                  Save price
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
