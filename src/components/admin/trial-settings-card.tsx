"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Clock } from "lucide-react";
import { Button, Card, CardContent, Input } from "@/components/ui";
import { adminService } from "@/services/admin.service";
import { parseApiError } from "@/lib/errors";

/**
 * Free-trial length. Kept as its own card above the plan list because it is the one
 * setting an admin is most likely to come here to change.
 */
export function TrialSettingsCard() {
  const queryClient = useQueryClient();
  const [days, setDays] = useState("");
  const [error, setError] = useState("");

  const settingsQ = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: adminService.getSettings,
  });

  // Seed the input once the current value arrives, without clobbering an edit in
  // progress if the query refetches underneath the user.
  useEffect(() => {
    if (settingsQ.data && days === "") setDays(String(settingsQ.data.trialDurationDays));
  }, [settingsQ.data, days]);

  const saveM = useMutation({
    mutationFn: () => adminService.updateSettings({ trialDurationDays: Number.parseInt(days, 10) }),
    onSuccess: (res) => {
      toast.success(res.message);
      void queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
    },
    onError: (err) => setError(parseApiError(err).message),
  });

  const current = settingsQ.data?.trialDurationDays;
  const parsed = Number.parseInt(days, 10);
  const isDirty = Number.isFinite(parsed) && parsed !== current;

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
                  value={days}
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

            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              Changing this only affects companies who start a trial afterwards — anyone
              mid-trial keeps the length they were given.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
