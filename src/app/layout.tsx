import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { ToastContainer } from "react-toastify";
import { StoreProvider } from "@/store/provider";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";

// The fonts are bundled in ./fonts rather than fetched with next/font/google. The
// Google variant downloads the CSS and every font file from Google at build time, and
// on 2026-11-08 that fetch failed three deploys in a row on the server with a parse
// error inside next/font while passing everywhere else. A deploy should not depend on
// Google answering correctly. The files are the upstream variable fonts subset to
// Google's own `latin` + `latin-ext` ranges, so glyph coverage is unchanged. Regenerate
// with `scripts/build-fonts.py` (fonttools) if a weight or subset is ever needed.
//
// `display: "swap"` keeps text visible during load rather than invisible (FOIT), which
// matters most on the public QR page over mobile data.
//
// `latin-ext` is deliberately KEPT on the two text faces. Company and customer names
// are user-supplied free text and a missing glyph renders as tofu or a mismatched
// system fallback in the middle of someone's name.
const inter = localFont({
  src: "./fonts/inter.woff2",
  variable: "--font-inter",
  weight: "400 600",
  display: "swap",
});

const plusJakarta = localFont({
  src: "./fonts/plus-jakarta-sans.woff2",
  variable: "--font-plus-jakarta",
  weight: "400 800",
  display: "swap",
});

// `preload: false` — mono is used only in authenticated tables (invoice numbers,
// vehicle plates, QR tokens) and never above the fold. It was being <link rel=preload>ed
// on every route from the root layout, including the public QR page, where it competes
// with the LCP image for the same connection and is then never used.
const jetbrainsMono = localFont({
  src: "./fonts/jetbrains-mono.woff2",
  variable: "--font-jetbrains",
  weight: "400",
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
