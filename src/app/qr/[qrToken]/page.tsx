"use client";

import { useState, useEffect, use } from "react";
import { toast } from "react-toastify";
import { CheckCircle, AlertTriangle, MapPin, Loader2, X } from "lucide-react";
import { Button, Input, CustomerPhoneInput } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { qrService } from "@/services";
import { parseApiError, fieldErrorsFromDetails, errorMessageWithId } from "@/lib/errors";
import { isValidPhoneNumber } from "libphonenumber-js";
import Joi from "joi";
import type { QRCompanyInfo, QRSubmissionResponse } from "@/types";

const VEHICLE = /^[A-Za-z0-9-]+$/;
const MAX_INVOICE_AMOUNT = 10_000_000;

const baseSchema = {
  fullName: Joi.string().min(2).max(255).required().messages({
    "string.empty": "Full name is required",
    "string.min": "Name must be at least 2 characters",
  }),
  invoiceNumber: Joi.string().min(1).max(64).required().messages({
    "string.empty": "Invoice number is required",
  }),
  invoiceAmount: Joi.number().positive().max(MAX_INVOICE_AMOUNT).required().messages({
    "number.base": "Enter a valid amount",
    "number.positive": "Amount must be positive",
    "number.max": `Amount cannot exceed ${MAX_INVOICE_AMOUNT.toLocaleString()}`,
  }),
};

const fuelSchema = Joi.object({
  ...baseSchema,
  vehicleNumber: Joi.string().min(2).max(32).pattern(VEHICLE).required().messages({
    "string.empty": "Vehicle number is required",
    "string.pattern.base": "Only letters, numbers, and dashes allowed",
  }),
});

const shopSchema = Joi.object(baseSchema);

interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export default function QRSubmissionPage({
  params,
}: Readonly<{
  params: Promise<{ qrToken: string }>;
}>) {
  const { qrToken } = use(params);
  const [company, setCompany] = useState<QRCompanyInfo | null>(null);
  const [qrError, setQrError] = useState<"not_found" | "generic" | null>(null);
  const [isLoadingCompany, setIsLoadingCompany] = useState(true);

  const [form, setForm] = useState({
    mobile: "",
    fullName: "",
    vehicleNumber: "",
    invoiceNumber: "",
    invoiceAmount: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");
  const [rateLimitRemaining, setRateLimitRemaining] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<QRSubmissionResponse & { fullName: string; amount: number } | null>(null);

  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "pending" | "granted" | "denied">("idle");

  // Resolve QR token on mount
  useEffect(() => {
    let cancelled = false;
    qrService
      .resolveToken(qrToken)
      .then((info) => {
        if (!cancelled) {
          setCompany(info);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        const parsed = parseApiError(err);
        setQrError(parsed.status === 404 ? "not_found" : "generic");
      })
      .finally(() => {
        if (!cancelled) setIsLoadingCompany(false);
      });
    return () => {
      cancelled = true;
    };
  }, [qrToken]);

  // Countdown for 429.
  // Tick every second so the display is accurate even for the 15-minute
  // resubmit cooldown (BE 2026-05-03). Format as Xm Ys / Xm / Xs depending
  // on magnitude in the button label below.
  useEffect(() => {
    if (rateLimitRemaining <= 0) return;
    const t = setTimeout(() => setRateLimitRemaining((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [rateLimitRemaining]);

  const formatCountdown = (totalSeconds: number): string => {
    if (totalSeconds <= 0) return "";
    if (totalSeconds < 60) return `${totalSeconds}s`;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    // After ~3 minutes the second-precision is just visual noise — drop it.
    if (minutes >= 3) return `${minutes}m`;
    return seconds === 0 ? `${minutes}m` : `${minutes}m ${seconds}s`;
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("denied");
      return;
    }
    setLocationStatus("pending");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setLocationStatus("granted");
      },
      () => setLocationStatus("denied"),
      { timeout: 10_000, enableHighAccuracy: false }
    );
  };

  const isFuelStation = company?.businessType === "fuel_station";

  const validate = () => {
    const newErrors: Record<string, string> = {};

    // Mobile — validated via libphonenumber-js on the full E.164
    if (!form.mobile) {
      newErrors.mobile = "Mobile number is required";
    } else if (!isValidPhoneNumber(form.mobile)) {
      newErrors.mobile = "Enter a valid phone number for the selected country";
    }

    // Remaining fields via Joi
    const schema = isFuelStation ? fuelSchema : shopSchema;
    const payload: Record<string, unknown> = {
      fullName: form.fullName.trim(),
      invoiceNumber: form.invoiceNumber.trim(),
      invoiceAmount: form.invoiceAmount ? Number(form.invoiceAmount) : undefined,
    };
    if (isFuelStation) {
      payload.vehicleNumber = form.vehicleNumber.toUpperCase().trim();
    }
    const { error } = schema.validate(payload, { abortEarly: false });
    if (error) {
      error.details.forEach((d) => {
        const key = d.path[0] as string;
        if (!newErrors[key]) newErrors[key] = d.message;
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (rateLimitRemaining > 0) return;
    setGeneralError("");

    setIsSubmitting(true);
    try {
      const amount = Number(form.invoiceAmount);
      const payload: Parameters<typeof qrService.submitPurchase>[1] = {
        mobile: form.mobile.trim(),
        fullName: form.fullName.trim(),
        invoiceNumber: form.invoiceNumber.trim(),
        invoiceAmount: amount,
      };
      if (isFuelStation) {
        payload.vehicleNumber = form.vehicleNumber.toUpperCase().trim();
      }
      if (location) {
        payload.latitude = location.latitude;
        payload.longitude = location.longitude;
        payload.locationAccuracy = location.accuracy;
      }

      const result = await qrService.submitPurchase(qrToken, payload);
      setSuccess({ ...result, fullName: form.fullName.trim(), amount });
      toast.success("Purchase recorded — thank you!");
    } catch (err) {
      const parsed = parseApiError(err);
      if (parsed.status === 429) {
        const seconds = parsed.retryAfterSeconds ?? 60;
        setRateLimitRemaining(seconds);
        setGeneralError(parsed.message);
      } else if (parsed.status === 409) {
        setGeneralError(
          "This receipt has already been recorded. You cannot submit the same invoice twice."
        );
      } else if (parsed.details?.length) {
        setErrors(fieldErrorsFromDetails(parsed.details));
        setGeneralError(parsed.message);
      } else {
        setGeneralError(errorMessageWithId(parsed));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let v = value;
    if (name === "vehicleNumber") v = value.toUpperCase();
    setForm((prev) => ({ ...prev, [name]: v }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // ── Loading ───────────────────────────────────────────
  if (isLoadingCompany) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-primary-600 animate-spin mx-auto" />
          <p className="mt-4 text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  // ── QR invalid ────────────────────────────────────────
  if (qrError === "not_found" || !company) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-sm text-center bg-white rounded-2xl border border-slate-200 p-8">
          <div className="mx-auto h-16 w-16 rounded-full bg-error-100 flex items-center justify-center mb-4">
            <X className="h-8 w-8 text-error-500" />
          </div>
          <h1 className="text-xl font-heading font-bold text-slate-800">QR Code Not Recognized</h1>
          <p className="text-slate-500 mt-2 text-sm">
            {qrError === "not_found"
              ? "This QR code is invalid or no longer active."
              : "Could not load this QR code. Please try again."}
          </p>
        </div>
      </div>
    );
  }

  if (!company.isActive) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-sm text-center bg-white rounded-2xl border border-slate-200 p-8">
          <div className="mx-auto h-16 w-16 rounded-full bg-warning-100 flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-warning-500" />
          </div>
          <h1 className="text-xl font-heading font-bold text-slate-800">Not Accepting Submissions</h1>
          <p className="text-slate-500 mt-2 text-sm">
            <strong>{company.companyName}</strong> is not currently accepting purchase submissions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-md mx-auto px-4 py-6 sm:py-8">
        {/* Brand */}
        <div className="text-center mb-6">
          <span className="text-lg font-bold font-heading tracking-tight">
            <span className="text-primary-600">KI</span>
            <span className="text-slate-800">Mates</span>
          </span>
        </div>

        {/* Company info */}
        <div className="bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-2xl p-5 text-center mb-6 shadow-lg shadow-primary-600/20">
          <h2 className="text-lg sm:text-xl font-bold font-heading">{company.companyName}</h2>
          <span className="inline-block mt-2 bg-white/15 backdrop-blur text-primary-100 text-xs font-medium px-3 py-1 rounded-full">
            {isFuelStation ? "⛽ Fuel Station" : "🏪 Shop"}
          </span>
        </div>

        {/* Success state */}
        {success ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 text-center animate-fade-in">
            <div className="mx-auto h-16 w-16 rounded-full bg-success-100 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-success-500" />
            </div>
            <h3 className="text-xl font-heading font-bold text-slate-800">Thank You!</h3>
            <p className="text-slate-500 mt-2 text-sm">
              {success.fullName}, your purchase of{" "}
              <strong className="text-slate-700">{formatCurrency(success.amount)}</strong> has been recorded.
            </p>
            <div className="mt-6 bg-primary-50 rounded-xl p-4 border border-primary-100">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Your Total Spend Here</p>
              <p className="text-2xl sm:text-3xl font-bold font-heading text-primary-700 mt-1">
                {formatCurrency(success.customerTotalInvoiceAmount)}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                {success.customerSubmissionCount} purchase
                {success.customerSubmissionCount > 1 ? "s" : ""} recorded
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6">
            <h3 className="text-base sm:text-lg font-heading font-semibold text-slate-800 text-center mb-5">
              Record Your Purchase
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <CustomerPhoneInput
                label="Mobile Number"
                name="mobile"
                value={form.mobile}
                onChange={(e164) => {
                  setForm((prev) => ({ ...prev, mobile: e164 }));
                  if (errors.mobile) setErrors((prev) => ({ ...prev, mobile: "" }));
                }}
                error={errors.mobile}
              />

              <Input
                label="Full Name"
                name="fullName"
                placeholder="Enter your full name"
                value={form.fullName}
                onChange={handleChange}
                error={errors.fullName}
                autoComplete="name"
              />

              {isFuelStation && (
                <Input
                  label="Vehicle Registration"
                  name="vehicleNumber"
                  placeholder="e.g. NE-1234-AB"
                  value={form.vehicleNumber}
                  onChange={handleChange}
                  error={errors.vehicleNumber}
                  helperText="Letters, numbers, dashes — no spaces"
                  className="uppercase"
                />
              )}

              <Input
                label="Invoice Number"
                name="invoiceNumber"
                placeholder="As shown on your receipt"
                value={form.invoiceNumber}
                onChange={handleChange}
                error={errors.invoiceNumber}
              />

              <Input
                label="Invoice Amount (₣)"
                name="invoiceAmount"
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="0.00"
                value={form.invoiceAmount}
                onChange={handleChange}
                error={errors.invoiceAmount}
                helperText="West African CFA Franc"
              />

              {/* Geolocation (optional) */}
              <div className="pt-2">
                {locationStatus === "idle" && (
                  <button
                    type="button"
                    onClick={requestLocation}
                    className="w-full text-sm text-primary-600 hover:text-primary-700 py-2 flex items-center justify-center gap-2 border border-dashed border-primary-200 rounded-lg hover:bg-primary-50 transition-colors"
                  >
                    <MapPin className="h-4 w-4" /> Attach location (optional)
                  </button>
                )}
                {locationStatus === "pending" && (
                  <div className="flex items-center gap-2 text-sm text-slate-500 justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Getting location...
                  </div>
                )}
                {locationStatus === "granted" && location && (
                  <div className="flex items-center gap-2 text-sm text-success-600 justify-center py-2">
                    <CheckCircle className="h-4 w-4" />
                    Location attached (±{Math.round(location.accuracy)}m)
                  </div>
                )}
                {locationStatus === "denied" && (
                  <div className="text-center text-xs text-slate-400 py-2">
                    Location unavailable — submission will proceed without it
                  </div>
                )}
              </div>

              {generalError && (
                <p className="text-sm text-error-600 bg-error-50 border border-error-100 rounded-lg p-3">
                  {generalError}
                </p>
              )}

              <Button
                type="submit"
                fullWidth
                size="lg"
                isLoading={isSubmitting}
                disabled={isSubmitting || rateLimitRemaining > 0}
              >
                {rateLimitRemaining > 0 ? `Try again in ${formatCountdown(rateLimitRemaining)}` : "Submit Purchase"}
              </Button>
            </form>
          </div>
        )}

        <p className="text-center text-xs text-slate-400 mt-8">
          Powered by <span className="font-semibold text-slate-500">KIMates</span>
        </p>
      </div>
    </div>
  );
}
