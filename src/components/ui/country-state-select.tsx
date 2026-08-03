"use client";

import { useEffect, useMemo, useState } from "react";
// Only `Country` is imported eagerly — it is the one dataset needed on first paint.
//
// `State` (544 KB) and `City` (7.7 MB) are loaded on demand instead. Between them they
// accounted for almost the entire weight of the signup form, and neither is consulted
// until the user has already picked a country. `country-state-city` declares
// `sideEffects: false` and splits Country/State/City into separate modules, so leaving
// them out of the static import lets the bundler keep the datasets out of first load.
import { Country, type ICountry, type IState } from "country-state-city";
import { SearchableSelect } from "./searchable-select";
import { Input } from "./input";

/**
 * Adapt the SearchableSelect's `(value: string)` callback to the
 * `(event)` shape the parent forms already use, so the wrappers below remain
 * drop-in replacements for the previous native <Select>.
 */
function toSelectEvent(
  name: string,
  value: string,
): React.ChangeEvent<HTMLSelectElement> {
  return { target: { name, value } } as React.ChangeEvent<HTMLSelectElement>;
}

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

// ─── Region data (loaded on demand) ────────────────────────────
//
// These import the package's SUBMODULES rather than its barrel, and that detail is
// load-bearing. The barrel (`country-state-city`) statically imports country, state
// AND city, so a dynamic import of it pulls every dataset — meaning simply choosing a
// country would drag down the 7.7 MB city file. Importing `lib/state` and `lib/city`
// separately keeps each dataset in its own chunk, so you only ever download the data
// you actually reached.
//
// The package publishes no `exports` map (v3.2.1), so these deep paths are permitted.
// If a future upgrade adds one, or moves these files, the imports below break loudly
// at build time — re-check `node_modules/country-state-city/package.json` then.

type StateApi = (typeof import("country-state-city"))["State"];
type CityApi = (typeof import("country-state-city"))["City"];

/** Each resolves once per session; the chunks are browser-cached thereafter. */
let stateApiPromise: Promise<StateApi> | null = null;
let cityApiPromise: Promise<CityApi> | null = null;

/**
 * Deep path first (one dataset per chunk), barrel as a safety net.
 *
 * The fallback matters: the deep paths rely on the package publishing no `exports`
 * map and on the bundler resolving its extensionless internal imports. If a future
 * version changes either, this degrades to the barrel — which still works, just with
 * coarser chunking — instead of leaving the signup form with a dead dropdown.
 *
 * The shape is checked rather than assumed, because a wrong-but-truthy module would
 * not throw: it would silently yield "no regions available" on every country, which
 * is the kind of failure that reaches production unnoticed.
 */
function pick<T>(mod: unknown, method: keyof T & string): T | null {
  const candidate = (mod as { default?: unknown })?.default ?? mod;
  return typeof (candidate as Record<string, unknown>)?.[method] === "function"
    ? (candidate as T)
    : null;
}

function loadStateApi(): Promise<StateApi> {
  stateApiPromise ??= import("country-state-city/lib/state")
    .then((m) => pick<StateApi>(m, "getStatesOfCountry"))
    .catch(() => null)
    .then(
      async (api) => api ?? (await import("country-state-city")).State,
    );
  return stateApiPromise;
}

function loadCityApi(): Promise<CityApi> {
  cityApiPromise ??= import("country-state-city/lib/city")
    .then((m) => pick<CityApi>(m, "getCitiesOfState"))
    .catch(() => null)
    .then(async (api) => api ?? (await import("country-state-city")).City);
  return cityApiPromise;
}

/**
 * States/regions for a country, looked up by name.
 * Returns [] if the country isn't recognised, has no states, or the chunk fails —
 * the last case degrades to a free-text field rather than blocking the form.
 */
export async function getStatesForCountryName(
  name: string | undefined | null,
): Promise<IState[]> {
  const code = getCountryCode(name);
  if (!code) return [];
  try {
    const State = await loadStateApi();
    return State.getStatesOfCountry(code);
  } catch {
    stateApiPromise = null;
    return [];
  }
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
    <SearchableSelect
      label={label}
      name={name}
      value={value}
      onChange={(v) => onChange(toSelectEvent(name, v))}
      error={error}
      helperText={helperText}
      disabled={disabled}
      placeholder={placeholder}
      options={options}
      emptyText="No matching country"
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
  const [options, setOptions] = useState<{ value: string; label: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!country) {
      setOptions([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    void (async () => {
      const states = await getStatesForCountryName(country);
      if (cancelled) return;
      setOptions(states.map((s) => ({ value: s.name, label: s.name })));
      setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [country]);

  // No country picked yet → keep the select disabled with a helpful message.
  // While the region data is in flight, stay disabled rather than briefly showing an
  // empty list that reads as "this country has no regions".
  // Once a country is picked but genuinely has no states (rare), fall back gracefully.
  const isDisabled = disabled || !country || isLoading || options.length === 0;
  let fallbackHelper: string | undefined;
  if (!country) fallbackHelper = "Select a country first";
  else if (isLoading) fallbackHelper = "Loading regions…";
  else if (options.length === 0)
    fallbackHelper = "No regions available for this country — leave blank or contact support";
  else fallbackHelper = helperText;

  return (
    <SearchableSelect
      label={label}
      name={name}
      value={value}
      onChange={(v) => onChange(toSelectEvent(name, v))}
      error={error}
      helperText={fallbackHelper}
      disabled={isDisabled}
      placeholder={placeholder}
      options={options}
      emptyText="No matching region"
    />
  );
}

// ─── City data (loaded on demand) ──────────────────────────────

async function loadCitiesOfState(
  countryCode: string,
  stateName: string,
): Promise<{ name: string }[]> {
  try {
    // The state chunk is already resolved by this point (a state had to be chosen to
    // get here), so this only pays for the city data.
    const [State, City] = await Promise.all([loadStateApi(), loadCityApi()]);
    const stateRow = State.getStatesOfCountry(countryCode).find(
      (s) => s.name.toLowerCase() === stateName.trim().toLowerCase(),
    );
    if (!stateRow) return [];
    return City.getCitiesOfState(countryCode, stateRow.isoCode);
  } catch {
    // A failed chunk fetch must not break the form — the caller falls back to a
    // free-text city input, the same experience as a country with no data.
    cityApiPromise = null;
    return [];
  }
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
  placeholder = "e.g. Cape Town",
}: Readonly<CityInputProps>) {
  const [cities, setCities] = useState<{ name: string }[]>([]);

  // The city dataset is fetched as a separate chunk the first time a user actually
  // reaches this field with both a country and a state chosen. Until then it costs
  // nothing, which matters because this component sits on the signup form.
  useEffect(() => {
    const countryCode = getCountryCode(country);
    if (!countryCode || !state) {
      setCities([]);
      return;
    }

    let cancelled = false;
    void (async () => {
      const list = await loadCitiesOfState(countryCode, state);
      if (!cancelled) setCities(list);
    })();

    return () => {
      cancelled = true;
    };
  }, [country, state]);

  // Dropdown when we have data, free text otherwise (Niger and most West
  // African states fall back to text — package data is sparse there).
  if (cities.length > 0) {
    return (
      <SearchableSelect
        label={label}
        name={name}
        value={value}
        onChange={(v) => onChange(toSelectEvent(name, v))}
        error={error}
        helperText={helperText}
        placeholder="Select city"
        options={cities.map((c) => ({ value: c.name, label: c.name }))}
        emptyText="No matching city"
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
