import { z } from "zod";

export const cepParamSchema = z.object({
  cep: z.string().regex(/^\d{5}-?\d{3}$/, "CEP must be in format 00000-000"),
});

export const reverseQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});
