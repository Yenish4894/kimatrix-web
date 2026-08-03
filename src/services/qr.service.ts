import { publicApi } from "@/lib/api";
import type { QRCompanyInfo, QRSubmissionPayload, QRSubmissionResponse } from "@/types";

// These endpoints are PUBLIC — no auth required.
//
// They use `publicApi`, which has no interceptors, rather than the shared `api`
// instance. The shared one attaches any stored Bearer token and treats a 401 as a
// session expiry: clear storage, toast "Your session has ended", redirect to /login.
// On a public page that meant a stale token — a merchant testing their own QR while
// signed in, say — threw the customer off the form and discarded what they'd typed.
export const qrService = {
  // GET /api/qr/:qrToken
  resolveToken: async (qrToken: string) => {
    const { data } = await publicApi.get<{ data: QRCompanyInfo }>(`/qr/${qrToken}`);
    return data.data;
  },

  // POST /api/qr/:qrToken/submit
  submitPurchase: async (qrToken: string, payload: QRSubmissionPayload) => {
    const { data } = await publicApi.post<{ data: QRSubmissionResponse }>(
      `/qr/${qrToken}/submit`,
      payload
    );
    return data.data;
  },
};
