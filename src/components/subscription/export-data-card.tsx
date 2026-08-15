"use client";

import { useState } from "react";
import { Download, FileJson, FileSpreadsheet, FileText } from "lucide-react";
import { Button, Card, CardContent, CardHeader } from "@/components/ui";
import api from "@/lib/api";
import { useCompanyProfile } from "@/hooks/useCompanyProfile";
import { parseApiError } from "@/lib/errors";

type Dataset = "customers" | "purchases";
type Format = "csv" | "json" | "pdf";

/**
 * Which download buttons the card offers.
 *
 * CSV and JSON are fully built and still work end-to-end — the backend streams both,
 * and `run()` below still handles them. They are hidden rather than deleted because
 * the product currently offers PDF only; add them back to this list to re-expose them
 * with no other change.
 */
const VISIBLE_FORMATS: Format[] = ["pdf"];

/**
 * Downloads an export.
 *
 * Cannot be a plain `<a href>`: the export endpoints are JWT-authenticated and a
 * browser navigation carries no Authorization header, so the link would 401. Fetching
 * as a blob keeps the request going through the same axios instance as everything else,
 * which also means it inherits the refresh-token interceptor — a download that starts
 * on a just-expired access token still succeeds.
 */
async function downloadExport(dataset: Dataset, format: Format): Promise<void> {
  const response = await api.get(`/company/export/${dataset}`, {
    params: { format },
    responseType: "blob",
  });

  // Prefer the server's filename; it is dated, so repeat downloads do not collide.
  const disposition = String(response.headers["content-disposition"] ?? "");
  const match = /filename="([^"]+)"/.exec(disposition);
  const filename = match?.[1] ?? `kimates-${dataset}.${format}`;

  const url = URL.createObjectURL(response.data as Blob);
  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    // Without this the entire file stays pinned in memory for the life of the tab.
    URL.revokeObjectURL(url);
  }
}

export function ExportDataCard() {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { data: profile } = useCompanyProfile();

  const run = async (dataset: Dataset, format: Format): Promise<void> => {
    setBusy(`${dataset}-${format}`);
    setError(null);
    try {
      if (format === "pdf") {
        // Built from the JSON the API already streams, so the PDF needs no new
        // endpoint and cannot drift from what CSV and JSON contain.
        const { data } = await api.get(`/company/export/${dataset}`, {
          params: { format: "json" },
        });
        const { generateExportPdf } = await import("@/lib/pdf/data-export");
        await generateExportPdf({
          dataset,
          rows: Array.isArray(data) ? data : [],
          companyName: profile?.name ?? "",
          country: profile?.country ?? "",
        });
        return;
      }
      await downloadExport(dataset, format);
    } catch (err) {
      // A blob-typed error response arrives as a Blob, so the usual JSON parsing finds
      // nothing useful. The message is generic on purpose rather than wrong.
      setError(parseApiError(err).message || "That download didn't work. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const options: { dataset: Dataset; label: string; description: string }[] = [
    {
      dataset: "customers",
      label: "Customers",
      description: "Every customer, ranked by total spend — ready to run a draw from.",
    },
    {
      dataset: "purchases",
      label: "Purchases",
      description: "Every individual submission, largest amount first.",
    },
  ];

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

        {options.map((option) => (
          <div
            key={option.dataset}
            className="flex flex-col gap-3 border-b border-slate-100 pb-5 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="font-medium text-slate-800">{option.label}</p>
              <p className="text-sm text-slate-500">{option.description}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              {VISIBLE_FORMATS.map((format) => (
                <Button
                  key={format}
                  variant={format === "pdf" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => void run(option.dataset, format)}
                  disabled={busy !== null}
                  aria-label={`Download ${option.label.toLowerCase()} as ${format.toUpperCase()}`}
                >
                  {busy === `${option.dataset}-${format}` ? (
                    <Download className="h-4 w-4 animate-pulse" aria-hidden="true" />
                  ) : (
                    <FormatIcon format={format} />
                  )}
                  {format.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>
        ))}

        <p className="text-xs text-slate-500">
          A branded PDF you can print, file or send on. Downloads stay available after a
          plan ends.
        </p>
      </CardContent>
    </Card>
  );
}

function FormatIcon({ format }: Readonly<{ format: Format }>) {
  if (format === "json") return <FileJson className="h-4 w-4" aria-hidden="true" />;
  if (format === "csv") return <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />;
  return <FileText className="h-4 w-4" aria-hidden="true" />;
}
