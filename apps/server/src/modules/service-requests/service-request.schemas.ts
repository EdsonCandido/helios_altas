import { z } from "zod";

export const createServiceRequestSchema = z.object({
  categoryId: z.string({ required_error: "Selecione uma categoria." }).uuid("Categoria inválida."),
  description: z
    .string({ required_error: "Informe a descrição do problema." })
    .min(10, "Deve ter pelo menos 10 caracteres.")
    .max(2000, "Deve ter no máximo 2000 caracteres."),
  address: z
    .string({ required_error: "Informe o endereço." })
    .min(3, "Deve ter pelo menos 3 caracteres.")
    .max(255, "Deve ter no máximo 255 caracteres."),
  addressNumber: z
    .string({ required_error: "Informe o número da residência." })
    .min(1, "Informe o número da residência.")
    .max(20, "Deve ter no máximo 20 caracteres."),
  city: z
    .string({ required_error: "Informe a cidade." })
    .min(2, "Deve ter pelo menos 2 caracteres.")
    .max(120, "Deve ter no máximo 120 caracteres."),
  state: z
    .string({ required_error: "Informe a UF." })
    .min(2, "Informe a UF com 2 letras.")
    .max(2, "Informe a UF com 2 letras."),
  neighborhood: z.string().max(120, "Deve ter no máximo 120 caracteres.").optional(),
  latitude: z.number({ required_error: "Informe o local no mapa.", invalid_type_error: "Local inválido." }).min(-90).max(90),
  longitude: z
    .number({ required_error: "Informe o local no mapa.", invalid_type_error: "Local inválido." })
    .min(-180)
    .max(180),
  isHomeService: z.boolean({ required_error: "Informe se é atendimento na residência." }),
});

export const rejectServiceRequestSchema = z.object({
  reason: z
    .string({ required_error: "Informe o motivo da recusa." })
    .min(3, "Deve ter pelo menos 3 caracteres.")
    .max(500, "Deve ter no máximo 500 caracteres."),
});
