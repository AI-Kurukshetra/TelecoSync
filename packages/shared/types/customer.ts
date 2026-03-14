export type Customer = {
  id: string;
  tenantId: string;
  accountNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status: "active" | "inactive";
};
