// Shape of a Medicine catalog row as returned by the backend (`/medicines`, `/admin/medicines`).
// Mirrors App\Models\Medicine — note `embeddingJson` is intentionally hidden by the backend and is
// never present here; `embeddingModel` (a label) is exposed so admins can see whether a row is
// embedded and with which model.
export type MedicineSource = "seed" | "admin" | "stub";

export interface Medicine {
  id: string;
  name: string;
  normalizedName: string;
  genericName: string | null;
  brandNames: string[] | null;
  dosageForms: string[] | null;
  commonUsage: string | null;
  sideEffects: string[] | null;
  interactions: string[] | null;
  warnings: string[] | null;
  contraindications: string[] | null;
  notes: string | null;
  metadataJson: Record<string, unknown> | null;
  isVerified: boolean;
  source: MedicineSource;
  searchText: string | null;
  embeddingModel: string | null;
  createdAt: string;
  updatedAt: string;
}

// Laravel length-aware paginator envelope (the `data` field of the ApiResponse for a paginated list).
export interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// Editable monograph fields for the admin create/update form.
export interface MedicineFormValues {
  name: string;
  genericName: string;
  brandNames: string;
  dosageForms: string;
  commonUsage: string;
  sideEffects: string;
  interactions: string;
  warnings: string;
  contraindications: string;
  notes: string;
  isVerified: boolean;
}
