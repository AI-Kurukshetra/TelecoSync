import { z } from "zod";

export const revenueAssuranceJobSchema = z.object({
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime()
});
