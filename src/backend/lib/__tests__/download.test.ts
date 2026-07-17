import { describe, it, expect } from "vitest";
import { extensionFromUrl, safeFileName } from "../download";

describe("extensionFromUrl", () => {
  it("extracts the extension from a stored upload path", () => {
    expect(extensionFromUrl("/uploads/0d38787eb63285791e986c07ca7cd936.pdf")).toBe(".pdf");
  });

  it("ignores query strings and fragments", () => {
    expect(extensionFromUrl("/uploads/scan.png?token=abc#x")).toBe(".png");
  });

  it("returns '' when there is no extension", () => {
    expect(extensionFromUrl("/uploads/noext")).toBe("");
  });

  it("does not treat a leading-dot filename as an extension", () => {
    expect(extensionFromUrl("/uploads/.hidden")).toBe("");
  });
});

describe("safeFileName", () => {
  it("keeps alphanumerics and turns spaces into underscores", () => {
    expect(safeFileName("Annual Checkup Report")).toBe("Annual_Checkup_Report");
  });

  it("strips unsafe punctuation and collapses whitespace runs to one underscore", () => {
    expect(safeFileName("CBC / Lipid: 2026")).toBe("CBC_Lipid_2026");
  });

  it("falls back when the label has no usable characters", () => {
    expect(safeFileName("/// ", "report")).toBe("report");
  });
});
