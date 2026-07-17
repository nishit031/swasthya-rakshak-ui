export type { Entitlements } from "@/backend/features/auth/auth.types";

// Mirrors SubscriptionPlan (app/Models/SubscriptionPlan.php) as returned by GET /subscription/plans.
export interface SubscriptionPlan {
  id: string;
  code: "free" | "individual" | "family";
  name: string;
  unitPriceInPaise: number;
  currency: string;
  billingInterval: string;
  perMember: boolean;
  featuresJson: string[];
  isActive: boolean;
}

// Returned by POST /subscription/checkout.
export interface CheckoutResult {
  orderId: string;
  amountInPaise: number;
  currency: string;
  provider: string;
  paymentId: string;
  planCode: string;
  memberCount: number;
}
