"use client";

import { useMemo } from "react";
import { getCountryCallingCode, isValidPhoneNumber, type CountryCode } from "libphonenumber-js";
import { cn } from "@/lib/utils";
import { getCountryCode } from "./country-state-select";

interface PhoneInputProps {
  label?: string;
  name: string;
  /** Country *name* (e.g. "Niger") — drives the locked dial code prefix */
  country: string;
  /** Full E.164 number (e.g. "+22798765432") or empty */
  value: string;
  /** Called with the full E.164 number (or empty if local part is cleared) */
  onChange: (value: string) => void;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  placeholder?: string;
}

export function PhoneInput({
  label,
  name,
  country,
  value,
  onChange,
  error,
  helperText,
  disabled,
  placeholder,
}: Readonly<PhoneInputProps>) {
  const countryCode = useMemo(() => getCountryCode(country), [country]);

  // Use libphonenumber-js's calling code lookup — handles edge cases like
  // shared-country codes (NANP +1) and weird formats correctly.
  // getCountryCode returns ISO-2 alpha codes, which match libphonenumber-js's
  // CountryCode type by spec — cast is safe; bad codes throw inside the try.
  const dialCode = useMemo(() => {
    if (!countryCode) return null;
    try {
      return getCountryCallingCode(countryCode as CountryCode);
    } catch {
      return null;
    }
  }, [countryCode]);

  // Strip the prefix from the stored E.164 to show only local digits in the input.
  const localPart = useMemo(() => {
    if (!value || !dialCode) return "";
    const prefix = `+${dialCode}`;
    return value.startsWith(prefix) ? value.slice(prefix.length) : "";
  }, [value, dialCode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Digits only — strip anything else the user might paste
    const local = e.target.value.replace(/\D/g, "");
    const full = dialCode && local ? `+${dialCode}${local}` : "";
    onChange(full);
  };

  const inputId = label?.toLowerCase().replace(/\s+/g, "-") ?? name;
  const isDisabled = disabled || !dialCode;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            "block text-sm font-medium mb-1",
            error ? "text-error-500" : "text-slate-600"
          )}
        >
          {label}
        </label>
      )}
      <div
        className={cn(
          "flex h-11 w-full rounded-md border bg-white overflow-hidden transition-colors duration-150",
          "focus-within:ring-[3px]",
          error
            ? "border-error-500 focus-within:border-error-500 focus-within:ring-error-500/15"
            : "border-slate-200 hover:border-slate-300 focus-within:border-primary-500 focus-within:ring-primary-500/15",
          isDisabled && "bg-slate-50"
        )}
      >
        <span
          className={cn(
            "flex items-center justify-center px-3 border-r border-slate-200 bg-slate-50 text-sm font-medium select-none whitespace-nowrap",
            dialCode ? "text-slate-700" : "text-slate-400"
          )}
        >
          {dialCode ? `+${dialCode}` : "+?"}
        </span>
        <input
          id={inputId}
          name={name}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          value={localPart}
          onChange={handleChange}
          disabled={isDisabled}
          placeholder={placeholder}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          className="flex-1 min-w-0 px-3 text-base text-slate-800 bg-transparent placeholder:text-slate-300 focus:outline-none disabled:cursor-not-allowed disabled:text-slate-400"
        />
      </div>
      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-[13px] text-error-500" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${inputId}-helper`} className="mt-1 text-[13px] text-slate-400">
          {!country
            ? "Select a country first"
            : helperText}
        </p>
      )}
    </div>
  );
}

// ─── Validation helper ─────────────────────────────────────────

/**
 * Validate a phone number against the rules of a given country.
 * Returns null if valid (or empty + not required), otherwise an error message.
 *
 * Caller decides if empty is OK (e.g. WhatsApp is optional, contactPhone is not).
 */
export function validatePhoneForCountry(
  phone: string,
  country: string,
  opts: { required?: boolean; label?: string } = {}
): string | null {
  const { required = true, label = "Phone" } = opts;

  if (!phone) {
    return required ? `${label} is required` : null;
  }

  const countryCode = getCountryCode(country);
  if (!countryCode) {
    return "Select a country first";
  }

  if (!isValidPhoneNumber(phone, countryCode as CountryCode)) {
    return `${label} is not a valid number for the selected country`;
  }

  return null;
}
