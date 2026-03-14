import { z } from "zod";

export const webhookSubscriptionSchema = z.object({
  name: z.string().min(1),
  targetUrl: z.string().url(),
  eventTypes: z.array(z.string().min(1)).min(1),
  headers: z.record(z.string()).optional(),
  secret: z.string().min(8).optional(),
  enabled: z.boolean().optional()
});

export const connectorSchema = z.object({
  name: z.string().min(2),
  connectorType: z.enum(["rest", "sftp", "smtp", "custom"]),
  direction: z.enum(["inbound", "outbound", "bidirectional"]),
  systemType: z.string().min(2),
  config: z.record(z.unknown()).default({}),
  enabled: z.boolean().optional()
});

export const apiRegistrySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  version: z.string().min(1),
  standard: z.string().optional(),
  baseUrl: z.string().url(),
  specUrl: z.string().url().optional(),
  authType: z.string().default("bearer"),
  status: z.string().default("active"),
  ownerTeam: z.string().optional()
});
