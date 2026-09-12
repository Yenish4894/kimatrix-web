"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui";
import { messageFromBlobError } from "@/lib/download";

interface InvoiceDownloadButtonProps {
  invoiceNumber: string;
  download: () => Promise<void>;
  label?: string;
}

/**
 * One row's invoice download. It holds its own busy state, so a slow PDF on one row
 * shows a spinner on that row only. The rest of the table stays usable.
 */
export function InvoiceDownloadButton({
  invoiceNumber,
  download,
  label = "Download invoice",
}: Readonly<InvoiceDownloadButtonProps>) {
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try {
      await download();
    } catch (err) {
      // The server's own reason ("invoice not available for a failed payment"),
      // recovered from the blob body. Otherwise every failure reads the same.
      toast.error(await messageFromBlobError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => void run()}
      isLoading={busy}
      className="whitespace-nowrap"
      aria-label={`${label} ${invoiceNumber}`}
    >
      {!busy && <Download className="h-4 w-4" aria-hidden="true" />}
      {label}
    </Button>
  );
}
