"use client";

import { useMemo } from "react";
import { City, Country, State, type ICountry, type IState } from "country-state-city";
import { Select } from "./select";
import { Input } from "./input";

// ─── Helpers (exported for use outside the components) ─────────

/**
 * Look up the ISO-2 country code for a given country *name*.
 * Returns undefined if no match. Used to fetch states for a country
 * when we only have the name stored (we don't persist the code).
 */
export function getCountryCode(name: string | undefined | null): string | undefined {
  if (!name) return undefined;
  const trimmed = name.trim().toLowerCase();
  return Country.getAllCountries().find((c) => c.name.toLowerCase() === trimmed)?.isoCode;
}

/**
 * States/regions for a country, looked up by name.
 * Returns [] if the country isn't recognised or has no states.
 */
export function getStatesForCountryName(name: string | undefined | null): IState[] {
  const code = getCountryCode(name);
  if (!code) return [];
  return State.getStatesOfCountry(code);
}

// ─── CountrySelect ─────────────────────────────────────────────

interface CountrySelectProps {
  label?: string;
  name?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  /** Defaults to "Select country" */
  placeholder?: string;
}

export function CountrySelect({
  label = "Country",
  name = "country",
  value,
  onChange,
  error,
  helperText,
  disabled,
  placeholder = "Select country",
}: Readonly<CountrySelectProps>) {
  const options = useMemo(
    () =>
      Country.getAllCountries().map((c: ICountry) => ({
        value: c.name,
        label: c.flag ? `${c.flag} ${c.name}` : c.name,
      })),
    []
  );

  return (
    <Select
      label={label}
      name={name}
      value={value}
      onChange={onChange}
      error={error}
      helperText={helperText}
      disabled={disabled}
      placeholder={placeholder}
      options={options}
    />
  );
}

// ─── StateSelect ───────────────────────────────────────────────

interface StateSelectProps {
  label?: string;
  name?: string;
  /** Country *name* (e.g. "Niger") — used to filter the state list */
  country: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  /** Defaults to "Select state / region" */
  placeholder?: string;
}

export function StateSelect({
  label = "State / Region",
  name = "state",
  country,
  value,
  onChange,
  error,
  helperText,
  disabled,
  placeholder = "Select state / region",
}: Readonly<StateSelectProps>) {
  const options = useMemo(
    () =>
      getStatesForCountryName(country).map((s) => ({
        value: s.name,
        label: s.name,
      })),
    [country]
  );

  // No country picked yet → keep the select disabled with a helpful message.
  // Once a country is picked but it has no states (rare), fall back gracefully.
  const isDisabled = disabled || !country || options.length === 0;
  let fallbackHelper: string | undefined;
  if (!country) fallbackHelper = "Select a country first";
  else if (options.length === 0) fallbackHelper = "No regions available for this country — leave blank or contact support";
  else fallbackHelper = helperText;

  return (
    <Select
      label={label}
      name={name}
      value={value}
      onChange={onChange}
      error={error}
      helperText={fallbackHelper}
      disabled={isDisabled}
      placeholder={placeholder}
      options={options}
    />
  );
}

// ─── CityInput ─────────────────────────────────────────────────
// Hybrid: dropdown when the (country, state) combo has cities in the package's
// dataset, plain text input otherwise. Same external API as Input.

interface CityInputProps {
  label?: string;
  name?: string;
  /** Country *name* (e.g. "Niger") */
  country: string;
  /** State *name* (e.g. "Niamey") */
  state: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  error?: string;
  helperText?: string;
  placeholder?: string;
}

export function CityInput({
  label = "City",
  name = "city",
  country,
  state,
  value,
  onChange,
  error,
  helperText,
  placeholder = "e.g. Niamey",
}: Readonly<CityInputProps>) {
  const cities = useMemo(() => {
    const countryCode = getCountryCode(country);
    if (!countryCode || !state) return [];
    const stateRow = State.getStatesOfCountry(countryCode)
      .find((s) => s.name.toLowerCase() === state.trim().toLowerCase());
    if (!stateRow) return [];
    return City.getCitiesOfState(countryCode, stateRow.isoCode);
  }, [country, state]);

  // Dropdown when we have data, free text otherwise (Niger and most West
  // African states fall back to text — package data is sparse there).
  if (cities.length > 0) {
    return (
      <Select
        label={label}
        name={name}
        value={value}
        onChange={onChange}
        error={error}
        helperText={helperText}
        placeholder="Select city"
        options={cities.map((c) => ({ value: c.name, label: c.name }))}
      />
    );
  }

  return (
    <Input
      label={label}
      name={name}
      value={value}
      onChange={onChange}
      error={error}
      placeholder={placeholder}
      helperText={helperText}
    />
  );
}
