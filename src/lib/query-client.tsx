"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000, // 1 minute fresh
        gcTime: 5 * 60_000, // 5 min in cache
        retry: (failureCount, error) => {
          // Don't retry auth errors
          const status = (error as { response?: { status?: number } })?.response?.status;
          if (status === 401 || status === 403 || status === 404) return false;
          return failureCount < 2;
        },
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/**
 * The one QueryClient for this browser tab, reachable from non-React code.
 *
 * It has to be reachable outside a component because the cache must be emptied
 * whenever the signed-in user changes (logout, a forced logout from the axios
 * interceptor, a password change). Keys such as ["company","profile"] are not scoped
 * to a user, so a cache that survives the switch shows the next account the previous
 * account's data until each query refetches.
 *
 * On the server every call gets a fresh client, so nothing is shared across requests.
 */
export function getQueryClient(): QueryClient {
  if (typeof window === "undefined") return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(getQueryClient);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
