import api from "@/lib/api";
import type { SubscriptionPlan } from "@/types";

interface CreateOrderResponse {
  paymentId: string;
  paypalOrderId: string;
  approvalUrl: string;
}

interface CaptureOrderResponse {
  paymentId: string;
  subscriptionStartsAt: string;
  subscriptionEndsAt: string;
}

export const paymentService = {
  // GET /api/payments/plans — public, no auth
  getPlans: async (): Promise<SubscriptionPlan[]> => {
    const { data } = await api.get<{ data: SubscriptionPlan[] }>("/payments/plans");
    return data.data;
  },

  // POST /api/payments/paypal/create-order — requires company auth
  // After receiving approvalUrl, caller must do: window.location.href = approvalUrl
  createOrder: async (planId: string): Promise<CreateOrderResponse> => {
    const { data } = await api.post<{ data: CreateOrderResponse }>(
      "/payments/paypal/create-order",
      { planId }
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
};
