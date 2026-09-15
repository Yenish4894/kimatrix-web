"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  QrCode,
  UserPlus,
  BarChart3,
  Fuel,
  Store,
  ArrowRight,
  CheckCircle,
  Smartphone,
  FileText,
  Gift,
  Mail,
  CreditCard,
  Globe,
  Users,
  Printer,
  Trophy,
  ShieldCheck,
  MailCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { paymentService } from "@/services/payment.service";
import { recordLandingVisitOnce } from "@/services/metrics.service";
import type { SubscriptionPlan } from "@/types";

/*
 * Landing copy — refreshed 2026-09-15 to match the platform as built
 * (.claude/skills/feature-spec.md). Rules for editing it:
 *  - Only claim what exists. No numbers that an admin can change (trial length, spin
 *    price): the public site has no endpoint for them, and a hard-coded "7 days" goes
 *    stale the moment the setting moves.
 *  - Global: no country-specific wording (decided 2026-09-15).
 */

/* ─── Features ───────────────────────────────────── */
const features = [
  {
    icon: QrCode,
    title: "Your own QR code",
    description:
      "Ready as soon as you confirm your email, and emailed to you as a printable poster. Pause it any time, or regenerate it if a poster goes missing.",
    color: "bg-primary-100 text-primary-600",
  },
  {
    icon: Smartphone,
    title: "No app for customers",
    description:
      "Customers scan with any phone camera and fill a short form in their browser. No download, no account, no friction.",
    color: "bg-accent-100 text-accent-600",
  },
  {
    icon: BarChart3,
    title: "Live dashboard",
    description:
      "Every purchase appears as it's submitted. See total customers, total spend, your top spender and how long your plan has left.",
    color: "bg-success-100 text-success-600",
  },
  {
    icon: Users,
    title: "Customer & purchase records",
    description:
      "Search and sort every customer and purchase, filter by date, and void a wrong entry with a reason — it drops out of totals and reports.",
    color: "bg-info-100 text-info-600",
  },
  {
    icon: FileText,
    title: "Reports & exports",
    description:
      "One-click PDFs of your top 10, all customers and transactions, a monthly report, and CSV exports of your data whenever you want it.",
    color: "bg-warning-100 text-warning-600",
  },
  {
    icon: Gift,
    title: "Lucky draw",
    description:
      "Reward your customers with a draw run on your real purchases. The winner is picked at random and can win only once per period.",
    color: "bg-accent-100 text-accent-600",
  },
  {
    icon: Mail,
    title: "Automatic emails",
    description:
      "Reminders before your trial or plan ends, and a receipt with an invoice PDF after every payment — nothing to chase.",
    color: "bg-primary-100 text-primary-600",
  },
  {
    icon: CreditCard,
    title: "Flexible billing",
    description:
      "Short plans with no lock-in, paid securely with PayPal — once, or on auto-renew you can change or cancel. Every invoice is one click away.",
    color: "bg-success-100 text-success-600",
  },
  {
    icon: Globe,
    title: "Works wherever you are",
    description:
      "Customer amounts are recorded in your own country's currency, and phone numbers use your country's dialling code.",
    color: "bg-info-100 text-info-600",
  },
];

function FeatureGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {features.map((f) => (
        <div key={f.title} className="bg-white border border-slate-200 rounded-2xl p-6 h-full">
          <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center mb-4", f.color)} aria-hidden="true">
            <f.icon className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold font-heading text-slate-800">{f.title}</h3>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">{f.description}</p>
        </div>
      ))}
    </div>
  );
}

/* ─── How it works ───────────────────────────────── */
const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "Sign up",
    description: "Create your account in a few minutes.",
  },
  {
    icon: MailCheck,
    step: "02",
    title: "Confirm your email",
    description: "Your account is activated and your QR code arrives by email, ready to print.",
  },
  {
    icon: Printer,
    step: "03",
    title: "Display your QR",
    description: "Put the poster where customers pay — the counter, the till or the pumps.",
  },
  {
    icon: BarChart3,
    step: "04",
    title: "Track, reward, report",
    description: "Watch purchases arrive, run lucky draws and download reports any time.",
  },
];

/* ─── Plan card contents ─────────────────────────── */
// The same everywhere: plans differ by length, not by features.
const planIncludes = [
  "Your QR code & printable poster",
  "Live dashboard & customer records",
  "PDF reports & CSV exports",
  // Plans carry no spins (drawSpins = 0); spins are a separately priced add-on.
  "Lucky draw (spins are an add-on)",
  "Email receipts & invoices",
];

const faqs = [
  {
    q: "How do I get started?",
    a: "Sign up and confirm your email — your QR code arrives by email straight away. Choose a plan from Billing to keep using KIMates.",
  },
  {
    q: "Do my customers need to download an app?",
    a: "No. Customers scan your QR code with any smartphone camera and fill in a short form in their browser. No app and no account.",
  },
  {
    q: "What happens when my trial or plan ends?",
    a: "Your dashboard is locked and your QR code stops accepting new purchases until you renew. Billing, your invoices and data exports stay available, and you get a reminder email before it happens.",
  },
  {
    q: "How does the lucky draw work?",
    a: "Each purchase in the period is one entry. When you spin, the winner is picked at random on our server, and a customer can win only once per period. Spins aren't part of the plan price: you buy them as an add-on during a paid plan.",
  },
  {
    q: "What businesses can use KIMates?",
    a: "Fuel stations and shops, anywhere. Each has its own form: fuel stations also record the vehicle registration. Amounts are in your own country's currency.",
  },
  {
    q: "How do I pay?",
    a: "Plans are paid in US dollars through PayPal — as a one-time payment or on auto-renew, which you can change or cancel. Every payment comes with an invoice.",
  },
  {
    q: "Is my customer data secure?",
    a: "Yes. Everything travels over HTTPS and only you can see your business's data. You can export it at any time, and you can close your account from Settings.",
  },
];

/* ─── Homepage ───────────────────────────────────── */
export default function HomePage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);

  // Landing-page visitor count. Here and nowhere else: this page is the front door,
  // and counting app routes would mostly count the same signed-in owners over and over.
  useEffect(() => {
    recordLandingVisitOnce();
  }, []);

  useEffect(() => {
    paymentService.getPlans()
      .then(setPlans)
      .catch(() => {})
      .finally(() => setPlansLoading(false));
  }, []);

  // Every active plan, in the admin's order (product decision 2026-09-15 — the page
  // used to advertise only the 15- and 30-day plans, which hid the cheapest one and
  // drifted from Billing whenever an admin changed the catalogue).
  const shownPlans = [...plans].sort(
    (a, b) => (a.sortOrder ?? a.durationDays) - (b.sortOrder ?? b.durationDays) || a.durationDays - b.durationDays,
  );
  const price = (p: SubscriptionPlan) => Number.parseFloat(p.price).toFixed(2);

  const planCard = (p: SubscriptionPlan) => {
    // Only the admin's "Most Popular" flag decides the badge — no guessing.
    const featured = !!p.isPopular;
    const tagline = p.description?.trim() || `${p.durationDays} days of full access`;
    return (
    <div
      key={p.id}
      className={cn(
        "rounded-2xl p-7 relative flex flex-col",
        featured
          ? "bg-primary-600 text-white shadow-xl shadow-primary-600/20"
          : "bg-white border border-slate-200 hover:shadow-lg transition-shadow",
      )}
    >
      {featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-accent-500 text-white text-xs font-bold px-4 py-1 rounded-full uppercase shadow-lg whitespace-nowrap">
            Most Popular
          </span>
        </div>
      )}
      <h3 className={cn("text-xl font-semibold font-heading", featured ? "text-white" : "text-slate-800")}>
        {p.name}
      </h3>
      <p className={cn("mt-1 text-sm", featured ? "text-primary-200" : "text-slate-500")}>{tagline}</p>
      <div className="mt-6 mb-8">
        <span className={cn("text-4xl font-bold font-heading", featured ? "" : "text-slate-900")}>${price(p)}</span>
        <span className={cn("ml-1 text-sm", featured ? "text-primary-200" : "text-slate-500")}>/ {p.durationDays} days</span>
      </div>
      <ul className="space-y-3 mb-8">
        {planIncludes.map((f) => (
          <li key={f} className={cn("flex items-center gap-3 text-sm", featured ? "text-primary-100" : "text-slate-600")}>
            <CheckCircle className={cn("h-4 w-4 shrink-0", featured ? "text-accent-400" : "text-success-500")} aria-hidden="true" />
            {f}
          </li>
        ))}
      </ul>
      <Link href="/register" className="mt-auto">
        <Button variant={featured ? "accent" : "secondary"} fullWidth className="h-12">Get started</Button>
      </Link>
    </div>
    );
  };

  // Up to four across on desktop; fewer plans get a narrower, centred grid.
  const gridCols =
    shownPlans.length >= 4
      ? "md:grid-cols-2 xl:grid-cols-4 max-w-6xl"
      : shownPlans.length === 3
        ? "md:grid-cols-3 max-w-5xl"
        : shownPlans.length === 2
          ? "md:grid-cols-2 max-w-3xl"
          : "max-w-sm";

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="shrink-0" aria-label="KIMates home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/kimates-logo.png" alt="KIMates" width={150} height={32} className="h-8 w-auto" />
            </Link>

            <div className="hidden lg:flex items-center gap-8">
              <a href="#features" className="text-sm text-slate-600 hover:text-primary-600 transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm text-slate-600 hover:text-primary-600 transition-colors">How it Works</a>
              <a href="#lucky-draw" className="text-sm text-slate-600 hover:text-primary-600 transition-colors">Lucky Draw</a>
              <a href="#pricing" className="text-sm text-slate-600 hover:text-primary-600 transition-colors">Pricing</a>
              <a href="#faq" className="text-sm text-slate-600 hover:text-primary-600 transition-colors">FAQ</a>
              <Link href="/login">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm">Get started <ArrowRight className="h-4 w-4" aria-hidden="true" /></Button>
              </Link>
            </div>

            <div className="lg:hidden flex items-center gap-2">
              {/* h-11: the small button is 32px, under the 44px touch minimum. */}
              <Link href="/login"><Button variant="ghost" size="sm" className="h-11">Login</Button></Link>
              <Link href="/register"><Button variant="primary" size="sm" className="h-11">Sign up</Button></Link>
            </div>
          </div>
        </div>
      </nav>

      <main>
      {/* Hero */}
      <section className="pt-16 sm:pt-24 pb-20 sm:pb-28 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-primary-50 to-transparent rounded-full blur-3xl opacity-60 -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary-50 border border-primary-100 rounded-full px-4 py-1.5 mb-6">
              <span className="h-2 w-2 rounded-full bg-primary-500" />
              <span className="text-sm text-primary-700 font-medium">Built for fuel stations &amp; shops</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-heading text-slate-900 leading-[1.1] tracking-tight">
              Track every purchase{" "}
              <span className="text-primary-800">with one QR code</span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Customers scan your code and log their purchase in seconds. You get a live customer list,
              top-spender rankings, lucky draws and ready-made reports — built for fuel stations and shops.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/register">
                <Button size="lg" className="min-w-[200px] h-12 text-base">
                  Get started <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button variant="secondary" size="lg" className="min-w-[200px] h-12 text-base">
                  See how it works
                </Button>
              </a>
            </div>
          </div>

          {/* Product preview mockup */}
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="bg-slate-900 rounded-2xl p-2 shadow-2xl shadow-slate-900/20">
              <div className="bg-slate-800 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-slate-600" />
                    <div className="h-3 w-3 rounded-full bg-slate-600" />
                    <div className="h-3 w-3 rounded-full bg-slate-600" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-slate-700 rounded-md h-6 flex items-center px-3">
                      <span className="text-xs text-slate-500">kimates.com/company/dashboard</span>
                    </div>
                  </div>
                </div>
                {/* Illustrative figures only — deliberately in no one country's currency. */}
                <div className="p-6 bg-slate-50">
                  {/* 2×2 on phones: four columns in 300px cut the labels off mid-word. */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    {[
                      { label: "Total Customers", value: "247", color: "border-l-primary-500" },
                      { label: "Total Spend", value: "$24,580", color: "border-l-accent-500" },
                      { label: "Top Spender", value: "Alex M.", color: "border-l-success-500" },
                      { label: "Plan", value: "18 days left", color: "border-l-info-500" },
                    ].map((card) => (
                      <div key={card.label} className={cn("bg-white rounded-lg p-3 border-l-4", card.color)}>
                        <p className="text-[10px] text-slate-500 uppercase">{card.label}</p>
                        <p className="text-sm font-bold text-slate-800 mt-1">{card.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1 bg-white rounded-lg p-4 flex items-center justify-center">
                      <div className="text-center">
                        <div className="h-20 w-20 bg-primary-50 rounded-lg mx-auto mb-2 flex items-center justify-center" aria-hidden="true">
                          <QrCode className="h-10 w-10 text-primary-600" />
                        </div>
                        <p className="text-[10px] text-slate-500">Your QR Code</p>
                      </div>
                    </div>
                    <div className="col-span-2 bg-white rounded-lg p-3">
                      <p className="text-[10px] text-slate-500 uppercase mb-2">Recent Purchases</p>
                      {["Alex Morgan — $250.00", "Sam Lee — $124.50", "Jordan Reed — $85.00"].map((row) => (
                        <div key={row} className="py-1.5 border-b border-slate-100 last:border-0">
                          <p className="text-[11px] text-slate-600">{row}</p>
                        </div>
                      ))}
                      <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-accent-50 border border-accent-100 px-2 py-0.5">
                        <Trophy className="h-3 w-3 text-accent-600" aria-hidden="true" />
                        <span className="text-[10px] font-medium text-accent-700">Lucky draw winner: Sam Lee</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 sm:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-primary-600 uppercase tracking-wide mb-2">Features</p>
            <h2 className="text-3xl sm:text-4xl font-bold font-heading text-slate-900">Everything you need to know your customers</h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto">
              From the first scan to the monthly report — no spreadsheets, no paper slips.
            </p>
          </div>
          <FeatureGrid />
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary-600 uppercase tracking-wide mb-2">How it works</p>
            <h2 className="text-3xl sm:text-4xl font-bold font-heading text-slate-900">Up and running in minutes</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 max-w-6xl mx-auto">
            {steps.map((item, i) => (
              <div key={item.step} className="relative text-center">
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-[62%] w-[76%] border-t-2 border-dashed border-slate-200" />
                )}
                <div className="relative z-10">
                  <span className="text-xs font-bold text-primary-600 tracking-widest">{item.step}</span>
                  <div className="mx-auto h-14 w-14 rounded-2xl bg-primary-600 flex items-center justify-center mt-3 mb-5 shadow-lg shadow-primary-600/20" aria-hidden="true">
                    <item.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold font-heading text-slate-800">{item.title}</h3>
                  <p className="text-sm text-slate-500 mt-2">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lucky draw spotlight */}
      <section id="lucky-draw" className="py-16 sm:py-24 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(8,145,178,0.18),transparent_55%)]" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-sm font-semibold text-accent-400 uppercase tracking-wide mb-2">Lucky draw</p>
            <h2 className="text-3xl sm:text-4xl font-bold font-heading text-white">Reward your best customers</h2>
            <p className="text-slate-400 mt-4 leading-relaxed">
              Turn every receipt into a chance to win. Run a draw on the purchases your customers have
              already submitted — it brings them back and gives them a reason to scan every time.
            </p>
          </div>
          <ul className="space-y-4">
            {[
              { icon: Trophy, title: "Fair by design", text: "Each purchase is one entry and the winner is picked at random on our server." },
              { icon: ShieldCheck, title: "One win per customer", text: "A customer can win only once per period, and voided purchases never count." },
              { icon: Gift, title: "Spins when you need them", text: "Buy spins as an add-on whenever you want during a paid plan. Complimentary access can include some too." },
            ].map((item) => (
              <li key={item.title} className="flex gap-4 bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="h-10 w-10 rounded-lg bg-accent-500/20 flex items-center justify-center shrink-0" aria-hidden="true">
                  <item.icon className="h-5 w-5 text-accent-300" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                  <p className="text-sm text-slate-400 mt-0.5">{item.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Business Types */}
      <section className="py-16 sm:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-primary-600 uppercase tracking-wide mb-2">Business Types</p>
            <h2 className="text-3xl sm:text-4xl font-bold font-heading text-slate-900">Built for your business</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="bg-white border border-slate-200 rounded-2xl p-8 hover:shadow-lg hover:border-accent-200 transition-all group">
              <div className="h-14 w-14 rounded-2xl bg-accent-100 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform" aria-hidden="true">
                <Fuel className="h-7 w-7 text-accent-600" />
              </div>
              <h3 className="text-xl font-semibold font-heading text-slate-800">Fuel Station</h3>
              <p className="text-slate-500 mt-3 leading-relaxed">
                Customers log each fill-up with their vehicle registration, so you know who your regulars are and what they spend.
              </p>
              <ul className="mt-4 space-y-2">
                {["Vehicle registration on every purchase", "Invoice number & amount", "Top customers & lucky draws"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle className="h-4 w-4 text-accent-500 shrink-0" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-8 hover:shadow-lg hover:border-primary-200 transition-all group">
              <div className="h-14 w-14 rounded-2xl bg-primary-100 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform" aria-hidden="true">
                <Store className="h-7 w-7 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold font-heading text-slate-800">Shop</h3>
              <p className="text-slate-500 mt-3 leading-relaxed">
                Every receipt adds to that customer&apos;s running total, so your most valuable shoppers rise to the top on their own.
              </p>
              <ul className="mt-4 space-y-2">
                {["Invoice tracking", "Spend adds up per customer", "Top 10 leaderboard & lucky draws"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle className="h-4 w-4 text-primary-500 shrink-0" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary-600 uppercase tracking-wide mb-2">Pricing</p>
            <h2 className="text-3xl sm:text-4xl font-bold font-heading text-slate-900">Simple, transparent pricing</h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto">
              Pick a plan in US dollars, paid once or on auto-renew. No lock-in.
            </p>
          </div>

          {plansLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-6xl mx-auto" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl border border-slate-200 p-7 h-[420px] animate-pulse bg-slate-50" />
              ))}
            </div>
          ) : shownPlans.length > 0 ? (
            <div className={cn("grid grid-cols-1 gap-6 mx-auto", gridCols)}>
              {shownPlans.map(planCard)}
            </div>
          ) : (
            <p className="text-center text-slate-500">
              Plans are shown in Billing after you sign up.{" "}
              <Link href="/register" className="text-primary-600 font-medium hover:underline">Get started</Link>
            </p>
          )}
          <p className="text-center text-sm text-slate-500 mt-8">
            Every plan includes every feature. Lucky draw spins are bought separately as an add-on during a paid plan.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 sm:py-24 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-primary-600 uppercase tracking-wide mb-2">FAQ</p>
            <h2 className="text-3xl sm:text-4xl font-bold font-heading text-slate-900">Common questions</h2>
          </div>
          <div className="space-y-4">
            {faqs.map(({ q, a }) => (
              <div key={q} className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
                <h3 className="text-base font-semibold text-slate-800 mb-2">{q}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — last section before footer */}
      <section className="py-20 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.12),transparent_60%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-3xl sm:text-4xl font-bold font-heading text-white">
            Ready to know your customers?
          </h2>
          <p className="text-slate-400 mt-4 max-w-md mx-auto">
            Sign up today — your QR code is on its way as soon as you confirm your email.
          </p>
          <Link href="/register" className="mt-8 inline-block">
            <Button variant="accent" size="lg" className="h-12 text-base">
              Get started <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Button>
          </Link>
        </div>
      </section>

      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-500 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/kimates-logo-white.png" alt="KIMates" width={150} height={32} className="h-8 w-auto" />
              <p className="mt-3 text-sm text-slate-500">
                QR-based customer purchase tracking for fuel stations and shops.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-200 mb-3 text-sm">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Login</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Get started</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-200 mb-3 text-sm">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="mailto:info@kimates.com" className="hover:text-white transition-colors">info@kimates.com</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500">
              &copy; {new Date().getFullYear()} KIMates. All rights reserved.
            </p>
            <div className="flex gap-6 text-xs text-slate-500">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
