import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/errors.js";
import { sendError } from "../utils/http.js";
import { logger } from "../utils/logger.js";

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof ZodError) {
    sendError(res, "VALIDATION_ERROR", error.issues[0]?.message ?? "Invalid input.", 400);
    return;
  }

  if (error instanceof AppError) {
    sendError(res, error.code, error.message, error.statusCode);
    return;
  }

  logger.error({ err: error }, "Unhandled error");
  sendError(res, "INTERNAL_ERROR", "Unexpected error.", 500);
}
