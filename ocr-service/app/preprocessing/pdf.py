"""PDF handling: detect an embedded text layer and read it directly, else rasterize pages to
images for OCR. pypdfium2 is imported lazily so this module loads without the native lib present.
"""

from __future__ import annotations

import io

# A text layer with fewer than this many non-whitespace chars is treated as "no real text"
# (e.g. a scanned PDF that carries only a stray watermark string) and sent to OCR instead.
_MIN_TEXT_CHARS = 20


def extract_pdf_text(data: bytes, max_pages: int) -> str:
    """Concatenated text-layer text across pages (empty string if there is no usable layer)."""
    import pypdfium2 as pdfium

    pdf = pdfium.PdfDocument(data)
    try:
        parts: list[str] = []
        for i in range(min(len(pdf), max_pages)):
            page = pdf[i]
            textpage = page.get_textpage()
            parts.append(textpage.get_text_range())
        return "\n\n".join(parts).strip()
    finally:
        pdf.close()


def has_text_layer(data: bytes, max_pages: int) -> bool:
    text = extract_pdf_text(data, max_pages)
    return len(text.replace("\n", "").replace(" ", "")) >= _MIN_TEXT_CHARS


def page_count(data: bytes) -> int:
    import pypdfium2 as pdfium

    pdf = pdfium.PdfDocument(data)
    try:
        return len(pdf)
    finally:
        pdf.close()


def rasterize(data: bytes, max_pages: int, scale: float) -> list[bytes]:
    """Render each page to PNG bytes for OCR."""
    import pypdfium2 as pdfium

    pdf = pdfium.PdfDocument(data)
    try:
        images: list[bytes] = []
        for i in range(min(len(pdf), max_pages)):
            bitmap = pdf[i].render(scale=scale)
            pil = bitmap.to_pil()
            buf = io.BytesIO()
            pil.save(buf, format="PNG")
            images.append(buf.getvalue())
        return images
    finally:
        pdf.close()
