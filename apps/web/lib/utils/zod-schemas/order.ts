import { z } from "zod";

export const orderSchema = z.object({
  customerId: z.string().uuid(),
  orderType: z.enum(["new", "modify", "cancel", "suspend"]),
  items: z.array(z.record(z.unknown())).min(1)
});
