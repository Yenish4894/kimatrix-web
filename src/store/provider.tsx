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
      router.push("/login");
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
