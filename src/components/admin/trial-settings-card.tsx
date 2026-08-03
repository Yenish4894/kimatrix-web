"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Clock } from "lucide-react";
import { Button, Card, CardContent, Input, Select, QueryErrorState } from "@/components/ui";
import { adminService } from "@/services/admin.service";
import { parseApiError } from "@/lib/errors";

/** Mirrors SUPPORTED_CURRENCIES on the backend — the set PayPal will settle in. */
const SUPPORTED_CURRENCIES = [
  "AUD", "BRL", "CAD", "CHF", "CNY", "CZK", "DKK", "EUR", "GBP", "HKD",
  "HUF", "ILS", "JPY", "MXN", "MYR", "NOK", "NZD", "PHP", "PLN", "RUB",
  "SEK", "SGD", "THB", "TWD", "USD", "ZAR",
] as const;

/**
 * Free-trial length. Kept as its own card above the plan list because it is the one
 * setting an admin is most likely to come here to change.
 */
export function TrialSettingsCard() {
  const queryClient = useQueryClient();
  const [days, setDays] = useState<string | null>(null);
  const [error, setError] = useState("");

  const settingsQ = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: adminService.getSettings,
  });

  // Seed once from the server value, then leave the field alone.
  //
  // `null` means "not yet seeded" — distinct from `""`, which is a user who has
  // cleared the box. The previous version keyed off `days === ""` with `days` in the
  // dependency array, so selecting all and pressing delete re-fired the effect and
  // snapped the old value straight back: the field was uneditable except by
  // backspacing one character at a time.
  const serverDays = settingsQ.data?.trialDurationDays;
  useEffect(() => {
    if (serverDays !== undefined) setDays((prev) => prev ?? String(serverDays));
  }, [serverDays]);

  const value = days ?? "";

  const saveM = useMutation({
    mutationFn: () => adminService.updateSettings({ trialDurationDays: Number.parseInt(value, 10) }),
    onSuccess: (res) => {
      toast.success(res.message);
      void queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
    },
    onError: (err) => setError(parseApiError(err).message),
  });

  // Without this the admin gets an enabled but empty "Length (days)" box, a
  // permanently disabled Save button and no explanation — and a currency dropdown
  // showing nothing selected, which reads as "the platform currency was reset".
  const settingsFailed = settingsQ.isError;

  const current = settingsQ.data?.trialDurationDays;
  const parsed = Number.parseInt(value, 10);
  const isDirty = Number.isFinite(parsed) && parsed !== current;

  // ── Billing currency ──
  const [currency, setCurrency] = useState<string | null>(null);
  const [currencyError, setCurrencyError] = useState("");
  const serverCurrency = settingsQ.data?.platformCurrency;
  useEffect(() => {
    if (serverCurrency !== undefined) setCurrency((prev) => prev ?? serverCurrency);
  }, [serverCurrency]);

  const currencyValue = currency ?? "";
  const isCurrencyDirty = currencyValue !== "" && currencyValue !== serverCurrency;

  const currencyM = useMutation({
    mutationFn: () => adminService.updateSettings({ platformCurrency: currencyValue }),
    onSuccess: (res) => {
      toast.success(res.message);
      void queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "plans"] });
    },
    // The server refuses while plans still exist in the old currency; surface that
    // message inline rather than as a toast, since it tells them what to do next.
    onError: (err) => setCurrencyError(parseApiError(err).message),
  });

  if (settingsFailed) {
    return (
      <Card>
        <CardContent className="py-5">
          <QueryErrorState
            error={settingsQ.error}
            resource="trial settings"
            onRetry={() => settingsQ.refetch()}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="py-5">
        <div className="flex items-start gap-3">
          <div
            className="h-9 w-9 rounded-lg bg-primary-50 border border-primary-100 flex items-center justify-center shrink-0"
            aria-hidden="true"
          >
            <Clock className="h-4 w-4 text-primary-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-heading font-semibold text-slate-800">Free trial</h2>
            <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">
              How long a new company gets before they need to pay. The clock starts when
              they confirm their email, so time spent waiting on an inbox isn&apos;t
              charged against them.
            </p>

            <div className="flex flex-wrap items-end gap-3 mt-4">
              <div className="w-32">
                <Input
                  label="Length (days)"
                  name="trialDurationDays"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={90}
                  value={value}
                  onChange={(e) => {
                    setDays(e.target.value);
                    if (error) setError("");
                  }}
                  error={error}
                  disabled={settingsQ.isLoading}
                />
              </div>
              <Button
                onClick={() => saveM.mutate()}
                isLoading={saveM.isPending}
                disabled={!isDirty || settingsQ.isLoading}
              >
                Save
              </Button>
            </div>

            <p className="text-xs text-slate-500 mt-3 leading-relaxed">
              Changing this only affects companies who start a trial afterwards — anyone
              mid-trial keeps the length they were given.
            </p>

            <div className="mt-5 pt-5 border-t border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700">Billing currency</h3>
              <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">
                Every plan is priced in this currency.{" "}
                {settingsQ.data ? (
                  <>
                    Currently <strong>{settingsQ.data.platformCurrency}</strong>.
                  </>
                ) : null}
              </p>

              <div className="flex flex-wrap items-end gap-3 mt-3">
                <div className="w-40">
                  <Select
                    label="Currency"
                    name="platformCurrency"
                    value={currencyValue}
                    onChange={(e) => {
                      setCurrency(e.target.value);
                      if (currencyError) setCurrencyError("");
                    }}
                    error={currencyError}
                    disabled={settingsQ.isLoading}
                    options={SUPPORTED_CURRENCIES.map((c) => ({ value: c, label: c }))}
                  />
                </div>
                <Button
                  variant="secondary"
                  onClick={() => currencyM.mutate()}
                  isLoading={currencyM.isPending}
                  disabled={!isCurrencyDirty || settingsQ.isLoading}
                >
                  Change currency
                </Button>
              </div>

              <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                You can only switch currency once no plans are on sale in the old one —
                changing it can&apos;t convert your prices, so the amounts would be wrong.
                Hide the old plans first, then create new ones at the right prices.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
