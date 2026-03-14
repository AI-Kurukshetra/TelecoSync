import { z } from "zod";

export const invoiceSchema = z.object({
  accountId: z.string().uuid(),
  billingPeriodStart: z.string().datetime(),
  billingPeriodEnd: z.string().datetime(),
  subtotal: z.number().nonnegative().optional(),
  tax: z.number().nonnegative().optional(),
  total: z.number().nonnegative().optional(),
  dueDate: z.string().optional()
});

export const paymentSchema = z.object({
  invoiceId: z.string().uuid(),
  amount: z.number().nonnegative(),
  currency: z.string().length(3).optional(),
  method: z.string().min(2).optional(),
  status: z.string().min(2).optional(),
  gatewayReference: z.string().optional(),
  paidAt: z.string().datetime().optional()
});
