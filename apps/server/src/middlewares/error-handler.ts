import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/errors.js";
import { sendError } from "../utils/http.js";
import { logger } from "../utils/logger.js";

const fieldLabels: Record<string, string> = {
  categoryId: "Categoria",
  description: "Descrição do problema",
  address: "Endereço",
  addressNumber: "Número",
  city: "Cidade",
  state: "UF",
  neighborhood: "Bairro",
  latitude: "Latitude",
  longitude: "Longitude",
  isHomeService: "Atendimento na residência",
  cep: "CEP",
  reason: "Motivo",
  serviceRadiusMeters: "Raio de atendimento",
};

function formatZodMessage(error: ZodError): {
  message: string;
  details: Array<{ field: string; message: string }>;
} {
  const details = error.issues.map((issue) => {
    const field = issue.path.map(String).join(".") || "form";
    return { field, message: issue.message };
  });

  const first = details[0];
  if (!first) {
    return { message: "Dados inválidos.", details: [] };
  }

  const label = fieldLabels[first.field] ?? first.field;
  return {
    message: `${label}: ${first.message}`,
    details,
  };
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof ZodError) {
    const formatted = formatZodMessage(error);
    sendError(res, "VALIDATION_ERROR", formatted.message, 400, formatted.details);
    return;
  }

  if (error instanceof AppError) {
    sendError(res, error.code, error.message, error.statusCode);
    return;
  }

  logger.error({ err: error }, "Unhandled error");
  sendError(res, "INTERNAL_ERROR", "Unexpected error.", 500);
}
