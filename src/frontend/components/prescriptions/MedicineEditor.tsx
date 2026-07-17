"use client";

import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/frontend/components/ui/Field";
import { Button } from "@/frontend/components/ui/Button";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";
import {
  DEFAULT_DOSES,
  MEAL_SLOTS,
  computeCourse,
  type FoodTiming,
  type MealSlot,
  type Medicine
} from "@/backend/features/prescriptions/medicine";
import { cn } from "@/frontend/components/ui/cn";

interface MedicineEditorProps {
  medicines: Medicine[];
  onChange: (medicines: Medicine[]) => void;
}

const EMPTY_MEDICINE: Medicine = { name: "", quantity: undefined, doses: [...DEFAULT_DOSES] };

/** Repeatable list of structured medicine rows: name, quantity, and a per-slot dose schedule. */
export function MedicineEditor({ medicines, onChange }: MedicineEditorProps) {
  const { t, formatMessage } = useTranslation();

  function updateRow(index: number, patch: Partial<Medicine>) {
    onChange(medicines.map((m, i) => (i === index ? { ...m, ...patch } : m)));
  }

  function toggleSlot(index: number, slot: MealSlot) {
    const row = medicines[index];
    const has = row.doses.some((d) => d.slot === slot);
    const doses = has
      ? row.doses.filter((d) => d.slot !== slot)
      : [...row.doses, { slot, food: "after" as FoodTiming }];
    updateRow(index, { doses });
  }

  function setFood(index: number, slot: MealSlot, food: FoodTiming) {
    const row = medicines[index];
    updateRow(index, { doses: row.doses.map((d) => (d.slot === slot ? { ...d, food } : d)) });
  }

  function addRow() {
    onChange([...medicines, { ...EMPTY_MEDICINE, doses: [...DEFAULT_DOSES] }]);
  }

  function removeRow(index: number) {
    onChange(medicines.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
        {t("doctor.prescriptions.medicines")}
      </label>

      {medicines.map((medicine, index) => {
        const { perDay, durationDays } = computeCourse(medicine);
        return (
          <div
            key={index}
            className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700"
          >
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
              <Input
                aria-label={t("medicine.name")}
                placeholder={t("medicine.name")}
                value={medicine.name}
                onChange={(e) => updateRow(index, { name: e.target.value })}
              />
              <Input
                aria-label={t("medicine.quantity")}
                type="number"
                min={1}
                placeholder={t("medicine.quantityPlaceholder")}
                className="sm:w-28"
                value={medicine.quantity ?? ""}
                onChange={(e) =>
                  updateRow(index, {
                    quantity: e.target.value ? Number(e.target.value) : undefined
                  })
                }
              />
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => removeRow(index)}
                aria-label={t("medicine.remove")}
              >
                <Trash2 size={16} />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {MEAL_SLOTS.map((slot) => {
                const dose = medicine.doses.find((d) => d.slot === slot);
                const active = Boolean(dose);
                return (
                  <div
                    key={slot}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                      active
                        ? "border-primary-300 bg-primary-50 dark:border-primary-700 dark:bg-primary-900/30"
                        : "border-gray-200 dark:border-gray-700"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSlot(index, slot)}
                      className={cn(
                        "font-medium",
                        active
                          ? "text-primary-700 dark:text-primary-300"
                          : "text-gray-500 dark:text-gray-400"
                      )}
                    >
                      {t(`medicine.slots.${slot}`)}
                    </button>
                    {active && (
                      <div
                        role="group"
                        aria-label={`${t(`medicine.slots.${slot}`)} food timing`}
                        className="flex items-center gap-0.5 rounded-full bg-white/70 p-0.5 dark:bg-gray-900/40"
                      >
                        {(["before", "after"] as FoodTiming[]).map((food) => (
                          <button
                            key={food}
                            type="button"
                            onClick={() => setFood(index, slot, food)}
                            className={cn(
                              "rounded-full px-2 py-1 text-xs font-medium transition-colors",
                              dose!.food === food
                                ? "bg-primary-600 text-white shadow-sm"
                                : "text-gray-500 hover:text-primary-700 dark:text-gray-400 dark:hover:text-primary-300"
                            )}
                          >
                            {t(food === "before" ? "medicine.beforeFood" : "medicine.afterFood")}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {perDay > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatMessage("medicine.perDay", { n: perDay })}
                {durationDays !== null &&
                  ` · ${formatMessage("medicine.dayCourse", { n: durationDays })}`}
              </p>
            )}
          </div>
        );
      })}

      <Button type="button" variant="outline" size="sm" onClick={addRow} className="self-start">
        <Plus size={16} /> {t("medicine.addMedicine")}
      </Button>
    </div>
  );
}
