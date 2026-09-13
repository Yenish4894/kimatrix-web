"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Cloudflare Turnstile, explicit rendering, no npm dependency.
 *
 * The parent owns the token. Tokens are single-use, so after a failed submit the
 * parent bumps `resetKey` and the widget issues a fresh one.
 */

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const LOAD_TIMEOUT_MS = 15_000;

interface TurnstileApi {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    const timer = window.setTimeout(() => fail(new Error("Turnstile load timed out")), LOAD_TIMEOUT_MS);
    function fail(err: Error) {
      window.clearTimeout(timer);
      script.remove();
      scriptPromise = null; // allow a retry on the next mount
      reject(err);
    }
    script.onload = () => {
      window.clearTimeout(timer);
      if (window.turnstile) resolve(window.turnstile);
      else fail(new Error("Turnstile loaded without its API"));
    };
    script.onerror = () => fail(new Error("Turnstile script failed to load"));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

interface TurnstileWidgetProps {
  siteKey: string;
  onToken: (token: string | null) => void;
  /** Change this to force a fresh token (e.g. after a failed submit). */
  resetKey: number;
  action?: string;
}

export function TurnstileWidget({ siteKey, onToken, resetKey, action }: Readonly<TurnstileWidgetProps>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;
  const [status, setStatus] = useState<"loading" | "ready" | "load-failed" | "challenge-failed">("loading");

  useEffect(() => {
    let cancelled = false;
    loadTurnstile()
      .then((api) => {
        if (cancelled || !containerRef.current) return;
        widgetIdRef.current = api.render(containerRef.current, {
          sitekey: siteKey,
          action,
          callback: (token: string) => {
            setStatus("ready");
            onTokenRef.current(token);
          },
          "expired-callback": () => onTokenRef.current(null),
          "timeout-callback": () => onTokenRef.current(null),
          "error-callback": () => {
            setStatus("challenge-failed");
            onTokenRef.current(null);
          },
        });
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("load-failed");
      });

    return () => {
      cancelled = true;
      const id = widgetIdRef.current;
      widgetIdRef.current = null;
      if (id && window.turnstile) window.turnstile.remove(id);
    };
  }, [siteKey, action]);

  // Skip the initial render: only a change of resetKey means "get a new token".
  const firstReset = useRef(true);
  useEffect(() => {
    if (firstReset.current) {
      firstReset.current = false;
      return;
    }
    const id = widgetIdRef.current;
    if (id && window.turnstile) {
      onTokenRef.current(null);
      window.turnstile.reset(id);
    }
  }, [resetKey]);

  const retry = () => {
    const id = widgetIdRef.current;
    if (id && window.turnstile) {
      setStatus("ready");
      window.turnstile.reset(id);
    }
  };

  return (
    <div>
      <div ref={containerRef} className="min-h-[65px]" />
      {status === "load-failed" && (
        <p role="alert" className="mt-1 text-[13px] text-error-500">
          The security check could not load, so the form can&apos;t be submitted yet. Check
          your connection or turn off any content blocker for this site, then reload the page.
        </p>
      )}
      {status === "challenge-failed" && (
        <p role="alert" className="mt-1 text-[13px] text-error-500">
          The security check didn&apos;t complete.{" "}
          <button
            type="button"
            onClick={retry}
            className="font-medium underline underline-offset-2 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            Try again
          </button>
        </p>
      )}
    </div>
  );
}
