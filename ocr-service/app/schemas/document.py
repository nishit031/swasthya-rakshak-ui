"""Unified OCR document schema — the single source of truth for what the service returns.

Any extraction engine (PaddleOCR today, a GPU VLM later) normalizes into `OcrDocument`, so the
consuming backend never changes when the engine does. Every extracted field carries confidence
and provenance; the original text is always preserved.
"""

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel

# [x0, y0, x1, y1] in pixel coordinates of the rendered page. All-zero means "no layout info"
# (e.g. text pulled from a PDF text layer, which has no reliable bounding boxes).
BBox = list[float]


class StructureTier(str, Enum):
    structured = "structured"
    semi_structured = "semi_structured"
    unstructured = "unstructured"


class DocGroup(str, Enum):
    clinical = "clinical"
    imaging = "imaging"
    medication = "medication"
    procedure = "procedure"
    administrative = "administrative"
    other = "other"


class RouteDecision(str, Enum):
    pdf_text = "pdf_text"
    paddleocr = "paddleocr"
    image_analysis = "image_analysis"
    gpu_vlm = "gpu_vlm"


class Word(BaseModel):
    text: str
    bbox: BBox
    confidence: float


class Line(BaseModel):
    text: str
    bbox: BBox
    confidence: float
    words: list[Word] = []


class Block(BaseModel):
    text: str
    bbox: BBox
    confidence: float
    lines: list[Line] = []


class Page(BaseModel):
    page: int
    width: float
    height: float
    blocks: list[Block] = []


class Document(BaseModel):
    text: str
    pages: list[Page] = []


class Source(BaseModel):
    filename: str
    mime_type: str
    size_bytes: int
    page_count: int
    sha256: str


class Processing(BaseModel):
    received_at: str
    completed_at: str
    duration_ms: int
    engine: str
    engine_version: str
    pipeline: list[str]


class Classification(BaseModel):
    structure_tier: StructureTier
    doc_group_hint: DocGroup
    is_medical_image: bool
    confidence: float


class Routing(BaseModel):
    decision: RouteDecision
    reason: str
    escalated: bool


class Provenance(BaseModel):
    page: int
    bbox: BBox


class ExtractedField(BaseModel):
    name: str
    value: str
    unit: str | None = None
    reference_range: str | None = None
    flag: str | None = None  # lab abnormal flag: high | low | normal
    # Extra structured attributes that don't fit the flat value shape — e.g. a medication's
    # dose/frequency/route/duration, or an admin field's raw label. Absent for simple value rows.
    attributes: dict[str, str] | None = None
    # Set when this field's OCR confidence is below the escalation threshold — a "review me" hint.
    low_confidence: bool = False
    confidence: float
    provenance: Provenance


class Fields(BaseModel):
    kind: str  # "lab" | "billing" | "none"
    items: list[ExtractedField] = []


class ConfidenceSummary(BaseModel):
    ocr_mean: float
    ocr_min: float


class OcrDocument(BaseModel):
    schema_version: str = "1.0"
    request_id: str
    job_id: str
    source: Source
    processing: Processing
    classification: Classification
    routing: Routing
    document: Document
    fields: Fields
    confidence: ConfidenceSummary
    warnings: list[str] = []
