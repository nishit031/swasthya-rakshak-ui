"use client";

import { Pill } from "lucide-react";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";
import { computeCourse, parseMedicines } from "@/backend/features/prescriptions/medicine";

interface MedicineListProps {
  medicinesJson: unknown;
}

/** Renders a prescription's medicines, structured schedule when available, name-only for legacy records. */
export function MedicineList({ medicinesJson }: MedicineListProps) {
  const { t, formatMessage } = useTranslation();
  const medicines = parseMedicines(medicinesJson);

  if (medicines.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {medicines.map((medicine, i) => {
        const { perDay, durationDays } = computeCourse(medicine);
        if (perDay === 0) {
          return (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-full bg-success-100 px-3 py-1 text-xs font-medium text-success-700 dark:bg-success-900/40 dark:text-success-300"
            >
              <Pill size={12} />
              {medicine.name}
            </span>
          );
        }

        const slots = medicine.doses
          .map(
            (d) =>
              `${t(`medicine.slots.${d.slot}`)} (${t(`medicine.${d.food === "before" ? "beforeFood" : "afterFood"}`)})`
          )
          .join(", ");

        return (
          <div
            key={i}
            className="flex flex-col gap-1 rounded-lg bg-success-50 px-3 py-2 text-xs text-success-800 dark:bg-success-900/30 dark:text-success-200"
          >
            <span className="inline-flex items-center gap-1 font-semibold">
              <Pill size={12} />
              {medicine.name}
              {medicine.quantity ? ` · ${medicine.quantity}` : ""}
            </span>
            <span>{slots}</span>
            <span className="text-success-600 dark:text-success-400">
              {formatMessage("medicine.perDay", { n: perDay })}
              {durationDays !== null &&
                ` · ${formatMessage("medicine.dayCourse", { n: durationDays })}`}
            </span>
          </div>
        );
      })}
    </div>
  );
}
