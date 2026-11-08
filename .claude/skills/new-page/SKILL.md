---
name: new-page
description: Use when adding a page, route or API call to the frontend (company portal, admin panel or public). Covers type → service → query → page → guard → docs in the order this repo expects.
---

# New page or API call

## 1. Type: `src/types/index.ts`

Add the request and response shapes, named after the backend (`../backend/.claude/rules/endpoints.md` has every route and shape).

## 2. Service: `src/services/<area>.service.ts`

Add a function to the existing object (`companyService`, `adminService`, ...). It calls `api` (or `publicApi` for the QR flow) and returns `data.data`. Uploads pass a `FormData`.

## 3. Page: `src/app/<area>/<route>/page.tsx`

- `"use client"` for anything interactive. Server components only for static public pages.
- Fetch with `useQuery({ queryKey: ["<area>", "<thing>"], queryFn })`; mutate with `useMutation` and invalidate by prefix.
- Loading with `PageLoader`, errors with `QueryErrorState`, actions with `toast` + `actionErrorMessage`.
- Irreversible actions go through `ConfirmDialog`.
- Reuse `src/components/ui/` first; add a shared component only when two pages need it.

## 4. Guard and navigation

- Protected pages inherit `DashboardShell requiredRole` from `admin/layout.tsx` or `company/layout.tsx`; `middleware.ts` already covers the path prefix.
- Add the link to `src/components/layouts/sidebar.tsx` for the right role.
- If the page must stay reachable after access lapses, add it to `isLapsedReachableRoute` in `src/lib/entitlement.ts`.

## 5. Copy

English, no country names in marketing copy, "trial" not "free trial", KIMates for the brand. Mobile first: check 390 px.

## 6. Tests and docs

- Pure logic goes in `src/lib/<thing>.ts` with a colocated `<thing>.test.ts`.
- Run the `sync-docs` skill: route table in `.claude/rules/pages-and-routes.md`, any new pattern in `patterns.md`.

## Checklist

- [ ] No axios call outside `src/services/`
- [ ] Query key under the area prefix; invalidation after mutations
- [ ] Sidebar link added; lapsed-access behaviour decided
- [ ] 390 px and 1280 px checked, console clean
- [ ] `npm run lint`, `npx tsc --noEmit`, `npm test` green
