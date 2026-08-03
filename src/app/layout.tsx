import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { ToastContainer } from "react-toastify";
import { StoreProvider } from "@/store/provider";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";

// `display: "swap"` is next/font's default but stated explicitly — it is what keeps
// text visible during load rather than invisible (FOIT), which matters most on the
// public QR page over mobile data.
//
// `latin-ext` is deliberately KEPT on the two text faces. It costs ~40 KB, but company
// and customer names are user-supplied free text and a missing glyph renders as tofu
// or a mismatched system fallback in the middle of someone's name. Not worth the
// saving in a market whose character set I can't verify.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

// `preload: false` — mono is used only in authenticated tables (invoice numbers,
// vehicle plates, QR tokens) and never above the fold. It was being <link rel=preload>ed
// on every route from the root layout, including the public QR page, where it competes
// with the LCP image for the same connection and is then never used.
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: "KIMates — QR-Based Purchase Tracking",
    template: "%s | KIMates",
  },
  description:
    "Simple, powerful purchase tracking for fuel stations and shops. Subscribe, get your QR code, and start collecting customer data instantly.",
  applicationName: "KIMates",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "KIMates",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0891B2",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${plusJakarta.variable} ${jetbrainsMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col antialiased" suppressHydrationWarning>
        <StoreProvider>
          {children}
          <ServiceWorkerRegister />
          <InstallPrompt />
          <ToastContainer
            position="top-center"
            autoClose={5000}
            hideProgressBar={false}
            closeOnClick
            pauseOnHover
            toastClassName="!rounded-lg !shadow-lg !border !border-slate-200"
          />
        </StoreProvider>
      </body>
    </html>
  );
}
