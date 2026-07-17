"""Image cleanup before OCR. PIL does the load-bearing lifts (EXIF-rotate, grayscale, upscale,
autocontrast, light denoise) — the single biggest confidence gain on phone photos of reports.
Deskew is an optional OpenCV pass, skipped silently if cv2 isn't importable. All imports are lazy.
"""

from __future__ import annotations

import io

# Small/low-DPI scans read poorly; upscale to at least this width. ponytail: the calibration
# knob — raise it (or add adaptive thresholding) if real-world photos still OCR badly.
_MIN_WIDTH = 1500


def preprocess_image(data: bytes) -> bytes:
    from PIL import Image, ImageFilter, ImageOps

    try:  # let PIL open HEIC/HEIF (iPhone photos); no-op if pillow-heif isn't installed
        from pillow_heif import register_heif_opener

        register_heif_opener()
    except Exception:
        pass

    img = Image.open(io.BytesIO(data))
    img = ImageOps.exif_transpose(img)  # honor camera orientation
    img = img.convert("L")  # grayscale

    if img.width < _MIN_WIDTH:
        ratio = _MIN_WIDTH / img.width
        img = img.resize((_MIN_WIDTH, int(img.height * ratio)))

    img = ImageOps.autocontrast(img)  # contrast normalization
    img = img.filter(ImageFilter.MedianFilter(size=3))  # light denoise

    data = _to_png(img)
    return _deskew(data)


def binarize_adaptive(data: bytes) -> bytes:
    """Second-chance preprocessing for pages that OCR'd below the confidence threshold: CLAHE
    (local contrast) + adaptive Gaussian threshold. Helps faded print and unevenly-lit phone
    photos; the caller keeps whichever OCR pass scored higher. No-op if cv2 is unavailable."""
    try:
        import cv2
        import numpy as np
    except Exception:
        return data

    arr = np.frombuffer(data, dtype=np.uint8)
    gray = cv2.imdecode(arr, cv2.IMREAD_GRAYSCALE)
    if gray is None:
        return data
    gray = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8)).apply(gray)
    binary = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 15
    )
    ok, encoded = cv2.imencode(".png", binary)
    return encoded.tobytes() if ok else data


def _to_png(img) -> bytes:
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def _deskew(data: bytes) -> bytes:
    """Rotate to level using OpenCV's minAreaRect on the text mask. No-op if cv2 is unavailable."""
    try:
        import cv2
        import numpy as np
    except Exception:
        # ponytail: cv2 absent (e.g. pure-logic test env) — skip deskew, upstream steps still help.
        return data

    arr = np.frombuffer(data, dtype=np.uint8)
    gray = cv2.imdecode(arr, cv2.IMREAD_GRAYSCALE)
    if gray is None:
        return data
    inv = cv2.bitwise_not(gray)
    thresh = cv2.threshold(inv, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)[1]
    coords = cv2.findNonZero(thresh)
    if coords is None:
        return data
    angle = cv2.minAreaRect(coords)[-1]
    angle = -(90 + angle) if angle < -45 else -angle
    if abs(angle) < 0.5:  # not worth rotating
        return data
    h, w = gray.shape
    matrix = cv2.getRotationMatrix2D((w / 2, h / 2), angle, 1.0)
    rotated = cv2.warpAffine(
        gray, matrix, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE
    )
    ok, encoded = cv2.imencode(".png", rotated)
    return encoded.tobytes() if ok else data
