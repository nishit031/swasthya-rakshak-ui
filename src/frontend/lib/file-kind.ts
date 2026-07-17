export type FileKind = "image" | "pdf" | "unknown";

/** Infer preview/viewer mode from stored filename or URL extension. */
export function detectFileKind(originalFilename: string | null | undefined, url: string): FileKind {
  const name = originalFilename ?? url;
  const pathname = name.split(/[?#]/)[0];
  if (/\.(jpe?g|png|webp|gif)$/i.test(pathname)) return "image";
  if (/\.pdf$/i.test(pathname)) return "pdf";
  return "unknown";
}
