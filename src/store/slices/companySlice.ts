import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { SubscriptionPlan } from "@/types";
import { paymentService } from "@/services/payment.service";

/**
 * Plans only.
 *
 * The company PROFILE used to live here as well, in parallel with a TanStack
 * `["company","profile"]` query used by eight pages. Only one writer invalidated, and
 * only the TanStack side, so the two drifted: the currency symbol kept the previous
 * country after a settings save, the PayPal return showed pre-payment status for up to
 * a minute, and every cold page load fetched the profile twice.
 *
 * The profile now lives solely in `useCompanyProfile()`. Do not reintroduce it here.
 */
interface CompanyState {
  plans: SubscriptionPlan[];
  isLoadingPlans: boolean;
  plansFetchFailed: boolean;
}

const initialState: CompanyState = {
  plans: [],
  isLoadingPlans: false,
  plansFetchFailed: false,
};

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
      state.plans = [];
      state.plansFetchFailed = false;
    },
  },
  extraReducers: (builder) => {
    builder
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

export const { clearCompany } = companySlice.actions;
export default companySlice.reducer;
