"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Button, Input, Modal } from "@/components/ui";
import { adminService } from "@/services";
import { formatDate } from "@/lib/utils";
import { errorMessageWithId, parseApiError } from "@/lib/errors";
import type { Company } from "@/types";

interface GrantTrialModalProps {
  /** Null closes the modal; a company opens it for that company. */
  company: Pick<Company, "id" | "name" | "trialEndsAt"> | null;
  onClose: () => void;
  /** Called after a successful grant so the caller can refresh its own queries. */
  onGranted: () => void | Promise<void>;
}

/**
 * Grant or extend a trial.
 *
 * Shared by the company detail panel and the companies list. The list is where an
 * admin actually goes to switch a company on, but the only trial control used to live
 * on the detail page — which is why "Activate" on the list got reached for instead,
 * and why it kept returning "This company is not deactivated."
 *
 * One endpoint covers both cases. The SQL is
 * `GREATEST(COALESCE(trial_ends_at, now), now) + N days`, so a company that never had
 * a trial gets a fresh one, a running trial is extended without losing days, and an
 * expired trial restarts from today rather than from a stale past date.
 */
export function GrantTrialModal({ company, onClose, onGranted }: Readonly<GrantTrialModalProps>) {
  const [days, setDays] = useState("7");

  const mutation = useMutation({
    mutationFn: () => adminService.extendTrial(company!.id, Number(days)),
    onSuccess: async (result) => {
      toast.success(`Trial now runs until ${formatDate(result.trialEndsAt)}.`);
      await onGranted();
      onClose();
    },
    onError: (err) => toast.error(errorMessageWithId(parseApiError(err))),
  });

  const isExtension = Boolean(company?.trialEndsAt);
  const numericDays = Number(days);
  const daysAreValid = Number.isInteger(numericDays) && numericDays >= 1 && numericDays <= 365;

  return (
    <Modal
      open={company !== null}
      onClose={onClose}
      title={isExtension ? "Extend trial" : "Grant trial"}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !daysAreValid}>
            {mutation.isPending ? "Saving…" : "Confirm"}
          </Button>
        </>
      }
    >
      {company && (
        <p className="mb-4 text-sm text-slate-600">
          {isExtension ? "Extending the trial for " : "Granting a trial to "}
          <strong className="text-slate-800">{company.name}</strong>.
        </p>
      )}
      <Input
        label="Days"
        type="number"
        min={1}
        max={365}
        value={days}
        onChange={(e) => setDays(e.target.value)}
        helperText={
          isExtension
            ? "Added on top of any trial time still remaining, not instead of it."
            : "The trial starts today and the company gets access immediately."
        }
      />
    </Modal>
  );
}
