import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  category: z.string().optional(),
  price: z.number().nonnegative().optional(),
  currency: z.string().length(3).optional(),
  billingCycle: z.string().optional(),
  lifecycleStatus: z.string().optional(),
  version: z.string().optional()
});
