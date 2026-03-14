import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  next: z.string().optional()
});

export const forgotPasswordSchema = z.object({
  email: z.string().email()
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8)
});

export const registerSchema = z.object({
  role: z.enum(["admin", "inventory_manager", "customer"]),
  fullName: z.string().min(2),
  department: z.string().min(2).optional(),
  email: z.string().email(),
  password: z.string().min(8),
  tenantName: z.string().min(2).optional(),
  tenantSlug: z
    .string()
    .min(3)
    .regex(/^[a-z0-9-]+$/, "Tenant slug must use lowercase letters, numbers, and hyphens."),
  phone: z.string().min(7).optional()
}).superRefine((value, context) => {
  if (value.role === "admin" && !value.tenantName) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Tenant name is required for administrator signup.",
      path: ["tenantName"]
    });
  }

  if ((value.role === "admin" || value.role === "inventory_manager") && !value.department) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Department is required for staff signup.",
      path: ["department"]
    });
  }
});
