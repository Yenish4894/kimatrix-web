"use client";

import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { companyService } from "@/services";
import type { CompanyProfile } from "@/types";

/**
 * The single source of truth for the logged-in company's profile.
 *
 * Previously this lived in TWO caches: `companySlice.profile` (written by the layout
 * gate) and a TanStack `["company","profile"]` query (read by eight pages). Only the
 * settings page invalidated, and only the TanStack side, which produced three
 * reachable bugs:
 *
 *  1. Changing the country in Settings refreshed TanStack but not Redux, so
 *     `useCurrencyFormatter` — which read Redux — kept the old currency symbol on
 *     every amount across the dashboard until a hard reload.
 *  2. Returning from PayPal dispatched Redux but left the query cache stale for its
 *     60s `staleTime`, so a user who had just viewed the dashboard saw pre-payment
 *     subscription status.
 *  3. Every cold company page load fetched `/company/profile` twice.
 *
 * One query key, one invalidation surface. Anything that changes the profile
 * server-side should call `invalidateCompanyProfile`.
 */
export const COMPANY_PROFILE_KEY = ["company", "profile"] as const;

export function useCompanyProfile() {
  return useQuery<CompanyProfile>({
    queryKey: COMPANY_PROFILE_KEY,
    queryFn: companyService.getProfile,
    // The gate depends on this, so a failure must surface rather than retry forever.
    retry: 1,
  });
}

/** Call after any mutation that can change the profile server-side. */
export function invalidateCompanyProfile(queryClient: QueryClient): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: COMPANY_PROFILE_KEY });
}

/** Convenience for components that only need the invalidator. */
export function useInvalidateCompanyProfile(): () => Promise<void> {
  const queryClient = useQueryClient();
  return () => invalidateCompanyProfile(queryClient);
}
