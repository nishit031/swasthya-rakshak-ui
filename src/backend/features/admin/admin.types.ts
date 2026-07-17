// Mirrors AdminService::toUserSummary / getUser (app/Services/Admin/AdminService.php) —
// whitelisted fields only, never a health table.
export interface AdminUserSummary {
  id: string;
  fullName: string;
  phone: string;
  role: "patient" | "doctor" | "admin";
  phoneVerified: boolean;
  suspendedAt: string | null;
  createdAt: string;
}

export interface AdminUserDetail extends AdminUserSummary {
  subscription: {
    planCode: string;
    status: string;
    features: string[];
    periodEnd: string | null;
    memberCount: number;
  };
  counts: {
    familyMembers: number;
    medicalRecords: number;
    labReports: number;
    prescriptions: number;
  };
}

export interface AdminSubscriptionRow {
  id: string;
  userId: string;
  planCode: string;
  status: string;
  memberCount: number;
  unitPriceInPaise: number;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  user?: { id: string; fullName: string; phone: string };
}

export interface AdminPaymentRow {
  id: string;
  userId: string;
  planCode: string;
  amountInPaise: number;
  status: string;
  gatewayProvider: string;
  createdAt: string;
  user?: { id: string; fullName: string; phone: string };
}

export interface AdminMetrics {
  activeSubscriptionsByPlan: Record<string, { count: number; revenueInPaise: number }>;
  mrrInPaise: number;
  totalUsers: number;
  signupsLast30Days: number;
}

export interface AuditLogRow {
  id: string;
  userId: string;
  actorId: string | null;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  createdAt: string;
}

export interface ImpersonationResult {
  accessToken: string;
  expiresInSeconds: number;
  phiMode: "redacted";
}
