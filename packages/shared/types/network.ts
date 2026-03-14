export type NetworkElement = {
  id: string;
  tenantId: string;
  name: string;
  type: string;
  status: "active" | "inactive" | "faulted";
};
