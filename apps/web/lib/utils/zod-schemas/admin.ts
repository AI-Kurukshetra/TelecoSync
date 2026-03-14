import { z } from "zod";

export const roleSchema = z.object({
  name: z.string().min(2),
  permissions: z.record(z.array(z.string())).default({})
});

export const tenantSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/),
  plan: z.string().default("starter"),
  status: z.string().default("active")
});

export const workflowSchema = z.object({
  name: z.string().min(2),
  triggerType: z.string().min(2),
  steps: z.array(z.record(z.unknown())).min(1),
  status: z.string().default("active")
});

export const notificationSchema = z.object({
  userId: z.string().uuid().optional(),
  channel: z.enum(["email", "sms", "in_app"]),
  title: z.string().min(2),
  body: z.string().optional()
});

export const documentSchema = z.object({
  entityType: z.string().optional(),
  entityId: z.string().uuid().optional(),
  name: z.string().min(2),
  storagePath: z.string().min(2).optional(),
  mimeType: z.string().optional(),
  sizeBytes: z.number().int().nonnegative().optional()
});
