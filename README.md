# KIMatrix Web - Frontend

> B2B SaaS QR-based customer purchase tracking platform for fuel stations and shops in Niger, West Africa

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38bdf8)](https://tailwindcss.com/)
[![Redux Toolkit](https://img.shields.io/badge/Redux_Toolkit-2.11-764abc)](https://redux-toolkit.js.org/)

## 📋 Overview

KIMatrix Web is the frontend application for the KIMatrix QR platform. Built with Next.js 15 (App Router), it provides a modern, responsive interface for managing fuel station purchases, tracking customer loyalty, and administering company operations across Niger, West Africa.

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
- **Redux Toolkit 2.11** - Global state management
- **React Query 5** - Server state management and caching

### Forms & Validation
- **Joi** - Schema validation
- **libphonenumber-js** - Phone number validation
- **country-state-city** - Location data

### UI Components
- **lucide-react** - Icon library
- **react-toastify** - Toast notifications
- **qrcode.react** - QR code generation
- **embla-carousel** - Carousel component

### PDF Generation
- **jsPDF** - PDF creation
- **jspdf-autotable** - Table generation for PDFs

### HTTP Client
- **Axios 1.15** - API communication with interceptors

### Utilities
- **dayjs** - Date manipulation
- **js-cookie** - Cookie management
- **use-debounce** - Input debouncing

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── admin/                # Admin portal pages
│   │   ├── company/              # Company portal pages
│   │   │   ├── billing/          # Billing & subscriptions
│   │   │   ├── customers/        # Customer management
│   │   │   ├── dashboard/        # Company dashboard
│   │   │   └── profile/          # Company profile
│   │   ├── qr/                   # QR scanning pages
│   │   ├── login/                # Login page
│   │   ├── register/             # Registration page
│   │   ├── forgot-password/      # Password recovery
│   │   ├── reset-password/       # Password reset
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Landing page
│   ├── components/               # React components
│   │   ├── layouts/              # Layout components
│   │   ├── pwa/                  # PWA components
│   │   ├── settings/             # Settings components
│   │   └── ui/                   # Reusable UI components
│   ├── lib/                      # Utility libraries
│   │   ├── api.ts                # Axios instance & interceptors
│   │   ├── errors.ts             # Error handling
│   │   ├── query-client.tsx      # React Query config
│   │   └── tokens.ts             # Token management
│   ├── services/                 # API service layer
│   │   ├── auth.service.ts       # Authentication APIs
│   │   ├── company.service.ts    # Company APIs
│   │   ├── payment.service.ts    # Payment APIs
│   │   ├── qr.service.ts         # QR scanning APIs
│   │   └── admin.service.ts      # Admin APIs
│   ├── store/                    # Redux store
│   │   ├── slices/               # Redux slices
│   │   │   ├── authSlice.ts      # Auth state
│   │   │   └── companySlice.ts   # Company state
│   │   ├── store.ts              # Store configuration
│   │   ├── hooks.ts              # Typed hooks
│   │   └── provider.tsx          # Redux provider
│   └── types/                    # TypeScript types
├── public/                       # Static assets
│   ├── icons/                    # PWA icons
│   └── sw.js                     # Service worker
├── docs/                         # Documentation
├── .env.example                  # Environment variables template
├── .gitignore                    # Git ignore patterns
├── next.config.ts                # Next.js configuration
├── tailwind.config.js            # Tailwind configuration
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # Dependencies
└── README.md                     # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ and npm/yarn
- Backend API running (see [kimatrix-api](../backend))
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/KIMatrix/kimatrix-web.git
   cd kimatrix-web
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
2. **Token Storage**: Access token in memory, refresh token in httpOnly cookie
3. **Protected Routes**: Middleware checks authentication before rendering
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
   NEXT_PUBLIC_API_BASE_URL=https://api.kimatrix.com
   ```

### Manual Deployment

```bash
# Build production bundle
npm run build

# Start production server
npm start
```

## 🔒 Security Best Practices

- ✅ Environment variables never committed (.gitignore configured)
- ✅ JWT tokens stored securely (memory + httpOnly cookies)
- ✅ HTTPS enforced in production
- ✅ Input validation with Joi schemas
- ✅ XSS protection via React's built-in escaping
- ✅ CSRF protection via SameSite cookies
- ✅ Rate limiting on backend API

## 📚 Documentation

- [Backend API Guide](./docs/BACKEND_API_GUIDE.md)
- [Backend Flows](./docs/BACKEND_FLOWS.md)
- [Integration Status](./docs/INTEGRATION_STATUS.md)
- [UI/UX Design Spec](./UI_UX_DESIGN_SPEC.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary and confidential. All rights reserved.

## 👥 Team

- **Development**: KIMatrix Team
- **Design**: KIMatrix Team
- **Product**: KIMatrix Team

## 📞 Support

For issues or questions:
- Email: support@kimatrix.com
- GitHub Issues: [kimatrix-web/issues](https://github.com/KIMatrix/kimatrix-web/issues)

---

Built with ❤️ by KIMatrix Team
