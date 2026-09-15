import { z } from "zod";

export const updatePartnerSchema = z.object({
  description: z.string().min(10).max(2000).optional(),
  address: z.string().min(3).max(255).optional(),
  city: z.string().min(2).max(120).optional(),
  state: z.string().min(2).max(2).optional(),
  neighborhood: z.string().min(2).max(120).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  serviceRadiusMeters: z.number().int().min(500).max(100_000).optional(),
});

export const partnerAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
  windows: z.array(
    z.object({
      weekday: z.number().int().min(0).max(6),
      startMinutes: z.number().int().min(0).max(1440),
      endMinutes: z.number().int().min(0).max(1440),
    }),
  ),
});

export const partnerServicesSchema = z.object({
  items: z.array(
    z.object({
      categoryId: z.string().uuid(),
      minimumVisitFeeCents: z.number().int().min(0),
      isActive: z.boolean(),
    }),
  ),
});

export const nearbyQuerySchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  radiusMeters: z.coerce.number().int().min(500).max(100_000).optional(),
  categoryId: z.string().uuid().optional(),
  availableOnly: z.coerce.boolean().optional(),
});
