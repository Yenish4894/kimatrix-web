import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthState, AuthUser, BusinessType, RegistrationFormData, LoginFormData } from "@/types";
import { TokenStorage } from "@/lib/tokens";
import { authService } from "@/services";
import { getQueryClient } from "@/lib/query-client";
import { clearCompany } from "./companySlice";

const initialState: AuthState = {
  user: null,
  companyId: null,
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
    return result;
  } catch (err) {
    return rejectWithValue(err);
  }
});

// Registration does NOT sign the user in — the response is a neutral "check your
// email" (identical whether or not the address was already registered), so there is
// nothing to persist. They confirm the emailed link, then log in.
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

export const logout = createAsyncThunk("auth/logout", async (_, { dispatch }) => {
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
  // Query keys are not user-scoped, so without this the next account to sign in on
  // this tab briefly sees the previous account's profile, purchases and plans.
  dispatch(clearCompany());
  getQueryClient().clear();
});

// Restore session from localStorage on app boot
export const loadSession = createAsyncThunk(
  "auth/loadSession",
  async (_, { rejectWithValue }) => {
    const user = TokenStorage.getUser();
    const tokens = TokenStorage.getTokens();
    const companyId = TokenStorage.getCompanyId();

    if (!user || !tokens) {
      return rejectWithValue("no_session");
    }

    // Re-assert the edge session cookie (read by src/proxy.ts) in case it was
    // lost while the localStorage session survived — keeps the two in sync.
    TokenStorage.setUser(user, companyId);

    // If access token is expired (or about to be), the axios interceptor
    // will handle refresh on the next request. We just restore state here.
    return { user, tokens, companyId };
  }
);

// ─── Slice ────────────────────────────────────────────────
//
// Whether the company is active is NOT stored here. It used to be, as a copy of the
// login response persisted to localStorage, and it drifted from the server-computed
// profile exactly as the removed companySlice profile did (ARC-5). Read `hasAccess`
// from useCompanyProfile() instead.

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<AuthUser>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    clearAuth: (state) => {
      state.user = null;
      state.companyId = null;
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
        state.tokens = action.payload.tokens;
        state.isAuthenticated = true;
        state.isLoading = false;
      })
      .addCase(login.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
      })
      // register — no session: the user confirms their email, then logs in
      .addCase(registerCompany.pending, (state) => { state.isLoading = true; })
      .addCase(registerCompany.fulfilled, (state) => { state.isLoading = false; })
      .addCase(registerCompany.rejected, (state) => { state.isLoading = false; })
      // logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.companyId = null;
        state.tokens = null;
        state.isAuthenticated = false;
        state.isLoading = false;
      })
      // load session
      .addCase(loadSession.pending, (state) => { state.isLoading = true; })
      .addCase(loadSession.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.companyId = action.payload.companyId;
        state.tokens = action.payload.tokens;
        state.isAuthenticated = true;
        state.isLoading = false;
      })
      .addCase(loadSession.rejected, (state) => {
        state.user = null;
        state.companyId = null;
        state.tokens = null;
        state.isAuthenticated = false;
        state.isLoading = false;
      });
  },
});

export const { setUser, clearAuth } = authSlice.actions;
export default authSlice.reducer;
