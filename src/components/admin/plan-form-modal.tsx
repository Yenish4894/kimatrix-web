"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { AlertTriangle } from "lucide-react";
import { Button, Input, Modal, Checkbox } from "@/components/ui";
import { adminService, type PlanFormPayload } from "@/services/admin.service";
import { parseApiError, fieldErrorsFromDetails } from "@/lib/errors";
import type { AdminPlan } from "@/types";

interface PlanFormModalProps {
  /** null = creating a new plan */
  plan: AdminPlan | null;
  onClose: () => void;
  onSaved: () => void;
}

export function PlanFormModal({ plan, onClose, onSaved }: Readonly<PlanFormModalProps>) {
  const isEdit = plan !== null;

  const [form, setForm] = useState({
    name: plan?.name ?? "",
    description: plan?.description ?? "",
    durationDays: plan ? String(plan.durationDays) : "",
    price: plan?.price ?? "",
    isPopular: plan?.isPopular ?? false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Editing price or duration on a plan that has already been sold creates a new
  // version rather than rewriting the old one. Warn before they save, not after.
  const carriesHistory = Boolean(plan?.hasPayments || plan?.hasSubscribers);
  const billingChanged =
    isEdit &&
    (form.price.trim() !== plan?.price ||
      form.durationDays.trim() !== String(plan?.durationDays));
  const willVersion = carriesHistory && billingChanged;

  const saveM = useMutation({
    mutationFn: async () => {
      const payload: PlanFormPayload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        durationDays: Number.parseInt(form.durationDays, 10),
        price: form.price.trim(),
        isPopular: form.isPopular,
      };
      return isEdit && plan
        ? adminService.updatePlan(plan.id, payload)
        : adminService.createPlan(payload);
    },
    onSuccess: (res) => {
      toast.success(res.message);
      onSaved();
    },
    onError: (err) => {
      const parsed = parseApiError(err);
      const fieldErrors = fieldErrorsFromDetails(parsed.details);
      if (Object.keys(fieldErrors).length > 0) setErrors(fieldErrors);
      else toast.error(parsed.message);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  return (
    <Modal open onClose={onClose} title={isEdit ? "Edit plan" : "New plan"} size="md">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveM.mutate();
        }}
        className="space-y-4"
      >
        <Input
          label="Plan name"
          name="name"
          value={form.name}
          onChange={handleChange}
          error={errors["name"]}
          placeholder="e.g. 30 Day Plan"
        />

        <Input
          label="Short description"
          name="description"
          value={form.description}
          onChange={handleChange}
          error={errors["description"]}
          placeholder="Optional — shown under the plan name"
          helperText="Leave blank to hide"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Length (days)"
            name="durationDays"
            type="number"
            inputMode="numeric"
            min={1}
            value={form.durationDays}
            onChange={handleChange}
            error={errors["durationDays"]}
            placeholder="30"
          />
          <Input
            label="Price"
            name="price"
            inputMode="decimal"
            value={form.price}
            onChange={handleChange}
            error={errors["price"]}
            placeholder="249.99"
            helperText={plan ? `Charged in ${plan.currency}` : "Uses your platform currency"}
          />
        </div>

        <div>
          <Checkbox
            label="Show a “Most Popular” badge on this plan"
            checked={form.isPopular}
            onChange={(e) => setForm((prev) => ({ ...prev, isPopular: e.target.checked }))}
          />
          <p className="mt-1 ml-7 text-xs text-slate-400">
            Only one plan can carry the badge — setting it here removes it from any other.
          </p>
        </div>

        {willVersion && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-xl border border-warning-100 bg-warning-50 p-3.5"
          >
            <AlertTriangle
              className="h-4 w-4 text-warning-700 mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <p className="text-sm text-warning-700 leading-relaxed">
              This plan has already been sold, so changing its price or length will save it
              as a <strong>new version</strong>. Companies already subscribed keep the plan
              they paid for, and past invoices stay accurate.
            </p>
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saveM.isPending}>
            Cancel
          </Button>
          <Button type="submit" isLoading={saveM.isPending}>
            {willVersion ? "Save as new version" : isEdit ? "Save changes" : "Create plan"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
