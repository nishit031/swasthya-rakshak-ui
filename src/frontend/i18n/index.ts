import { en, type Translation } from "./en";
import { hi } from "./hi";

export type Language = "en" | "hi";

export const translations: Record<Language, Translation> = { en, hi };

export type { Translation } from "./en";
