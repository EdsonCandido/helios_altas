import type { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "../utils/errors.js";
import { verifyAccessToken } from "../utils/tokens.js";

export type AuthUser = {
  id: string;
  role: "CLIENT" | "PARTNER" | "ADMIN";
};

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    next(new UnauthorizedError());
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.authUser = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired token."));
  }
}

export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    next();
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.authUser = { id: payload.sub, role: payload.role };
  } catch {
    // Public endpoints ignore invalid tokens.
  }

  next();
}
