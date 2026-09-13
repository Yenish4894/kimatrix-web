"use client";

import { useEffect } from "react";
import { Provider } from "react-redux";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { store } from "./store";
import { clearAuth } from "./slices/authSlice";
import { clearCompany } from "./slices/companySlice";
import { QueryProvider, getQueryClient } from "@/lib/query-client";
import { onSessionInvalidated } from "@/lib/api";
import { loginUrlWithReturn } from "@/lib/return-url";

// Inner component — handles session invalidation events from axios interceptor
function SessionHandler({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onSessionInvalidated(() => {
      // Auth first, so the gated layouts stop rendering their pages before the cache
      // empties; then drop everything cached for the account that just lost its session.
      store.dispatch(clearAuth());
      store.dispatch(clearCompany());
      getQueryClient().clear();
      toast.error("Your session has ended. Please log in again.");
      // Bring them back to the page they were on once they sign in again (FE-14).
      const here = `${globalThis.location.pathname}${globalThis.location.search}`;
      router.push(/^\/(company|admin)(\/|$)/.test(here) ? loginUrlWithReturn(here) : "/login");
    });
    return unsubscribe;
  }, [router]);

  return <>{children}</>;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <QueryProvider>
        <SessionHandler>{children}</SessionHandler>
      </QueryProvider>
    </Provider>
  );
}
