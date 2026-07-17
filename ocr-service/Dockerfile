FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

# System libs Paddle + OpenCV need at runtime (pypdfium2 bundles its own).
RUN apt-get update && apt-get install -y --no-install-recommends \
        libgl1 libglib2.0-0 libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /srv

COPY requirements.txt .
RUN pip install -r requirements.txt

# Pre-bake the PaddleOCR models into the image so the running container needs no network —
# "no cloud dependency" holds at runtime. This is the slow build step.
# pyclipper must import before paddle — see the comment in app/ocr/paddle_engine.py.
RUN python -c "import pyclipper; from paddleocr import PaddleOCR; PaddleOCR(use_angle_cls=True, lang='en', show_log=False)"

COPY app ./app

EXPOSE 8000
# ponytail: single uvicorn worker for the pilot — the in-memory job store assumes one process.
# Scale to multiple workers only alongside a shared (Redis) job store; see services/jobs.py.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
