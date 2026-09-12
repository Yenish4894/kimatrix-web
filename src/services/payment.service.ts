import api from "@/lib/api";
import type { SubscriptionPlan } from "@/types";

interface CreateOrderResponse {
  paymentId: string;
  paypalOrderId: string;
  approvalUrl: string;
}

interface CaptureOrderResponse {
  paymentId: string;
  kind: "order" | "spin_addon";
  subscriptionStartsAt: string;
  subscriptionEndsAt: string;
}

export const paymentService = {
  // GET /api/payments/plans — public, no auth
  getPlans: async (): Promise<SubscriptionPlan[]> => {
    const { data } = await api.get<{ data: SubscriptionPlan[] }>("/payments/plans");
    return data.data;
  },

  // GET /api/payments/spin-addon — public. Price of one lucky draw spin, in USD.
  getSpinAddonPrice: async (): Promise<{ priceUsd: number }> => {
    const { data } = await api.get<{ data: { priceUsd: number } }>("/payments/spin-addon");
    return data.data;
  },

  // POST /api/payments/paypal/create-order — requires company auth
  // After receiving approvalUrl, caller must do: window.location.href = approvalUrl
  createOrder: async (planId: string, spinQuantity = 0): Promise<CreateOrderResponse> => {
    const { data } = await api.post<{ data: CreateOrderResponse }>(
      "/payments/paypal/create-order",
      { planId, spinQuantity }
    );
    return data.data;
  },

  // POST /api/payments/paypal/create-spin-order — requires company auth, active paid plan
  createSpinOrder: async (spinQuantity: number): Promise<CreateOrderResponse> => {
    const { data } = await api.post<{ data: CreateOrderResponse }>(
      "/payments/paypal/create-spin-order",
      { spinQuantity }
    );
    return data.data;
  },

  // POST /api/payments/paypal/capture-order — requires company auth
  // paypalOrderId comes from ?token= query param on the success return URL
  captureOrder: async (paypalOrderId: string): Promise<CaptureOrderResponse> => {
    const { data } = await api.post<{ data: CaptureOrderResponse }>(
      "/payments/paypal/capture-order",
      { paypalOrderId }
    );
    return data.data;
  },

  // ─── Subscriptions ────────────────────────────────────────────────────────

  subscribe: async (planId: string): Promise<SubscribeResponse> => {
    const { data } = await api.post<{ data: SubscribeResponse }>("/payments/subscriptions", {
      planId,
    });
    return data.data;
  },

  confirmSubscription: async (paypalSubscriptionId: string): Promise<SubscriptionStatus> => {
    const { data } = await api.post<{ data: SubscriptionStatus }>(
      "/payments/subscriptions/confirm",
      { paypalSubscriptionId },
    );
    return data.data;
  },

  getSubscriptionStatus: async (): Promise<SubscriptionStatus> => {
    const { data } = await api.get<{ data: SubscriptionStatus }>("/payments/subscriptions/status");
    return data.data;
  },

  cancelSubscription: async (reason: string): Promise<{ accessUntil: string | null }> => {
    const { data } = await api.post<{ data: { accessUntil: string | null } }>(
      "/payments/subscriptions/cancel",
      { reason },
    );
    return data.data;
  },

  changePlan: async (
    planId: string,
  ): Promise<{ approvalUrl: string | null; effectiveFrom: string | null }> => {
    const { data } = await api.post<{
      data: { approvalUrl: string | null; effectiveFrom: string | null };
    }>("/payments/subscriptions/change-plan", { planId });
    return data.data;
  },
}

export interface SubscribeResponse {
  subscriptionId: string;
  approvalUrl: string;
  /** When billing starts — today, or when existing trial/paid time runs out. */
  startsAt: string;
}

export interface SubscriptionStatus {
  status:
    | "none"
    | "pending"
    | "active"
    | "past_due"
    | "pending_cancel"
    | "cancelled"
    | "expired"
    | "suspended";
  planId: string | null;
  planName: string | null;
  currentPeriodEnd: string | null;
  nextBillingTime: string | null;
  cancelledAt: string | null;
  /** True while a cancelled customer keeps the access they already paid for. */
  accessUntilPeriodEnd: boolean;
}
