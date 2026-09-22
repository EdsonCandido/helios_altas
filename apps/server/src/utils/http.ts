import type { Response } from "express";

export function sendData<T>(res: Response, data: T, status = 200): Response {
  return res.status(status).json({ data });
}

export function sendError(
  res: Response,
  code: string,
  message: string,
  status: number,
  details?: unknown,
): Response {
  return res.status(status).json({
    error: details === undefined ? { code, message } : { code, message, details },
  });
}
