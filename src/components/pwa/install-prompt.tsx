"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "kimates-install-dismissed";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;

      // Respect prior dismissal (7-day cooldown)
      const dismissed = localStorage.getItem(DISMISS_KEY);
      if (dismissed && Date.now() - Number(dismissed) < 7 * 24 * 60 * 60 * 1000) {
        return;
      }

      setDeferredPrompt(event);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed left-4 right-4 bottom-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-sm z-50",
        "bg-white rounded-2xl shadow-xl border border-slate-200 p-4 animate-slide-up"
      )}
      role="dialog"
      aria-label="Install KIMates"
    >
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 h-7 w-7 flex items-center justify-center rounded-md text-slate-400 hover:bg-slate-100"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
          <Download className="h-5 w-5 text-primary-600" />
        </div>
        <div className="flex-1 min-w-0 pr-4">
          <p className="text-sm font-semibold text-slate-800">Install KIMates</p>
          <p className="text-xs text-slate-500 mt-1">
            Add to your home screen for faster access and offline support.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleInstall}
              className="h-8 px-3 rounded-md bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium transition-colors"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="h-8 px-3 rounded-md text-slate-500 hover:bg-slate-100 text-xs font-medium transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
