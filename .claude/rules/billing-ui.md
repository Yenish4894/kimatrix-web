# Billing, access and retention UI

Files: `src/app/company/billing/page.tsx` (+ `success`, `cancel`), `src/app/company/payments/page.tsx`, `src/components/billing/`, `src/components/subscription/`, `src/hooks/useEntitlement.ts`, `src/lib/entitlement.ts`, `src/lib/billing.ts`, `src/lib/payments.ts`, `src/lib/retention.ts`.

## Access model as the UI sees it

`useEntitlement()` turns the company profile into `{ state, endsAt, hasAccess, source }` with `toEntitlement()`. States: pending, trialing, active (paid or comp), expired, trial expired, banned. The frontend never decides access; it reads what the server computed.

- `decideGate(entitlement, pathname)` picks between the page, the paywall and a redirect. Billing, payments, export and settings stay reachable after access lapses (`isLapsedReachableRoute`).
- Countdown banners (`countdownBannerKind`, `countdownCopy`) show for trials and paid plans. The word is "trial", never "free trial".

## Billing page

- Plans come from `paymentService.getPlans()`: every active plan in admin order, the `isPopular` badge, name and description from the plan.
- One-time purchase: `paymentService.initiatePayment(planId)` → PayPal approval URL → `/company/billing/success?token=` captures → invalidate `["company"]`.
- Auto-renew UI exists (`src/components/subscription/`) but is **hidden since 2026-09-27**; do not resurface it.
- Spin add-on card: shown when `draws.canBuySpins === true` and the price is loaded; anchored at `#buy-spins` so the lucky-draw page can link to it. Quantity 1 to 100.
- Cancel/return pages explain what happened and link back; a failed capture shows `actionErrorMessage` with the request id.

## Payments page

Payment history with status (Paid, Refunded, Pending) and an invoice PDF download per paid row (`src/lib/download.ts`). Amounts are USD.

## Retention copy

`src/lib/retention.ts`: `DATA_RETENTION_DAYS = 7`, `ACCOUNT_DELETION_GRACE_DAYS = 7`. Billing, the paywall and the delete-account dialog read these constants so the wording stays in step with the backend's `config/retention.ts`.

## Service status (admin)

`src/lib/system-status.ts` maps the backend's status payload to the dashboard panel: SMTP (hourly canary), PayPal, database, Redis, queue. A red banner appears on admin pages when SMTP is down.
