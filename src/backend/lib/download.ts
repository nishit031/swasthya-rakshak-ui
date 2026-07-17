// Client-side helpers for exporting/downloading a stored file to the user's device.

// Extracts a file extension (including the dot, e.g. ".pdf") from a URL/path, or "" if none.
export function extensionFromUrl(url: string): string {
  const clean = url.split("?")[0].split("#")[0];
  const base = clean.substring(clean.lastIndexOf("/") + 1);
  const dot = base.lastIndexOf(".");
  return dot > 0 ? base.substring(dot) : "";
}

// Turns an arbitrary label (record title / test name) into a safe filename fragment.
export function safeFileName(label: string, fallback = "download"): string {
  const cleaned = label
    .trim()
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .replace(/\s+/g, "_");
  return cleaned || fallback;
}

// Triggers a browser download of the file at `url` via a temporary anchor. For same-origin
// URLs (local /uploads/...) the `download` filename is honored; for future cross-origin cloud
// signed URLs the filename/disposition is controlled by the storage layer instead.
export function triggerDownload(url: string, filename: string): void {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// Downloads a client-generated text blob (e.g. CSV) as a file — same anchor-click pattern as
// triggerDownload, but for in-memory content rather than an already-hosted URL.
export function downloadTextBlob(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, filename);
  URL.revokeObjectURL(url);
}
