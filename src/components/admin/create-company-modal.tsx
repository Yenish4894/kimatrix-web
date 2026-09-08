"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Gift } from "lucide-react";
import { Button, Input, Modal, Select } from "@/components/ui";
import { adminService } from "@/services/admin.service";
import { parseApiError, fieldErrorsFromDetails } from "@/lib/errors";
import type { CreateCompanyPayload } from "@/types";

interface CreateCompanyModalProps {
  onClose: () => void;
  onCreated: () => void;
}

/** A year out, as a yyyy-mm-dd string for the date input. */
function defaultCompDate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Onboards a company the operator already knows, without sending them through public
 * signup.
 *
 * Two deliberate absences. There is no password field: the owner sets their own from an
 * emailed link, so an admin never types, stores or transmits a customer's credential.
 * And there is no trial — access comes from a comp, which leaves the trial registry
 * untouched so the business can still claim its own free trial later if the comp lapses.
 */
export function CreateCompanyModal({ onClose, onCreated }: Readonly<CreateCompanyModalProps>) {
  const [form, setForm] = useState({
    name: "",
    registrationNumber: "",
    businessType: "" as "" | "fuel_station" | "shop",
    streetAddress: "",
    city: "",
    state: "",
    country: "South Africa",
    postalCode: "",
    contactEmail: "",
    contactPhone: "",
    whatsappNumber: "",
    email: "",
    compedUntil: defaultCompDate(),
    compReason: "",
  });
  const [neverExpires, setNeverExpires] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: keyof typeof form) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: "" } : e));
  };

  const createM = useMutation({
    mutationFn: async () => {
      const payload: CreateCompanyPayload = {
        name: form.name.trim(),
        registrationNumber: form.registrationNumber.trim(),
        businessType: form.businessType as "fuel_station" | "shop",
        streetAddress: form.streetAddress.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        country: form.country.trim(),
        postalCode: form.postalCode.trim() || null,
        contactEmail: form.contactEmail.trim(),
        contactPhone: form.contactPhone.trim(),
        whatsappNumber: form.whatsappNumber.trim() || null,
        email: form.email.trim(),
        // Sent as the end of the chosen day rather than midnight, so "free until the
        // 8th" includes the 8th — a date input gives 00:00 and would cut them off a
        // day early.
        compedUntil: neverExpires ? null : `${form.compedUntil}T23:59:59.000Z`,
        compReason: form.compReason.trim(),
      };
      return adminService.createCompany(payload);
    },
    onSuccess: (res) => {
      toast.success(`Company created. Invite sent to ${res.ownerEmail}.`);
      onCreated();
    },
    onError: (err) => {
      const parsed = parseApiError(err);
      const fieldErrors = fieldErrorsFromDetails(parsed.details);
      if (Object.keys(fieldErrors).length > 0) setErrors(fieldErrors);
      else toast.error(parsed.message);
    },
  });

  const required = [
    form.name,
    form.registrationNumber,
    form.businessType,
    form.streetAddress,
    form.city,
    form.state,
    form.country,
    form.contactEmail,
    form.contactPhone,
    form.email,
  ];
  const canSubmit =
    required.every((v) => v.trim().length > 0) &&
    form.compReason.trim().length >= 3 &&
    (neverExpires || form.compedUntil.length > 0);

  return (
    <Modal
      open
      onClose={onClose}
      title="Add a company"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            isLoading={createM.isPending}
            disabled={!canSubmit}
            onClick={() => createM.mutate()}
          >
            Create &amp; send invite
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <p className="text-sm text-slate-600">
          Creates the account and emails the owner a link to choose their own password.
          You never handle their password.
        </p>

        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Business
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Company name"
              value={form.name}
              onChange={(e) => set("name")(e.target.value)}
              error={errors["name"]}
            />
            <Input
              label="Registration number"
              value={form.registrationNumber}
              onChange={(e) => set("registrationNumber")(e.target.value)}
              error={errors["registrationNumber"]}
            />
          </div>
          <Select
            label="Business type"
            value={form.businessType}
            onChange={(e) => set("businessType")(e.target.value)}
            error={errors["businessType"]}
            placeholder="Select a type"
            options={[
              { value: "fuel_station", label: "Fuel Station" },
              { value: "shop", label: "Shop" },
            ]}
            helperText="Fuel stations capture a vehicle number on the customer form; shops do not."
          />
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Address
          </h3>
          <Input
            label="Street address"
            value={form.streetAddress}
            onChange={(e) => set("streetAddress")(e.target.value)}
            error={errors["streetAddress"]}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="City"
              value={form.city}
              onChange={(e) => set("city")(e.target.value)}
              error={errors["city"]}
            />
            <Input
              label="State / Region"
              value={form.state}
              onChange={(e) => set("state")(e.target.value)}
              error={errors["state"]}
            />
            <Input
              label="Country"
              value={form.country}
              onChange={(e) => set("country")(e.target.value)}
              error={errors["country"]}
            />
            <Input
              label="Postal code"
              value={form.postalCode}
              onChange={(e) => set("postalCode")(e.target.value)}
              error={errors["postalCode"]}
              helperText="Optional"
            />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Contact
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Contact email"
              type="email"
              value={form.contactEmail}
              onChange={(e) => set("contactEmail")(e.target.value)}
              error={errors["contactEmail"]}
            />
            <Input
              label="Contact phone"
              value={form.contactPhone}
              onChange={(e) => set("contactPhone")(e.target.value)}
              error={errors["contactPhone"]}
              helperText="Full international format, e.g. +27821234567"
            />
          </div>
          <Input
            label="WhatsApp number"
            value={form.whatsappNumber}
            onChange={(e) => set("whatsappNumber")(e.target.value)}
            error={errors["whatsappNumber"]}
            helperText="Optional"
          />
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Owner login
          </h3>
          <Input
            label="Login email"
            type="email"
            value={form.email}
            onChange={(e) => set("email")(e.target.value)}
            error={errors["email"]}
            helperText="The invite link is sent here. It can be the same as the contact email."
          />
        </section>

        <section className="space-y-3 rounded-xl border border-primary-100 bg-primary-50/60 p-4">
          <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary-700">
            <Gift className="h-3.5 w-3.5" aria-hidden="true" />
            Free access
          </h3>
          <p className="text-sm text-slate-600">
            The company uses the platform free until this date. Afterwards the normal
            rules resume and they will be asked to subscribe.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Free until"
              type="date"
              value={form.compedUntil}
              onChange={(e) => set("compedUntil")(e.target.value)}
              error={errors["compedUntil"]}
              disabled={neverExpires}
            />
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={neverExpires}
                  onChange={(e) => setNeverExpires(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                No end date
              </label>
            </div>
          </div>
          {neverExpires && (
            <p className="text-xs text-warning-700 bg-warning-50 border border-warning-100 rounded-lg p-2.5">
              This account will be free permanently and will never prompt anyone to
              revisit it. A date is usually better — an admin can always extend it.
            </p>
          )}
          <Input
            label="Why is this free?"
            value={form.compReason}
            onChange={(e) => set("compReason")(e.target.value)}
            error={errors["compReason"]}
            helperText="Recorded against the company and written to the audit log."
          />
        </section>
      </div>
    </Modal>
  );
}
