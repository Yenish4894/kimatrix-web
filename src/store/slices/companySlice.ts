import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { CompanyProfile, SubscriptionPlan } from "@/types";
import { companyService } from "@/services";
import { paymentService } from "@/services/payment.service";
import { parseApiError } from "@/lib/errors";

interface CompanyState {
  profile: CompanyProfile | null;
  plans: SubscriptionPlan[];
  isLoadingProfile: boolean;
  isLoadingPlans: boolean;
  profileFetchFailed: boolean;
  /** HTTP status of the last profile failure. 0 = network/timeout, null = no failure. */
  profileErrorStatus: number | null;
  plansFetchFailed: boolean;
}

const initialState: CompanyState = {
  profile: null,
  plans: [],
  isLoadingProfile: false,
  isLoadingPlans: false,
  profileFetchFailed: false,
  profileErrorStatus: null,
  plansFetchFailed: false,
};

export const fetchCompanyProfile = createAsyncThunk(
  "company/fetchProfile",
  async (_, { rejectWithValue }) => {
    try {
      return await companyService.getProfile();
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const fetchPlans = createAsyncThunk(
  "company/fetchPlans",
  async (_, { rejectWithValue }) => {
    try {
      return await paymentService.getPlans();
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

const companySlice = createSlice({
  name: "company",
  initialState,
  reducers: {
    clearCompany: (state) => {
      state.profile = null;
      state.plans = [];
      state.profileFetchFailed = false;
      state.plansFetchFailed = false;
    },
    // Called after a successful PayPal capture to sync subscription fields
    // without waiting for a full profile refetch. Optimistic — the authoritative
    // values arrive on the next `fetchCompanyProfile`.
    setSubscription: (
      state,
      action: { payload: { subscriptionEndsAt: string } }
    ) => {
      if (state.profile) {
        state.profile.subscriptionExpiresAt = action.payload.subscriptionEndsAt;
        state.profile.isActive = true;
        // Keep the entitlement block coherent, or the gate would bounce the user
        // straight back to billing on the very next render after paying.
        state.profile.hasAccess = true;
        state.profile.subscriptionStatus = "active";
        state.profile.accessUntil = action.payload.subscriptionEndsAt;
        state.profile.isTrial = false;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCompanyProfile.pending, (state) => {
        state.isLoadingProfile = true;
        state.profileFetchFailed = false;
      })
      .addCase(fetchCompanyProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
        state.isLoadingProfile = false;
        state.profileFetchFailed = false;
        state.profileErrorStatus = null;
      })
      .addCase(fetchCompanyProfile.rejected, (state, action) => {
        // Capture the status so the route gate can tell "not subscribed" (403) apart
        // from "the request failed" (500 / offline / timeout). Treating both as the
        // former sent paying customers to the payment page.
        state.profileErrorStatus = parseApiError(action.payload).status;
        state.isLoadingProfile = false;
        state.profileFetchFailed = true;
      })
      .addCase(fetchPlans.pending, (state) => {
        state.isLoadingPlans = true;
        state.plansFetchFailed = false;
      })
      .addCase(fetchPlans.fulfilled, (state, action) => {
        state.plans = action.payload;
        state.isLoadingPlans = false;
        state.plansFetchFailed = false;
      })
      .addCase(fetchPlans.rejected, (state) => {
        state.isLoadingPlans = false;
        state.plansFetchFailed = true;
      });
  },
});

export const { clearCompany, setSubscription } = companySlice.actions;
export default companySlice.reducer;
