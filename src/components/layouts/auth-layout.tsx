"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QrCode, BarChart3, Shield, Zap, Fuel, TrendingUp, Users } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loadSession } from "@/store/slices/authSlice";
import { PageLoader } from "@/components/ui/loader";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

const features = [
  { icon: Zap,       text: "QR code ready in under 2 minutes" },
  { icon: QrCode,    text: "Customers scan — no app needed"    },
  { icon: BarChart3, text: "Live dashboard + PDF exports"      },
  { icon: Shield,    text: "Flexible 15 or 30-day plans"       },
];

const recentPurchases = [
  { initials: "AM", name: "Ali Mohamed",  amount: "25,000", time: "2m ago"  },
  { initials: "FA", name: "Fatima Abdou", amount: "12,000", time: "18m ago" },
  { initials: "OH", name: "Omar Hassan",  amount: "8,500",  time: "1h ago"  },
];

export function AuthLayout({ children, title, subtitle }: Readonly<AuthLayoutProps>) {
  const [hasCheckedSession, setHasCheckedSession] = useState(false);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(loadSession()).finally(() => setHasCheckedSession(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hasCheckedSession || !isAuthenticated || !user) return;
    const target = user.userType === "super_admin" ? "/admin/dashboard" : "/company/dashboard";
    router.replace(target);
  }, [hasCheckedSession, isAuthenticated, user, router]);

  if (!hasCheckedSession || isAuthenticated) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #EFF6FF 0%, #F0F9FF 50%, #F0FDFA 100%)" }}
    >
      {/* Soft page-level orbs */}
      <div className="absolute top-0 left-0 h-[500px] w-[500px] rounded-full bg-primary-100/70 blur-[120px] -translate-x-1/3 -translate-y-1/3 pointer-events-none" />
      <div className="absolute bottom-0 right-0 h-[450px] w-[450px] rounded-full bg-accent-100/50 blur-[100px] translate-x-1/3 translate-y-1/3 pointer-events-none" />

      {/* ── One unified card ── */}
      <div className="relative w-full max-w-[900px] flex flex-col md:flex-row rounded-[2rem] overflow-hidden shadow-2xl shadow-primary-900/14 border border-slate-200/60">

        {/* Top accent stripe — spans the entire card width */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 z-20" />

        {/* ═══ LEFT ZONE — dark teal ═══ */}
        <div className="hidden md:flex md:w-[45%] relative flex-col justify-between overflow-hidden">

          {/* Base gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700" />

          {/* Decorative rings — depth effect */}
          <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full border border-white/[0.06] pointer-events-none" />
          <div className="absolute -bottom-8 -right-8 h-48 w-48 rounded-full border border-white/[0.08] pointer-events-none" />
          <div className="absolute top-1/3 -left-16 h-56 w-56 rounded-full border border-white/[0.05] pointer-events-none" />

          {/* Ambient glow */}
          <div className="absolute -top-24 -left-16 h-64 w-64 rounded-full bg-primary-400/25 blur-[70px] pointer-events-none" />
          <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-accent-500/15 blur-[60px] pointer-events-none" />

          {/* Dot texture */}
          <div
            className="absolute inset-0 opacity-[0.035] pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
              backgroundSize: "22px 22px",
            }}
          />

          {/* Content */}
          <div className="relative z-10 flex flex-col gap-5 p-8 lg:p-10 pt-10 lg:pt-11 h-full">

            {/* Logo */}
            <Link href="/" className="inline-flex items-baseline shrink-0">
              <span className="text-lg font-bold font-heading text-white tracking-tight">KI</span>
              <span className="text-lg font-bold font-heading text-accent-300 tracking-tight">Mates</span>
            </Link>

            {/* Headline */}
            <div className="space-y-1.5">
              <h2 className="text-[1.45rem] lg:text-[1.6rem] font-bold font-heading text-white leading-[1.2] tracking-tight">
                Track every purchase,{" "}
                <span className="text-accent-300">grow every relationship</span>
              </h2>
              <p className="text-white/50 text-xs leading-relaxed">
                QR-based customer data for fuel stations &amp; shops.
              </p>
            </div>

            {/* Dashboard mockup */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl p-3 shadow-lg shadow-black/15">
              {/* Mockup header */}
              <div className="flex items-center justify-between mb-2.5">
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400" />
                    </span>
                    <span className="text-[8px] font-semibold text-green-300/90 uppercase tracking-widest">Live</span>
                  </div>
                  <p className="text-[11px] font-semibold text-white leading-tight">Niamey Fuel Station</p>
                </div>
                <div className="h-7 w-7 rounded-lg bg-white/10 border border-white/12 flex items-center justify-center">
                  <Fuel className="h-3.5 w-3.5 text-accent-300" />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-1.5 mb-2.5">
                <div className="bg-white/8 rounded-lg p-2">
                  <p className="text-[7px] text-white/40 uppercase tracking-wider">Total Spend</p>
                  <p className="text-xs font-bold text-white mt-0.5">2.4M ₣</p>
                  <p className="text-[8px] text-accent-300 mt-0.5">↑ 12% this week</p>
                </div>
                <div className="bg-white/8 rounded-lg p-2">
                  <p className="text-[7px] text-white/40 uppercase tracking-wider">Customers</p>
                  <p className="text-xs font-bold text-white mt-0.5">247</p>
                  <p className="text-[8px] text-green-400 mt-0.5">+8 today</p>
                </div>
              </div>

              {/* Recent purchases */}
              <p className="text-[7px] text-white/30 uppercase tracking-widest mb-1.5">Recent Purchases</p>
              {recentPurchases.map((row) => (
                <div key={row.name} className="flex items-center justify-between py-1 border-b border-white/[0.06] last:border-0">
                  <div className="flex items-center gap-1.5">
                    <div className="h-5 w-5 rounded-full bg-accent-500/30 border border-accent-400/20 flex items-center justify-center shrink-0">
                      <span className="text-[7px] font-bold text-accent-200">{row.initials}</span>
                    </div>
                    <span className="text-[10px] text-white/70 font-medium">{row.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold text-white">{row.amount} ₣</p>
                    <p className="text-[8px] text-white/30">{row.time}</p>
                  </div>
                </div>
              ))}

              {/* Pulse notification */}
              <div className="mt-2 flex items-center gap-1.5 bg-accent-500/15 border border-accent-400/20 rounded-lg px-2 py-1">
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent-400" />
                </span>
                <p className="text-[9px] text-accent-200/85 font-medium">New purchase just submitted</p>
              </div>
            </div>

            {/* Feature bullets */}
            <div className="space-y-2">
              {features.map((item) => (
                <div key={item.text} className="flex items-center gap-2.5 group">
                  <div className="h-7 w-7 rounded-lg bg-white/10 border border-white/14 flex items-center justify-center shrink-0 group-hover:bg-white/18 transition-all duration-200">
                    <item.icon className="h-3 w-3 text-accent-300" />
                  </div>
                  <span className="text-[11px] text-white/75 font-medium">{item.text}</span>
                </div>
              ))}
            </div>

            {/* Stat chips + copyright */}
            <div className="mt-auto pt-2 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { icon: Users,      value: "500+",  label: "Businesses" },
                  { icon: TrendingUp, value: "99.9%", label: "Uptime"     },
                  { icon: BarChart3,  value: "2K+",   label: "Customers"  },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-1 bg-white/8 border border-white/10 rounded-full px-2.5 py-1">
                    <s.icon className="h-2.5 w-2.5 text-accent-300 shrink-0" />
                    <span className="text-[10px] font-bold text-white">{s.value}</span>
                    <span className="text-[9px] text-white/45">{s.label}</span>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-white/22">
                &copy; {new Date().getFullYear()} KIMates. All rights reserved.
              </p>
            </div>

          </div>
        </div>

        {/* ═══ RIGHT ZONE — white form ═══ */}
        <div className="flex-1 bg-white flex items-center justify-center px-8 py-10 sm:px-10 lg:px-12 relative">

          {/* Subtle inner top-left watermark */}
          <div className="absolute top-6 right-7 opacity-[0.06] pointer-events-none select-none">
            <QrCode className="h-20 w-20 text-primary-900" />
          </div>

          <div className="w-full max-w-[340px] relative z-10">

            {/* Mobile logo */}
            <div className="md:hidden mb-6 flex items-center gap-0.5">
              <span className="text-xl font-bold font-heading text-primary-700 tracking-tight">KI</span>
              <span className="text-xl font-bold font-heading text-slate-800 tracking-tight">Mates</span>
            </div>

            {/* Form header */}
            <div className="mb-6">
              <div className="h-9 w-9 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center mb-4">
                <QrCode className="h-4 w-4 text-primary-600" />
              </div>
              <h1 className="text-[1.3rem] font-heading font-bold text-slate-800 tracking-tight">{title}</h1>
              <p className="text-slate-500 mt-1 text-sm">{subtitle}</p>
            </div>

            {children}

            <p className="text-center text-xs text-slate-400 mt-5">
              By continuing you agree to our{" "}
              <Link href="/terms" className="text-slate-500 hover:text-slate-700 underline underline-offset-2 transition-colors">Terms</Link>
              {" "}&amp;{" "}
              <Link href="/privacy" className="text-slate-500 hover:text-slate-700 underline underline-offset-2 transition-colors">Privacy</Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
