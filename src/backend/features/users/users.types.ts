// Optional per-meal clock times ("HH:MM", 24-hour) the patient eats on, used to anchor
// medicine reminder times instead of the fixed defaults. Any field left unset falls back
// to the app default for that meal slot. `wakeUp`/`bedtime` are display-only for now — no
// medicine dose slot maps to either, so they don't feed reminder generation yet.
export interface MealTimings {
  wakeUp?: string;
  breakfast?: string;
  lunch?: string;
  highTea?: string;
  dinner?: string;
  bedtime?: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  phone: string;
  dateOfBirth: Date | null;
  gender: string | null;
  profilePhoto: string | null;
  bloodGroup: string | null;
  mealTimings: MealTimings | null;
  aiConsent: boolean; // whether the user has consented to AI-processing their records (DPDPA)
}

// Phone is the verified identity, so it is intentionally NOT editable here
// (changing it would require a fresh OTP verification flow).
export interface UpdateProfileInput {
  fullName?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  mealTimings?: MealTimings;
  aiConsent?: boolean; // true = grant AI-processing consent, false = revoke
}
