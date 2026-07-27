"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { PageLoader } from "@/components/ui/loader";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { loadSession } from "@/store/slices/authSlice";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  children: React.ReactNode;
  title: string;
  requiredRole?: "company" | "super_admin";
}

export function DashboardShell({ children, title, requiredRole }: Readonly<DashboardShellProps>) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasCheckedSession, setHasCheckedSession] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAppSelector((state) => state.auth);

  // Boot: restore session from localStorage if not already authenticated.
  // If a parent layout (e.g. company/layout.tsx) already loaded the session,
  // isAuthenticated is true by the time this mounts — skip the redundant dispatch
  // and avoid the second PageLoader flash.
  useEffect(() => {
    if (isAuthenticated) {
      setHasCheckedSession(true);
      return;
    }
    dispatch(loadSession()).finally(() => setHasCheckedSession(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redirect if not authenticated after session check
  useEffect(() => {
    if (!hasCheckedSession) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    // Role mismatch → redirect to the correct dashboard
    if (requiredRole && user && user.userType !== requiredRole) {
      const target = user.userType === "super_admin" ? "/admin/dashboard" : "/company/dashboard";
      router.replace(target);
    }
  }, [hasCheckedSession, isAuthenticated, requiredRole, router, user]);

  const handleMenuToggle = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  // Focus trap for mobile sidebar — keeps keyboard focus inside when open,
  // closes on Escape, and restores focus to the trigger when closed.
  useEffect(() => {
    if (!mobileMenuOpen) {
      previousFocusRef.current?.focus();
      previousFocusRef.current = null;
      return;
    }

    previousFocusRef.current = document.activeElement as HTMLElement;

    const sidebarEl = sidebarRef.current;
    if (!sidebarEl) return;

    const getFocusable = () =>
      Array.from(
        sidebarEl.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetParent !== null);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const focusable = getFocusable();
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    getFocusable()[0]?.focus();

    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileMenuOpen]);

  // Guard: wait until session is resolved before rendering
  if (!hasCheckedSession || isLoading || !isAuthenticated) {
    return <PageLoader />;
  }

  // Guard: wrong role — brief flash before redirect
  if (requiredRole && user?.userType !== requiredRole) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Skip link — first focusable element, only visible when focused */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-primary-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-md focus:shadow-lg"
      >
        Skip to main content
      </a>

      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div ref={sidebarRef} className={cn("lg:block", mobileMenuOpen ? "block" : "hidden")}>
        <Sidebar onCollapsedChange={setSidebarCollapsed} />
      </div>

      <div className={cn("min-h-screen flex flex-col transition-all duration-300", sidebarCollapsed ? "lg:ml-[72px]" : "lg:ml-[260px]")}>
        <Header title={title} onMenuToggle={handleMenuToggle} />
        <main id="main-content" className="flex-1 p-6" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
