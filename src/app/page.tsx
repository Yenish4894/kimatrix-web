"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import {
  QrCode,
  UserPlus,
  BarChart3,
  Fuel,
  Store,
  ArrowRight,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Smartphone,
  Shield,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ─── Feature Carousel Data ──────────────────────── */
const features = [
  {
    icon: QrCode,
    title: "Instant QR Code",
    description: "Get a unique QR code for your business the moment you subscribe. Print it, display it, and start tracking.",
    color: "bg-primary-100 text-primary-600",
  },
  {
    icon: Smartphone,
    title: "Mobile-First Customer Form",
    description: "Customers scan your QR and fill a simple form on their phone. No app download, no login required.",
    color: "bg-accent-100 text-accent-600",
  },
  {
    icon: BarChart3,
    title: "Real-Time Dashboard",
    description: "See every purchase as it happens. Track totals, top spenders, and customer trends at a glance.",
    color: "bg-success-100 text-success-600",
  },
  {
    icon: FileText,
    title: "PDF Reports",
    description: "Download detailed PDF reports of all customers or your top 10 spenders with a single click.",
    color: "bg-info-100 text-info-600",
  },
  {
    icon: Shield,
    title: "Flexible Plans",
    description: "Choose 15-day or 30-day plans. No long-term commitments, no hidden fees. Pay only for what you need.",
    color: "bg-warning-100 text-warning-600",
  },
];

/* ─── Feature Carousel ───────────────────────────── */
function FeatureCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start", slidesToScroll: 1 },
    [Autoplay({ delay: 4000, stopOnInteraction: true })]
  );
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi]);

  return (
    <div className="relative">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {features.map((f) => (
            <div key={f.title} className="flex-[0_0_100%] min-w-0 sm:flex-[0_0_50%] lg:flex-[0_0_33.333%] px-3">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 h-full hover:shadow-md hover:border-slate-300 transition-all">
                <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center mb-4", f.color)}>
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold font-heading text-slate-800">{f.title}</h3>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">{f.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 mt-8">
        <button
          onClick={scrollPrev}
          className="h-10 w-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          aria-label="Previous"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex gap-2">
          {features.map((f, i) => (
            <button
              key={f.title}
              onClick={() => emblaApi?.scrollTo(i)}
              className={cn(
                "h-2 rounded-full transition-all",
                selectedIndex === i ? "w-6 bg-primary-600" : "w-2 bg-slate-300"
              )}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={scrollNext}
          className="h-10 w-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          aria-label="Next"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

/* ─── Homepage ───────────────────────────────────── */
export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-xl font-bold font-heading tracking-tight">
              <span className="text-primary-600">KI</span><span className="text-slate-800">Mates</span>
            </Link>

            <div className="hidden lg:flex items-center gap-8">
              <a href="#features" className="text-sm text-slate-600 hover:text-primary-600 transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm text-slate-600 hover:text-primary-600 transition-colors">How it Works</a>
              <a href="#pricing" className="text-sm text-slate-600 hover:text-primary-600 transition-colors">Pricing</a>
              <Link href="/login">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm">Get Started <ArrowRight className="h-4 w-4" /></Button>
              </Link>
            </div>

            <div className="lg:hidden flex items-center gap-2">
              <Link href="/login"><Button variant="ghost" size="sm">Login</Button></Link>
              <Link href="/register"><Button variant="primary" size="sm">Register</Button></Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero — Clean, light, product-focused */}
      <section className="pt-16 sm:pt-24 pb-20 sm:pb-28 relative overflow-hidden">
        {/* Subtle background accents */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-primary-50 to-transparent rounded-full blur-3xl opacity-60 -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary-50 border border-primary-100 rounded-full px-4 py-1.5 mb-6">
              <span className="h-2 w-2 rounded-full bg-primary-500" />
              <span className="text-sm text-primary-700 font-medium">Now available in Niger</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-heading text-slate-900 leading-[1.1] tracking-tight">
              Track every purchase{" "}
              <span className="text-primary-800">with one QR code</span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
              The simplest way for fuel stations and shops to collect customer purchase data. Subscribe, get your QR code, start tracking.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="min-w-[200px] h-12 text-base">
                  Start Free Trial <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/qr/demo">
                <Button variant="secondary" size="lg" className="min-w-[200px] h-12 text-base">
                  Try Demo Form
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-16 flex items-center justify-center">
            <div className="flex items-center divide-x divide-slate-200 bg-slate-50 rounded-2xl border border-slate-100 px-2 py-4">
              {[
                { value: "500+", label: "Businesses" },
                { value: "2,000+", label: "Customers tracked" },
                { value: "99.9%", label: "Uptime" },
              ].map((stat) => (
                <div key={stat.label} className="px-6 sm:px-10 text-center">
                  <p className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">{stat.value}</p>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Product preview mockup */}
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="bg-slate-900 rounded-2xl p-2 shadow-2xl shadow-slate-900/20">
              <div className="bg-slate-800 rounded-xl overflow-hidden">
                {/* Browser chrome */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-slate-600" />
                    <div className="h-3 w-3 rounded-full bg-slate-600" />
                    <div className="h-3 w-3 rounded-full bg-slate-600" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-slate-700 rounded-md h-6 flex items-center px-3">
                      <span className="text-xs text-slate-400">kimates.com/company/dashboard</span>
                    </div>
                  </div>
                </div>
                {/* Dashboard preview content */}
                <div className="p-6 bg-slate-50">
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    {[
                      { label: "Total Customers", value: "247", color: "border-l-primary-500" },
                      { label: "Total Spend", value: "2.4M CFA", color: "border-l-accent-500" },
                      { label: "Top Spender", value: "Ali M.", color: "border-l-success-500" },
                      { label: "Plan Status", value: "Active", color: "border-l-info-500" },
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
                        <div className="h-20 w-20 bg-primary-50 rounded-lg mx-auto mb-2 flex items-center justify-center">
                          <QrCode className="h-10 w-10 text-primary-600" />
                        </div>
                        <p className="text-[10px] text-slate-500">Your QR Code</p>
                      </div>
                    </div>
                    <div className="col-span-2 bg-white rounded-lg p-3">
                      <p className="text-[10px] text-slate-500 uppercase mb-2">Recent Customers</p>
                      {["Ali Mohamed — 25,000 CFA", "Fatima Abdou — 12,000 CFA", "Omar Hassan — 8,500 CFA"].map((row) => (
                        <div key={row} className="py-1.5 border-b border-slate-100 last:border-0">
                          <p className="text-[11px] text-slate-600">{row}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Carousel */}
      <section id="features" className="py-16 sm:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-primary-600 uppercase tracking-wide mb-2">Features</p>
            <h2 className="text-3xl sm:text-4xl font-bold font-heading text-slate-900">Everything you need to track purchases</h2>
            <p className="text-slate-500 mt-3 max-w-lg mx-auto">
              Powerful tools designed for simplicity
            </p>
          </div>
          <FeatureCarousel />
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary-600 uppercase tracking-wide mb-2">Simple Process</p>
            <h2 className="text-3xl sm:text-4xl font-bold font-heading text-slate-900">Three steps to get started</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-16 max-w-4xl mx-auto">
            {[
              {
                icon: UserPlus,
                step: "01",
                title: "Register & Subscribe",
                description: "Create your account, choose 15 or 30-day plan, and you're ready to go.",
              },
              {
                icon: QrCode,
                step: "02",
                title: "Display Your QR Code",
                description: "Print or display your unique QR code at your counter for customers to scan.",
              },
              {
                icon: BarChart3,
                step: "03",
                title: "Track & Download",
                description: "Watch purchases come in live. Download PDF reports of all customer data.",
              },
            ].map((item, i) => (
              <div key={item.step} className="relative text-center">
                {i < 2 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] border-t-2 border-dashed border-slate-200" />
                )}
                <div className="relative z-10">
                  <span className="text-xs font-bold text-primary-600 tracking-widest">{item.step}</span>
                  <div className="mx-auto h-14 w-14 rounded-2xl bg-primary-600 flex items-center justify-center mt-3 mb-5 shadow-lg shadow-primary-600/20">
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

      {/* Business Types */}
      <section className="py-16 sm:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-primary-600 uppercase tracking-wide mb-2">Business Types</p>
            <h2 className="text-3xl sm:text-4xl font-bold font-heading text-slate-900">Built for your business</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="bg-white border border-slate-200 rounded-2xl p-8 hover:shadow-lg hover:border-accent-200 transition-all group">
              <div className="h-14 w-14 rounded-2xl bg-accent-100 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Fuel className="h-7 w-7 text-accent-600" />
              </div>
              <h3 className="text-xl font-semibold font-heading text-slate-800">Fuel Station</h3>
              <p className="text-slate-500 mt-3 leading-relaxed">
                Track fuel purchases with vehicle registration numbers. Identify your top customers and their spending patterns.
              </p>
              <ul className="mt-4 space-y-2">
                {["Vehicle reg. tracking", "Fuel amount logging", "Customer rankings"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle className="h-4 w-4 text-accent-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-8 hover:shadow-lg hover:border-primary-200 transition-all group">
              <div className="h-14 w-14 rounded-2xl bg-primary-100 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Store className="h-7 w-7 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold font-heading text-slate-800">Shop</h3>
              <p className="text-slate-500 mt-3 leading-relaxed">
                Track all customer invoices with names and totals. Build loyalty and find your most valuable shoppers.
              </p>
              <ul className="mt-4 space-y-2">
                {["Invoice tracking", "Spend accumulation", "Top 10 leaderboard"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle className="h-4 w-4 text-primary-500 shrink-0" />
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
            <p className="text-slate-500 mt-3">No hidden fees. Cancel anytime.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <div className="bg-white border border-slate-200 rounded-2xl p-8 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold font-heading text-slate-800">15-Day Plan</h3>
              <p className="text-slate-500 mt-1 text-sm">Perfect for trying out</p>
              <div className="mt-6 mb-8">
                <span className="text-5xl font-bold font-heading text-slate-900">$XX</span>
                <span className="text-slate-400 ml-1 text-sm">/ 15 days</span>
              </div>
              <ul className="space-y-3 mb-8">
                {["Unique QR Code", "Customer Dashboard", "PDF Reports", "Email Support"].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-slate-600">
                    <CheckCircle className="h-4 w-4 text-success-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/register">
                <Button variant="secondary" fullWidth className="h-12">Choose Plan</Button>
              </Link>
            </div>

            <div className="bg-primary-600 rounded-2xl p-8 text-white relative shadow-xl shadow-primary-600/20">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-accent-500 text-white text-xs font-bold px-4 py-1 rounded-full uppercase shadow-lg">
                  Most Popular
                </span>
              </div>
              <h3 className="text-xl font-semibold font-heading">30-Day Plan</h3>
              <p className="text-primary-200 mt-1 text-sm">Best value for growing businesses</p>
              <div className="mt-6 mb-8">
                <span className="text-5xl font-bold font-heading">$XX</span>
                <span className="text-primary-200 ml-1 text-sm">/ 30 days</span>
              </div>
              <ul className="space-y-3 mb-8">
                {["Everything in 15-day", "Extended tracking", "Priority support", "Customer rankings"].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-primary-100">
                    <CheckCircle className="h-4 w-4 text-accent-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/register">
                <Button variant="accent" fullWidth className="h-12">Choose Plan</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.12),transparent_60%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-3xl sm:text-4xl font-bold font-heading text-white">
            Ready to start tracking?
          </h2>
          <p className="text-slate-400 mt-4 max-w-md mx-auto">
            Join hundreds of businesses in Niger already using KIMates.
          </p>
          <Link href="/register" className="mt-8 inline-block">
            <Button variant="accent" size="lg" className="h-12 text-base">
              Register Now <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div>
              <span className="text-xl font-bold font-heading tracking-tight">
                <span className="text-primary-400">KI</span><span className="text-white">Mates</span>
              </span>
              <p className="mt-3 text-sm text-slate-600">
                QR-based customer purchase tracking for businesses in Niger.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-200 mb-3 text-sm">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Login</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Register</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-200 mb-3 text-sm">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li>support@kimates.com</li>
                <li>Niamey, Niger</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-600">
              &copy; {new Date().getFullYear()} KIMates. All rights reserved.
            </p>
            <div className="flex gap-6 text-xs text-slate-600">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
