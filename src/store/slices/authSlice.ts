import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthState, AuthUser, BusinessType, RegistrationFormData, LoginFormData } from "@/types";
import { TokenStorage } from "@/lib/tokens";
import { authService } from "@/services";

const initialState: AuthState = {
  user: null,
  companyId: null,
  companyIsActive: null,
  tokens: null,
  isLoading: false,
  isAuthenticated: false,
};

// ─── Thunks ───────────────────────────────────────────────

export const login = createAsyncThunk("auth/login", async (credentials: LoginFormData, { rejectWithValue }) => {
  try {
    const result = await authService.login(credentials);
    TokenStorage.setTokens(result.tokens);
    TokenStorage.setUser(result.user, result.companyId ?? null);
    TokenStorage.setCompanyIsActive(result.companyIsActive ?? null);
    return result;
  } catch (err) {
    return rejectWithValue(err);
  }
});

// Registration creates the company in PENDING state. No tokens are issued
// and the user must wait for super admin activation before they can log in.
// Therefore: no token storage, no auth state mutation — just return the
// payload so the page can show the success message.
export const registerCompany = createAsyncThunk(
  "auth/registerCompany",
  async (payload: Omit<RegistrationFormData, "businessType"> & { businessType: BusinessType }, { rejectWithValue }) => {
    try {
      return await authService.registerCompany(payload);
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const logout = createAsyncThunk("auth/logout", async () => {
  const refreshToken = TokenStorage.getRefreshToken();
  if (refreshToken) {
    // Fire and forget — always clear client state regardless
    try {
      await authService.logout(refreshToken);
    } catch {
      /* ignore — server may 401 if already expired */
    }
  }
  TokenStorage.clear();
});

// Restore session from localStorage on app boot
export const loadSession = createAsyncThunk(
  "auth/loadSession",
  async (_, { rejectWithValue }) => {
    const user = TokenStorage.getUser();
    const tokens = TokenStorage.getTokens();
    const companyId = TokenStorage.getCompanyId();
    const companyIsActive = TokenStorage.getCompanyIsActive();

    if (!user || !tokens) {
      return rejectWithValue("no_session");
    }

    // If access token is expired (or about to be), the axios interceptor
    // will handle refresh on the next request. We just restore state here.
    return { user, tokens, companyId, companyIsActive };
  }
);

// ─── Slice ────────────────────────────────────────────────

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<AuthUser>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    // Called after a successful PayPal capture to reflect the company is now active
    setCompanyIsActive: (state, action: PayloadAction<boolean>) => {
      state.companyIsActive = action.payload;
      TokenStorage.setCompanyIsActive(action.payload);
    },
    clearAuth: (state) => {
      state.user = null;
      state.companyId = null;
      state.companyIsActive = null;
      state.tokens = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      TokenStorage.clear();
    },
  },
  extraReducers: (builder) => {
    builder
      // login
      .addCase(login.pending, (state) => { state.isLoading = true; })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.companyId = action.payload.companyId ?? null;
        state.companyIsActive = action.payload.companyIsActive ?? null;
        state.tokens = action.payload.tokens;
        state.isAuthenticated = true;
        state.isLoading = false;
      })
      .addCase(login.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
      })
      // register — no auth state change; account is pending activation
      .addCase(registerCompany.pending, (state) => { state.isLoading = true; })
      .addCase(registerCompany.fulfilled, (state) => { state.isLoading = false; })
      .addCase(registerCompany.rejected, (state) => { state.isLoading = false; })
      // logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.companyId = null;
        state.companyIsActive = null;
        state.tokens = null;
        state.isAuthenticated = false;
        state.isLoading = false;
      })
      // load session
      .addCase(loadSession.pending, (state) => { state.isLoading = true; })
      .addCase(loadSession.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.companyId = action.payload.companyId;
        state.companyIsActive = action.payload.companyIsActive;
        state.tokens = action.payload.tokens;
        state.isAuthenticated = true;
        state.isLoading = false;
      })
      .addCase(loadSession.rejected, (state) => {
        state.user = null;
        state.companyId = null;
        state.companyIsActive = null;
        state.tokens = null;
        state.isAuthenticated = false;
        state.isLoading = false;
      });
  },
});

export const { setUser, clearAuth, setCompanyIsActive } = authSlice.actions;
export default authSlice.reducer;
