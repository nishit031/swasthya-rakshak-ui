import {
  Stethoscope,
  ScanLine,
  Pill,
  Syringe,
  Receipt,
  Folder,
  type LucideIcon
} from "lucide-react";
import type { BadgeTone } from "@/frontend/components/ui/Badge";
import type { DocGroup } from "@/backend/features/medical-records/document-types";

// Presentational mapping from a document group to its icon/tone — kept separate from
// document-types.ts so that registry stays server-safe (no lucide-react import there).
export const GROUP_UI: Record<DocGroup, { icon: LucideIcon; tone: BadgeTone; chip: string }> = {
  clinical: {
    icon: Stethoscope,
    tone: "blue",
    chip: "bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300"
  },
  imaging: {
    icon: ScanLine,
    tone: "gray",
    chip: "bg-secondary-100 text-secondary-600 dark:bg-secondary-900/40 dark:text-secondary-300"
  },
  medication: {
    icon: Pill,
    tone: "green",
    chip: "bg-success-100 text-success-600 dark:bg-success-900/40 dark:text-success-300"
  },
  procedure: {
    icon: Syringe,
    tone: "amber",
    chip: "bg-warning-100 text-warning-600 dark:bg-warning-900/40 dark:text-warning-300"
  },
  administrative: {
    icon: Receipt,
    tone: "red",
    chip: "bg-error-100 text-error-600 dark:bg-error-900/40 dark:text-error-300"
  },
  other: {
    icon: Folder,
    tone: "gray",
    chip: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
  }
};
