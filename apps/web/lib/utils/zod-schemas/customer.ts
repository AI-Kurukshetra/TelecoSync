import { z } from "zod";

export const customerSchema = z.object({
  accountNumber: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional()
});
