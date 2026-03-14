export type Order = {
  id: string;
  tenantId: string;
  customerId: string;
  orderNumber: string;
  orderType: "new" | "modify" | "cancel" | "suspend";
  status: "pending" | "in_progress" | "completed" | "cancelled";
};
