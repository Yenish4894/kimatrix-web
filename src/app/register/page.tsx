"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock } from "lucide-react";
import { AuthLayout } from "@/components/layouts/auth-layout";
import { Button, Input, Select, Checkbox } from "@/components/ui";
import { CountrySelect, StateSelect, CityInput } from "@/components/ui/country-state-select";
import { PhoneInput, validatePhoneForCountry } from "@/components/ui/phone-input";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { registerCompany } from "@/store/slices/authSlice";
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
  password: Joi.string().min(8).max(128).pattern(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required().messages({
    "string.empty": "Password is required",
    "string.min": "Password must be at least 8 characters",
    "string.pattern.base": "Must include lowercase, uppercase, and number",
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
  // Default Country to Niger — platform is Niger-only for MVP, saves a click for 99% of users
  country: "Niger",
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
  const [pendingResult, setPendingResult] = useState<{ companyName: string; message: string } | null>(null);
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.auth);

  const validate = () => {
    const { error } = schema.validate(form, { abortEarly: false });
    if (!error) { setErrors({}); return true; }
    const newErrors: Record<string, string> = {};
    error.details.forEach((d) => {
      const key = d.path[0] as string;
      if (!newErrors[key]) newErrors[key] = d.message;
    });
    setErrors(newErrors);
    return false;
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    // Defensive guard against double-submit on slow connections / Suspense
    if (isLoading) return;
    if (!validate()) return;

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

    try {
      const result = await dispatch(
        registerCompany({ ...form, businessType: form.businessType as BusinessType })
      ).unwrap();
      // Account is in PENDING state. No tokens issued. Show pending screen.
      setPendingResult({
        companyName: result.company.name,
        message: result.message ?? "Thank you for registering. Once your payment is verified, your account will be activated and you'll be able to log in.",
      });
    } catch (err) {
      const parsed = parseApiError(err);
      if (parsed.details?.length) {
        setErrors(fieldErrorsFromDetails(parsed.details));
        toast.error(parsed.message);
      } else if (parsed.message.toLowerCase().includes("password") && parsed.message.toLowerCase().includes("breach")) {
        setErrors({ password: "This password has appeared in a known data breach. Choose another." });
        toast.error("Password is not secure. Please choose another.");
      } else {
        toast.error(errorMessageWithId(parsed));
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Pending activation success screen — shown after successful registration.
  // No tokens are issued; user must wait for super admin to activate the account.
  if (pendingResult) {
    return (
      <AuthLayout
        title="Application received"
        subtitle="Your account is awaiting activation"
      >
        <div className="space-y-6">
          <div className="rounded-2xl border border-success-100 bg-success-50/60 p-5">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-success-100 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-5 w-5 text-success-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-success-800">
                  {pendingResult.companyName} registered successfully
                </p>
                <p className="text-sm text-success-700/90 mt-1 leading-relaxed">
                  {pendingResult.message}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-primary-100 bg-primary-50/70 p-4">
            <div className="flex items-start gap-3">
              <Clock className="h-4 w-4 text-primary-600 mt-0.5 shrink-0" />
              <div className="text-xs text-primary-800 leading-relaxed">
                <p className="font-semibold mb-1">What happens next?</p>
                <ol className="list-decimal list-inside space-y-0.5 text-primary-700/90">
                  <li>Log in with your credentials below.</li>
                  <li>Choose a subscription plan and pay via PayPal.</li>
                  <li>Your account activates instantly — no waiting.</li>
                </ol>
              </div>
            </div>
          </div>

          <Link href="/login" className="block">
            <Button fullWidth>Log In &amp; Subscribe</Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create Account" subtitle="Register your business to get started">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide mb-4">Business Information</h3>
          <div className="space-y-4">
            <Input label="Company Name" name="name" placeholder="e.g. Sahel Fuel Co." value={form.name} onChange={handleChange} error={errors.name} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Company Registration Number" name="registrationNumber" placeholder="e.g. RC-12345" value={form.registrationNumber} onChange={handleChange} error={errors.registrationNumber} />
              <Select
                label="Business Type"
                name="businessType"
                value={form.businessType}
                onChange={handleChange}
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
          <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide mb-4">Address</h3>
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
            <Input label="Street Address" name="streetAddress" placeholder="Street and number" value={form.streetAddress} onChange={handleChange} error={errors.streetAddress} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CityInput
                country={form.country}
                state={form.state}
                value={form.city}
                onChange={handleChange}
                error={errors.city}
              />
              <Input label="Postal Code" name="postalCode" placeholder="Optional" value={form.postalCode} onChange={handleChange} error={errors.postalCode} helperText="Leave blank if not used" />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide mb-4">Contact Information</h3>
          <div className="space-y-4">
            <Input label="Contact Email" name="contactEmail" type="email" placeholder="contact@company.com" value={form.contactEmail} onChange={handleChange} error={errors.contactEmail} helperText="Public contact email" />
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
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide mb-4">Account Setup</h3>
          <div className="space-y-4">
            <Input label="Login Email" name="email" type="email" placeholder="admin@company.com" value={form.email} onChange={handleChange} error={errors.email} helperText="Private email for logging in" />
            <Input label="Username" name="username" placeholder="Choose a unique username" value={form.username} onChange={handleChange} error={errors.username} helperText="Letters, numbers, dots, dashes, underscores only" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Password" name="password" type="password" placeholder="8+ chars, upper, lower, digit" value={form.password} onChange={handleChange} error={errors.password} />
              <Input label="Confirm Password" name="confirmPassword" type="password" placeholder="Re-enter password" value={form.confirmPassword} onChange={handleChange} error={errors.confirmPassword} />
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

        <Button type="submit" fullWidth isLoading={isLoading}>
          Register
        </Button>

        <p className="text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="text-primary-600 hover:underline font-medium">Login</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
