# KIMates Web - Frontend

> B2B SaaS QR-based customer purchase tracking platform for fuel stations and shops, available worldwide

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38bdf8)](https://tailwindcss.com/)

## 📋 Overview

KIMates Web is the frontend for the KIMates QR platform, built with Next.js 15 (App Router). Businesses sign up, verify their email to start a trial, and get a QR code; their customers scan it to record purchases without logging in. The platform owner runs everything from a super-admin panel. Customer amounts are shown in the company country's currency; everything paid to KIMates is in USD.

Live at https://kimates.com.

## ✨ Features

### Public
- **Landing page** with every active plan in the admin's order and the admin's "Most Popular" badge
- **Signup** with email verification (verifying starts the trial), honeypot and Cloudflare Turnstile
- **Customer QR form** (`/qr/[qrToken]`): mobile first, no login; Fuel Station and Shop variants; separate screens for paused, inactive and invalid QR codes

### Company Portal
- **Dashboard**: stats, plan status with countdown, recent purchases
- **QR code**: branded poster PDF, pause/resume, regenerate
- **Customers and purchases**: search, sort, date filters, void a purchase with a reason
- **Reports**: top 10, all customers, transactions, monthly; PDF and CSV
- **Lucky draw**: 15-second wheel with music, full-screen Draw mode for a shop TV, buy more spins once free ones run out
- **Billing**: PayPal one-time payment for plans and spin add-ons; payments history with invoice PDFs
- **Settings**: profile, password, change login email, delete account (7-day grace)
- **Paywall**: when access lapses, billing, payments, export and settings stay reachable

### Admin Panel
- **Dashboard**: platform stats per currency, visitors, service status (SMTP, PayPal, database, Redis, queue)
- **Companies**: ban/unban, complimentary access with spins, trial extension, onboarding by invite, deletion, read-only customer/purchase/draw tabs
- **Plans & trial, lucky-draw pricing, payments, bulk email (with attachments), audit log**

### Progressive Web App
- Installable, with an offline page and a service worker (`public/sw.js`)

## 🛠️ Tech Stack

- **Next.js 15.5** (App Router), **React 19.2**, **TypeScript 5.9** (strict)
- **TanStack Query** for all server state; **Redux Toolkit** only for the signed-in session
- **Tailwind CSS 4** (theme in `src/app/globals.css` under `@theme`, no `tailwind.config.js`), `class-variance-authority`, `tailwind-merge`, `lucide-react`, `react-toastify`
- **Axios** client in `src/lib/api.ts` (Bearer token, refresh rotation; clears the JSON content type for `FormData` uploads)
- **jsPDF** + `jspdf-autotable` for the QR poster and reports
- `libphonenumber-js` and `country-state-city` for phone and address fields; a small in-house validator in `src/lib/validation.ts`
- **Fonts** self-hosted in `src/app/fonts/` with `next/font/local` (Inter, Plus Jakarta Sans, JetBrains Mono), so builds never need Google Fonts. Regenerate with `scripts/build-fonts.py`

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                        # Routes: admin/, company/, qr/[qrToken]/, login/, register/,
│   │                               #   verify-email/, reset-password/, terms/, privacy/, offline/
│   │   └── fonts/                  # Self-hosted woff2 fonts
│   ├── middleware.ts               # Edge redirect for /admin and /company (UX only;
│   │                               #   the backend enforces access on every request)
│   ├── components/                 # ui/, layouts/, lucky-draw/, billing/, admin/, auth/, ...
│   ├── hooks/                      # useEntitlement, useCompanyProfile, useCurrencyFormatter, useSpinSound
│   ├── lib/                        # Pure helpers with colocated *.test.ts, plus pdf/
│   ├── services/                   # One module per API area (auth, company, admin, payment, qr, metrics)
│   ├── store/                      # Redux auth slice
│   └── types/                      # API types shared with the backend
├── public/                         # Brand images, PWA icons, sounds, service worker
├── scripts/build-fonts.py          # Rebuilds src/app/fonts from Google's upstream fonts
├── .claude/                        # Project instructions for Claude Code (CLAUDE.md, rules, skills)
└── .github/workflows/              # deploy.yml (test, then deploy) and uptime.yml (checks /ready)
```

## 🚀 Getting Started

### Prerequisites

- Node.js 22 and npm
- The backend API running locally (see the backend repository)

### Installation

```bash
git clone https://github.com/Yenish4894/kimatrix-web.git
cd kimatrix-web
npm install
cp .env.example .env
```

Set the API origin in `.env` (origin only; the client appends `/api`):

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

Optional: `NEXT_PUBLIC_TURNSTILE_SITE_KEY` turns on the signup bot check.

```bash
npm run dev    # http://localhost:3000
```

## 📝 Scripts

```bash
npm run dev       # development server (port 3000)
npm run build     # production build
npm start         # serve the production build
npm run lint      # ESLint
npm test          # unit tests (node:test via tsx, src/**/*.test.ts)
npx tsc --noEmit  # type check
```

Do not run Prettier on this repo; it is not a dependency and reformats whole files.

## 🔐 Authentication

- Access and refresh tokens are kept in `localStorage` (`src/lib/tokens.ts`) and sent as a Bearer header; a non-sensitive role cookie (`kimates.session`) drives the edge redirect.
- On a 401 the client refreshes once; the backend rotates refresh tokens and revokes every session if a used one comes back.
- `useEntitlement()` reads the access state the server computed; the frontend never decides access itself.

## 💳 Payments

1. The company picks a plan or a number of spins on Billing.
2. The frontend asks the backend for a PayPal order and redirects to PayPal.
3. PayPal returns to `/company/billing/success`, which confirms the payment once.
4. The backend captures it, grants the plan or spins, and emails a receipt with the invoice.
5. A signed PayPal webhook covers buyers who close the browser before step 3.

Auto-renewing PayPal subscriptions are built but hidden from customers since 2026-09-27.

## 🚀 Deployment

A push to `main` runs lint and tests on GitHub Actions, then deploys to the VPS over SSH: `git pull`, `npm ci`, `npm run build` (the previous build is restored if the build fails), `pm2 restart kimatrix-web`, and a health check. Production reads `NEXT_PUBLIC_API_BASE_URL=https://kimates.com` from `.env.production` on the server.

`uptime.yml` checks `https://kimates.com/ready` and the SSL certificate every 10 minutes.

## 🔒 Security

- No secrets in the repo; `.env*` files are git-ignored
- CSP, HSTS and other security headers in `next.config.ts`
- Client-side validation mirrors the backend, which re-validates everything with Joi
- Tokens in `localStorage` are readable by page scripts, so XSS protection matters; refresh rotation and theft detection on the backend limit the damage of a stolen token

## 📚 Documentation

- `CLAUDE.md` and `.claude/rules/` in this repo: routes, patterns, lucky draw and billing UI
- The backend repository's `.claude/rules/`: API endpoints, schema, flows and decisions

## 📄 License

MIT, see [LICENSE](LICENSE).

## 📞 Support

- Email: info@kimates.com
- Issues: [kimatrix-web/issues](https://github.com/Yenish4894/kimatrix-web/issues)
