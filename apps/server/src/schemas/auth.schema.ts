import { z } from "zod";

export const loginSchema = z.object({
  organizationId: z.string().uuid().optional(),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8),
});

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  name: z.string().trim().min(2).max(100),
  password: z
    .string()
    .min(8, "password must be at least 8 characters")
    .max(128, "password must be at most 128 characters"),
  organizationName: z.string().trim().min(2).max(100),
});
