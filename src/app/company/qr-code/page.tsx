"use client";

import { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download, Copy, Check, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { Card, CardContent, Button } from "@/components/ui";
import { companyService } from "@/services";
import { formatAddress } from "@/lib/utils";
// generateQrPosterPdf is lazy-loaded on click — saves ~150KB on initial render.

export default function QRCodePage() {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  // Container ref — we grab the inner <canvas> at click time
  const qrContainerRef = useRef<HTMLDivElement>(null);

  const profileQ = useQuery({
    queryKey: ["company", "profile"],
    queryFn: companyService.getProfile,
  });

  const company = profileQ.data;

  const copyUrl = () => {
    if (!company?.qrUrl) return;
    navigator.clipboard.writeText(company.qrUrl);
    setCopied(true);
    toast.success("URL copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    if (!company) return;
    const canvas = qrContainerRef.current?.querySelector("canvas");
    if (!canvas) {
      toast.error("QR code is not ready yet. Try again in a moment.");
      return;
    }
    setIsDownloading(true);
    try {
      const { generateQrPosterPdf } = await import("@/lib/pdf/qr-poster");
      generateQrPosterPdf(company, canvas);
      toast.success("QR poster downloaded");
    } catch {
      toast.error("Could not generate the PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <DashboardShell title="QR Code" requiredRole="company">
      <div className="max-w-lg mx-auto">
        <Card>
          <CardContent className="text-center py-8 sm:py-12">
            <h2 className="text-xl sm:text-2xl font-heading font-bold text-slate-800 mb-2">
              Your QR Code
            </h2>
            <p className="text-slate-500 mb-8 text-sm sm:text-base max-w-sm mx-auto">
              Print or display this QR code at your business for customers to scan.
            </p>

            <div className="bg-primary-50 rounded-2xl p-6 sm:p-10 inline-block mb-6 border border-primary-100">
              <div className="bg-white rounded-xl p-4" ref={qrContainerRef}>
                {company?.qrUrl ? (
                  // Render at higher resolution so the embedded PDF image is crisp.
                  // CSS scales it back down for display.
                  <QRCodeCanvas
                    value={company.qrUrl}
                    size={660}
                    level="H"
                    bgColor="#ffffff"
                    fgColor="#0F766E"
                    style={{ width: 220, height: 220 }}
                  />
                ) : (
                  <div className="h-[220px] w-[220px] flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-primary-600 animate-spin" />
                  </div>
                )}
              </div>
            </div>

            <p className="text-lg font-semibold text-slate-800 font-heading">
              {company?.name ?? "Loading..."}
            </p>
            {company && <p className="text-xs text-slate-400 mt-1">{formatAddress(company)}</p>}

            {company?.qrUrl && (
              <div className="mt-6 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 max-w-sm mx-auto">
                <span className="text-xs font-mono text-slate-500 truncate flex-1 text-left">
                  {company.qrUrl}
                </span>
                <button
                  onClick={copyUrl}
                  className="shrink-0 h-7 w-7 flex items-center justify-center rounded-md hover:bg-slate-200 text-slate-500 transition-colors"
                  aria-label="Copy URL"
                >
                  {copied ? <Check className="h-4 w-4 text-success-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 mt-8">
              <Button
                variant="primary"
                size="lg"
                onClick={handleDownload}
                isLoading={isDownloading}
                disabled={!company || isDownloading}
              >
                <Download className="h-5 w-5" /> Download Poster (PDF)
              </Button>
            </div>
            <p className="text-xs text-slate-400 mt-3 max-w-xs mx-auto">
              A branded poster with your QR, company name, and address — ready to print.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
