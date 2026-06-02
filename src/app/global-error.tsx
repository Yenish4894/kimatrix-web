"use client";

// Root-level fallback. Catches errors that escape the root layout itself
// (rare). Must render its own <html>/<body> since the layout is unavailable.
// Keep this absolutely minimal — no providers, no layouts, no third-party
// components, since whatever broke might have broken those too.

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // TODO when Sentry is wired: Sentry.captureException(error)
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[global error]", error);
    }
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: "#334155",
          background: "#F8FAFC",
        }}
      >
        <div style={{ textAlign: "center", padding: "32px", maxWidth: "440px" }}>
          <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#0F172A", margin: 0 }}>
            <span style={{ color: "#0D9488" }}>KI</span>Mates
          </h1>
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#0F172A", marginTop: "32px" }}>
            We hit a critical error
          </h2>
          <p style={{ fontSize: "14px", color: "#64748B", marginTop: "8px", lineHeight: 1.5 }}>
            Something went wrong loading the application. Please try again or contact support if the
            problem persists.
          </p>
          {error.digest && (
            <p style={{ fontSize: "12px", color: "#94A3B8", marginTop: "12px", fontFamily: "monospace" }}>
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              marginTop: "24px",
              padding: "10px 20px",
              background: "#0D9488",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
