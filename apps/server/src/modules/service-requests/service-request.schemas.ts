import { z } from "zod";

export const createServiceRequestSchema = z.object({
  categoryId: z.string().uuid(),
  description: z.string().min(10).max(2000),
  address: z.string().min(3).max(255),
  city: z.string().min(2).max(120),
  state: z.string().min(2).max(2),
  neighborhood: z.string().max(120).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  isHomeService: z.boolean(),
});

export const rejectServiceRequestSchema = z.object({
  reason: z.string().min(3).max(500),
});
