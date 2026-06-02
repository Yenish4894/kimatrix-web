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
  durationDays: number;
  price: string;
  currency: string;
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
  isActive: boolean;
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
