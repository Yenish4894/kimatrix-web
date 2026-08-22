"use client";

import { useState } from "react";
import { Download, FileText, Trophy, Users, Receipt } from "lucide-react";
import { Button, Card, CardContent, CardHeader } from "@/components/ui";
import api from "@/lib/api";
import { parseApiError } from "@/lib/errors";

type Report = "top10" | "customers" | "transactions";

/**
 * The three reports a company can take away, in the order they are most wanted.
 *
 * All three are PDFs rendered by the backend. They used to be built in the browser,
 * which could not work once the same documents had to be attached to expiry emails —
 * a browser that is not running cannot render anything. One implementation now serves
 * both, so a merchant's emailed report and their downloaded one are the same document.
 *
 * CSV and JSON still exist end-to-end on the API and are simply not offered here.
 */
const REPORTS: { key: Report; label: string; description: string; icon: typeof Trophy }[] = [
  {
    key: "top10",
    label: "Top 10 customers",
    description: "Ranked by total spend, with the top three highlighted — ready to run a draw from.",
    icon: Trophy,
  },
  {
    key: "customers",
    label: "All customers",
    description: "Every customer, with their total spend and how often they have visited.",
    icon: Users,
  },
  {
    key: "transactions",
    label: "All transactions",
    description: "Every individual purchase submitted through your QR code, newest first.",
    icon: Receipt,
  },
];

/**
 * Downloads a report.
 *
 * Cannot be a plain `<a href>`: these endpoints are JWT-authenticated and a browser
 * navigation carries no Authorization header, so the link would 401. Fetching as a
 * blob keeps the request on the same axios instance as everything else, which also
 * means it inherits the refresh-token interceptor — a download that starts on a
 * just-expired access token still succeeds.
 *
 * It also means no URL granting access to customer names and phone numbers ever
 * exists to be copied, logged or forwarded.
 */
async function downloadReport(report: Report): Promise<void> {
  const response = await api.get(`/company/reports/${report}.pdf`, { responseType: "blob" });

  // Prefer the server's filename; it carries the company and the date, so repeat
  // downloads do not collide in the downloads folder.
  const disposition = String(response.headers["content-disposition"] ?? "");
  const filename = /filename="([^"]+)"/.exec(disposition)?.[1] ?? `kimates-${report}.pdf`;

  const url = URL.createObjectURL(response.data as Blob);
  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    // Without this the whole file stays pinned in memory for the life of the tab.
    URL.revokeObjectURL(url);
  }
}

/**
 * An error response arrives as a Blob because the request asked for one, so the usual
 * JSON parsing finds nothing. Read it back as text to recover the real message —
 * otherwise a 5,000-row cap or an expired session both read as "download failed".
 */
async function messageFromBlobError(err: unknown): Promise<string> {
  const data = (err as { response?: { data?: unknown } })?.response?.data;
  if (data instanceof Blob) {
    try {
      const parsed = JSON.parse(await data.text()) as { message?: string };
      if (parsed.message) return parsed.message;
    } catch {
      // Not JSON — fall through to the generic message below.
    }
  }
  return parseApiError(err).message || "That download didn't work. Please try again.";
}

export function ExportDataCard() {
  const [busy, setBusy] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (report: Report): Promise<void> => {
    setBusy(report);
    setError(null);
    try {
      await downloadReport(report);
    } catch (err) {
      setError(await messageFromBlobError(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-h3 font-heading font-semibold text-slate-800">Download your data</h2>
        <p className="mt-1 text-sm text-slate-500">
          Your data is yours. You can download it at any time, including after a plan ends.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {error && (
          <p role="alert" className="rounded-lg bg-error-50 px-4 py-3 text-sm text-error-700">
            {error}
          </p>
        )}

        {REPORTS.map((report) => (
          <div
            key={report.key}
            className="flex flex-col gap-3 border-b border-slate-100 pb-5 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-start gap-3">
              <report.icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              <div className="min-w-0">
                <p className="font-medium text-slate-800">{report.label}</p>
                <p className="text-sm text-slate-500">{report.description}</p>
              </div>
            </div>
            <div className="shrink-0">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void run(report.key)}
                disabled={busy !== null}
                aria-label={`Download ${report.label.toLowerCase()} as PDF`}
              >
                {busy === report.key ? (
                  <Download className="h-4 w-4 animate-pulse" aria-hidden="true" />
                ) : (
                  <FileText className="h-4 w-4" aria-hidden="true" />
                )}
                PDF
              </Button>
            </div>
          </div>
        ))}

        <p className="text-xs text-slate-500">
          Branded PDFs you can print, file or send on. Downloads stay available after a plan
          ends.
        </p>
      </CardContent>
    </Card>
  );
}
