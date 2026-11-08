# sena-temp frontend (kimatrix-web)

Next.js App Router site for KIMates: public landing and signup, the company portal, the super-admin panel, and the no-login customer QR form. Working name in conversation: **sena-temp**. Brand in user-facing copy: **KIMates**.

@AGENTS.md

## Tech stack

- Next.js 15.5 (App Router), React 19, TypeScript 5.9 strict, path alias `@/` → `src/`
- TanStack Query for all server state; Redux Toolkit only for the signed-in session (`src/store/slices/authSlice.ts`)
- Tailwind CSS v4 (theme tokens in `src/app/globals.css` `@theme`), `class-variance-authority`, `lucide-react`, `react-toastify`
- Axios client `src/lib/api.ts` (Bearer token, refresh rotation, session-invalidated event); `publicApi` for the QR flow
- jsPDF + autotable for the Reports page and QR poster (`src/lib/pdf/`)
- Tests: `node:test` via `tsx` on `src/**/*.test.ts` (pure helpers in `src/lib/`), 309 tests
- PWA: `public/sw.js` (`CACHE_NAME = "kimates-v2"`), `src/app/manifest.ts`

## Commands

```bash
npm run dev      # http://localhost:3000, needs NEXT_PUBLIC_API_BASE_URL in .env
npm run build    # production build; production uses .env.production on the server
npm run lint     # eslint 9 via FlatCompat (see eslint.config.mjs header)
npm test
npx tsc --noEmit
```

**Do not run `npx prettier` here.** It is not a dependency and reformats whole files.

## Structure

```
src/
  app/            routes (see .claude/rules/pages-and-routes.md); layouts for admin and company
  components/     ui/ (barrel index.ts), layouts/ (DashboardShell, Sidebar), lucky-draw/, billing/, auth/, admin/...
  services/       one object per API area: authService, companyService, adminService, paymentService, qrService, metricsService
  hooks/          useEntitlement, useCompanyProfile, useCurrencyFormatter, useSpinSound
  lib/            pure helpers + tests: api, env, errors, entitlement, retention, payments, validation, draw-sound...
  store/          Redux store, provider, authSlice
  types/index.ts  API shapes shared with the backend
  middleware.ts   edge redirect for /admin and /company by the role cookie
```

## Conventions

- **API layer only in `src/services/`**: components never call axios. Add the type to `src/types/index.ts`, the call to the service object, then a query or mutation in the page.
- **Query keys** start with the area: `["admin", ...]`, `["company", ...]`. Invalidate by prefix after mutations.
- **Route guards are UX, not security**: `DashboardShell requiredRole` and `middleware.ts` redirect; the backend enforces access on every request.
- **Access**: read `useEntitlement()`; never recompute plan logic in a component. `decideGate` in `src/lib/entitlement.ts` says which routes stay reachable after access lapses.
- **Errors**: `parseApiError` / `actionErrorMessage` from `src/lib/errors.ts` for toasts and dialogs; they surface validation details and the request id.
- **Uploads**: pass `FormData` to `api`; the client clears its JSON Content-Type so the browser sends real multipart.
- **Copy**: English only, no country-specific marketing, never "free trial" promotion (the trial feature exists, the marketing phrase was removed 2026-09-16). Headings on dark surfaces need an explicit text colour (`globals.css` paints headings dark).
- **Mobile first** for `/qr/[qrToken]` and `/register`; the customer form must work on a cheap phone.
- **Heavy imports** stay out of the `ui` barrel (see the note in `src/components/ui/index.ts` about `CustomerPhoneInput`).

## Gotchas

- `src/lib/env.ts` throws in production without `NEXT_PUBLIC_API_BASE_URL`; the server's `.env.production` provides it. It was once git-ignored by a broad `env.ts` rule; keep `!src/lib/env.ts` in `.gitignore`.
- A frontend deploy takes minutes (`npm ci` + `next build`). HEAD changing on the server is not "live"; wait for a new `.next/BUILD_ID` and a pm2 restart after it.
- The service worker caches images network-first and `/_next/static/` cache-first; bump `CACHE_NAME` only to force eviction.
- Draw mode and the page wheel share one sound hook; `active:false` silences the hidden one.
- The Turnstile widget renders only when `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is set at build time.

## Domain index

- Routes and what each page does → `.claude/rules/pages-and-routes.md`
- Code patterns with real examples → `.claude/rules/patterns.md`
- Lucky draw UI (wheel, Draw mode, sound, buying spins) → `.claude/rules/lucky-draw-ui.md`
- Billing, paywall, countdowns, retention copy → `.claude/rules/billing-ui.md`
- Skills: `new-page`, `commit-check`, `sync-docs`, `doc-standards`
- Backend API registry: `../backend/.claude/rules/endpoints.md` (separate repo, same workspace)

## Deploy

Push to `main` runs lint and tests, then builds on the VPS and restarts pm2 `kimatrix-web`. `.github/workflows/uptime.yml` checks `/ready` and the certificate every 10 minutes. Commit freely; push only when the owner asks.

## Mandatory verification

`npm run lint`, `npx tsc --noEmit` and `npm test` must pass before work is called done. For UI changes, check 390 px and 1280 px widths and the browser console.
