"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { AuthLayout } from "@/components/layouts/auth-layout";
import { Button, Input, Select, Checkbox } from "@/components/ui";
import { CountrySelect, StateSelect, CityInput } from "@/components/ui/country-state-select";
import { PhoneInput, validatePhoneForCountry } from "@/components/ui/phone-input";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { registerCompany } from "@/store/slices/authSlice";
import { authService } from "@/services/auth.service";
import { parseApiError, fieldErrorsFromDetails, errorMessageWithId } from "@/lib/errors";
import { toast } from "react-toastify";
import type { BusinessType } from "@/types";
import Joi from "joi";

const E164 = /^\+[1-9]\d{1,14}$/;

const schema = Joi.object({
  name: Joi.string().min(2).max(255).required().messages({
    "string.empty": "Company name is required",
    "string.min": "Name must be at least 2 characters",
  }),
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
    "string.min": "State must be at least 2 characters",
  }),
  country: Joi.string().min(2).max(128).required().messages({
    "string.empty": "Country is required",
    "string.min": "Country must be at least 2 characters",
  }),
  postalCode: Joi.string().min(1).max(32).allow("").optional().messages({
    "string.max": "Postal code cannot exceed 32 characters",
  }),
  registrationNumber: Joi.string().min(3).max(128).required().messages({
    "string.empty": "Registration number is required",
  }),
  contactEmail: Joi.string().email({ tlds: { allow: false } }).max(255).required().messages({
    "string.empty": "Contact email is required",
    "string.email": "Enter a valid email address",
  }),
  // Country-specific phone validation runs post-Joi via libphonenumber-js.
  // Joi here only enforces presence + basic shape (must start with +).
  contactPhone: Joi.string().pattern(E164).required().messages({
    "string.empty": "Contact phone is required",
    "string.pattern.base": "Enter a valid phone number",
  }),
  whatsappNumber: Joi.string().pattern(E164).allow("").optional().messages({
    "string.pattern.base": "Enter a valid WhatsApp number",
  }),
  businessType: Joi.string().valid("fuel_station", "shop").required().messages({
    "any.only": "Select a business type",
    "string.empty": "Select a business type",
  }),
  username: Joi.string().min(3).max(64).pattern(/^[a-zA-Z0-9_.-]+$/).required().messages({
    "string.empty": "Username is required",
    "string.min": "Username must be at least 3 characters",
    "string.pattern.base": "Use only letters, numbers, dots, dashes, and underscores",
  }),
  email: Joi.string().email({ tlds: { allow: false } }).max(255).required().messages({
    "string.empty": "Login email is required",
    "string.email": "Enter a valid email address",
  }),
  password: Joi.string().min(8).max(18).pattern(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/).required().messages({
    "string.empty": "Password is required",
    "string.min": "Password must be at least 8 characters",
    "string.max": "Password must be at most 18 characters",
    "string.pattern.base": "Must include lowercase, uppercase, number, and special character",
  }),
  confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
    "string.empty": "Please confirm your password",
    "any.only": "Passwords do not match",
  }),
  promoEmailOptIn: Joi.boolean().optional(),
  termsAccepted: Joi.boolean().valid(true).required().messages({
    "any.only": "You must accept the Terms and Privacy Policy",
  }),
});

const initialForm = {
  name: "",
  // Default Country to South Africa — saves a click for 99% of users
  country: "South Africa",
  state: "",
  city: "",
  streetAddress: "",
  postalCode: "",
  registrationNumber: "",
  contactEmail: "",
  contactPhone: "",
  whatsappNumber: "",
  businessType: "" as "" | BusinessType,
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  promoEmailOptIn: false,
  termsAccepted: false,
};

export default function RegisterPage() {
  const [form, setForm] = useState<typeof initialForm>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isLoading } = useAppSelector((state) => state.auth);



  /** Pure — builds the error map without touching state, so the caller can both set
   *  it and use it to decide which field to focus. */
  const computeErrors = (): Record<string, string> => {
    const { error } = schema.validate(form, { abortEarly: false });
    if (!error) return {};
    const newErrors: Record<string, string> = {};
    error.details.forEach((d) => {
      const key = d.path[0] as string;
      if (!newErrors[key]) newErrors[key] = d.message;
    });
    return newErrors;
  };

  // Validate a single field on blur using the full schema so cross-field refs
  // (e.g. confirmPassword vs password) resolve correctly.
  const validateField = (name: string) => {
    const { error } = schema.validate(form, { abortEarly: false });
    const fieldError = error?.details.find((d) => d.path[0] === name);
    setErrors((prev) => ({ ...prev, [name]: fieldError?.message ?? "" }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    validateField(e.target.name);
  };

  const handlePhoneBlur = (name: "contactPhone" | "whatsappNumber") => {
    const { error } = schema.validate(form, { abortEarly: false });
    const joiErr = error?.details.find((d) => d.path[0] === name);
    if (joiErr) {
      setErrors((prev) => ({ ...prev, [name]: joiErr.message }));
      return;
    }
    const value = form[name];
    if (value) {
      const label = name === "contactPhone" ? "Contact phone" : "WhatsApp number";
      const phoneErr = validatePhoneForCountry(value, form.country, {
        required: name === "contactPhone",
        label,
      });
      setErrors((prev) => ({ ...prev, [name]: phoneErr ?? "" }));
    }
  };

  /**
   * Scroll the first invalid field into view and focus it.
   *
   * This form is ~15 fields across five sections; the submit button sits well below
   * the fold. Without this, a failed validation set state and returned silently — the
   * errors rendered hundreds of pixels above the viewport and the user experienced it
   * as "the register button does nothing".
   */
  const focusFirstError = (errs: Record<string, string>) => {
    const firstKey = Object.keys(errs).find((k) => errs[k]);
    if (!firstKey) return;
    const el =
      document.querySelector<HTMLElement>(`[name="${firstKey}"]`) ??
      document.getElementById("plan-picker");
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.focus({ preventScroll: true });
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    // Defensive guard against double-submit on slow connections / Suspense
    if (isLoading || isProcessing) return;

    const validationErrors = computeErrors();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      focusFirstError(validationErrors);
      return;
    }

    // Country-specific phone validation (libphonenumber-js)
    // Joi already enforced E.164 shape; this checks length + country-specific rules.
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

    setIsProcessing(true);

    // Create the account. This also establishes a session (auto-login), so the
    // customer lands inside the app rather than back at a login screen.
    let result: Awaited<ReturnType<typeof authService.registerCompany>>;
    try {
      result = await dispatch(
        registerCompany({ ...form, businessType: form.businessType as BusinessType })
      ).unwrap();
    } catch (err) {
      setIsProcessing(false);
      const parsed = parseApiError(err);
      if (parsed.details?.length) {
        setErrors(fieldErrorsFromDetails(parsed.details));
        toast.error(parsed.message);
      } else {
        toast.error(errorMessageWithId(parsed));
      }
      return;
    }

    // Registration is finished. No payment step.
    //
    // It used to redirect straight to PayPal, which meant the free trial was
    // unreachable — the trial existed in the backend and no customer could ever get
    // to it, because the front door demanded a plan and a card. The default path is
    // now the trial; paying is something they choose later from the billing page.
    //
    // `trial.eligible` is advisory (the server re-decides at confirmation), so it is
    // only used to pick a destination, never to promise anything.
    if (result.trial?.eligible === false) {
      // A repeat email or phone. Deliberately not told which — that would be an
      // enumeration oracle — and never blocked from registering, only from the trial.
      toast.info("Account created. Choose a plan to activate your QR code.");
      router.replace("/company/billing");
      return;
    }

    toast.success("Account created. Check your email to start your free trial.");
    router.replace("/company/dashboard");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  return (
    <AuthLayout title="Create Account" subtitle="Start your free trial — no card required">
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <div>
          <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wide mb-4">Business Information</h2>
          <div className="space-y-4">
            <Input label="Company Name" name="name" placeholder="e.g. Sahel Fuel Co." value={form.name} onChange={handleChange} onBlur={handleBlur} error={errors.name} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Company Registration Number" name="registrationNumber" placeholder="e.g. RC-12345" value={form.registrationNumber} onChange={handleChange} onBlur={handleBlur} error={errors.registrationNumber} />
              <Select
                label="Business Type"
                name="businessType"
                value={form.businessType}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.businessType}
                placeholder="Select type"
                options={[
                  { value: "fuel_station", label: "Fuel Station" },
                  { value: "shop", label: "Shop" },
                ]}
              />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wide mb-4">Address</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CountrySelect
                value={form.country}
                onChange={(e) => {
                  // Country change → cascade-reset state + city + phones
                  // (the locked phone prefix changes with country, so old digits are no longer valid)
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
                  // State change → reset city (city dropdown depends on state; old value may not be in the new list)
                  setForm((prev) => ({ ...prev, state: e.target.value, city: "" }));
                  if (errors.state) setErrors((prev) => ({ ...prev, state: "" }));
                  if (errors.city) setErrors((prev) => ({ ...prev, city: "" }));
                }}
                error={errors.state}
              />
            </div>
            <Input label="Street Address" name="streetAddress" placeholder="Street and number" value={form.streetAddress} onChange={handleChange} onBlur={handleBlur} error={errors.streetAddress} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CityInput
                country={form.country}
                state={form.state}
                value={form.city}
                onChange={handleChange}
                error={errors.city}
              />
              <Input label="Postal Code" name="postalCode" placeholder="Optional" value={form.postalCode} onChange={handleChange} onBlur={handleBlur} error={errors.postalCode} helperText="Leave blank if not used" />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wide mb-4">Contact Information</h2>
          <div className="space-y-4">
            <Input label="Contact Email" name="contactEmail" type="email" placeholder="contact@company.com" value={form.contactEmail} onChange={handleChange} onBlur={handleBlur} error={errors.contactEmail} helperText="Public contact email" />
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
                onBlur={() => handlePhoneBlur("contactPhone")}
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
                onBlur={() => handlePhoneBlur("whatsappNumber")}
                error={errors.whatsappNumber}
                placeholder="Optional"
                helperText="Optional"
              />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wide mb-4">Account Setup</h2>
          <div className="space-y-4">
            <Input label="Login Email" name="email" type="email" placeholder="admin@company.com" value={form.email} onChange={handleChange} onBlur={handleBlur} error={errors.email} helperText="Private email for logging in" />
            <Input label="Username" name="username" placeholder="Choose a unique username" value={form.username} onChange={handleChange} onBlur={handleBlur} error={errors.username} helperText="Letters, numbers, dots, dashes, underscores only" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Password" name="password" type="password" placeholder="8–18 chars, upper, lower, number, special" value={form.password} onChange={handleChange} onBlur={handleBlur} error={errors.password} />
              <Input label="Confirm Password" name="confirmPassword" type="password" placeholder="Re-enter password" value={form.confirmPassword} onChange={handleChange} onBlur={handleBlur} error={errors.confirmPassword} />
            </div>
          </div>
        </div>

        {/* What used to be the plan picker. Registration no longer takes payment —
            the default path is the free trial, and paying is a later, separate choice
            made from the billing page. */}
        <div className="rounded-xl border border-primary-100 bg-primary-50/60 p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-primary-900">
                Your free trial starts when you confirm your email
              </p>
              <p className="mt-1 text-sm text-primary-800/80">
                No card needed. We&apos;ll email you a confirmation link — click it and your QR
                code goes live straight away. You can choose a plan any time before the trial
                ends.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Checkbox name="promoEmailOptIn" checked={form.promoEmailOptIn} onChange={handleChange} label="I agree to receive promotional emails from KIMates" />
          <Checkbox
            name="termsAccepted"
            checked={form.termsAccepted}
            onChange={handleChange}
            label={
              <span>
                I agree to the{" "}
                <Link href="/terms" className="text-primary-600 hover:underline" target="_blank" rel="noopener noreferrer">Terms of Service</Link>
                {" "}and{" "}
                <Link href="/privacy" className="text-primary-600 hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</Link>
              </span>
            }
            error={errors.termsAccepted}
          />
        </div>

        <Button type="submit" fullWidth isLoading={isLoading || isProcessing}>
          <Sparkles className="h-4 w-4 mr-2" aria-hidden="true" />
          {isProcessing ? "Creating your account…" : "Start my free trial"}
        </Button>

        <p className="text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="text-primary-600 hover:underline font-medium">Login</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
