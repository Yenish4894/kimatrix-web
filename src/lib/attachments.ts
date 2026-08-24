/**
 * Client-side attachment rules for the bulk email screen.
 *
 * Deliberately mirrors the server: the server is the real gate, but a file that will
 * be refused should be refused before the admin waits for a 10 MB upload to finish.
 */
export const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;

export const ATTACHMENT_ALLOWED_EXTENSIONS = [
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".csv",
  ".txt",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
] as const;

/** For the file picker's `accept`, so the OS dialog filters before anything is chosen. */
export const ATTACHMENT_ACCEPT = ATTACHMENT_ALLOWED_EXTENSIONS.join(",");

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot === -1 ? "" : filename.slice(dot).toLowerCase();
}

/**
 * Why a file cannot be attached, or null if it can.
 *
 * Returns a finished sentence rather than a code: this is shown to the admin as-is,
 * and "invalid file" tells them nothing about which rule they hit or by how much.
 */
export function attachmentError(file: File): string | null {
  if (!ATTACHMENT_ALLOWED_EXTENSIONS.includes(extensionOf(file.name) as never)) {
    return "That file type can't be attached. Use a PDF, image, or document.";
  }
  if (file.size > ATTACHMENT_MAX_BYTES) {
    return `That file is ${formatBytes(file.size)} — the limit is ${formatBytes(
      ATTACHMENT_MAX_BYTES,
    )}. Try compressing it or sending a link instead.`;
  }
  if (file.size === 0) {
    return "That file is empty.";
  }
  return null;
}
