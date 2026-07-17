import { describe, expect, it } from "vitest";
import { detectFileKind } from "./file-kind";

describe("detectFileKind", () => {
  it("returns pdf for URLs with query strings", () => {
    expect(detectFileKind(null, "/uploads/report.pdf?signature=abc123")).toBe("pdf");
  });

  it("returns image for image URLs with fragments", () => {
    expect(detectFileKind(null, "/uploads/photo.jpg#preview")).toBe("image");
  });

  it("returns unknown for unsupported extensions", () => {
    expect(detectFileKind(null, "/uploads/data.txt")).toBe("unknown");
  });
});
