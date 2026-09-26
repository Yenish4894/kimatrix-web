# KIMates Web - Frontend

> B2B SaaS QR-based customer purchase tracking platform for fuel stations and shops, focused on South Africa and India

[![Next.js](https://img.shields.io/badge/Next.js-15.3-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38bdf8)](https://tailwindcss.com/)
[![Redux Toolkit](https://img.shields.io/badge/Redux_Toolkit-2.11-764abc)](https://redux-toolkit.js.org/)

## 📋 Overview

KIMates Web is the frontend application for the KIMates QR platform. Built with Next.js 15 (App Router), it provides a modern, responsive interface for managing fuel station and shop purchases, tracking customer loyalty, and administering company operations across South Africa and India. Customer amounts are formatted in the company country’s local currency; subscription payments are in USD.

## ✨ Features

### Customer Management
- **QR Code Scanning**: Quick customer identification via QR codes
- **Purchase Recording**: Real-time transaction tracking with fuel type and quantity
- **Customer History**: View complete purchase history and loyalty points

### Company Portal
- **Dashboard Analytics**: Revenue metrics, top customers, recent transactions
- **Customer Management**: CRUD operations with search and filtering
- **Billing & Subscriptions**: PayPal integration for plan upgrades
- **Profile Management**: Company information and settings

### Admin Portal
- **Company Management**: Approve/deactivate companies, extend subscriptions
- **User Management**: View all users and companies
- **System Overview**: Platform-wide analytics and monitoring

### Authentication & Security
- **JWT-based Authentication**: Secure token-based auth with refresh tokens
- **Role-based Access Control**: Super admin, company owner roles
- **Protected Routes**: Middleware-based route protection
- **Subscription Gating**: Automatic access control for expired subscriptions

### Progressive Web App (PWA)
- **Offline Support**: Service worker for offline functionality
- **Installable**: Add to home screen on mobile devices
- **Push Notifications**: Real-time updates (future)

## 🛠️ Tech Stack

### Core
- **Next.js 16.2** - React framework with App Router
- **React 19.2** - UI library
- **TypeScript 5** - Type safety

### Styling
- **TailwindCSS 4** - Utility-first CSS framework
- **class-variance-authority** - Component variants
- **tailwind-merge** - Conditional class merging

### State Management
- **TanStack Query** - Server state: every API read and its cache
- **Redux Toolkit** - Client session state (the signed-in user)

### Forms & Validation
- **`src/lib/validation.ts`** - Small in-house schema validator (`v`); no form library
- **libphonenumber-js** - Phone number validation
- **country-state-city** - Location data

### UI Components
- **lucide-react** - Icon library
- **react-toastify** - Toast notifications
- **qrcode.react** - QR code generation

### PDF Generation
- **jsPDF** - PDF creation
- **jspdf-autotable** - Table generation for PDFs

### HTTP Client
- **Axios** - API communication with interceptors

### Utilities
- **`src/lib/dates.ts`** - Local-day date conversions for date inputs (no date library)
- **js-cookie** - Cookie management
- **use-debounce** - Input debouncing

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── page.tsx                # Landing page
│   │   ├── admin/                  # Admin portal: dashboard, companies (+ detail), plans,
│   │   │                           #   lucky-draw, payments, email, audit-log, settings
│   │   ├── company/                # Company portal: dashboard, customers (+ detail),
│   │   │                           #   purchases (+ detail), qr-code, reports, lucky-draw,
│   │   │                           #   billing (+ success/cancel), payments, export, settings
│   │   ├── qr/[qrToken]/           # Public customer purchase form (no login)
│   │   ├── login/ register/ forgot-password/ reset-password/
│   │   ├── verify-email/ confirm-email-change/
│   │   ├── terms/ privacy/ offline/
│   │   └── layout.tsx              # Root layout
│   ├── middleware.ts               # Edge redirect for /admin and /company (UX gate;
│   │                               #   the backend enforces auth on every request)
│   ├── components/                 # admin, auth, billing, layouts, lucky-draw, payments,
│   │                               #   purchases, pwa, settings, subscription, ui
│   ├── hooks/                      # useCompanyProfile, useEntitlement, useCurrencyFormatter
│   ├── lib/                        # api client, tokens, dates, validation, entitlement,
│   │   └── pdf/                    #   ... and browser-side PDF builders (reports, QR poster)
│   ├── services/                   # One module per API area (auth, company, admin, payment,
│   │                               #   qr, metrics)
│   ├── store/                      # Redux: auth slice, typed hooks, provider
│   └── types/                      # Shared TypeScript types
├── public/                         # Brand images, PWA icons, service worker (sw.js)
├── .github/workflows/deploy.yml    # Test, then deploy on push to main
├── next.config.ts                  # Next.js config (CSP and security headers)
└── package.json
```

Styling uses Tailwind CSS v4: there is no `tailwind.config.js`; the theme lives in
`src/app/globals.css` under `@theme`.

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ and npm/yarn
- Backend API running (see [kimates-api](../backend))
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/KIMates/kimates-web.git
   cd kimates-web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local`:
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open browser**
   ```
   http://localhost:3000
   ```

## 📝 Available Scripts

```bash
npm run dev        # Start development server (port 3000)
npm run build      # Build for production
npm start          # Start production server
npm run lint       # Run ESLint
```

## 🔗 API Integration

The frontend communicates with the backend API via Axios. The base URL is configured in `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

### API Client Configuration

- **Axios Instance**: Configured in `src/lib/api.ts`
- **Request Interceptor**: Attaches JWT access token to requests
- **Response Interceptor**: Handles token refresh on 401 errors
- **Error Handling**: Centralized error handling with toast notifications

### Service Layer

All API calls are organized in the `src/services/` directory:

- `auth.service.ts` - Login, register, password reset
- `company.service.ts` - Company CRUD, profile updates
- `payment.service.ts` - Plans, PayPal orders
- `qr.service.ts` - QR scanning, purchase recording
- `admin.service.ts` - Admin operations

## 🔐 Authentication Flow

1. **Login**: User submits credentials → Backend returns JWT tokens
2. **Token Storage**: Access and refresh tokens in `localStorage`, plus a non-sensitive role cookie
3. **Protected Routes**: `middleware.ts` redirects signed-out or wrong-role visitors at the edge; `DashboardShell` checks again in the browser
4. **Token Refresh**: Automatic refresh on 401 using refresh token
5. **Logout**: Clear tokens, redirect to login

## 💳 Payment Integration

### PayPal Integration Flow

1. **Plan Selection**: User selects subscription plan
2. **Order Creation**: Frontend calls backend `/payment/paypal/create-order`
3. **Redirect**: User redirected to PayPal approval URL
4. **Approval**: User approves payment on PayPal
5. **Capture**: Frontend calls backend `/payment/paypal/capture-order`
6. **Activation**: Backend updates company subscription, frontend syncs state
7. **Webhook**: Backend webhook handles closed-browser scenarios

## 🎨 UI/UX Design

- **Responsive Design**: Mobile-first approach with Tailwind breakpoints
- **Dark Mode**: (Future enhancement)
- **Accessibility**: ARIA labels, keyboard navigation
- **Toast Notifications**: Real-time feedback for user actions
- **Loading States**: Skeletons and spinners for async operations

## 📱 PWA Features

- **Service Worker**: Offline support for critical pages
- **Manifest**: App metadata and icons
- **Install Prompt**: Custom install UI
- **Offline Page**: Fallback when offline

## 🧪 Testing

```bash
# Run tests (future)
npm test

# Run tests in watch mode
npm test -- --watch

# Generate coverage report
npm test -- --coverage
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Import in Vercel**
   - Connect GitHub repository
   - Set environment variables in Vercel dashboard
   - Deploy

3. **Set Environment Variables**
   ```
   NEXT_PUBLIC_API_BASE_URL=https://kimates.com
   ```

   Origin only — the API client appends `/api` itself. The backend is
   reverse-proxied under the main domain; there is no `api.*` subdomain.

### Manual Deployment

```bash
# Build production bundle
npm run build

# Start production server
npm start
```

## 🔒 Security Best Practices

- ✅ Environment variables never committed (.gitignore configured)
- ⚠️ Access and refresh tokens are kept in `localStorage` (`src/lib/tokens.ts`), sent as a
  Bearer header. Readable by any script on the page, so XSS protection matters; the
  backend's refresh rotation and theft detection limit the damage of a stolen token.
- ✅ Only a non-sensitive role cookie (`kimates.session`) is set, for the edge redirect
- ✅ HTTPS enforced in production; CSP and security headers in `next.config.ts`
- ✅ Client-side input validation (`src/lib/validation.ts`); the backend re-validates with Joi
- ✅ XSS protection via React's built-in escaping
- ✅ No cookie-based auth, so classic CSRF does not apply
- ✅ Rate limiting on the backend API

## 📚 Documentation

API endpoints, environment variables and deployment are documented in the backend
repository's README.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary and confidential. All rights reserved.

## 👥 Team

- **Development**: KIMates Team
- **Design**: KIMates Team
- **Product**: KIMates Team

## 📞 Support

For issues or questions:
- Email: support@kimates.com
- GitHub Issues: [kimates-web/issues](https://github.com/KIMates/kimates-web/issues)

---

Built with ❤️ by KIMates Team
