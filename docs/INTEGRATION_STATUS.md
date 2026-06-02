# sena-temp Frontend — Integration Status & Audit

> Single source of truth for what's wired to the backend vs static/stubbed.
> Last audited: 2026-05-03.
> Build: clean (25 routes). TypeScript: clean. ESLint: clean after fixes.
>
> **Companion docs:**
> - `BACKEND_API_GUIDE.md` — exact request/response shapes for all live endpoints
> - `BACKEND_FLOWS.md` — user-journey context
> - `PENDING_BACKEND.md` — **every FE feature blocked by a missing BE endpoint** (update when BE ships)

Legend:
- ✅ **Integrated** — hits the real backend API
- 🟡 **Static** — hardcoded content (about pages, homepage marketing copy, etc.)
- ⚠ **Stub** — UI exists but backend endpoint not yet shipped; shows "coming soon"
- ❌ **Broken** — known bug or missing handler

---

## Route-by-route integration status

### Public routes

| Route | Type | Status | API Endpoints Used |
|-------|------|--------|-------------------|
| `/` | Marketing | 🟡 Static | None |
| `/terms` | Legal | 🟡 Static (placeholder copy) | None |
| `/privacy` | Legal | 🟡 Static (placeholder copy) | None |
| `/offline` | PWA fallback | 🟡 Static | None |
| `/not-found` | 404 | 🟡 Static | None |
| `/manifest.webmanifest` | PWA manifest | 🟡 Static (generated from `src/app/manifest.ts`) | None |

### Auth routes

> All auth routes now have a **guest guard** via `AuthLayout` — authenticated users are redirected to their dashboard instead of seeing the form.

| Route | Type | Status | API Endpoints |
|-------|------|--------|--------------|
| `/login` | Auth flow | ✅ Integrated | `POST /auth/login` |
| `/register` | Auth flow → **pending activation screen** | ✅ Integrated (BREAKING) | `POST /auth/register/company` — no tokens issued, user routed to pending screen with login link |
| `/forgot-password` | Auth flow | ✅ Integrated | `POST /auth/password-reset/request` |
| `/reset-password?token=` | Auth flow | ✅ Integrated | `POST /auth/password-reset/confirm` |

### QR submission (public)

| Route | Type | Status | API Endpoints |
|-------|------|--------|--------------|
| `/qr/[qrToken]` | Customer form | ✅ Integrated | `GET /qr/:token`, `POST /qr/:token/submit` |

### Company dashboard routes (auth required, `userType=company`)

| Route | Type | Status | API Endpoints |
|-------|------|--------|--------------|
| `/company/dashboard` | Overview | ✅ Integrated | `GET /company/profile`, `GET /company/stats`, `GET /company/purchases?limit=5` |
| `/company/customers` | List + search + sort + paginate + **CSV export** | ✅ Integrated | `GET /company/customers`, `GET /company/customers/export` |
| `/company/customers/[id]` | Detail + purchase history (paginated) | ✅ Integrated | `GET /company/customers/:id`, `GET /company/purchases?customerId=` |
| `/company/purchases` | List + filter + sort + paginate + **CSV export** | ✅ Integrated | `GET /company/purchases`, `GET /company/purchases/export` |
| `/company/purchases/[id]` | Detail + audit trail | ✅ Integrated | `GET /company/purchases/:id` |
| `/company/qr-code` | Display + **branded PDF poster (jsPDF)** | ✅ Integrated | `GET /company/profile` |
| `/company/settings` | **Editable profile + password change** | ✅ Integrated | `GET /company/profile`, `PUT /company/profile`, `POST /auth/password-change` |
| `/company/reports` | Client-side reports | ✅ **Top 10 monthly** + ✅ **All customers** — branded PDFs via jsPDF | `GET /company/purchases`, `GET /company/customers` |

### Admin dashboard routes (auth required, `userType=super_admin`)

| Route | Type | Status | API Endpoints |
|-------|------|--------|--------------|
| `/admin/dashboard` | Platform stats (8 metrics) | ✅ Integrated | `GET /admin/stats` |
| `/admin/companies` | List + filters + **3-state status (Pending/Active/Deactivated)** + activate/deactivate | ✅ Integrated | `GET /admin/companies`, `PATCH .../activate`, `PATCH .../deactivate` |
| `/admin/companies/[id]` | Detail + owner info + 3-state badge + toggle | ✅ Integrated | `GET /admin/companies/:id`, `PATCH .../activate`, `PATCH .../deactivate` |
| `/admin/settings` | Account info + **password change** | ✅ Integrated | `POST /auth/password-change` |
| `/admin/visitors` | Visitor analytics | ⚠ **Stub** — shows "coming soon" | None (BE endpoint pending) |
| `/admin/email` | Bulk email composer | ⚠ **Stub** — shows "coming soon" | None (BullMQ email worker pending) |

---

## Feature-by-feature breakdown

### Authentication & Route Guards

| Feature | Status | Notes |
|---------|--------|-------|
| Email/username login (`identifier`) | ✅ | BE detects by `@` |
| Single "Invalid credentials" error | ✅ | Anti-enumeration |
| 429 countdown UI | ✅ | Honors `Retry-After` header |
| Refresh token rotation | ✅ | Automatic via axios interceptor |
| Theft detection → hard logout | ✅ | Custom `kimates:session-invalidated` event |
| Concurrent 401 queueing | ✅ | Single refresh, all queued requests retry |
| Session restoration on reload | ✅ | `loadSession` thunk reads localStorage |
| Logout → BE + clear storage | ✅ | `POST /auth/logout` + `TokenStorage.clear()` |
| Password reset email delivery | ⚠ | BE not shipped — dev-only via server logs |
| Auth guard (`/company/*`, `/admin/*`) | ✅ | `DashboardShell` — unauthenticated → `/login`; wrong role → correct dashboard |
| Guest guard (`/login`, `/register`, `/forgot-password`, `/reset-password`) | ✅ | `AuthLayout` — authenticated users redirected to their dashboard |
| 409 field-level errors on register | ✅ | Fixed: `rejectWithValue` preserves Axios response through Redux thunk |
| 401 login error handling | ✅ | Fixed: axios interceptor skips refresh for all `/auth/*` public endpoints |

### Company flows

| Feature | Status | Notes |
|---------|--------|-------|
| Register company (multi-field) | ✅ | E.164 phone validation, 409 field-level errors |
| HIBP breach inline error | ✅ | Parsed from BE message |
| View dashboard stats | ✅ | Cached 60s via React Query |
| QR code render | ✅ | Client-side SVG from `profile.qrUrl` |
| QR download as PDF | 🟡 | Uses `window.print()` + browser "Save as PDF" |
| Customer list: debounced search | ✅ | 300ms debounce via `use-debounce` |
| Customer list: sort by aggregate | ✅ | `totalInvoiceAmount`, `submissionCount`, `firstSubmissionAt`, `lastSubmissionAt` |
| Customer detail + purchase history | ✅ | Paginated (20/page) — was hard-capped at 100 |
| Purchase list: search + date range + sort | ✅ | Date range picker redesigned with Calendar icons |
| Purchase detail: audit trail | ✅ | IP, UA, geolocation shown |
| Top 10 customers monthly report | ✅ | Client-side: aggregates purchases by month; print via `window.open()` |
| All customers report | ✅ | Client-side: fetches all customers sorted by total spend; print via `window.open()` |

### Admin flows

| Feature | Status | Notes |
|---------|--------|-------|
| Platform stats (8 metrics) | ✅ | Fuel/shop split, customers, purchases, spend |
| Companies list + filters | ✅ | `status`, `businessType`, debounced search |
| Company detail | ✅ | Owner info, timestamps, status badges |
| Activate/deactivate company | ✅ | Optimistic cache invalidation via React Query mutation |
| Company action dropdown | ✅ | Fixed: was clipped by `overflow-hidden` on table wrapper |
| Bulk email | ⚠ **Stub** | BE pending |
| Visitor analytics | ⚠ **Stub** | BE pending |
| Admin settings | 🟡 Static | Shows username/email from store; password change stubbed honestly |

### Customer (QR scan) flow

| Feature | Status | Notes |
|---------|--------|-------|
| Resolve QR token → company info | ✅ | `GET /qr/:token` |
| Business type auto-detects form fields | ✅ | Fuel: vehicle required; Shop: no vehicle |
| Mobile (E.164) validation | ✅ | `+[1-9]\d{1,14}` client + server |
| Vehicle auto-uppercase | ✅ | Matches BE normalization |
| Invoice amount: positive, 2 decimals, ≤10M | ✅ | BE `MAX_INVOICE_AMOUNT` |
| Optional geolocation | ✅ | `navigator.geolocation` with 10s timeout |
| 409 "already submitted" clear UI | ✅ | Shows "This receipt has already been recorded" |
| 429 rate limit countdown | ✅ | 10/min + 50/day per mobile |
| Success: shows customer total + submission count | ✅ | From response |

### Security

| Control | Status | Notes |
|---------|--------|-------|
| No `dangerouslySetInnerHTML` | ✅ | Grep-verified |
| No `innerHTML`, `eval`, `Function()` | ✅ | Grep-verified |
| No `document.cookie` reads | ✅ | All token storage via `TokenStorage` wrapper |
| `target="_blank"` has `rel="noopener noreferrer"` | ✅ | Fixed in audit |
| No unchecked `any` casts | ✅ | Grep-verified |
| No `console.log` leaks | ✅ | Grep-verified |
| Tokens in localStorage | ✅ | Accepted tradeoff — BE uses Bearer not cookies |
| HTTPS-only in production | ✅ | Next.js default |
| Refresh rotation + theft detection | ✅ | Interceptor logic |
| No client-side validation as sole layer | ✅ | All fields re-validated server-side |
| Minimum password strength | ✅ | 8+, upper, lower, digit + HIBP |
| Axios interceptor skips refresh on auth endpoints | ✅ | Fixed: `/auth/login`, `/auth/register`, `/auth/password-reset/*` pass through directly |

### PWA

| Piece | Status |
|-------|--------|
| `manifest.webmanifest` via `app/manifest.ts` | ✅ |
| Service worker (`public/sw.js`) | ✅ Registered in production only |
| Install prompt (beforeinstallprompt) | ✅ 7-day dismiss cooldown |
| Offline fallback page | ✅ `/offline` |
| Icons (SVG scalable) | ✅ regular + maskable + apple-touch |

---

## Known caveats / non-issues

1. **Report PDFs use `window.open()` + `window.print()`** — opens a clean standalone branded window. Browser "Save as PDF" produces the file. Server-side PDF generation is a BE deferred item.
2. **Tokens in localStorage** — acceptable per backend design (no cookie-based auth). XSS surface is minimized (no `dangerouslySetInnerHTML`, strict CSP is a future improvement).
3. **`FormEvent` deprecation lint hint** — false positive. React 19 did NOT deprecate `FormEvent`. SonarLint is wrong. Safe to ignore.
4. **SonarLint "prefer globalThis over window"** — false positive. `window` is correct in browser contexts in Next.js.
5. **`/company/settings` shows read-only data** — no BE endpoint for company profile edits yet.
6. **Notification bell is disabled** — decorative red dot removed; bell is muted with `cursor-not-allowed` until BE notifications feed ships.
7. **All-customers report uses all-time `totalInvoiceAmount`** — the customer endpoint returns all-time aggregates, not per-period. Monthly breakdown for all customers requires BE aggregation endpoint.

---

## Known missing BE endpoints (tracked for future integration)

Full authoritative list with acceptance criteria, workarounds, and priorities:
**→ see [`PENDING_BACKEND.md`](./PENDING_BACKEND.md)**

Quick summary:

| Endpoint | Blocks | Priority |
|----------|--------|----------|
| `POST /api/company/qr/download-pdf` | branded QR poster | P1 |
| `POST /api/admin/email/bulk` | `/admin/email` | P1 |
| `GET /api/admin/visitors/stats` | `/admin/visitors` | P1 |
| Password reset email delivery | production `/forgot-password` | P1 |
| `PUT /api/company/profile` | company settings edit | P1 |
| `POST /api/auth/password-change` | in-app password change (company) | P1 |
| `POST /api/admin/password-change` | admin settings password change | P2 |
| `GET /api/company/customers/export` | CSV/Excel export | P2 |
| Notifications feed (2 endpoints) | header bell icon | P2 |

---

## Issues fixed (2026-04-14 audit)

| Issue | Severity | Fix |
|-------|----------|-----|
| `setState` anti-pattern in DashboardShell useEffect | P1 | Simplified effect |
| `target="_blank"` without `rel="noopener noreferrer"` | P1 security | Added rel attribute |
| `/terms` and `/privacy` routes missing | P1 | Created placeholder pages |
| Non-functional "Export PDF" buttons | P1 UX | Removed until BE ships |
| QR page "Download PDF" had no handler | P1 UX | Wired to `window.print()` |

## Issues fixed (2026-04-22 session)

| Issue | Severity | Fix |
|-------|----------|-----|
| 409 RESOURCE_CONFLICT errors swallowed on register | P1 | `rejectWithValue` in `registerCompany` + `login` thunks preserves Axios response |
| 401 login error showed "Unable to reach server" | P1 | Axios interceptor now skips refresh for all `/auth/*` public endpoints |
| Company action dropdown clipped (not visible on click) | P1 UX | Removed `overflow-hidden` from table wrapper; moved to `<thead>` |
| Customer detail purchase history hard-capped at 100 | P1 | Replaced `limit:100` with proper pagination (20/page + Pagination component) |
| Auth pages accessible while logged in | P1 security | `AuthLayout` now restores session + redirects authenticated users to their dashboard |
| Admin settings had live-looking fake password form | P1 UX | Replaced with honest stub — read-only account info + disabled "coming soon" button |
| Notification bell had permanent fake red dot | P2 UX | Removed red dot; bell is disabled/muted until notifications feed ships |
| `/company/reports` showed only "Coming Soon" | P2 | Built two client-side reports: Top 10 monthly + All customers; both printable |
| Date picker in purchases page looked like plain text | P2 UX | Redesigned as unified date-range pill with Calendar icons |

## QR resubmit cooldown — countdown UX (2026-05-08)

BE shipped a **15-minute resubmit cooldown per `(company, mobile)`** on QR submissions (vehicle-agnostic). Returns `429` with a polished message including remaining minutes.

**FE handling:**
- Existing 429 path already shows the BE message verbatim and reads `Retry-After` into the countdown.
- Countdown UX previously showed `"Try again in 900s"` ticking down to `899s`, etc. — fine for 60-second login throttling, awful for 15 minutes.
- Added `formatCountdown(seconds)` in `src/app/qr/[qrToken]/page.tsx`:
  - `< 60s` → `"45s"`
  - `1–2 minutes` → `"1m 30s"` (second-precision useful here)
  - `≥ 3 minutes` → `"14m"` (drops seconds — visual noise at that scale)
- Tick rate stays at 1s for accuracy.

The user still gets the polished BE message in the inline error banner — the button label is just the ambient state indicator.

---

## BE quality-of-life updates (2026-05-08, doc-only sync)

Three improvements landed on the BE — no FE code changes needed, just doc sync + tracking update:

| BE update | FE impact |
|---|---|
| **Password reset emails actually delivered** (BullMQ + nodemailer SMTP, branded HTML template) | Zero — same generic 200, same URL format. `/forgot-password` flow now works end-to-end without the dev-log workaround. **Removes a P1 from `PENDING_BACKEND.md`.** |
| **Friendly 409 conflict messages** (no more Postgres detail leaks) | Zero — we already render `details[].message` inline; users automatically see nicer copy. |
| **Redis-backed rate limiters** | Zero — same headers, same 429 body. |

`BACKEND_API_GUIDE.md` and `BACKEND_FLOWS.md` synced from BE source. Pending BE endpoint count: **3** (down from 4) — only Aggregated reports endpoint, Bulk email (admin), and Visitor analytics remain. Notifications feed still tracked as P2.

---

## Production-readiness pass (2026-05-08)

Full audit ([`PRODUCTION_AUDIT_2026-05-08.md`](PRODUCTION_AUDIT_2026-05-08.md)) executed. Both P0s + 12 of 19 P1s fixed in same session.

**User-requested + P0:**
- Removed "Submit Another Purchase" button from QR submission success
- Hidden Export CSV buttons on `/company/customers` + `/company/purchases` (PDF reports remain as the only export path)
- Added `@KIMates` attribution to every PDF (footer on report PDFs, centred bottom on QR poster)
- Fixed wrong currency `(ZAR)` → `(₣)` on QR submission page (most-seen surface)
- Fixed dashboard QR fgColor `#3730A3` (old indigo) → `#0F766E` (brand teal)

**New infrastructure:**
- `src/components/ui/query-error-state.tsx` — reusable error UI for failed list queries (retry + parsed message + requestId). Wired into 4 list pages.
- `src/app/error.tsx` + `src/app/global-error.tsx` + `src/app/loading.tsx` — branded route-level fallbacks for unhandled errors and route transitions.
- `src/lib/env.ts` — validates `NEXT_PUBLIC_API_BASE_URL` at import time; fails fast in production if missing or malformed. `api.ts` now imports from `env` instead of `process.env`.
- `next.config.ts` — strict CSP + `X-Frame-Options DENY` + `Referrer-Policy` + `Permissions-Policy`.

**Existing components hardened:**
- `Modal` — proper focus trap (Tab/Shift+Tab cycles within dialog), restores focus on close, focuses first focusable on open. Overlay is now a `<button>` with `aria-label` instead of `<div onClick>`.
- `DashboardShell` — added skip-to-content link (sr-only until focused) + `<main id="main-content" tabIndex={-1}>` landmark. Mobile menu overlay is also now a button with aria-label.
- Icon-only buttons across list pages — proper `aria-label`s referencing the row's identifying field (customer name, invoice number, company name).
- Anchor-wrapping-button antipattern removed across list pages.
- Submit handlers (register, login, settings) — defensive `if (isLoading) return` guards.

**Performance:**
- `jspdf` + `jspdf-autotable` lazy-loaded via dynamic `import()` on PDF download click. ~200KB cut from initial bundles of `/company/reports` and `/company/qr-code`.

**Deferred (documented as backlog in PRODUCTION_AUDIT):**
- Sentry wire-up (needs DSN/account)
- i18n migration (needs product decision on French timeline)
- Skeleton loaders (existing spinners functional)
- Inline mutation confirmation indicators
- Logout confirmation modal

---

## Country-aware phone validation (2026-05-08)

Phone fields (contactPhone + whatsappNumber on `/register` and `/company/settings`) now use **`libphonenumber-js`** (~16M weekly downloads, ~80KB gzipped — used by Stripe, Twilio, Auth0) to validate against the **selected country's actual rules** — not just E.164 shape.

| What | Where |
|---|---|
| Dependency | `libphonenumber-js` |
| New component | `<PhoneInput>` in [`src/components/ui/phone-input.tsx`](src/components/ui/phone-input.tsx) |
| New helper | `validatePhoneForCountry(phone, country, opts)` — returns null if valid, an error string otherwise |

**Behaviour:**
- **Locked country prefix** — left of the input shows `+227` (or whatever the country dial code is), non-editable. User types only local digits. Stored value is the full E.164 string (`+22798765432`) so submit shape unchanged.
- **Country-specific validation** — selecting India means the field rejects anything that isn't a valid 10-digit Indian mobile starting with 6/7/8/9. Niger expects 8 digits. France expects 9 digits starting with 6 or 7. All handled automatically by libphonenumber-js's per-country rules.
- **Cascading reset** — when the user changes Country, both phone fields are cleared (the locked prefix changes, so old digits are no longer in the right country). Same as State + City reset on Country change.
- **Two-stage validation** — Joi enforces presence + E.164 shape on submit (fast, no library needed); then `validatePhoneForCountry()` runs per-country rules via libphonenumber-js. Errors merge into the form's `errors` dict and render inline.
- **WhatsApp** is locked to the selected country too (per product decision — diaspora edge case acknowledged but acceptable for MVP). It remains optional; only validated if user enters a value.

**Used at:**
- `/register` — contactPhone (required) + whatsappNumber (optional)
- `/company/settings` — same two fields, partial-update aware (diff still works field-by-field)

QR customer mobile (`/qr/[qrToken]`) is intentionally left as the existing E.164 regex — customers may be roaming and we can't assume their country.

---

## Structured address integration (2026-05-03)

BE replaced the single `address` text column with 5 structured fields. FE wired through end-to-end:

| Layer | Change |
|---|---|
| Dependency | Installed `country-state-city` (~1.7M weekly downloads, MIT, offline-bundled hierarchical data — countries → states/regions) |
| Types | `Company` extends new `CompanyAddress` interface (`streetAddress`, `city`, `state`, `country`, `postalCode`). `RegistrationFormData` and `UpdateCompanyProfilePayload` swapped to the 5-field shape. Legacy `address` removed everywhere. |
| Reusable UI | `src/components/ui/country-state-select.tsx` exports `<CountrySelect>` (250 countries with flag emoji) + `<StateSelect>` (filtered by selected country, gracefully disabled until a country is picked or for countries with no states) + `getCountryCode()` / `getStatesForCountryName()` helpers |
| Display util | `formatAddress()` in `src/lib/utils.ts` joins the 5 fields with commas, skipping blanks. Single source for read-only address rendering. |
| `/register` | Address Joi rules + initial state + form swapped to 5 fields. Country defaults to `Niger`. Changing country resets state (old value would be invalid). |
| `/company/settings` | Same swap. Diff function compares all 5 fields independently for partial updates. |
| `/company/qr-code` | Address line under company name now uses `formatAddress(company)` |
| `/admin/companies/[id]` | "Address" detail row uses `formatAddress(company)` |
| QR PDF poster (`src/lib/pdf/qr-poster.ts`) | Embedded address now formatted via `formatAddress(company)` and wrapped to fit |

**Validation rules (mirrored from BE):**
- `streetAddress`: 3-512 chars, required
- `city`: 2-128 chars, required
- `state`: 2-128 chars, required
- `country`: 2-128 chars, required (full country name, e.g. "Niger" — not ISO code)
- `postalCode`: 1-32 chars, optional (allows blank/null — Niger doesn't use them)

**UX choices:**
- Country defaults to "Niger" on registration — saves a click for 99% of users; can still pick another from the dropdown
- State/Region select is disabled with a helpful message until a country is picked
- City uses the new `<CityInput>` component — **renders as a dropdown when the (country, state) combo has city data in the package, falls back to text input otherwise**. For Niger and most West African states the package's city data is sparse, so users get a free-text field; for major US/EU states they get a dropdown. Same component, automatic switch.
- Cascading reset on parent change: changing Country clears State + City; changing State clears City. Avoids stale values that would no longer be in the dropdown options.
- Postal Code marked "Optional" with helper text — doesn't block submit if empty

---

## Pagination contract sync (2026-05-03, doc-only)

BE refreshed `FRONTEND_API_GUIDE.md` + `FRONTEND_FLOWS.md` with an explicit **Pagination contract** section codifying which endpoints paginate vs which don't. No new endpoints, no behaviour change — purely a clarification.

| Endpoint class | Pagination | FE status |
|---|---|---|
| In-app lists (`/admin/companies`, `/company/customers`, `/company/purchases`) | ALWAYS paginated, default `page=1 limit=10`, max `limit=100` | ✅ all three use `PAGE_SIZE=20` |
| Customer detail purchase history | paginated (same query, with `customerId` filter) | ✅ `PAGE_SIZE=20` |
| Bulk-export (`/customers/export`, `/purchases/export`) | INTENTIONALLY NOT paginated — single-shot full download | ✅ `responseType: blob` |
| Single-record (`/profile`, `/stats`, `/:id`) | n/a | ✅ |

Synced both guides into `frontend/docs/`. No code changes needed — FE was already aligned.

---

## Tie-aware Top 10 + activity-based tiebreaker (2026-05-03, follow-up)

Two related bugs in `/company/reports`:

**Bug 1 — Tie cutoff dropped customers.** Old code used `rows.slice(0, 10)` which arbitrarily kept the 9th and 10th customers when (say) four were tied at ₣150. Fixed via `topNWithTies(rows, 10)` — keeps everyone whose `totalSpend` is ≥ the 10th-place value. Output may exceed 10 rows when ties exist; preview heading shows `(N shown — includes X tied at the cutoff)` so the user understands.

**Bug 2 — No tiebreaker.** When totals were equal, ordering was insertion-order (BE doesn't guarantee anything either). Added a `compareRows` helper: primary `totalSpend DESC`, secondary `lastActivity DESC` (most recently active customer wins).

> ⚠ **This is a FE workaround.** Long-term, aggregated reports belong on the backend — fetching every purchase for a period just to compute top 10 client-side is wasteful for busy companies. Tracked in `PENDING_BACKEND.md` → "Aggregated reports endpoint". When BE ships `/api/company/reports/top-customers?from=&to=&limit=10`, we'll swap the client-side aggregation for a single API call but keep the same tie-aware semantics.

**Changes:**
- `CustomerRow` (page) and `ReportRow` (PDF lib) now carry `lastActivity: string` (ISO timestamp)
- `buildTop10()` tracks the latest `submittedAt` per customer during aggregation
- `handleGenerateAll()` re-sorts client-side with `compareRows` after fetching all pages (BE pagination doesn't preserve tie order)
- `generateTop10Pdf()` no longer slices internally; trusts the page-supplied list
- `lastActivity` is kept on `CustomerRow`/`ReportRow` as a non-displayed sort key only. The column was *not* added to the UI — sorting is enough.

---

## Currency formatting fix (2026-05-03, follow-up)

`formatCurrency()` was incorrectly using `en-ZA` locale (South African English) — that locale uses **comma as decimal separator** and space as thousands separator, e.g. `120.30` rendered as `R 120,30`. Plus the `R` prefix was Rand (wrong currency). Niger uses **CFA Franc (XOF)**.

Fixed in `src/lib/utils.ts`:
- Locale → `en-US` (period decimal, comma thousands)
- Symbol → `₣` (West African CFA Franc — matches design spec)
- Always show 2 decimals (`minimumFractionDigits: 2`) — looks more financial-grade

Now `120.30` renders as `₣ 120.30`, `1234567.50` as `₣ 1,234,567.50`. Affects every list, detail, stat card, report PDF, and dashboard view.

---

## Real branded PDFs via jsPDF (2026-05-03, follow-up)

Replaced all `window.print()` browser-PDF tricks with real PDF generation via **`jsPDF` + `jspdf-autotable`** (~200KB gzipped, ~28M weekly downloads combined). All PDFs now have a consistent KIMates header (wordmark + generated date), divider, content, table styling, page numbers, and footer.

| PDF | Generator | Page | Output |
|---|---|---|---|
| QR poster | `generateQrPosterPdf(company, canvas)` | `/company/qr-code` | `kimates-qr-{company}.pdf` — A4 portrait, brand-bordered, large centred QR with tinted frame, company name + business type + address, "How to use" footer |
| Top 10 monthly | `generateTop10Pdf(rows, monthLabel, company)` | `/company/reports` | `kimates-top10-{month-year}.pdf` — branded header, ranked autoTable with 1st/2nd/3rd podium tint, summary line |
| All customers | `generateAllCustomersPdf(rows, company)` | `/company/reports` | `kimates-all-customers-{date}.pdf` — same branded header, full sorted list, summary line |

**Architecture:**
- `src/lib/pdf/branding.ts` — shared `BRAND` color tokens (matching `globals.css`), `drawHeader()`, `drawFooterOnAllPages()`, `savePdf()`. Single source of brand styling.
- `src/lib/pdf/qr-poster.ts` — poster generator. Takes the live `<canvas>` from `QRCodeCanvas`, calls `canvas.toDataURL("image/png")`, embeds via `doc.addImage()`. QR rendered at 660×660 internally (CSS scales it to 220 on-screen) so the embedded PDF image is crisp.
- `src/lib/pdf/customer-reports.ts` — `generateTop10Pdf` + `generateAllCustomersPdf` share the same `buildReport()` core; ranked flag toggles podium markers and tinted top-3 rows.

**QR rendering change:** `/company/qr-code` switched from `<QRCodeSVG>` to `<QRCodeCanvas>` so the canvas is grabbable via ref. Visual on-screen render is identical.

---

## Login 403 account-state handling (2026-05-03, follow-up)

BE login now returns **403 with polished user copy** when password is correct but the company is in a non-loggable state. Two cases — both rendered as a **persistent banner** above the login form (not a transient toast), since the user needs to understand why they can't log in.

| Trigger | BE message (verbatim) | Banner |
|---|---|---|
| `403` "awaiting activation" — Pending company | *"Your account is awaiting activation. You'll be able to log in once your payment is verified."* | Yellow/warning, `Clock` icon, "Account awaiting activation" heading |
| `403` "deactivated" — Admin-disabled company | *"Your account has been deactivated. Please contact support."* | Red/error, `ShieldOff` icon, "Account deactivated" heading |

The banner clears when the user types in either input or successfully submits. 401 (Invalid credentials) and 429 (rate limit) keep their existing toast-based UX since those are transient/recoverable failures.

Why a banner not a toast: 403 is a *state* the user needs to remember and act on (contact support / wait for activation), not a transient error.

---

## BE Phase 5 integration (2026-05-03 session)

Backend shipped Phase 5: pending-activation registration flow + 4 new endpoints. All wired.

| Change | Files |
|---|---|
| **Registration → pending state** (BREAKING) — no tokens issued; user shown a "pending activation" screen with explanation + Go-to-Login button | `src/services/auth.service.ts`, `src/store/slices/authSlice.ts`, `src/app/register/page.tsx` |
| **Editable company profile** — `PUT /company/profile` partial update; form computes diff vs. server state, only sends changed fields | `src/services/company.service.ts`, `src/app/company/settings/page.tsx`, `src/types/index.ts` (`UpdateCompanyProfilePayload`) |
| **In-app password change** — reusable `PasswordChangeCard` used by both `/company/settings` and `/admin/settings`; on success clears tokens + Redux + redirects to `/login` (BE revokes all refresh tokens) | `src/components/settings/password-change-card.tsx`, `src/services/auth.service.ts` (`changePassword`), `src/app/company/settings/page.tsx`, `src/app/admin/settings/page.tsx` |
| **CSV exports** — Export buttons on `/company/customers` and `/company/purchases`; uses `responseType: blob` + `downloadBlob` helper to trigger browser download | `src/services/company.service.ts` (`exportCustomers`, `exportPurchases`), `src/lib/download.ts`, list pages |
| **Three-state company status** — `getCompanyStatus()` derives Pending / Active / Deactivated from `isActive + deactivatedAt`. Badge + action button branch on this; Pending and Deactivated companies both get an "Activate" button. | `src/lib/company-status.ts`, `src/app/admin/companies/page.tsx`, `src/app/admin/companies/[id]/page.tsx` |

**Notes:**
- Status filter dropdown remains `all/active/inactive` (BE supports only those). Per-row badges differentiate Pending vs Deactivated visually.
- `Company` type already had `deactivatedAt` from earlier — no type changes needed for status derivation.
- Admin password change is now real (was stubbed). Same endpoint serves both roles.

## Visual design overhaul (2026-04-23 session)

| Change | Component / file | Notes |
|---|---|---|
| Theme corrected to teal + orange (per spec) | `src/app/globals.css` | Was indigo + amber. Teal `#0D9488` primary, Orange `#F97316` accent. All semantic colors realigned. |
| Refined focus ring with rounded corners | `globals.css` | Primary-color outline, 2px offset, 4px radius |
| Skeleton shimmer animation added | `globals.css` | `.shimmer` class with linear gradient + keyframes — replaces cheap pulse |
| Auth layout — premium gradient hero | `auth-layout.tsx` | Diagonal `primary-700→primary-900` base, ambient teal + accent glow orbs, subtle grid texture, glassmorphic feature cards (`bg-white/10 backdrop-blur-sm border border-white/20`) |
| Auth right panel — top accent stripe (mobile only) | `auth-layout.tsx` | `primary-600 → primary-500 → accent-500` gradient bar |
| Button — tactile gradient + shadow | `button.tsx` | All variants now use `bg-gradient-to-b` with brand-tinted shadows. `active:scale-[0.98]` for press feedback. Hover lifts shadow and depth. |
| StatCard — premium dashboard cards | `stat-card.tsx` | Gradient orb icons (primary/accent/success variants), ambient blur glow background, hover lift + scale. Trend pills now use `success-50` / `error-50` backgrounds with `TrendingUp`/`TrendingDown` icons. |
| Card — softer border + larger radius | `card.tsx` | `border-slate-200/80`, `rounded-xl`, refined shadow |
| Modal — backdrop blur + premium shadow | `modal.tsx` | `backdrop-blur-sm` on overlay, `rounded-2xl` content with layered shadow (`0_24px_48px` drop + `0_0_0_1px` ring) |
| Sidebar — active item with accent bar + gradient | `sidebar.tsx` | Left-edge gradient bar on active route, `bg-gradient-to-r` background tint, smoother hover transitions |

**Design principles applied:**
- Strategic gradients only at hero moments (auth, primary CTAs, stat orbs); tables/forms/lists stay clean
- Depth through layered shadows + subtle ring borders, not heavy drop shadows
- Press feedback via `active:scale-[0.98]` for tactile feel on all primary actions
- Backdrop blur on modal overlay for modern glassmorphism without overdoing it
- Brand-tinted shadows (teal glow on primary buttons, orange glow on accent) reinforce brand presence subtly

---

## Audit verification (2026-04-22)

- ✅ `npx tsc --noEmit` → no errors
- ✅ All pages have `isLoading` / empty states / error states handled
- ✅ Auth guard covers all `/company/*` and `/admin/*` routes via `DashboardShell`
- ✅ Guest guard covers all auth pages via `AuthLayout`
- ✅ All table pages are paginated (no hard-capped `limit` without pagination UI)

Update this document every time a BE endpoint ships or a new feature is wired.
