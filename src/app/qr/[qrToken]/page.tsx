"use client";

import { useState, useEffect, useCallback, useRef, use } from "react";
import { toast } from "react-toastify";
import {
  CheckCircle,
  AlertTriangle,
  MapPin,
  Loader2,
  X,
  Fuel,
  Store,
  WifiOff,
} from "lucide-react";
import { Button, Input } from "@/components/ui";
// By path, not via the barrel — this drags in the country dataset and phone metadata,
// and this is the only route that needs them.
import {
  CustomerPhoneInput,
  isoFromCountryName,
} from "@/components/ui/customer-phone-input";
import { formatCurrency, getCurrencySymbol } from "@/lib/utils";
import { qrService } from "@/services";
import { parseApiError, fieldErrorsFromDetails, errorMessageWithId } from "@/lib/errors";
import { isValidPhoneNumber } from "libphonenumber-js";
import type { QRCompanyInfo, QRSubmissionResponse } from "@/types";

const VEHICLE = /^[A-Za-z0-9-]+$/;
const MAX_INVOICE_AMOUNT = 10_000_000;

/**
 * Hand-rolled rather than Joi.
 *
 * Joi is 171 KB raw / 53 KB gzipped and is not tree-shakeable — it builds its whole
 * type registry at module scope, so these four rules cost exactly as much as the
 * 15-field registration schema. That was 21% of everything this route shipped, parsed
 * before hydration, on the one page a walk-up customer loads over mobile data.
 *
 * The page already hand-rolls the phone check via `isValidPhoneNumber`, so this is
 * consistent with what was here rather than a new pattern. The server validates all
 * of this again regardless — this layer exists purely to catch mistakes early.
 */
const RULES: Record<string, (raw: string) => string | undefined> = {
  fullName: (v) => {
    const t = v.trim();
    if (!t) return "Full name is required";
    if (t.length < 2) return "Name must be at least 2 characters";
    if (t.length > 255) return "Name is too long";
    return undefined;
  },
  invoiceNumber: (v) => {
    const t = v.trim();
    if (!t) return "Invoice number is required";
    if (t.length > 64) return "Invoice number is too long";
    return undefined;
  },
  invoiceAmount: (v) => {
    if (!v.trim()) return "Enter a valid amount";
    const n = Number(v);
    if (!Number.isFinite(n)) return "Enter a valid amount";
    if (n <= 0) return "Amount must be positive";
    if (n > MAX_INVOICE_AMOUNT)
      return `Amount cannot exceed ${MAX_INVOICE_AMOUNT.toLocaleString()}`;
    return undefined;
  },
  vehicleNumber: (v) => {
    const t = v.trim().toUpperCase();
    if (!t) return "Vehicle number is required";
    if (t.length < 2) return "Vehicle number is too short";
    if (t.length > 32) return "Vehicle number is too long";
    if (!VEHICLE.test(t)) return "Only letters, numbers, and dashes allowed";
    return undefined;
  },
};

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
  const [isSlow, setIsSlow] = useState(false);
  const [success, setSuccess] = useState<QRSubmissionResponse & { fullName: string; amount: number } | null>(null);

  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "pending" | "granted" | "denied">("idle");

  // Resolve QR token. Extracted from the effect so the "couldn't connect" screen can
  // re-run it — a customer on a flaky connection must be able to retry without knowing
  // to reload the browser.
  const loadCompany = useCallback(() => {
    let cancelled = false;
    setQrError(null);
    setIsLoadingCompany(true);
    qrService
      .resolveToken(qrToken)
      .then((info) => {
        if (!cancelled) setCompany(info);
      })
      .catch((err) => {
        if (cancelled) return;
        const parsed = parseApiError(err);
        // 404 means the QR genuinely isn't ours. Anything else — offline, timeout,
        // 5xx — is a transient failure and must NOT be reported as an invalid code.
        setQrError(parsed.status === 404 ? "not_found" : "generic");
      })
      .finally(() => {
        if (!cancelled) setIsLoadingCompany(false);
      });
    return () => {
      cancelled = true;
    };
  }, [qrToken]);

  useEffect(() => loadCompany(), [loadCompany]);

  // Countdown for 429.
  // Tick every second so the display is accurate even for the 15-minute
  // resubmit cooldown (BE 2026-05-03). Format as Xm Ys / Xm / Xs depending
  // on magnitude in the button label below.
  useEffect(() => {
    if (rateLimitRemaining <= 0) return;
    const t = setTimeout(() => {
      // Clear the "too many requests" alert as the countdown ends, otherwise the
      // button reverts to "Submit Purchase" while a red error still sits above it.
      if (rateLimitRemaining === 1) setGeneralError("");
      setRateLimitRemaining((n) => n - 1);
    }, 1000);
    return () => clearTimeout(t);
  }, [rateLimitRemaining]);

  // Move focus to the success card once it renders.
  const successRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (success) successRef.current?.focus();
  }, [success]);

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

  /** Pure — builds the full error map without touching state. */
  const computeErrors = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    // Mobile — validated via libphonenumber-js on the full E.164
    if (!form.mobile) {
      newErrors.mobile = "Mobile number is required";
    } else if (!isValidPhoneNumber(form.mobile)) {
      newErrors.mobile = "Enter a valid phone number for the selected country";
    }

    // Vehicle number only applies to fuel stations; shops must not be asked for it.
    const fields = isFuelStation
      ? (["fullName", "invoiceNumber", "invoiceAmount", "vehicleNumber"] as const)
      : (["fullName", "invoiceNumber", "invoiceAmount"] as const);

    for (const field of fields) {
      const message = RULES[field]?.(form[field]);
      if (message) newErrors[field] = message;
    }

    return newErrors;
  };

  const validate = () => {
    const newErrors = computeErrors();
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Validate the blurred field only. Customers fill this on a phone with no
   * account — catching a bad invoice number at blur beats a wall of errors
   * after they've already hit Submit.
   */
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setErrors((prev) => ({ ...prev, [name]: computeErrors()[name] ?? "" }));
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (rateLimitRemaining > 0) return;
    setGeneralError("");

    setIsSubmitting(true);
    // A bare spinner for up to 15s reads as "frozen" to someone standing at a counter,
    // and the recovery they reach for is a browser reload, which loses the form.
    const slowTimer = setTimeout(() => setIsSlow(true), 6000);
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
      clearTimeout(slowTimer);
      setIsSlow(false);
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
      <div className="min-h-dvh bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-primary-600 animate-spin mx-auto" aria-hidden="true" />
          <p className="mt-4 text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  // ── Couldn't reach the server ─────────────────────────
  // Deliberately a separate screen from "invalid QR". These are the customer's most
  // likely failure (poor signal at a pump or counter) and telling them the merchant's
  // printed code is invalid is both wrong and unrecoverable — it generates support
  // calls about a sticker that is perfectly fine.
  if (qrError === "generic") {
    return (
      <div className="min-h-dvh bg-slate-50 flex items-center justify-center p-4">
        <div
          role="alert"
          className="max-w-sm text-center bg-white rounded-2xl border border-slate-200 p-8"
        >
          <div
            className="mx-auto h-16 w-16 rounded-full bg-warning-100 flex items-center justify-center mb-4"
            aria-hidden="true"
          >
            <WifiOff className="h-8 w-8 text-warning-500" />
          </div>
          <h1 className="text-xl font-heading font-bold text-slate-800">
            Couldn&apos;t load this page
          </h1>
          <p className="text-slate-600 mt-2 text-sm">
            Check your connection and try again. The QR code itself is fine.
          </p>
          <Button className="mt-5" fullWidth onClick={() => loadCompany()}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  // ── QR invalid ────────────────────────────────────────
  if (qrError === "not_found" || !company) {
    return (
      <div className="min-h-dvh bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-sm text-center bg-white rounded-2xl border border-slate-200 p-8">
          <div className="mx-auto h-16 w-16 rounded-full bg-error-100 flex items-center justify-center mb-4" aria-hidden="true">
            <X className="h-8 w-8 text-error-500" />
          </div>
          <h1 className="text-xl font-heading font-bold text-slate-800">QR Code Not Recognized</h1>
          <p className="text-slate-600 mt-2 text-sm">
            This QR code is invalid or no longer active.
          </p>
        </div>
      </div>
    );
  }

  // Falls back to the old `isActive` flag so this page keeps working if it goes live
  // ahead of the backend release. Simplify to `!company.isAcceptingSubmissions` once
  // the backend has shipped — a wrong answer here shows real customers at a counter
  // a "not accepting submissions" screen.
  const acceptingSubmissions = company.isAcceptingSubmissions ?? company.isActive ?? true;
  if (!acceptingSubmissions) {
    return (
      <div className="min-h-dvh bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-sm text-center bg-white rounded-2xl border border-slate-200 p-8">
          <div className="mx-auto h-16 w-16 rounded-full bg-warning-100 flex items-center justify-center mb-4" aria-hidden="true">
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
    <div className="min-h-dvh bg-slate-50">
      <main className="max-w-md mx-auto px-4 py-6 sm:py-8">
        {/* Brand */}
        <div className="text-center mb-6 flex justify-center">
          { }
          {/* Above the fold on the highest-traffic mobile route — hint the browser to
              fetch it early rather than at its default low priority. */}
          <img
            src="/brand/kimates-logo.png"
            alt="KIMates"
            width={150}
            height={32}
            fetchPriority="high"
            className="h-8 w-auto"
          />
        </div>

        {/* Company info */}
        <div className="bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-2xl p-5 text-center mb-6 shadow-lg shadow-primary-600/20">
          <h1 className="text-lg sm:text-xl font-bold font-heading text-white">{company.companyName}</h1>
          {/* white on white/20 over primary-600 ≈ 5.9:1. Was primary-100 on white/15
              at 2.73:1 — and this badge is the customer's only confirmation they
              scanned the right kind of business. */}
          <span className="inline-flex items-center gap-1.5 mt-2 bg-white/20 backdrop-blur text-white text-xs font-semibold px-3 py-1 rounded-full">
            {isFuelStation ? <Fuel className="h-3.5 w-3.5" aria-hidden="true" /> : <Store className="h-3.5 w-3.5" aria-hidden="true" />}
            {isFuelStation ? "Fuel Station" : "Shop"}
          </span>
        </div>

        {/* Success state */}
        {success ? (
          // Focus moves here on success. Without it focus fell to <body> when the form
          // unmounted, so a screen-reader user got only the 5s toast and then had to
          // re-traverse the page to find out whether their purchase was recorded.
          <div
            ref={successRef}
            tabIndex={-1}
            role="status"
            aria-live="polite"
            className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 text-center animate-fade-in focus:outline-none"
          >
            <div className="mx-auto h-16 w-16 rounded-full bg-success-100 flex items-center justify-center mb-4" aria-hidden="true">
              <CheckCircle className="h-8 w-8 text-success-500" />
            </div>
            <h2 className="text-xl font-heading font-bold text-slate-800">Thank You!</h2>
            <p className="text-slate-600 mt-2 text-sm">
              {success.fullName}, your purchase of{" "}
              <strong className="text-slate-700">{formatCurrency(success.amount, company?.country ?? "")}</strong> has been recorded.
            </p>
            <div className="mt-6 bg-primary-50 rounded-xl p-4 border border-primary-100">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Your Total Spend Here</p>
              <p className="text-2xl sm:text-3xl font-bold font-heading text-primary-700 mt-1">
                {formatCurrency(success.customerTotalInvoiceAmount, company?.country ?? "")}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                {success.customerSubmissionCount} purchase
                {success.customerSubmissionCount > 1 ? "s" : ""} recorded
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6">
            <h2 className="text-base sm:text-lg font-heading font-semibold text-slate-800 text-center mb-5">
              Record Your Purchase
            </h2>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <CustomerPhoneInput
                label="Mobile Number"
                name="mobile"
                value={form.mobile}
                onChange={(e164) => {
                  setForm((prev) => ({ ...prev, mobile: e164 }));
                  if (errors.mobile) setErrors((prev) => ({ ...prev, mobile: "" }));
                }}
                error={errors.mobile}
                // Pre-select the merchant's own country — almost every customer
                // standing in front of this QR code is in it, and the alternative is a
                // disabled field behind a 240-entry list on the very first question.
                defaultCountry={isoFromCountryName(company.country)}
              />

              <Input
                label="Full Name"
                name="fullName"
                placeholder="Enter your full name"
                value={form.fullName}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.fullName}
                autoComplete="name"
              />

              {isFuelStation && (
                <Input
                  label="Vehicle Registration"
                  name="vehicleNumber"
                  placeholder="e.g. CA-123-456"
                  value={form.vehicleNumber}
                  onChange={handleChange}
                  onBlur={handleBlur}
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
                onBlur={handleBlur}
                error={errors.invoiceNumber}
              />

              <Input
                label={`Invoice Amount (${getCurrencySymbol(company?.country ?? "")})`}
                name="invoiceAmount"
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="0.00"
                value={form.invoiceAmount}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.invoiceAmount}
              />

              {/* Geolocation (optional) */}
              <div className="pt-2">
                {locationStatus === "idle" && (
                  <button
                    type="button"
                    onClick={requestLocation}
                    className="w-full min-h-11 text-sm text-primary-600 hover:text-primary-700 py-2 flex items-center justify-center gap-2 border border-dashed border-primary-200 rounded-lg hover:bg-primary-50 transition-colors"
                  >
                    <MapPin className="h-4 w-4" aria-hidden="true" /> Attach location (optional)
                  </button>
                )}
                {locationStatus === "pending" && (
                  <div className="flex items-center gap-2 text-sm text-slate-500 justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Getting location...
                  </div>
                )}
                {locationStatus === "granted" && location && (
                  <div className="flex items-center gap-2 text-sm text-success-600 justify-center py-2">
                    <CheckCircle className="h-4 w-4" aria-hidden="true" />
                    Location attached (±{Math.round(location.accuracy)}m)
                  </div>
                )}
                {locationStatus === "denied" && (
                  <div className="text-center text-xs text-slate-500 py-2">
                    Location unavailable — submission will proceed without it
                  </div>
                )}
              </div>

              {generalError && (
                <p role="alert" className="text-sm text-error-600 bg-error-50 border border-error-100 rounded-lg p-3">
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

              {isSlow && (
                <p role="status" className="text-xs text-slate-600 text-center">
                  Still sending — please don&apos;t close this page.
                </p>
              )}
            </form>
          </div>
        )}

        <p className="text-center text-xs text-slate-500 mt-8">
          Powered by <span className="font-semibold text-slate-500">KIMates</span>
        </p>
      </main>
    </div>
  );
}
