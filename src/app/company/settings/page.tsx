"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Building2, Lock as LockIcon } from "lucide-react";
import Joi from "joi";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { Card, CardContent, CardHeader, Input, Button, Badge, Checkbox } from "@/components/ui";
import { CountrySelect, StateSelect, CityInput } from "@/components/ui/country-state-select";
import { PhoneInput, validatePhoneForCountry } from "@/components/ui/phone-input";
import { PasswordChangeCard } from "@/components/settings/password-change-card";
import { formatDate } from "@/lib/utils";
import { companyService } from "@/services";
import { useAppSelector } from "@/store/hooks";
import { parseApiError, fieldErrorsFromDetails, errorMessageWithId } from "@/lib/errors";
import type { UpdateCompanyProfilePayload } from "@/types";

const E164 = /^\+[1-9]\d{1,14}$/;

const profileSchema = Joi.object({
  streetAddress: Joi.string().min(3).max(512).required().messages({
    "string.empty": "Street address is required",
    "string.min": "Street address must be at least 3 characters",
  }),
  city: Joi.string().min(2).max(128).required().messages({
    "string.empty": "City is required",
    "string.min": "City must be at least 2 characters",
  }),
  state: Joi.string().min(2).max(128).required().messages({
    "string.empty": "State or region is required",
  }),
  country: Joi.string().min(2).max(128).required().messages({
    "string.empty": "Country is required",
  }),
  postalCode: Joi.string().min(1).max(32).allow("").optional(),
  contactEmail: Joi.string().email({ tlds: { allow: false } }).max(255).required().messages({
    "string.empty": "Contact email is required",
    "string.email": "Enter a valid email address",
  }),
  // Country-specific phone validation runs post-Joi via libphonenumber-js.
  contactPhone: Joi.string().pattern(E164).required().messages({
    "string.empty": "Contact phone is required",
    "string.pattern.base": "Enter a valid phone number",
  }),
  whatsappNumber: Joi.string().pattern(E164).allow("").optional().messages({
    "string.pattern.base": "Enter a valid WhatsApp number",
  }),
  promoEmailOptIn: Joi.boolean().optional(),
});

type ProfileForm = {
  streetAddress: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  contactEmail: string;
  contactPhone: string;
  whatsappNumber: string;
  promoEmailOptIn: boolean;
};

export default function CompanySettingsPage() {
  const user = useAppSelector((state) => state.auth.user);
  const qc = useQueryClient();

  const profileQ = useQuery({
    queryKey: ["company", "profile"],
    queryFn: companyService.getProfile,
  });

  const company = profileQ.data;

  const [form, setForm] = useState<ProfileForm>({
    streetAddress: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    contactEmail: "",
    contactPhone: "",
    whatsappNumber: "",
    promoEmailOptIn: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sync form to fetched profile
  useEffect(() => {
    if (!company) return;
    setForm({
      streetAddress: company.streetAddress ?? "",
      city: company.city ?? "",
      state: company.state ?? "",
      country: company.country ?? "",
      postalCode: company.postalCode ?? "",
      contactEmail: company.contactEmail ?? "",
      contactPhone: company.contactPhone ?? "",
      whatsappNumber: company.whatsappNumber ?? "",
      promoEmailOptIn: !!company.promoEmailOptIn,
    });
  }, [company]);

  const updateMut = useMutation({
    mutationFn: companyService.updateProfile,
    onSuccess: () => {
      toast.success("Profile updated");
      qc.invalidateQueries({ queryKey: ["company", "profile"] });
      setErrors({});
    },
    onError: (err) => {
      const parsed = parseApiError(err);
      if (parsed.details?.length) {
        setErrors(fieldErrorsFromDetails(parsed.details));
        toast.error(parsed.message);
      } else {
        toast.error(errorMessageWithId(parsed));
      }
    },
  });

  const validate = () => {
    const { error } = profileSchema.validate(form, { abortEarly: false });
    if (!error) { setErrors({}); return true; }
    const next: Record<string, string> = {};
    error.details.forEach((d) => {
      const k = d.path[0] as string;
      if (!next[k]) next[k] = d.message;
    });
    setErrors(next);
    return false;
  };

  // Build minimal partial diff vs. server state
  const diff = (): UpdateCompanyProfilePayload => {
    if (!company) return {};
    const out: UpdateCompanyProfilePayload = {};
    if (form.streetAddress !== company.streetAddress) out.streetAddress = form.streetAddress;
    if (form.city !== company.city) out.city = form.city;
    if (form.state !== company.state) out.state = form.state;
    if (form.country !== company.country) out.country = form.country;
    const pc = form.postalCode || null;
    if (pc !== (company.postalCode ?? null)) out.postalCode = pc;
    if (form.contactEmail !== company.contactEmail) out.contactEmail = form.contactEmail;
    if (form.contactPhone !== company.contactPhone) out.contactPhone = form.contactPhone;
    const w = form.whatsappNumber || null;
    if (w !== (company.whatsappNumber ?? null)) out.whatsappNumber = w;
    if (form.promoEmailOptIn !== company.promoEmailOptIn) out.promoEmailOptIn = form.promoEmailOptIn;
    return out;
  };

  const isDirty = Object.keys(diff()).length > 0;

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    // Defensive guard against double-submit
    if (updateMut.isPending) return;
    if (!validate()) return;

    // Country-specific phone validation (libphonenumber-js)
    const phoneErrors: Record<string, string> = {};
    const cpErr = validatePhoneForCountry(form.contactPhone, form.country, { label: "Contact phone" });
    if (cpErr) phoneErrors.contactPhone = cpErr;
    if (form.whatsappNumber) {
      const waErr = validatePhoneForCountry(form.whatsappNumber, form.country, {
        required: false,
        label: "WhatsApp number",
      });
      if (waErr) phoneErrors.whatsappNumber = waErr;
    }
    if (Object.keys(phoneErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...phoneErrors }));
      return;
    }

    const payload = diff();
    if (Object.keys(payload).length === 0) return;
    updateMut.mutate(payload);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  return (
    <DashboardShell title="Settings" requiredRole="company">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Editable profile */}
        <Card>
          <CardHeader>
            <h3 className="text-h4 font-heading font-semibold text-slate-800 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-slate-400" />
              Company Profile
            </h3>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Read-only fields — not editable per BE spec */}
              <Input label="Company Name" value={company?.name ?? ""} disabled helperText="Contact support to change the company name" />
              <Input label="Company Registration Number" value={company?.registrationNumber ?? ""} disabled />
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-600">Business Type:</span>
                {company && (
                  <Badge variant="brand">
                    {company.businessType === "fuel_station" ? "Fuel Station" : "Shop"}
                  </Badge>
                )}
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <CountrySelect
                    value={form.country}
                    onChange={(e) => {
                      // Country change → cascade-reset state + city + phones
                      // (locked phone prefix changes with country, so old digits are no longer valid)
                      setForm((prev) => ({
                        ...prev,
                        country: e.target.value,
                        state: "",
                        city: "",
                        contactPhone: "",
                        whatsappNumber: "",
                      }));
                      setErrors((prev) => ({
                        ...prev,
                        country: "",
                        state: "",
                        city: "",
                        contactPhone: "",
                        whatsappNumber: "",
                      }));
                    }}
                    error={errors.country}
                  />
                  <StateSelect
                    country={form.country}
                    value={form.state}
                    onChange={(e) => {
                      // State change → reset city (city dropdown depends on state)
                      setForm((prev) => ({ ...prev, state: e.target.value, city: "" }));
                      if (errors.state) setErrors((prev) => ({ ...prev, state: "" }));
                      if (errors.city) setErrors((prev) => ({ ...prev, city: "" }));
                    }}
                    error={errors.state}
                  />
                </div>
                <Input
                  label="Street Address"
                  name="streetAddress"
                  placeholder="Street and number"
                  value={form.streetAddress}
                  onChange={handleChange}
                  error={errors.streetAddress}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <CityInput
                    country={form.country}
                    state={form.state}
                    value={form.city}
                    onChange={handleChange}
                    error={errors.city}
                  />
                  <Input
                    label="Postal Code"
                    name="postalCode"
                    placeholder="Optional"
                    value={form.postalCode}
                    onChange={handleChange}
                    error={errors.postalCode}
                    helperText="Leave blank if not used"
                  />
                </div>
                <Input
                  label="Contact Email"
                  name="contactEmail"
                  type="email"
                  value={form.contactEmail}
                  onChange={handleChange}
                  error={errors.contactEmail}
                  helperText="Public contact email"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <PhoneInput
                    label="Contact Phone"
                    name="contactPhone"
                    country={form.country}
                    value={form.contactPhone}
                    onChange={(v) => {
                      setForm((prev) => ({ ...prev, contactPhone: v }));
                      if (errors.contactPhone) setErrors((prev) => ({ ...prev, contactPhone: "" }));
                    }}
                    error={errors.contactPhone}
                    placeholder="Local number"
                  />
                  <PhoneInput
                    label="WhatsApp Number"
                    name="whatsappNumber"
                    country={form.country}
                    value={form.whatsappNumber}
                    onChange={(v) => {
                      setForm((prev) => ({ ...prev, whatsappNumber: v }));
                      if (errors.whatsappNumber) setErrors((prev) => ({ ...prev, whatsappNumber: "" }));
                    }}
                    error={errors.whatsappNumber}
                    placeholder="Optional"
                    helperText="Optional"
                  />
                </div>
                <Checkbox
                  name="promoEmailOptIn"
                  checked={form.promoEmailOptIn}
                  onChange={handleChange}
                  label="Receive promotional emails from KIMates"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" isLoading={updateMut.isPending} disabled={!isDirty}>
                  Save Changes
                </Button>
                {!isDirty && (
                  <span className="text-xs text-slate-400">No changes to save</span>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Account info (read-only) */}
        <Card>
          <CardHeader>
            <h3 className="text-h4 font-heading font-semibold text-slate-800 flex items-center gap-2">
              <LockIcon className="h-4 w-4 text-slate-400" />
              Account
            </h3>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-sm text-slate-500">Username</span>
              <span className="text-sm font-medium text-slate-800 font-mono">{user?.username ?? "—"}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-sm text-slate-500">Login Email</span>
              <span className="text-sm font-medium text-slate-800">{user?.email ?? "—"}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-sm text-slate-500">Status</span>
              {company && (
                <Badge variant={company.isActive ? "success" : "error"}>
                  {company.isActive ? "Active" : "Deactivated"}
                </Badge>
              )}
            </div>
            {company?.joinedAt && (
              <div className="flex justify-between items-center py-1.5">
                <span className="text-sm text-slate-500">Joined</span>
                <span className="text-sm font-medium text-slate-800">{formatDate(company.joinedAt)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Password change */}
        <PasswordChangeCard />
      </div>
    </DashboardShell>
  );
}
