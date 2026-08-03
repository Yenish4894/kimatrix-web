"use client";

import { useMemo, useState, useId } from "react";
import { Country } from "country-state-city";
import { getCountryCallingCode, type CountryCode } from "libphonenumber-js";
import { cn } from "@/lib/utils";

interface CustomerPhoneInputProps {
  label?: string;
  name: string;
  /** Full E.164 number or empty string */
  value: string;
  /** Called with the full E.164 number, or empty if local part is cleared */
  onChange: (e164: string) => void;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  /**
   * ISO-2 code to pre-select, e.g. "ZA". Without it the number field starts disabled
   * behind a ~240-entry country list — on the public QR form that is the first field a
   * walk-up customer meets, and effectively all of a given merchant's customers are in
   * the merchant's own country, which the page already knows.
   */
  defaultCountry?: string | undefined;
}

/** Maps a country NAME (as stored on the company record) to its ISO-2 code. */
export function isoFromCountryName(name: string | undefined | null): string | undefined {
  if (!name) return undefined;
  const target = name.trim().toLowerCase();
  return Country.getAllCountries().find((c) => c.name.toLowerCase() === target)?.isoCode;
}

interface CountryOption {
  isoCode: string;
  name: string;
  flag: string;
  dialCode: string;
}

function buildCountryList(): CountryOption[] {
  return Country.getAllCountries()
    .flatMap((c) => {
      try {
        const dialCode = getCountryCallingCode(c.isoCode as CountryCode);
        return [{ isoCode: c.isoCode, name: c.name, flag: c.flag ?? "", dialCode }];
      } catch {
        return [];
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function CustomerPhoneInput({
  label,
  name,
  value,
  onChange,
  error,
  helperText,
  disabled,
  defaultCountry,
}: CustomerPhoneInputProps) {
  const [countryCode, setCountryCode] = useState<string>(defaultCountry ?? "");

  const countries = useMemo(buildCountryList, []);

  const dialCode = useMemo(() => {
    if (!countryCode) return null;
    try {
      return getCountryCallingCode(countryCode as CountryCode);
    } catch {
      return null;
    }
  }, [countryCode]);

  const localPart = useMemo(() => {
    if (!value || !dialCode) return "";
    const prefix = `+${dialCode}`;
    return value.startsWith(prefix) ? value.slice(prefix.length) : "";
  }, [value, dialCode]);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value;
    const digits = localPart; // capture before countryCode changes under us
    setCountryCode(next);
    // Re-prefix rather than wipe. Clearing on every country change meant correcting a
    // mis-tapped country silently deleted the number the customer had already typed.
    try {
      const nextDial = getCountryCallingCode(next as CountryCode);
      onChange(digits ? `+${nextDial}${digits}` : "");
    } catch {
      onChange("");
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const local = e.target.value.replace(/\D/g, "");
    onChange(dialCode && local ? `+${dialCode}${local}` : "");
  };

  const reactId = useId();
  const inputId = label ? `${reactId}-${label.toLowerCase().replace(/\s+/g, "-")}` : (name ?? reactId);
  const numberDisabled = disabled || !dialCode;

  return (
    <div className="w-full space-y-2">
      {label && (
        <label
          htmlFor={`${inputId}-number`}
          className={cn(
            "block text-sm font-medium",
            error ? "text-error-500" : "text-slate-600"
          )}
        >
          {label}
        </label>
      )}

      {/* Country selector */}
      <select
        value={countryCode}
        onChange={handleCountryChange}
        disabled={disabled}
        aria-label="Country code"
        className={cn(
          "flex h-11 w-full rounded-md border bg-white px-3 text-base text-slate-800 transition-colors duration-150",
          "focus:outline-none focus:ring-[3px]",
          error
            ? "border-error-500 focus:border-error-500 focus:ring-error-500/15"
            : "border-slate-200 hover:border-slate-300 focus:border-primary-500 focus:ring-primary-500/15",
          "disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
        )}
      >
        <option value="">Select country</option>
        {countries.map((c) => (
          <option key={c.isoCode} value={c.isoCode}>
            {c.flag} {c.name} (+{c.dialCode})
          </option>
        ))}
      </select>

      {/* Number input with locked dial code prefix */}
      <div
        className={cn(
          "flex h-11 w-full rounded-md border bg-white overflow-hidden transition-colors duration-150",
          "focus-within:ring-[3px]",
          error
            ? "border-error-500 focus-within:border-error-500 focus-within:ring-error-500/15"
            : "border-slate-200 hover:border-slate-300 focus-within:border-primary-500 focus-within:ring-primary-500/15",
          numberDisabled && "bg-slate-50"
        )}
      >
        <span
          className={cn(
            "flex items-center justify-center px-3 border-r border-slate-200 bg-slate-50 text-sm font-medium select-none whitespace-nowrap",
            dialCode ? "text-slate-700" : "text-slate-500"
          )}
        >
          {dialCode ? `+${dialCode}` : "+?"}
        </span>
        <input
          id={`${inputId}-number`}
          name={name}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          value={localPart}
          onChange={handleNumberChange}
          disabled={numberDisabled}
          placeholder={dialCode ? "Enter number" : "Select country first"}
          aria-invalid={!!error}
          aria-describedby={
            error
              ? `${inputId}-error`
              : helperText
              ? `${inputId}-helper`
              : undefined
          }
          className="flex-1 min-w-0 px-3 text-base text-slate-800 bg-transparent placeholder:text-slate-300 focus:outline-none disabled:cursor-not-allowed disabled:text-slate-400"
        />
      </div>

      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-[13px] text-error-500" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${inputId}-helper`} className="mt-1 text-[13px] text-slate-500">
          {helperText}
        </p>
      )}
    </div>
  );
}
