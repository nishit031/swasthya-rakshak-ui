# Test fixtures

Synthetic, PHI-free samples. The `.txt` files double as `curl` targets for the `text/plain` path
and back the deterministic parser tests.

To exercise the real OCR path, drop small **non-PHI** scans/photos here (e.g. `lab_scan.png`,
`prescription.jpg`, `chest_xray.jpg`) and POST them to `/v1/ocr`. Do **not** commit real patient
documents — the repo's `.gitignore` treats health data as never-commit.
