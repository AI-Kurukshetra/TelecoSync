export type RevenueAssuranceJob = {
  id: string;
  tenantId: string;
  status: "pending" | "running" | "completed" | "failed";
  leakagePct?: string;
};
