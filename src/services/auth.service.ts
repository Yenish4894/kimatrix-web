import api, { publicApi } from "@/lib/api";
import type {
  AuthUser,
  AuthTokens,
  BusinessType,
  LoginFormData,
  RegistrationFormData,
  PasswordChangePayload,
} from "@/types";

interface LoginResponse {
  user: AuthUser;
  companyId?: string;
  companyIsActive?: boolean;
  tokens: AuthTokens;
}

/**
 * The whole success payload of registration (HTTP 202). No session, no profile.
 *
 * The server answers exactly like this whether it created an account or the login
 * email was already registered (then it emails that address's owner instead), so the
 * form can't be used to check who is a customer. Don't add anything that differs.
 */
export interface RegisterCompanyResponse {
  status: "check_email";
}

export const authService = {
  // POST /api/auth/register/company
  // Does NOT sign the user in. Next steps: confirm the emailed link (which starts the
  // free trial), then log in — an unverified login still works, as before.
  registerCompany: async (
    payload: Omit<RegistrationFormData, "businessType"> & { businessType: BusinessType }
  ) => {
    const { data } = await api.post<{ data: RegisterCompanyResponse; message: string }>(
      "/auth/register/company",
      payload
    );
    return { ...data.data, message: data.message };
  },

  // POST /api/auth/login
  login: async (credentials: LoginFormData) => {
    const { data } = await api.post<{ data: LoginResponse }>("/auth/login", credentials);
    return data.data;
  },

  // POST /api/auth/logout
  logout: async (refreshToken: string) => {
    await api.post("/auth/logout", { refreshToken });
  },

  // POST /api/auth/refresh
  refresh: async (refreshToken: string) => {
    const { data } = await api.post<{ data: LoginResponse }>("/auth/refresh", { refreshToken });
    return data.data;
  },

  // POST /api/auth/password-reset/request
  requestPasswordReset: async (email: string) => {
    await api.post("/auth/password-reset/request", { email });
  },

  // POST /api/auth/password-reset/confirm
  confirmPasswordReset: async (payload: {
    token: string;
    newPassword: string;
    confirmNewPassword: string;
  }) => {
    await api.post("/auth/password-reset/confirm", payload);
  },

  // POST /api/auth/password-change (authenticated, company OR super_admin)
  // Side effect: server revokes ALL refresh tokens — caller MUST clear
  // local tokens and redirect to /login on success.
  changePassword: async (payload: PasswordChangePayload) => {
    await api.post("/auth/password-change", payload);
  },

  // POST /api/auth/email-verification/confirm — public; the link is opened from an
  // inbox, possibly in a browser with no session.
  //
  // Through `publicApi`, not `api`: an invalid or expired link answers 401, and the
  // shared interceptor read that as an expired session — it tried a refresh, logged a
  // signed-in user out, and the page showed a generic error instead of "link no
  // longer valid". The token in the body is the credential here, not a Bearer.
  confirmEmailVerification: async (token: string) => {
    await publicApi.post("/auth/email-verification/confirm", { token });
  },

  // POST /api/auth/email-change/request — authenticated. Sends a confirmation link to
  // the NEW address; nothing changes until that link is opened.
  requestEmailChange: async (payload: { newEmail: string; currentPassword: string }) => {
    const { data } = await api.post<{ data?: { message?: string }; message?: string }>(
      "/auth/email-change/request",
      payload,
    );
    return data.data?.message ?? data.message ?? "Check your new inbox to confirm.";
  },

  // POST /api/auth/email-change/confirm — public, via `publicApi` for the same reason
  // as email verification above: the link may be opened in a browser with an expired
  // session, and a refused token must read as "link invalid", not as a logout.
  confirmEmailChange: async (token: string): Promise<{ message: string; email: string | null }> => {
    const { data } = await publicApi.post<{
      data?: { message?: string; email?: string };
      message?: string;
    }>("/auth/email-change/confirm", { token });
    return {
      message: data.data?.message ?? data.message ?? "Your login email has been changed.",
      email: data.data?.email ?? null,
    };
  },

  // POST /api/auth/email-verification/resend — authenticated, so it takes no email
  // and cannot be used to probe which addresses exist. Rate limited server-side.
  resendEmailVerification: async () => {
    await api.post("/auth/email-verification/resend");
  },
};
