# Pages and routes

`src/app/`. Layouts: `layout.tsx` (root, providers), `admin/layout.tsx` and `company/layout.tsx` (both wrap `DashboardShell` with `requiredRole`). `middleware.ts` redirects `/admin/*` and `/company/*` to `/login?next=...` when the `kimates.session` role cookie is missing or wrong.

## Public

| Route | Page |
|---|---|
| `/` | Landing: features, every active plan in admin order with the `isPopular` badge, FAQ, "Get started" CTAs. Prices come from `paymentService.getPlans()` |
| `/register` | Company signup: company, address (country → state → city), contacts with dialling codes, login details, consents, honeypot, Turnstile. Neutral success screen ("check your email") whether or not the email was taken |
| `/login` | Email or username + password; honours `?next=` (`src/lib/return-url.ts`) |
| `/verify-email`, `/forgot-password`, `/reset-password`, `/confirm-email-change` | Token landing pages |
| `/qr/[qrToken]` | Customer purchase form, mobile first, no login. Fuel station: mobile, name, vehicle reg (no spaces), invoice no, amount. Shop: same without vehicle. Distinct screens for paused, inactive and invalid QR. Uses `publicApi` so a stale company session never redirects the customer |
| `/terms`, `/privacy`, `/offline` | Static |

## Company portal (`/company/*`, role `company`)

| Route | Page |
|---|---|
| `dashboard` | Stats, plan status and countdown banner, QR card, recent purchases |
| `qr-code` | View, download poster PDF (`src/lib/pdf/`), pause/resume with confirm, regenerate with warning |
| `customers`, `customers/[id]` | Searchable table; detail with the customer's purchases |
| `purchases`, `purchases/[id]` | Search, date filter, void with reason (`src/lib/void.ts`) |
| `reports` | Top 10, all customers, transactions, monthly; PDF and CSV |
| `lucky-draw` | Wheel, Draw mode, spins left, Buy more spins. See `lucky-draw-ui.md` |
| `billing`, `billing/success`, `billing/cancel` | Plans, PayPal checkout return pages, spin add-on card. See `billing-ui.md` |
| `payments` | Payment history with invoice PDF download |
| `export` | CSV/PDF exports; reachable after access lapses |
| `settings` | Profile, change password, change login email, delete account (7-day grace) |

Lapsed access shows the paywall over everything except billing, payments, export and settings (`decideGate`).

## Admin panel (`/admin/*`, role `super_admin`)

| Route | Page |
|---|---|
| `dashboard` | Platform stats, total spend per currency, visitors, Service status panel with a red banner when SMTP is down |
| `companies`, `companies/[id]` | List with filters; detail with ban/unban (reason required), comp access and spins, trial extend, release trial identifiers, resend invite, delete; read-only customers, purchases and draws tabs |
| `plans` | Versioned plans, Most Popular, hide/show with confirm, trial length |
| `lucky-draw` | Spin price (USD) and trial spins |
| `payments` | All payments, filters, invoice download |
| `email` | Bulk email: company picker, extra addresses box (`src/lib/bulkEmailAddresses.ts`), optional attachment, confirm with recipient count, sent log |
| `audit-log` | Global and per-company audit viewer |
| `settings` | Admin password |

## Adding a route

Use the `new-page` skill. Every new protected page lives under the right layout, uses a service function, and gets a query key under its area.
