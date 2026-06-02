# Pending Backend Endpoints — FE Blockers

> Every frontend feature that is **stubbed, disabled, or client-side workaround** because the backend endpoint doesn't exist yet.
> Keep this doc honest — flip entries to ✅ as the backend team ships endpoints.
> Last updated: 2026-05-08.

---

## How this doc is maintained

- **When BE adds an endpoint** → remove the row here + update `INTEGRATION_STATUS.md` → flip the matching UI from stub → live.
- **When FE discovers a new gap** → add a row here with priority, blocked UI location, expected shape, and workaround notes.
- **Priority scale:**
  - 🔴 **P0** — blocks core user value (registration, login, purchase submission)
  - 🟠 **P1** — important feature but workaround exists (PDF reports)
  - 🟡 **P2** — nice to have, low user impact

---

## Resolved (kept for reference)

- **PDF report downloads** (Top 10, all customers) — resolved client-side via `jsPDF + jspdf-autotable` on 2026-05-03. Branded layout, ranked podium, summary. Generators: `src/lib/pdf/customer-reports.ts`.
- **QR PDF poster** (Company) — resolved client-side via `jsPDF` on 2026-05-03. A4 brand-bordered poster with embedded QR, company info, and usage steps. Generator: `src/lib/pdf/qr-poster.ts`.
- **`PUT /api/company/profile`** — shipped 2026-05-03. Wired in `/company/settings`.
- **`POST /api/auth/password-change`** — shipped 2026-05-03. Wired via `PasswordChangeCard` in both `/company/settings` and `/admin/settings`. Same endpoint serves both roles.
- **`GET /api/company/customers/export`** — shipped 2026-05-03. (FE later hid the button per product decision — PDFs only.)
- **`GET /api/company/purchases/export`** — shipped 2026-05-03. (FE later hid the button per product decision — PDFs only.)
- **Password reset email delivery** — shipped 2026-05-08 via BullMQ + nodemailer SMTP. `/forgot-password` now actually delivers a branded email with the reset link. No FE change required.
- **Friendly 409 conflict messages** — shipped 2026-05-08. BE no longer leaks Postgres detail strings; per-field copy is user-friendly. FE inherits the improvement automatically via `details[].message`.
- **Redis-backed rate limiters** — shipped 2026-05-08. Same headers, same 429 body — transparent FE-side.

---

## Currently pending (3 items)

### 🟠 P1 — Aggregated reports endpoint (Company)

| Field | Value |
|-------|-------|
| **Expected endpoints** | `GET /api/company/reports/top-customers?from=&to=&limit=10` → server-side aggregated, tie-aware top N<br>`GET /api/company/reports/all-customers` → already-sorted aggregated list with tiebreaker |
| **Current FE workaround** | Client-side aggregation: fetches ALL purchases for the period (paginated 100/page through every page), aggregates by customer in JS, sorts with `totalSpend DESC, lastActivity DESC`, applies `topNWithTies(rows, 10)`. Works but wasteful — heavy bandwidth + memory for busy companies. |
| **Files** | `src/app/company/reports/page.tsx` (`fetchMonthPurchases`, `buildTop10`, `compareRows`, `topNWithTies`) |
| **Acceptance criteria** | <ul><li>BE computes aggregates server-side via SQL `GROUP BY` + window functions</li><li>Tie-aware top N: include all customers tied at the cutoff amount (e.g. if 4 customers tie at ₣150 at position 10, return all 4 → 12 rows total)</li><li>Tiebreaker: when totals are equal, order by `MAX(submitted_at) DESC`</li><li>Response shape: `{ items: [{ customerId, fullName, mobile, vehicleNumber, totalSpend, purchaseCount, lastActivity }], totalShown, tiedAtCutoff }`</li></ul> |
| **Migration plan** | When endpoint ships: replace `fetchMonthPurchases` + `buildTop10` calls with a single service method. Keep `topNWithTies` and `compareRows` as a fallback for the all-customers report if BE doesn't fully sort there. |

---

### 🟠 P1 — Bulk promotional email (Admin)

| Field | Value |
|-------|-------|
| **Expected endpoint** | `POST /api/admin/email/bulk` — body `{ subject, htmlBody }` → sends to all companies with `promoEmailOptIn=true` |
| **Blocked UI** | `/admin/email` — shows "Coming Soon" |
| **File** | `src/app/admin/email/page.tsx` |
| **Workaround** | None. Blocks super-admin promotional-email tool. |
| **BE dependency** | BullMQ email worker must be shipped first |
| **Acceptance criteria** | Async job returns `{ jobId }`, eventual confirmation via email or admin notification |

---

### 🟠 P1 — Visitor analytics (Admin)

| Field | Value |
|-------|-------|
| **Expected endpoint** | `GET /api/admin/visitors/stats` → `{ totalVisitors, todayVisitors, weeklyVisitors, ... }` |
| **Blocked UI** | `/admin/visitors` — shows "Coming Soon" |
| **File** | `src/app/admin/visitors/page.tsx` |
| **Workaround** | None |
| **BE dependency** | Tracking middleware + aggregation query |

---

### 🟡 P2 — Notifications feed

| Field | Value |
|-------|-------|
| **Expected endpoints** | `GET /api/notifications`, `POST /api/notifications/:id/read` |
| **Blocked UI** | Bell icon in header is disabled with "coming soon" tooltip |
| **File** | `src/components/layouts/header.tsx` |
| **Workaround** | None. Bell is muted/disabled. |
| **Future use** | Plan expiry warnings, new-customer alerts, admin announcements |

---

## Client-side workarounds currently in use

| UI | Workaround | File |
|----|-----------|------|
| QR code display | Rendered client-side from `qrUrl` via `qrcode.react` SVG — no server call needed | `src/app/company/qr-code/page.tsx`, `/company/dashboard` |
| QR PDF poster | `jsPDF` — branded A4 poster, embedded QR via `canvas.toDataURL()` | `src/lib/pdf/qr-poster.ts` |
| PDF reports (Top 10, all customers) | `jsPDF` + `jspdf-autotable` — branded header, table styling, page numbers | `src/lib/pdf/customer-reports.ts` |

---

## Features NOT in scope (no plan to build)

- Payment gateway integration — client has not finalized (Flutterwave deferred). Activation is a manual super-admin step until then.
- i18n French translations — MVP is English-only, strings structured to swap later.
- Multi-tenancy / sub-users per company — one owner per company in v1.

---

## Quick reference

| Blocks | Count |
|--------|-------|
| 🔴 P0 | 0 |
| 🟠 P1 | 2 |
| 🟡 P2 | 1 |
| **Total pending BE endpoints** | **3** |

> 8 → 4 → 3 → 4 → 3 across 2026-05-03 → 2026-05-08. Latest update: BE shipped password-reset email delivery (BullMQ + nodemailer), friendly 409 messages, and Redis-backed rate limiters — none required FE code changes.

See `INTEGRATION_STATUS.md` for the full per-route breakdown of what IS integrated.
