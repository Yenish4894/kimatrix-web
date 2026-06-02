import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { Company, SubscriptionPlan } from "@/types";
import { companyService } from "@/services";
import { paymentService } from "@/services/payment.service";

interface CompanyState {
  profile: Company | null;
  plans: SubscriptionPlan[];
  isLoadingProfile: boolean;
  isLoadingPlans: boolean;
  profileFetchFailed: boolean;
  plansFetchFailed: boolean;
}

const initialState: CompanyState = {
  profile: null,
  plans: [],
  isLoadingProfile: false,
  isLoadingPlans: false,
  profileFetchFailed: false,
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
    // without waiting for a full profile refetch.
    setSubscription: (
      state,
      action: { payload: { subscriptionEndsAt: string } }
    ) => {
      if (state.profile) {
        state.profile.subscriptionExpiresAt = action.payload.subscriptionEndsAt;
        state.profile.isActive = true;
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
      })
      .addCase(fetchCompanyProfile.rejected, (state) => {
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
