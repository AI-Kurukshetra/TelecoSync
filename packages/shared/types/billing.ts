export type Invoice = {
  id: string;
  tenantId: string;
  accountId: string;
  invoiceNumber: string;
  total: string;
  status: "draft" | "issued" | "paid" | "void";
};
