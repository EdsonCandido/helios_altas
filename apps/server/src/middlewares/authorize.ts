import type { NextFunction, Request, Response } from "express";
import { ForbiddenError, UnauthorizedError } from "../utils/errors.js";

export function authorize(...roles: Array<"CLIENT" | "PARTNER" | "ADMIN">) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.authUser) {
      next(new UnauthorizedError());
      return;
    }

    if (!roles.includes(req.authUser.role)) {
      next(new ForbiddenError());
      return;
    }

    next();
  };
}
