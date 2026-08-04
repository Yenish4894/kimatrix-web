"use client";

/**
 * The blurred backdrop behind the paywall.
 *
 * **It deliberately does NOT render `children`.**
 *
 * Rendering the real page behind a blur is the obvious implementation and it is wrong:
 * every page's `useQuery` still mounts and fires, every one of those requests 403s
 * against the now-locked API, and the customer gets a wall of error toasts glowing
 * through the blur — while we simultaneously hammer the API with requests we know will
 * be refused. It also briefly paints real customer data before the modal covers it.
 *
 * So this is a request-free skeleton: the right *shape*, none of the data, no network
 * at all. `aria-hidden` keeps the whole thing out of the accessibility tree, since the
 * paywall in front of it is an `alertdialog` and the skeleton behind is decoration.
 */
export function LockedShell() {
  return (
    <div
      aria-hidden="true"
      className="min-h-dvh bg-slate-50 p-4 sm:p-6 lg:p-8 select-none pointer-events-none blur-[2px]"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 space-y-3">
          <div className="h-8 w-56 rounded-lg bg-slate-200" />
          <div className="h-4 w-80 rounded bg-slate-200/70" />
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="mb-4 h-4 w-24 rounded bg-slate-200/70" />
              <div className="h-8 w-20 rounded-lg bg-slate-200" />
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-6 h-5 w-40 rounded bg-slate-200" />
          <div className="space-y-4">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200/70" />
                <div className="h-4 flex-1 rounded bg-slate-200/70" />
                <div className="hidden h-4 w-24 rounded bg-slate-200/70 sm:block" />
                <div className="hidden h-4 w-16 rounded bg-slate-200/70 md:block" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
