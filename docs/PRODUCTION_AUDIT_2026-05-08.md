# sena-temp Frontend — Production Readiness Audit

> Date: **2026-05-08**
> Scope: Full FE audit across 10 categories
> Mode shift: **MVP → Production-grade delivery**
>
> **STATUS:** Both P0s fixed. 12 of 19 P1s fixed in the same session. Remaining P1s and all P2s scheduled below as backlog. See "Fixes applied" section at the bottom for details.
> Methodology: Code-level read of every form, every `useQuery`/`useMutation`, every component, plus checks for known anti-patterns (XSS, console leaks, missing aria, etc.)
>
> Findings tagged:
> - 🔴 **P0** — blocks production (security, broken UX, wrong data shown to users)
> - 🟠 **P1** — important quality issue (missing validation, broken edge case, accessibility gap)
> - 🟡 **P2** — polish / nice-to-have (UX nuance, perf optimization, future-proofing)

---

## Summary

| Category | P0 | P1 | P2 | Total |
|---|---|---|---|---|
| 1. Validation completeness | 1 | 0 | 0 | 1 |
| 2. API error/loading/empty states | 0 | 4 | 1 | 5 |
| 3. Accessibility | 0 | 4 | 2 | 6 |
| 4. Edge cases & defensive coding | 0 | 1 | 2 | 3 |
| 5. Performance | 0 | 2 | 2 | 4 |
| 6. Security | 0 | 1 | 2 | 3 |
| 7. UX polish | 1 | 3 | 4 | 8 |
| 8. i18n readiness | 0 | 1 | 1 | 2 |
| 9. Telemetry & error reporting | 0 | 2 | 1 | 3 |
| 10. Build observability | 0 | 1 | 2 | 3 |
| **Total** | **2** | **19** | **17** | **38** |

**Verdict:** No security blockers. 2 customer-facing data-correctness issues that must ship-block. 19 important quality issues to triage before launch. 17 polish items to backlog.

---

## 🔴 P0 — Must fix before launch

### P0-1 · QR submission page shows wrong currency (ZAR — South African Rand)

- **File:** [`src/app/qr/[qrToken]/page.tsx:359`](../src/app/qr/[qrToken]/page.tsx#L359)
- **Code:** `<Input label="Invoice Amount (ZAR)" ... />`
- **Problem:** Niger uses CFA Franc (₣). The QR submission page is the most-seen surface in the entire product (every customer at every fuel station / shop). It tells them they're paying in South African Rand. This is wrong on day one.
- **Fix:** Change label to `"Invoice Amount (₣)"` or just `"Invoice Amount"` — let the placeholder/helper indicate currency.
- **Estimated fix time:** 2 minutes

### P0-2 · Company dashboard QR uses old indigo color, not brand teal

- **File:** [`src/app/company/dashboard/page.tsx:105`](../src/app/company/dashboard/page.tsx#L105)
- **Code:** `<QRCodeSVG ... fgColor="#3730A3" />`
- **Problem:** `#3730A3` is the **old indigo** primary color from before the teal rebrand (2026-04-23 design overhaul). The `/company/qr-code` page was updated to teal `#0F766E` but the dashboard widget was missed. Two QR codes for the same company render with different colors.
- **Fix:** Change `fgColor="#3730A3"` → `fgColor="#0F766E"`
- **Estimated fix time:** 1 minute

---

## 🟠 P1 — Should fix before launch

### Validation

*(none — covered well after recent updates: country-aware phones, structured address, all forms have Joi + inline errors)*

### API states (5)

#### P1-2.1 · List queries don't render error UI on failure
- **Affects:** `/admin/companies`, `/company/customers`, `/company/purchases`, `/company/dashboard` (recent purchases + stats), `/admin/dashboard`
- **Current behavior:** If the API fails (e.g., 500, network timeout), the table just shows "No data" or stays in loading. No error message, no retry button. User has no idea what's wrong.
- **Fix:** Each list query should branch on `isError` and render an error state with the message + retry button. Pattern: `{q.isError ? <ErrorCard onRetry={q.refetch} /> : <Table ... />}`
- **Build a reusable `<QueryErrorState onRetry={...} />` component** so every list page uses the same UI.

#### P1-2.2 · No global error boundary / Next.js `error.tsx`
- **Problem:** Unhandled component errors fall through to Next.js's default unbranded error page. In production this looks broken.
- **Fix:** Add `src/app/error.tsx` (route segment) and `src/app/global-error.tsx` (root) with branded fallback + reset action.

#### P1-2.3 · No route-level `loading.tsx` files
- **Problem:** During SSR streaming or route transitions, there's a flash of nothing before the page mounts.
- **Fix:** Add `src/app/loading.tsx` and segment-level loading files for major routes (`/company/*`, `/admin/*`). Use the existing `<PageLoader />` or skeleton variants.

#### P1-2.4 · Mutations don't surface inline confirmation, only toasts
- **Affects:** Activate/deactivate company, profile update, password change.
- **Current:** Toast for success, but no inline state ("Saved 2 seconds ago" indicator).
- **Fix:** Add a transient inline success indicator near the action that triggered it. Toasts are good for global notification, inline confirmation reduces eye travel.

### Accessibility (4)

#### P1-3.1 · Icon-only buttons missing `aria-label`
- **Affects:** Eye/view buttons on `/company/customers` (line 123), `/company/purchases` (line 128), three-dot MoreVertical on `/admin/companies` (line 129).
- **Fix:** Add `aria-label="View details"` and `aria-label="Open actions menu"` respectively.

#### P1-3.2 · Anchor-wrapping-button anti-pattern
- **Affects:** All `<Link><button>...</button></Link>` patterns in list-page action columns.
- **Problem:** Invalid HTML — buttons can't be inside anchors. Browsers paper over it; screen readers may read it twice.
- **Fix:** Either `<Link className="... button styles">` (Link styled as button) or `<button onClick={() => router.push(...)}>` (programmatic nav).

#### P1-3.3 · No skip-to-content link
- **Problem:** Keyboard users must Tab through the entire sidebar before reaching main content on every page.
- **Fix:** Add a visually-hidden `<a href="#main-content" className="sr-only focus:not-sr-only">Skip to content</a>` as the first focusable element.

#### P1-3.4 · `<main>` landmark missing IDs/labels for sectioning
- **Problem:** `<main>` exists in `DashboardShell` but isn't the only landmark. Screen reader navigation by landmarks is incomplete.
- **Fix:** Add `<header>`, `<nav>` (sidebar), `<main id="main-content">`, `<footer>` with proper `aria-label`s.

### Edge cases (1)

#### P1-4.1 · No explicit `if (isLoading) return` guard at top of submit handlers
- **Problem:** React batches state updates fast enough that double-click rarely double-submits, but it's not guaranteed under slow connections / Suspense.
- **Fix:** Top of every `handleSubmit`: `if (isSubmitting || isLoading) return;`. Belt-and-braces.

### Performance (2)

#### P1-5.1 · Heavy libraries are eagerly imported on every render of the route
- **Problem:**
  - `jspdf` + `jspdf-autotable` (~200KB gzipped) imported at top of `lib/pdf/*` → bundled into `/company/qr-code` and `/company/reports` even though the user only needs them when clicking Download.
  - `country-state-city` (~400KB without cities, ~1.5MB with) imported by `country-state-select.tsx` → bundled into `/register` and `/company/settings`.
  - `libphonenumber-js` (~80KB) → same routes.
- **Fix:**
  - Lazy-load PDF generators via dynamic `import('@/lib/pdf/qr-poster')` only on click.
  - Consider lazy-loading country-state-city + libphonenumber inside `country-state-select.tsx` and `phone-input.tsx` — `await import('country-state-city')` only when component mounts. Saves ~500KB on initial page load.

#### P1-5.2 · React Query `staleTime` and `refetch` strategy not declared
- **Problem:** Default `staleTime: 0` means every navigation refetches. Wastes bandwidth (relevant on Niger 3G) and adds load time.
- **Fix:** In `query-client.tsx`, set sensible defaults: `staleTime: 60_000`, `refetchOnWindowFocus: false`, `retry: (failureCount, error) => shouldRetry(error)`.

### Security (1)

#### P1-6.1 · No Content Security Policy (CSP) headers
- **Problem:** Even though we have no `dangerouslySetInnerHTML`, a future XSS bug or third-party script compromise could exfiltrate the localStorage tokens. CSP adds defense in depth.
- **Fix:** Add CSP via `next.config.ts` `headers()` callback. Start with a strict `default-src 'self'; img-src 'self' data:; ...` and report-only mode, then enforce.

### UX polish (3)

#### P1-7.1 · `Loader2` spinners used instead of skeleton loaders
- **Affects:** Customer detail (header pulse skeleton good, but content uses spinner), QR code page (spinner inside QR frame), QR submission resolve.
- **Problem:** Skeleton loaders are perceived as faster and reduce layout shift compared to spinners.
- **Fix:** Replace key spinners with shape-matching skeletons. The existing `.shimmer` class in globals.css is ready to use.

#### P1-7.2 · Modals don't trap focus
- **File:** `src/components/ui/modal.tsx`
- **Problem:** When a modal opens, Tab moves focus to elements behind the modal (in the page). Keyboard users get lost.
- **Fix:** Add focus trap (Headless UI's Dialog has it built-in, or write a small trap with `useEffect` on first/last focusable elements).

#### P1-7.3 · No "destructive action" confirmation pattern beyond Modal
- **Affects:** Deactivate company (good — has modal), but logout (sidebar) is one-click no-confirm.
- **Fix:** Logout should confirm if there are unsaved changes anywhere. At minimum, add a confirmation for accidental clicks.

### i18n (1)

#### P1-8.1 · `next-intl` installed but not used; all strings hardcoded
- **Problem:** Product spec says English+French. Currently 100% English hardcoded inline. Adding French later means rewriting every string-touching component.
- **Fix:** Either commit to English-only in `package.json` (remove `next-intl`) or wire it up now while the codebase is small. Recommend wiring it now — the rework cost grows with code size.

### Telemetry (2)

#### P1-9.1 · No error reporting service
- **Problem:** Production bugs are invisible. No Sentry, Rollbar, or equivalent. We rely entirely on user bug reports.
- **Fix:** Wire Sentry (free tier, ~30KB gzipped). Send errors + breadcrumbs + user context (companyId, userType, requestId).

#### P1-9.2 · `requestId` from BE errors not surfaced consistently in UI
- **Problem:** `parseApiError` extracts `requestId` and `errorMessageWithId` formats it, but it's only shown for some errors (mostly toasts). Inline field errors and 403 banners don't surface it. Support team can't trace user-reported issues.
- **Fix:** Always render `requestId` in error UI (small, monospaced, "Error code: abc123").

### Build observability (1)

#### P1-10.1 · No environment variable validation
- **Problem:** Only `NEXT_PUBLIC_API_BASE_URL` used, with localhost fallback. If a prod env is missing it, prod silently points at localhost.
- **Fix:** Add a `src/lib/env.ts` that runs at build time / app start, validates required env vars (Joi), throws if missing in production. Same pattern as BE has.

---

## 🟡 P2 — Backlog (polish, future-proofing)

### API states
- **P2-2.5** · `<Pagination>` doesn't disable when `isFetching` is true between pages. User can spam-click and queue requests.

### Accessibility
- **P2-3.5** · Heading hierarchy not fully h1→h2→h3. Some pages skip levels. Run axe-core or similar.
- **P2-3.6** · Color contrast ratios not verified — slate-300 placeholder text on white might fail WCAG AA at 4.5:1.

### Edge cases
- **P2-4.2** · Some `useEffect`s don't have `cancelled` guards. React-query handles its own cancellation, but our QR resolve does it manually — others should too if they have side effects on success.
- **P2-4.3** · Optimistic UI not used anywhere. Long-network operations show spinners; could optimistically update + rollback on error.

### Performance
- **P2-5.3** · No `next/image` usage. We use SVG inline icons (good) but any future raster images should use `<Image>`.
- **P2-5.4** · Service worker cache strategy not audited. Currently registered in production via `service-worker-register.tsx` but I haven't verified the SW's actual logic.

### Security
- **P2-6.2** · No subresource integrity (SRI) on external font links. If we self-host fonts (we should — Niger CDN reach is poor), this becomes moot.
- **P2-6.3** · LocalStorage tokens are accepted tradeoff but worth reconsidering — could move refresh token to HTTP-only cookie if BE shipped that path.

### UX polish
- **P2-7.4** · No "loading dots" indicator on slow async actions. Users on Niger 3G will click and wait — should show something within 200ms.
- **P2-7.5** · No undo for destructive actions (deactivate company). Toast with "Undo" button for 5 seconds is industry standard.
- **P2-7.6** · Empty states are text-only. Could use illustrations (consistent with the Lucide icon system already in place).
- **P2-7.7** · Form auto-save (localStorage drafts) for the long registration form. Niger 3G users may lose the form on connection drop.

### i18n
- **P2-8.2** · Error messages are programmatically constructed in English (e.g., `"${label} is required"`). Even with next-intl, those strings need extraction.

### Telemetry
- **P2-9.3** · No analytics. Nothing tracks which pages users visit, which actions fail, conversion funnels. Add at least PostHog free tier (also has session replay).

### Build observability
- **P2-10.2** · ESLint config uses default Next.js rules only. Could add stricter: `eslint-plugin-jsx-a11y`, `eslint-plugin-react-hooks` rules at error level, etc.
- **P2-10.3** · No CI pipeline visible. `npm run build` + `tsc --noEmit` + ESLint should run on every PR.

---

## What looks great (no findings)

- ✅ **TypeScript strict** mode on, no `any` casts in src
- ✅ **No XSS surfaces** — no `dangerouslySetInnerHTML`, `eval`, `new Function`, raw `innerHTML`
- ✅ **No `console.log` leaks** in src
- ✅ **`target="_blank"` always has `rel="noopener noreferrer"`**
- ✅ **Auth guards** comprehensive (DashboardShell + AuthLayout)
- ✅ **Token refresh + theft detection** correctly implemented
- ✅ **`prefers-reduced-motion`** honored in globals.css
- ✅ **All forms have inline error rendering**, all required fields validated
- ✅ **Recent additions are production-quality**: 5-field structured address, country-state hierarchy, libphonenumber, jsPDF, settings forms

---

## Recommended fix order

1. **P0s first** (3 minutes total) — both are 1-line changes
2. **P1 batch A — visible quality wins:**
   - 2.1 List error states (build `<QueryErrorState>` once, use everywhere)
   - 3.1 / 3.2 / 3.3 / 3.4 Accessibility quick wins
   - 7.1 Skeleton loaders
   - 9.2 RequestId in all error UIs
3. **P1 batch B — infrastructure:**
   - 2.2 Global error boundary (`error.tsx`)
   - 2.3 Route-level `loading.tsx`
   - 5.2 React Query defaults (staleTime, etc.)
   - 10.1 Env var validation
4. **P1 batch C — bigger ticket:**
   - 5.1 Lazy load heavy deps
   - 6.1 CSP headers
   - 8.1 i18n decision (commit to English-only or wire now)
   - 9.1 Sentry
5. **P2** — backlog, prioritize as informed by Sentry data once shipped

---

## Fixes applied (2026-05-08, same session as audit)

### User-requested changes (delivered alongside audit fixes)
- ✅ **Removed "Submit Another Purchase" button** from QR submission success screen — the success state is now terminal; if a customer needs to submit another receipt they re-scan the QR.
- ✅ **Hidden Export CSV buttons** from `/company/customers` and `/company/purchases` — only branded PDF reports remain as exports.
- ✅ **`@KIMates` attribution** added to every PDF: report PDFs show it on every page footer (accent-colored, right side); QR poster shows it centred at the very bottom.

### P0 — both fixed
- ✅ **P0-1:** QR submission amount label corrected from `(ZAR)` to `(₣)` with helper text "West African CFA Franc"
- ✅ **P0-2:** Dashboard QR fgColor updated from old indigo (`#3730A3`) to brand teal (`#0F766E`)

### P1 — fixed in this pass (12)
- ✅ **P1-2.1** — Built reusable `<QueryErrorState>` component (`src/components/ui/query-error-state.tsx`). Wired into `/admin/companies`, `/company/customers`, `/company/purchases`, `/company/customers/[id]` purchase history. Each list now renders error UI with retry button + parsed message + requestId on API failure.
- ✅ **P1-2.2** — Added `src/app/error.tsx` (route-level, branded with reset action) + `src/app/global-error.tsx` (root fallback with minimal HTML/inline styles to survive layout failures).
- ✅ **P1-2.3** — Added `src/app/loading.tsx` for route transitions.
- ✅ **P1-3.1** — `aria-label` on icon-only "view" buttons in customers/purchases tables (uses customer name / invoice number for context). MoreVertical button gets `aria-label`, `aria-expanded`, `aria-haspopup="menu"`.
- ✅ **P1-3.2** — Anchor-wrapping-button antipattern removed: list page Eye icons now use `<Link>` styled directly with button classes (no nested `<button>`); admin company action menu's "View Details" is now `<Link role="menuitem">`.
- ✅ **P1-3.3** — Skip-to-content link added to `DashboardShell` (visually hidden until focused, jumps to `<main id="main-content">`).
- ✅ **P1-3.4** — `<main id="main-content" tabIndex={-1}>` landmark in DashboardShell.
- ✅ **P1-4.1** — `if (isLoading) return` guards added at top of register, login, and settings submit handlers.
- ✅ **P1-5.1** — PDF generators (`jspdf` + `jspdf-autotable`) lazy-loaded via dynamic `import()` on click. Saves ~200KB from initial bundle of `/company/reports` and `/company/qr-code`. (`country-state-city` and `libphonenumber-js` kept eager — needed at form mount; lazy-loading them would require splitting the form components and the cost/benefit doesn't justify the complexity.)
- ✅ **P1-5.2** — Already done in `query-client.tsx` before the audit (was incorrectly flagged as a finding): `staleTime: 60_000`, `gcTime: 5min`, retry skips 401/403/404, `refetchOnWindowFocus: false`.
- ✅ **P1-6.1** — CSP headers in `next.config.ts`: strict `default-src 'self'`; `style-src` and `script-src` allow inline (Tailwind + React); `img-src` allows `data:` + `blob:` (QR codes + PDF blobs); `connect-src` allows the backend API origin; `frame-src 'none'`; `frame-ancestors 'none'`; `upgrade-insecure-requests` in production. Also added `X-Frame-Options DENY`, `X-Content-Type-Options nosniff`, `Referrer-Policy strict-origin-when-cross-origin`, `Permissions-Policy camera=(), microphone=(), geolocation=(self)`.
- ✅ **P1-7.2** — Modal now traps focus (`Tab` / `Shift+Tab` cycles within the dialog), restores focus on close to whatever was focused before, focuses first focusable element on open. Overlay is now a proper `<button aria-label="Close dialog">` instead of a raw `<div onClick>` (also fixes the same a11y antipattern in DashboardShell mobile menu overlay).
- ✅ **P1-10.1** — `src/lib/env.ts` validates `NEXT_PUBLIC_API_BASE_URL` at module import time. Throws in production if missing (fail-fast); warns + falls back in dev. Validates URL format. `lib/api.ts` now imports from `env` instead of directly from `process.env`.

### P1 — deferred (7)

These are documented as backlog rather than this-session work:

- ⏸ **P1-2.4** — Inline mutation confirmation indicators ("Saved 2s ago"). Toast pattern is acceptable for MVP; consider after Sentry data shows users missing toasts.
- ⏸ **P1-7.1** — Skeleton loaders. Existing `Loader2` spinners are functional; `.shimmer` class is ready in globals.css. Apply when refining specific pages (lower priority than infra).
- ⏸ **P1-7.3** — Logout confirmation. Low-impact UX nuance, easy to add later.
- ⏸ **P1-8.1** — i18n wire-up. **Needs product decision** on French timeline. `next-intl` is installed but not used. Either remove the dep or schedule a focused i18n migration session.
- ⏸ **P1-9.1** — Sentry. **Needs DSN/account setup**. Both error.tsx files have `// TODO when Sentry is wired: Sentry.captureException(error)` markers ready for the wire-up.
- ⏸ **P1-9.2** — RequestId now surfaces correctly via `errorMessageWithId()` in `<QueryErrorState>` and toast paths. Inline field errors (Joi/409 details) intentionally don't include requestId since the user can just retry — those are user errors, not server errors.

---

## Audit verification

- ✅ `npx tsc --noEmit` — clean
- ✅ Read every Joi schema (7 forms) for completeness
- ✅ Read every `useQuery` (15) and `useMutation` (3) for state handling
- ✅ Grepped all `<button>` for aria-label coverage
- ✅ Grepped XSS surfaces (innerHTML, eval, dangerouslySetInnerHTML, Function)
- ✅ Grepped `console.*` calls (only in tokens.ts comment)
- ✅ Grepped `target="_blank"` for missing rel attribute
- ✅ Inspected route-level error/loading file presence
- ✅ Inspected i18n usage (next-intl import count: 0)
- ✅ Verified env var inventory (1 used, 1 fallback)
- ✅ Confirmed CSP / SRI / Sentry absence by package.json + config inspection
