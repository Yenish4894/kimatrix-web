"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Download, LogOut } from "lucide-react";
import { Modal, Button } from "@/components/ui";
import { useAppDispatch } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";
import type { Entitlement } from "@/lib/entitlement";

interface PaywallModalProps {
  entitlement: Entitlement;
  companyName?: string;
}

function copyFor(entitlement: Entitlement): { heading: string; body: string } {
  switch (entitlement.status) {
    case "trial_expired":
      return {
        heading: "Your free trial has ended",
        body: "Nothing has been deleted. Choose a plan and everything picks up exactly where it left off — the same QR code, the same customer list.",
      };
    case "expired":
      return {
        heading: "Your subscription has expired",
        body: "Your data is safe and untouched. Renew and everything resumes immediately — the same QR code, the same customer list.",
      };
    default:
      // `pending` — registered, never subscribed, and either ineligible for a trial or
      // yet to confirm their email. Deliberately never says which identifier was
      // already used; that would be an enumeration oracle and, more simply, it is not
      // information this person needs.
      return {
        heading: "Choose a plan to get started",
        body: "Pick a plan and your QR code goes live straight away. You'll be able to start collecting customer purchases immediately.",
      };
  }
}

/**
 * The blocking paywall.
 *
 * Non-dismissible on purpose — no close button, no overlay click, no Escape. That is
 * only defensible because it offers three real, keyboard-reachable exits: subscribe,
 * download your data, log out. The customer is never trapped. There is simply no
 * "dismiss back to the page behind", because the page behind is no longer theirs to
 * read.
 *
 * A deactivated account never reaches this: an admin-banned company gets a read-only
 * notice instead, since offering "choose a plan" to someone we just banned would take
 * their money and change nothing.
 */
export function PaywallModal({ entitlement, companyName }: Readonly<PaywallModalProps>) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const { heading, body } = copyFor(entitlement);

  const handleLogout = async (): Promise<void> => {
    await dispatch(logout());
    router.push("/login");
  };

  return (
    <Modal
      open
      onClose={() => {
        /* non-dismissible — see `dismissible={false}` below */
      }}
      dismissible={false}
      role="alertdialog"
      size="md"
      initialFocusRef={headingRef}
      ariaLabel={heading}
    >
      <div className="-mx-6 -mt-4">
        {/* Dark hero. `text-white` on the heading is REQUIRED, not decorative:
            globals.css sets `h1-h6 { color: #111827 }` in @layer base, so a heading on
            a dark background renders near-black and invisible without it. This has
            already caused three visible bugs in this codebase. */}
        <div className="bg-gradient-to-br from-primary-700 to-primary-900 px-6 py-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/15">
            <CreditCard className="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="text-h2 font-heading font-semibold text-white focus:outline-none"
          >
            {heading}
          </h2>
          {companyName && <p className="mt-2 text-sm text-white/80">{companyName}</p>}
        </div>
      </div>

      <div className="pt-6 pb-2 text-center">
        <p className="text-body text-slate-600">{body}</p>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <Button
          onClick={() => router.push("/company/billing")}
          className="w-full justify-center"
          size="lg"
        >
          <CreditCard className="h-4 w-4" aria-hidden="true" />
          Choose a plan
        </Button>

        {entitlement.canExport && (
          <Button
            variant="secondary"
            onClick={() => router.push("/company/settings?export=1")}
            className="w-full justify-center"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Download my data
          </Button>
        )}

        <Button variant="ghost" onClick={handleLogout} className="w-full justify-center">
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Log out
        </Button>
      </div>

      <p className="mt-4 text-center text-xs text-slate-500">
        Your customer data stays exactly as it is. Nothing is deleted when a plan lapses.
      </p>
    </Modal>
  );
}
