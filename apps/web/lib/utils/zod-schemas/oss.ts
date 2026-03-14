import { z } from "zod";

export const networkElementSchema = z.object({
  name: z.string().min(2),
  type: z.string().min(2),
  vendorId: z.string().uuid().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  ipAddress: z.string().optional(),
  locationId: z.string().uuid().optional(),
  status: z.string().default("active")
});

export const networkInterfaceSchema = z.object({
  networkElementId: z.string().uuid(),
  interfaceName: z.string().min(2),
  type: z.string().optional(),
  bandwidthMbps: z.number().int().nonnegative().optional(),
  status: z.string().default("active")
});

export const assetSchema = z.object({
  name: z.string().min(2),
  assetType: z.string().optional(),
  status: z.string().default("active"),
  locationId: z.string().uuid().optional(),
  assignedTo: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).default({})
});

export const serviceInstanceSchema = z.object({
  customerId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  networkElementId: z.string().uuid().optional(),
  status: z.string().default("pending"),
  config: z.record(z.unknown()).default({})
});

export const ticketSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  severity: z.enum(["critical", "major", "minor", "info"]),
  networkElementId: z.string().uuid().optional(),
  serviceInstanceId: z.string().uuid().optional()
});

export const alarmSchema = z.object({
  networkElementId: z.string().uuid().optional(),
  severity: z.enum(["critical", "major", "minor", "info"]),
  description: z.string().optional(),
  source: z.string().optional(),
  status: z.string().default("active")
});

export const slaSchema = z.object({
  name: z.string().min(2),
  metricType: z.string().min(2),
  targetValue: z.number().nonnegative().optional(),
  measurementWindow: z.string().optional(),
  penalty: z.record(z.unknown()).default({})
});
