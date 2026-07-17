// Client-side helper for sharing a report via the native Web Share API (WhatsApp/email/etc. on
// mobile), with graceful fallbacks for browsers that don't support it.

export interface ShareContent {
  title: string;
  text?: string;
  // The report's signed file URL (via fileUrl()) — shareable and time-limited by the backend's
  // presign expiry, so this doubles as the "shareable link" without a dedicated share endpoint.
  url?: string;
}

export interface ShareFilePayload {
  blob: Blob;
  filename: string;
  mimeType: string;
}

export type ShareOutcome = "shared" | "copied" | "unsupported";

// Tries, in order: (1) native share sheet with the file attached, (2) native share sheet with
// just title/text/link (some browsers support Web Share but not file attachments), (3) copying
// `content.url` to the clipboard. Returns which path was taken so the caller can show matching
// feedback, or fall back to a plain download when "unsupported".
export async function shareReport(
  file: ShareFilePayload | null,
  content: ShareContent
): Promise<ShareOutcome> {
  if (typeof navigator !== "undefined" && navigator.share) {
    const shareFile = file ? new File([file.blob], file.filename, { type: file.mimeType }) : null;
    const canShareFile = !!shareFile && navigator.canShare?.({ files: [shareFile] });
    try {
      if (canShareFile && shareFile) {
        await navigator.share({ files: [shareFile], title: content.title, text: content.text });
      } else {
        await navigator.share({ title: content.title, text: content.text, url: content.url });
      }
      return "shared";
    } catch (err) {
      // AbortError = the user closed the share sheet without picking anything — respect that,
      // don't fall through to a surprise clipboard-copy or download.
      if ((err as Error)?.name === "AbortError") return "shared";
    }
  }
  if (content.url && typeof navigator !== "undefined" && navigator.clipboard) {
    await navigator.clipboard.writeText(content.url);
    return "copied";
  }
  return "unsupported";
}
