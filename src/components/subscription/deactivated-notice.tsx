"use client";

import { useRouter } from "next/navigation";
import { Download, LogOut, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui";
import { useAppDispatch } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";

/**
 * Shown instead of the paywall when an admin has deactivated the account.
 *
 * **No subscribe call to action, deliberately.** Offering "choose a plan" to someone we
 * have just banned would take their money and change nothing about their access — the
 * entitlement check blocks `deactivated` ahead of every paid state. Support is the only
 * route back.
 *
 * No export button either: `canExport` is false in exactly this one state, so the
 * button would 403. The copy says where the data still is rather than dangling a
 * download that cannot work.
 */
export function DeactivatedNotice({ companyName }: Readonly<{ companyName?: string }>) {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const handleLogout = async (): Promise<void> => {
    await dispatch(logout());
    router.push("/login");
  };

  return (
    <div className="min-h-dvh bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-error-50">
          <ShieldAlert className="h-6 w-6 text-error-600" aria-hidden="true" />
        </div>

        <h1 className="text-h2 font-heading font-semibold text-slate-800">
          This account has been deactivated
        </h1>

        {companyName && <p className="mt-2 text-sm text-slate-500">{companyName}</p>}

        <p className="mt-4 text-body text-slate-600">
          Your dashboard and QR code are switched off. Your data has not been deleted — our
          support team can restore access or send you a copy.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              window.location.href = "mailto:support@kimates.com";
            }}
            className="w-full justify-center"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Contact support
          </Button>
          <Button variant="ghost" onClick={handleLogout} className="w-full justify-center">
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Log out
          </Button>
        </div>
      </div>
    </div>
  );
}
