import api from "@/lib/api";
import type { QRCompanyInfo, QRSubmissionPayload, QRSubmissionResponse } from "@/types";

// These endpoints are PUBLIC — no auth required
export const qrService = {
  // GET /api/qr/:qrToken
  resolveToken: async (qrToken: string) => {
    const { data } = await api.get<{ data: QRCompanyInfo }>(`/qr/${qrToken}`);
    return data.data;
  },

  // POST /api/qr/:qrToken/submit
  submitPurchase: async (qrToken: string, payload: QRSubmissionPayload) => {
    const { data } = await api.post<{ data: QRSubmissionResponse }>(
      `/qr/${qrToken}/submit`,
      payload
    );
    return data.data;
  },
};
