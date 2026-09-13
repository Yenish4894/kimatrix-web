"use client";

import { useState } from "react";
import Link from "next/link";
import { MailCheck, Sparkles } from "lucide-react";
import { AuthLayout } from "@/components/layouts/auth-layout";
import { Button, Input, Select, Checkbox } from "@/components/ui";
import { CountrySelect, StateSelect, CityInput } from "@/components/ui/country-state-select";
import { PhoneInput, validatePhoneForCountry } from "@/components/ui/phone-input";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { registerCompany } from "@/store/slices/authSlice";
import { parseApiError, fieldErrorsFromDetails, errorMessageWithId } from "@/lib/errors";
import { toast } from "react-toastify";
import { EmailSuggestion, useEmailSuggestion } from "@/components/ui/email-suggestion";
import { TurnstileWidget } from "@/components/auth/turnstile-widget";
import type { BusinessType } from "@/types";

// Inlined at build time. Unset → no widget, no token sent (the server only enforces
// Turnstile when it has a secret configured).
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
import { v, newPasswordSchema, PASSWORD_HELP } from "@/lib/validation";

const E164 = /^\+[1-9]\d{1,14}$/;

const schema = v.object({
  name: v.string().min(2).max(255).required().messages({
    "string.empty": "Company name is required",
    "string.min": "Name must be at least 2 characters",
  }),
  streetAddress: v.string().min(3).max(512).required().messages({
    "string.empty": "Street address is required",
    "string.min": "Street address must be at least 3 characters",
  }),
  city: v.string().min(2).max(128).required().messages({
    "string.empty": "City is required",
    "string.min": "City must be at least 2 characters",
  }),
  state: v.string().min(2).max(128).required().messages({
    "string.empty": "State or region is required",
    "string.min": "State must be at least 2 characters",
  }),
  country: v.string().min(2).max(128).required().messages({
    "string.empty": "Country is required",
    "string.min": "Country must be at least 2 characters",
  }),
  postalCode: v.string().min(1).max(32).allow("").optional().messages({
    "string.max": "Postal code cannot exceed 32 characters",
  }),
  registrationNumber: v.string().min(3).max(128).required().messages({
    "string.empty": "Registration number is required",
  }),
  contactEmail: v.string().email().max(255).required().messages({
    "string.empty": "Contact email is required",
    "string.email": "Enter a valid email address",
  }),
  // Country-specific phone validation runs after this via libphonenumber-js.
  // The schema here only enforces presence + basic shape (must start with +).
  contactPhone: v.string().pattern(E164).required().messages({
    "string.empty": "Contact phone is required",
    "string.pattern.base": "Enter a valid phone number",
  }),
  whatsappNumber: v.string().pattern(E164).allow("").optional().messages({
    "string.pattern.base": "Enter a valid WhatsApp number",
  }),
  businessType: v.string().valid("fuel_station", "shop").required().messages({
    "any.only": "Select a business type",
    "string.empty": "Select a business type",
  }),
  username: v.string().min(3).max(64).pattern(/^[a-zA-Z0-9_.-]+$/).required().messages({
    "string.empty": "Username is required",
    "string.min": "Username must be at least 3 characters",
    "string.pattern.base": "Use only letters, numbers, dots, dashes, and underscores",
  }),
  email: v.string().email().max(255).required().messages({
    "string.empty": "Login email is required",
    "string.email": "Enter a valid email address",
  }),
  password: newPasswordSchema("Password is required"),
  confirmPassword: v.string().valid(v.ref("password")).required().messages({
    "string.empty": "Please confirm your password",
    "any.only": "Passwords do not match",
  }),
  promoEmailOptIn: v.boolean().optional(),
  termsAccepted: v.boolean().valid(true).required().messages({
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
  /** Set once the server accepts the form; switches the page to "check your email". */
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const { isLoading } = useAppSelector((state) => state.auth);
  // Kept out of `form`, which mirrors the validation schema field for field.
  const [website, setWebsite] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const awaitingTurnstile = !!TURNSTILE_SITE_KEY && !turnstileToken;

  const applyEmail = (name: "email" | "contactEmail") => (value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };
  const loginEmailHint = useEmailSuggestion(applyEmail("email"));
  const contactEmailHint = useEmailSuggestion(applyEmail("contactEmail"));

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
    const shapeErr = error?.details.find((d) => d.path[0] === name);
    if (shapeErr) {
      setErrors((prev) => ({ ...prev, [name]: shapeErr.message }));
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
    // Never focus the honeypot, even if the server names it.
    const firstKey = Object.keys(errs).find((k) => errs[k] && k !== "website");
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
    if (isLoading || isProcessing || awaitingTurnstile) return;

    const validationErrors = computeErrors();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      focusFirstError(validationErrors);
      return;
    }

    // Country-specific phone validation (libphonenumber-js)
    // The schema already enforced E.164 shape; this checks length + country-specific rules.
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

    // Create the account. No session comes back: the server answers the same neutral
    // "check your email" whether it created an account or the login email was already
    // registered (it emails that owner instead), so this page can't reveal which.
    try {
      await dispatch(
        registerCompany({
          ...form,
          businessType: form.businessType as BusinessType,
          website,
          ...(TURNSTILE_SITE_KEY && turnstileToken ? { turnstileToken } : {}),
        })
      ).unwrap();
    } catch (err) {
      setIsProcessing(false);
      // Turnstile tokens are single-use: the one just sent is spent either way.
      if (TURNSTILE_SITE_KEY) {
        setTurnstileToken(null);
        setTurnstileResetKey((k) => k + 1);
      }
      const parsed = parseApiError(err);
      if (parsed.details?.length) {
        const fieldErrors = fieldErrorsFromDetails(parsed.details);
        setErrors(fieldErrors);
        // e.g. a rejected login email sits far above the submit button.
        focusFirstError(fieldErrors);
        toast.error(parsed.message);
      } else {
        toast.error(errorMessageWithId(parsed));
      }
      return;
    }

    // Done. No payment step and no redirect into the app: show "check your email".
    // The emailed link starts the free trial; paying is a later choice from billing.
    setIsProcessing(false);
    // Spent either way; a fresh one is needed if they come back to edit the form.
    if (TURNSTILE_SITE_KEY) {
      setTurnstileToken(null);
      setTurnstileResetKey((k) => k + 1);
    }
    setSubmittedEmail(form.email.trim());
    window.scrollTo({ top: 0 });
  };

  if (submittedEmail) {
    return (
      <AuthLayout title="Check your email" subtitle="One more step to start your free trial">
        <div className="space-y-5 text-center" role="status" aria-live="polite">
          <MailCheck className="mx-auto h-12 w-12 text-primary-600" aria-hidden="true" />
          <p className="text-sm text-slate-700">
            We&apos;ve sent an email to{" "}
            <span className="font-semibold text-slate-900 break-all">{submittedEmail}</span>.
            Click the link in it to confirm your address — your free trial starts then.
          </p>
          <p className="text-sm text-slate-500">
            Can&apos;t find it? Check your spam or promotions folder. If you already have an
            account with this email, we&apos;ve sent you a sign-in reminder instead.
          </p>
          <Link href="/login" className="block">
            <Button type="button" fullWidth>Log in</Button>
          </Link>
          <p className="text-sm text-slate-500">
            Wrong email address?{" "}
            <button
              type="button"
              className="text-primary-600 hover:underline font-medium"
              onClick={() => setSubmittedEmail(null)}
            >
              Go back and fix it
            </button>
          </p>
        </div>
      </AuthLayout>
    );
  }

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
            {/* Full width: side by side, the selects clipped "South Africa" and the
                state placeholder mid-word. */}
            <div className="grid grid-cols-1 gap-4">
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
            <div>
              <Input
                ref={contactEmailHint.inputRef}
                label="Contact Email"
                name="contactEmail"
                type="email"
                placeholder="contact@company.com"
                value={form.contactEmail}
                onChange={(e) => { handleChange(e); contactEmailHint.reset(); }}
                onBlur={(e) => { handleBlur(e); contactEmailHint.check(e.target.value); }}
                error={errors.contactEmail}
                helperText="Public contact email"
              />
              <EmailSuggestion suggestion={contactEmailHint.suggestion} error={errors.contactEmail} onApply={contactEmailHint.apply} />
            </div>
            <div className="grid grid-cols-1 gap-4">
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
            <div>
              <Input
                ref={loginEmailHint.inputRef}
                label="Login Email"
                name="email"
                type="email"
                placeholder="admin@company.com"
                value={form.email}
                onChange={(e) => { handleChange(e); loginEmailHint.reset(); }}
                onBlur={(e) => { handleBlur(e); loginEmailHint.check(e.target.value); }}
                error={errors.email}
                helperText="Private email for logging in"
              />
              <EmailSuggestion suggestion={loginEmailHint.suggestion} error={errors.email} onApply={loginEmailHint.apply} />
            </div>
            <Input label="Username" name="username" placeholder="Choose a unique username" value={form.username} onChange={handleChange} onBlur={handleBlur} error={errors.username} helperText="Letters, numbers, dots, dashes, underscores only" />
            {/* The rules live in helper text, not the placeholder: a placeholder was cut
                off at this width and disappears as soon as the user starts typing. */}
            <div className="grid grid-cols-1 gap-4">
              <Input label="Password" name="password" type="password" placeholder="Create a password" value={form.password} onChange={handleChange} onBlur={handleBlur} error={errors.password} helperText={PASSWORD_HELP} />
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

        {/* Honeypot. Off-screen rather than display:none, which bots detect and skip.
            A human never sees, tabs to, or autofills it; anything typed here marks a bot. */}
        <div
          aria-hidden="true"
          style={{ position: "absolute", left: "-10000px", top: "auto", width: 1, height: 1, overflow: "hidden" }}
        >
          <label htmlFor="register-website">Website</label>
          <input
            id="register-website"
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>

        {TURNSTILE_SITE_KEY && (
          <TurnstileWidget
            siteKey={TURNSTILE_SITE_KEY}
            action="register"
            resetKey={turnstileResetKey}
            onToken={setTurnstileToken}
          />
        )}

        <Button type="submit" fullWidth isLoading={isLoading || isProcessing} disabled={awaitingTurnstile}>
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
