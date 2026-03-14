export type IntegrationConnector = {
  id: string;
  tenantId: string;
  name: string;
  connectorType: "rest" | "sftp" | "smtp" | "custom";
  enabled: boolean;
};
