// ─── Backend-aligned types ─────────────────────────────────
// Matches BACKEND_API_GUIDE.md (2026-05-03 + structured address)

// User roles
export type UserType = "super_admin" | "company";

// Business types (backend uses snake_case)
export type BusinessType = "fuel_station" | "shop";

// ─── Auth ──────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  userType: UserType;
  isActive: boolean;
}

export interface AuthTokens {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
}

export interface AuthState {
  user: AuthUser | null;
  companyId: string | null;
  companyIsActive: boolean | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// ─── Company ───────────────────────────────────────────────

// Structured address — replaces the legacy single `address` string (BE 2026-05-03)
export interface CompanyAddress {
  streetAddress: string;
  city: string;
  state: string;
  country: string;
  postalCode: string | null;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string | null;
  durationDays: number;
  price: string;
  currency: string;
  /**
   * Drives the "Most Popular" badge. Replaces the old hardcoded `durationDays === 30`
   * check, which would have un-featured everything the moment an admin created plans.
   */
  isPopular?: boolean;
  sortOrder?: number;
}

/** Admin view of a plan — adds lifecycle state the public catalogue never exposes. */
export interface AdminPlan extends SubscriptionPlan {
  isActive: boolean;
  archivedAt: string | null;
  supersededByPlanId: string | null;
  supersedesPlanId: string | null;
  /** Whether the plan carries billing history — an edit to price/duration will version it. */
  hasPayments?: boolean;
  hasSubscribers?: boolean;
}

export interface PlatformSettings {
  trialDurationDays: number;
  platformCurrency: string;
}

export interface Company extends CompanyAddress {
  id: string;
  name: string;
  registrationNumber: string;
  contactEmail: string;
  contactPhone: string;
  whatsappNumber: string | null;
  businessType: BusinessType;
  promoEmailOptIn: boolean;
  isActive: boolean;
  joinedAt: string;
  deactivatedAt?: string | null;
  qrToken: string;
  qrUrl: string;
  subscriptionExpiresAt: string | null;
  currentPlan: SubscriptionPlan | null;
  createdAt?: string;
  updatedAt?: string;
  owner?: {
    id: string;
    email: string;
    username: string;
    isActive: boolean;
    lastLoginAt: string | null;
  };
}

/**
 * Server-computed entitlement. Mirrors the backend's `computeEntitlement()`.
 * `active` covers paid and comped; `trialing` is a live free trial.
 */
export type SubscriptionStatus =
  | "pending"
  | "trialing"
  | "active"
  | "trial_expired"
  | "expired"
  | "past_due"
  | "deactivated";

/**
 * What `GET /company/profile` returns — a Company plus the entitlement block.
 *
 * Distinct from `Company` because the admin endpoints return the raw entity with no
 * entitlement fields, and the access gate must never read a possibly-undefined flag.
 */
export interface CompanyProfile extends Company {
  /**
   * The ONLY thing the route gate should read. Never re-derive access from a date on
   * the client: the old `subscriptionExpiresAt > Date.now()` check disagreed with the
   * backend about what a null expiry meant, and trusted the client's clock.
   *
   * The whole block is optional ONLY for the window in which this frontend may be
   * live against the previous backend. Make these required once the backend release
   * has shipped, and drop the legacy fallback in `resolveHasAccess`.
   */
  hasAccess?: boolean;
  subscriptionStatus?: SubscriptionStatus;
  /** Unified end-of-access across trial, paid and comp. `null` = perpetual or not started. */
  accessUntil?: string | null;
  /** Both ends of the trial window — the progress bar needs the span, not just the end. */
  trialStartedAt?: string | null;
  trialEndsAt?: string | null;
  isTrial?: boolean;
  isComped?: boolean;
  canExport?: boolean;
  /** Owner's email confirmation state. The trial clock starts on verification. */
  emailVerified?: boolean;
}

// ─── Customer ──────────────────────────────────────────────

export interface Customer {
  id: string;
  mobile: string;
  fullName: string;
  vehicleNumber: string | null;
  totalInvoiceAmount: string; // decimal as string
  submissionCount: number;
  firstSubmissionAt: string;
  lastSubmissionAt: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Purchase ──────────────────────────────────────────────

export interface Purchase {
  id: string;
  invoiceNumber: string;
  invoiceAmount: string; // decimal as string
  fullNameSnapshot: string;
  vehicleNumberSnapshot: string | null;
  submittedAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  latitude: string | null;
  longitude: string | null;
  locationAccuracy: string | null;
  customer?: Customer;
}

// ─── QR submission ─────────────────────────────────────────

export interface QRCompanyInfo {
  companyId: string;
  companyName: string;
  businessType: BusinessType;
  /**
   * Replaces the old `isActive`, which ignored subscription expiry — the form
   * rendered normally and the customer only hit the wall on submit.
   *
   * Optional only for the deploy window in which the frontend may be live against
   * the previous backend. Make it required once the backend release has shipped.
   */
  isAcceptingSubmissions?: boolean;
  /** @deprecated Superseded by `isAcceptingSubmissions`. Remove after the backend ships. */
  isActive?: boolean;
  /** Drives the currency symbol on the customer form. Absent on the old backend. */
  country?: string;
}

export interface QRSubmissionPayload {
  mobile: string;
  fullName: string;
  vehicleNumber?: string;
  invoiceNumber: string;
  invoiceAmount: number;
  latitude?: number;
  longitude?: number;
  locationAccuracy?: number;
}

export interface QRSubmissionResponse {
  purchaseId: string;
  customerId: string;
  customerTotalInvoiceAmount: string;
  customerSubmissionCount: number;
  submittedAt: string;
}

// ─── Dashboard stats ───────────────────────────────────────

export interface CompanyStats {
  totalCustomers: number;
  totalPurchases: number;
  totalSpend: string; // decimal as string
  topSpender: {
    id: string;
    fullName: string;
    mobile: string;
    vehicleNumber: string | null;
    totalInvoiceAmount: string;
    submissionCount: number;
  } | null;
}

export interface AdminStats {
  totalCompanies: number;
  activeCompanies: number;
  inactiveCompanies: number;
  totalFuelStations: number;
  totalShops: number;
  totalCustomers: number;
  totalPurchases: number;
  totalSpend: string;
}

// ─── API envelope ──────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  error: string;
  details?: Array<{ field: string; message: string }>;
  requestId?: string;
  timestamp: string;
}

// ─── Forms ─────────────────────────────────────────────────

export interface RegistrationFormData {
  name: string;
  streetAddress: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  registrationNumber: string;
  contactEmail: string;
  contactPhone: string;
  whatsappNumber: string;
  businessType: BusinessType | "";
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  promoEmailOptIn: boolean;
  termsAccepted: boolean;
}

export interface LoginFormData {
  identifier: string;
  password: string;
}

// ─── Profile edit + password change ────────────────────────

export interface UpdateCompanyProfilePayload {
  streetAddress?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string | null;
  contactEmail?: string;
  contactPhone?: string;
  whatsappNumber?: string | null;
  promoEmailOptIn?: boolean;
}

export interface PasswordChangePayload {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

// ─── Company status (derived) ──────────────────────────────

export type CompanyStatus = "pending" | "active" | "deactivated";
