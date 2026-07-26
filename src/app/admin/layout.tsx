"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loadSession } from "@/store/slices/authSlice";
import { PageLoader } from "@/components/ui/loader";

// Structural guard for the entire /admin section. Mirrors company/layout.tsx
// (minus the subscription gate — admins have no subscription). Children are not
// rendered until the session is restored and the super_admin role is confirmed,
// so per-page queries never fire for an unauthenticated or wrong-role visitor.
// The edge proxy (src/proxy.ts) is the first line; this is the client-side
// enforcement against the localStorage session.
export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const { user, isAuthenticated, isLoading } = useAppSelector((state) => state.auth);

  const [sessionChecked, setSessionChecked] = useState(false);
  const [gatePassed, setGatePassed] = useState(false);

  // Restore session from localStorage once.
  useEffect(() => {
    dispatch(loadSession()).finally(() => setSessionChecked(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Evaluate the gate once the session is resolved.
  useEffect(() => {
    if (!sessionChecked) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (user && user.userType !== "super_admin") {
      router.replace("/company/dashboard");
      return;
    }

    if (user?.userType === "super_admin") {
      setGatePassed(true);
    }
  }, [sessionChecked, isAuthenticated, user, router]);

  if (!sessionChecked || isLoading || !gatePassed) {
    return <PageLoader />;
  }

  return <>{children}</>;
}
