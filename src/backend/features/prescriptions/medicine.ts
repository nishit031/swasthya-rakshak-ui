export const MEAL_SLOTS = ["morning", "afternoon", "evening", "night"] as const;
export type MealSlot = (typeof MEAL_SLOTS)[number];
export type FoodTiming = "before" | "after";

export interface MedicineDose {
  slot: MealSlot;
  food: FoodTiming;
}

export interface Medicine {
  name: string;
  quantity?: number;
  doses: MedicineDose[];
}

export const DEFAULT_DOSES: MedicineDose[] = [
  { slot: "morning", food: "after" },
  { slot: "night", food: "after" }
];

function isMealSlot(value: unknown): value is MealSlot {
  return typeof value === "string" && (MEAL_SLOTS as readonly string[]).includes(value);
}

function isFoodTiming(value: unknown): value is FoodTiming {
  return value === "before" || value === "after";
}

// Accepts both the new structured shape and the legacy `{ name }` shape written before
// the medicine schedule existed, so old prescriptions keep rendering without a migration.
export function normalizeMedicine(raw: unknown): Medicine {
  const source = (raw ?? {}) as Record<string, unknown>;
  const name = typeof source.name === "string" ? source.name : "";
  const quantity =
    typeof source.quantity === "number" && Number.isFinite(source.quantity) && source.quantity > 0
      ? source.quantity
      : undefined;
  const doses = Array.isArray(source.doses)
    ? source.doses
        .filter((d): d is Record<string, unknown> => typeof d === "object" && d !== null)
        .map((d) => ({
          slot: isMealSlot(d.slot) ? d.slot : "morning",
          food: isFoodTiming(d.food) ? d.food : "after"
        }))
    : [];

  return { name, quantity, doses };
}

export function parseMedicines(json: unknown): Medicine[] {
  if (!json || !Array.isArray(json)) return [];
  return json.map(normalizeMedicine).filter((m) => m.name);
}

// Total doses/day and, if quantity is known, how many days the course lasts.
export function computeCourse(medicine: Medicine): { perDay: number; durationDays: number | null } {
  const perDay = medicine.doses.length;
  const durationDays =
    medicine.quantity && perDay > 0 ? Math.ceil(medicine.quantity / perDay) : null;
  return { perDay, durationDays };
}
