export type Gender = "male" | "female" | "other";

// Step 1 of registration — collected before the OTP is sent.
export interface RegisterInput {
  fullName: string;
  phone: string;
  password: string;
  gender: Gender;
}

// Step 1 of doctor registration — same base fields plus optional professional details.
export interface DoctorRegisterInput {
  fullName: string;
  phone: string;
  password: string;
  specialization?: string;
  licenseNumber?: string;
  clinicName?: string;
}

// Step 2 of registration / OTP login — the code the user received.
export interface VerifyOtpInput {
  phone: string;
  otp: string;
}

// Login option 1 — phone + password.
export interface LoginInput {
  phone: string;
  password: string;
}

// The two signed tokens returned after a successful login or verification.
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Mirrors SubscriptionService::entitlementsFor on the backend — sent as part of
// AuthUser.subscription so the dashboard knows what's unlocked without a second request.
export interface Entitlements {
  planCode: "free" | "individual" | "family";
  status: string;
  features: string[];
  periodEnd: string | null;
  memberCount: number;
}

// The safe-to-expose view of a user (no password hash, no internal flags).
export interface AuthUser {
  id: string;
  fullName: string;
  phone: string;
  role: "patient" | "doctor" | "admin";
  subscription?: Entitlements;
}

// Returned by the OTP-request endpoints. `devCode` is only populated in local dev
// (console SMS provider) so testing doesn't need a real text message.
export interface OtpRequestResult {
  devCode?: string;
}
