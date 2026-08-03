"use client";

import { useCallback } from "react";
import { formatCurrency } from "@/lib/utils";
import { useCompanyProfile } from "./useCompanyProfile";

/**
 * Returns a formatCurrency bound to the logged-in company's country, so every call
 * site in the company pages gets the correct local currency symbol.
 *
 * Reads the shared profile query rather than Redux — the two used to disagree after a
 * settings save, leaving amounts formatted in the previous country's currency.
 *
 * Wrapped in `useCallback` so the identity is stable across renders. It was returning
 * a fresh closure every time, which silently defeated memoization anywhere it was
 * passed as a prop — most visibly the reports table, where changing an unrelated
 * dropdown re-formatted every row.
 */
export function useCurrencyFormatter(): (amount: string | number) => string {
  const country = useCompanyProfile().data?.country ?? "";
  return useCallback((amount: string | number) => formatCurrency(amount, country), [country]);
}
