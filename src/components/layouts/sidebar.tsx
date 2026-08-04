"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Receipt,
  QrCode,
  FileText,
  Settings,
  LogOut,
  Building2,
  Eye,
  Mail,
  ChevronLeft,
  ChevronRight,
  Shield,
  Clock,
  CreditCard,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { useCompanyProfile } from "@/hooks/useCompanyProfile";
import { toEntitlement, useCountdown } from "@/hooks/useEntitlement";
import { logout } from "@/store/slices/authSlice";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const companyNav: NavSection[] = [
  {
    title: "Main",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/company/dashboard" },
      { icon: Users, label: "Customers", href: "/company/customers" },
      { icon: Receipt, label: "Purchases", href: "/company/purchases" },
      { icon: QrCode, label: "QR Code", href: "/company/qr-code" },
      { icon: FileText, label: "Reports", href: "/company/reports" },
    ],
  },
  {
    title: "Account",
    items: [
      { icon: CreditCard, label: "Billing", href: "/company/billing" },
      { icon: Settings, label: "Settings", href: "/company/settings" },
    ],
  },
];

const adminNav: NavSection[] = [
  {
    title: "Main",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard" },
      { icon: Building2, label: "Companies", href: "/admin/companies" },
      { icon: Tag, label: "Plans & Trial", href: "/admin/plans" },
      { icon: Eye, label: "Visitor Stats", href: "/admin/visitors" },
      { icon: Mail, label: "Bulk Email", href: "/admin/email" },
    ],
  },
  {
    title: "Account",
    items: [
      { icon: Settings, label: "Settings", href: "/admin/settings" },
    ],
  },
];

function getDaysLeft(subscriptionExpiresAt: string | null | undefined): number | null {
  if (!subscriptionExpiresAt) return null;
  const diff = new Date(subscriptionExpiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

interface SidebarProps {
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function Sidebar({ onCollapsedChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const { data: profile } = useCompanyProfile();

  const isAdmin = user?.userType === "super_admin";
  const nav = isAdmin ? adminNav : companyNav;

  const handleLogout = async () => {
    await dispatch(logout());
    router.push("/login");
  };

  // `accessUntil` unifies trial, paid and comp — `subscriptionExpiresAt` is the PAID
  // expiry only, so during a trial it is null and the whole block below vanished
  // exactly when the countdown mattered most.
  const entitlement = profile ? toEntitlement(profile) : null;
  const countdown = useCountdown(entitlement?.accessUntil ?? null);
  const daysLeft = getDaysLeft(entitlement?.accessUntil?.toISOString() ?? null);

  // The denominator, and the bug it replaces: this was
  // `profile?.currentPlan?.durationDays ?? 30`. A trial has no `currentPlan`, so day
  // one of a 7-day trial divided 7 by 30 and drew a ~23% bar — the customer's brand
  // new trial looked nearly spent. Use the trial length while trialing.
  const trialSpanDays =
    entitlement?.isTrial && profile?.trialStartedAt && profile?.trialEndsAt
      ? Math.max(
          1,
          Math.round(
            (new Date(profile.trialEndsAt).getTime() - new Date(profile.trialStartedAt).getTime()) /
              86_400_000,
          ),
        )
      : null;
  const planDuration = trialSpanDays ?? profile?.currentPlan?.durationDays ?? 30;
  // Server-computed. This used to be `companyIsActive === true && daysLeft > 0`, where
  // `companyIsActive` was a localStorage-cached boolean refreshed only at login. A
  // comped company (hasAccess true, no expiry ⇒ daysLeft null) therefore saw a red
  // "Inactive" badge and a "Subscribe to activate your account" link — permanently,
  // while paying.
  const subscriptionActive = profile?.hasAccess === true;
  const progressColor = daysLeft === null ? "bg-slate-300"
    : daysLeft > 10 ? "bg-success-500"
    : daysLeft > 3 ? "bg-accent-500"
    : "bg-error-500";

  return (
    <aside
      aria-label="Main navigation"
      className={cn(
        "fixed left-0 top-0 h-screen bg-white border-r border-slate-200 flex flex-col transition-all duration-300 z-40",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-100">
        {!collapsed && (
          <Link href="/" className="shrink-0" aria-label="KIMates home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/kimates-logo.png" alt="KIMates" width={140} height={30} className="h-[30px] w-auto" />
          </Link>
        )}
        {collapsed && (
          <Link href="/" className="mx-auto shrink-0" aria-label="KIMates home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/kimates-icon.png" alt="KIMates" width={32} height={32} className="h-8 w-8" />
          </Link>
        )}
        <button
          type="button"
          onClick={() => { setCollapsed((prev) => { const next = !prev; onCollapsedChange?.(next); return next; }); }}
          className={cn(
            "tap-target h-9 w-9 flex items-center justify-center rounded-md border border-slate-200 hover:bg-slate-50 transition-colors text-slate-400",
            collapsed && "mx-auto mt-0"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" /> : <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {nav.map((section) => (
          <div key={section.title} className="mb-6">
            {!collapsed && (
              <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {section.title}
              </p>
            )}
            <ul className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "relative flex items-center gap-3 h-11 rounded-lg transition-all duration-200 ease-out group/nav",
                        collapsed ? "justify-center px-0" : "px-3",
                        isActive
                          ? "bg-gradient-to-r from-primary-50 to-primary-50/40 text-primary-700 font-semibold shadow-[0_1px_2px_rgba(13,148,136,0.06)]"
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                      )}
                      title={collapsed ? item.label : undefined}
                      aria-label={collapsed ? item.label : undefined}
                    >
                      {/* Active indicator bar */}
                      {isActive && !collapsed && (
                        <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-gradient-to-b from-primary-500 to-primary-700" />
                      )}
                      <item.icon className={cn(
                        "h-[18px] w-[18px] shrink-0 transition-colors",
                        isActive ? "text-primary-600" : "text-slate-500 group-hover/nav:text-slate-600"
                      )} aria-hidden="true" />
                      {!collapsed && <span className="text-[13px]">{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Plan status (company only) */}
      {!isAdmin && !collapsed && user && (
        <div className="mx-3 mb-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary-500" aria-hidden="true" />
              <span className="text-xs font-semibold text-slate-700">Plan Status</span>
            </div>
            <span className={cn(
              "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
              subscriptionActive
                ? "bg-success-100 text-success-700"
                : "bg-error-100 text-error-700"
            )}>
              {!subscriptionActive ? "Inactive" : entitlement?.isTrial ? "Free trial" : "Active"}
            </span>
          </div>
          {subscriptionActive && daysLeft !== null && (
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Clock className="h-3 w-3" aria-hidden="true" />
                {/* Hours-then-minutes inside the last two days. "1 day left" sitting
                    unchanged for a full 24 hours tells nobody whether to act now. */}
                <span>{countdown ? `${countdown.label} remaining` : `${daysLeft} days remaining`}</span>
              </div>
              {/* Progress bar */}
              <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", progressColor)}
                  style={{ width: `${Math.min(100, (daysLeft / planDuration) * 100)}%` }}
                />
              </div>
            </div>
          )}
          {!subscriptionActive && (
            <p className="text-xs text-slate-500 mt-1">
              <Link href="/company/billing" className="text-primary-600 hover:underline font-medium">
                Subscribe
              </Link>{" "}to activate your account.
            </p>
          )}
        </div>
      )}

      {/* User info + Logout */}
      <div className="border-t border-slate-100 p-3">
        <div className={cn(
          "flex items-center gap-3 rounded-lg",
          collapsed ? "justify-center" : "px-2 py-2"
        )}>
          {/* Avatar */}
          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold shrink-0">
            {user?.username?.slice(0, 2).toUpperCase() || "KM"}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-slate-700 truncate">
                {user?.username}
              </p>
              <p className="text-[11px] text-slate-500">{user?.userType === "super_admin" ? "Admin" : "Company"}</p>
            </div>
          )}
          {!collapsed && (
            <button
              type="button"
              onClick={handleLogout}
              className="tap-target h-8 w-8 flex items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors shrink-0"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
        {collapsed && (
          <button
            type="button"
            onClick={handleLogout}
            className="tap-target mt-2 h-8 w-8 mx-auto flex items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
            title="Logout"
            aria-label="Logout"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </aside>
  );
}
