"use client";

import { useEffect } from "react";
import { Provider } from "react-redux";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { store } from "./store";
import { clearAuth } from "./slices/authSlice";
import { QueryProvider } from "@/lib/query-client";
import { onSessionInvalidated } from "@/lib/api";

// Inner component — handles session invalidation events from axios interceptor
function SessionHandler({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onSessionInvalidated(() => {
      store.dispatch(clearAuth());
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
