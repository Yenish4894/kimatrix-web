import type { NextConfig } from "next";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";

// Build a CSP that:
//  - default-src 'self' — block everything not on our origin by default
//  - allow inline styles (Tailwind in production needs them; React inserts inline styles)
//  - allow data: images (QR codes are data URLs, jsPDF embeds PNG dataURLs)
//  - allow blob: for downloads (CSV/PDF blobs)
//  - allow fetches to the backend API (NEXT_PUBLIC_API_BASE_URL)
//  - block <object>, <embed>, <iframe> entirely (frame-src 'none')
//  - upgrade-insecure-requests in production
function buildCsp(): string {
  const isDev = process.env.NODE_ENV !== "production";
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    // Next.js needs unsafe-eval in dev for fast refresh; production drops it.
    "script-src": ["'self'", "'unsafe-inline'", ...(isDev ? ["'unsafe-eval'"] : [])],
    // Tailwind + Next inline styles
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'", "data:"],
    // Allow API + WebSocket (Next dev) + same-origin
    "connect-src": [
      "'self'",
      apiBaseUrl,
      ...(isDev ? ["ws:", "wss:"] : []),
    ],
    "frame-src": ["'none'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };
  if (!isDev) {
    directives["upgrade-insecure-requests"] = [];
  }
  return Object.entries(directives)
    .map(([key, vals]) => (vals.length ? `${key} ${vals.join(" ")}` : key))
    .join("; ");
}

const securityHeaders = [
  { key: "Content-Security-Policy", value: buildCsp() },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // No camera/mic/geolocation needed except for QR submission flow's geolocation,
  // which is gated behind explicit user permission anyway.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
