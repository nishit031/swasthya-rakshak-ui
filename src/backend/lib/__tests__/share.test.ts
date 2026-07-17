import { describe, it, expect, vi, afterEach } from "vitest";
import { shareReport } from "../share";

const file = { blob: new Blob(["x"]), filename: "report.pdf", mimeType: "application/pdf" };
const content = { title: "CBC", text: "share text", url: "https://example.com/r/1" };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("shareReport", () => {
  it("shares the file directly when the platform supports file sharing", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { share, canShare: () => true });

    const outcome = await shareReport(file, content);

    expect(outcome).toBe("shared");
    expect(share).toHaveBeenCalledWith(
      expect.objectContaining({ title: content.title, text: content.text })
    );
    expect(share.mock.calls[0][0].files).toHaveLength(1);
  });

  it("falls back to a title/text/url share when file sharing isn't supported", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { share, canShare: () => false });

    const outcome = await shareReport(file, content);

    expect(outcome).toBe("shared");
    expect(share).toHaveBeenCalledWith({
      title: content.title,
      text: content.text,
      url: content.url
    });
  });

  it("treats a user-cancelled share sheet as shared, not a failure", async () => {
    const share = vi.fn().mockRejectedValue(
      Object.assign(new Error("cancelled"), {
        name: "AbortError"
      })
    );
    vi.stubGlobal("navigator", { share, canShare: () => true });

    const outcome = await shareReport(file, content);

    expect(outcome).toBe("shared");
  });

  it("falls back to copying the link when share() fails for a non-abort reason", async () => {
    const share = vi.fn().mockRejectedValue(new Error("not allowed"));
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { share, canShare: () => true, clipboard: { writeText } });

    const outcome = await shareReport(file, content);

    expect(outcome).toBe("copied");
    expect(writeText).toHaveBeenCalledWith(content.url);
  });

  it("copies the link when the Web Share API is entirely unavailable", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    const outcome = await shareReport(file, content);

    expect(outcome).toBe("copied");
    expect(writeText).toHaveBeenCalledWith(content.url);
  });

  it("reports unsupported when neither share nor clipboard is available", async () => {
    vi.stubGlobal("navigator", {});

    const outcome = await shareReport(file, content);

    expect(outcome).toBe("unsupported");
  });

  it("reports unsupported when there is no navigator at all and no url to copy", async () => {
    vi.stubGlobal("navigator", undefined);

    const outcome = await shareReport(file, { title: "CBC" });

    expect(outcome).toBe("unsupported");
  });
});
