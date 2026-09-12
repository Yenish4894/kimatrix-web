import api from "@/lib/api";
import { parseApiError } from "@/lib/errors";

/**
 * Downloads a backend-rendered file (reports, invoices) to the user's machine.
 *
 * Cannot be a plain `<a href>`: these endpoints are JWT-authenticated, and a browser
 * navigation carries no Authorization header, so the link would return 401. Fetching as
 * a blob keeps the request on the same axios instance as everything else, so it also
 * gets the refresh-token interceptor: a download that starts on a just-expired access
 * token still succeeds.
 *
 * It also means no URL granting access to the document ever exists to be copied,
 * logged or forwarded.
 */
export async function downloadFile(path: string, fallbackFilename: string): Promise<void> {
  const response = await api.get(path, { responseType: "blob" });

  // Prefer the server's filename. It carries the identifying detail (company, date,
  // invoice number), so repeat downloads do not collide in the downloads folder.
  const disposition = String(response.headers["content-disposition"] ?? "");
  const filename = /filename="([^"]+)"/.exec(disposition)?.[1] ?? fallbackFilename;

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
 * JSON parsing finds nothing. Read it back as text to recover the real message.
 * Otherwise a missing invoice and an expired session both read as "download failed".
 */
export async function messageFromBlobError(err: unknown): Promise<string> {
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
