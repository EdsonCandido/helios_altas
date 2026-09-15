import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(8).max(20),
  password: z.string().min(8).max(72),
  role: z.enum(["CLIENT", "PARTNER"]),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  phone: z.string().min(8).max(20).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(72),
});

export const updateClientSchema = z.object({
  homeAddress: z.string().max(255).optional(),
  homeCity: z.string().max(120).optional(),
  homeState: z.string().max(2).optional(),
  homeNeighborhood: z.string().max(120).optional(),
  homeLatitude: z.number().min(-90).max(90).optional(),
  homeLongitude: z.number().min(-180).max(180).optional(),
});
