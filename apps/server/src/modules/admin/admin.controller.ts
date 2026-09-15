import type { Request, Response } from "express";
import { z } from "zod";
import { sendData } from "../../utils/http.js";
import { adminService } from "./admin.service.js";

const listUsersSchema = z.object({
  query: z.string().optional(),
  role: z.enum(["CLIENT", "PARTNER", "ADMIN"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

const updateUserSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]).optional(),
  isActive: z.boolean().optional(),
});

const categorySchema = z.object({
  name: z.string().min(2).max(80),
  slug: z.string().min(2).max(80),
  description: z.string().max(255).optional(),
});

const updateCategorySchema = categorySchema.partial().extend({
  isActive: z.boolean().optional(),
});

const requestFilterSchema = z.object({
  status: z
    .enum(["PENDING", "SEARCHING", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "EXPIRED"])
    .optional(),
  categoryId: z.string().uuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export class AdminController {
  async users(req: Request, res: Response) {
    const input = listUsersSchema.parse(req.query);
    return sendData(res, await adminService.listUsers(input));
  }

  async updateUser(req: Request, res: Response) {
    const input = updateUserSchema.parse(req.body);
    return sendData(res, await adminService.updateUser(req.authUser!.id, req.params.id!, input));
  }

  async categories(_req: Request, res: Response) {
    return sendData(res, await adminService.listCategories());
  }

  async createCategory(req: Request, res: Response) {
    const input = categorySchema.parse(req.body);
    return sendData(res, await adminService.createCategory(input), 201);
  }

  async updateCategory(req: Request, res: Response) {
    const input = updateCategorySchema.parse(req.body);
    return sendData(res, await adminService.updateCategory(req.params.id!, input));
  }

  async requests(req: Request, res: Response) {
    const input = requestFilterSchema.parse(req.query);
    return sendData(res, await adminService.listRequests(input));
  }

  async mapPartners(req: Request, res: Response) {
    const input = z
      .object({
        categoryId: z.string().uuid().optional(),
        available: z.coerce.boolean().optional(),
      })
      .parse(req.query);
    return sendData(res, await adminService.mapPartners(input));
  }

  async mapClusters(req: Request, res: Response) {
    const input = requestFilterSchema.parse(req.query);
    return sendData(res, await adminService.mapClusters(input));
  }

  async indicators(_req: Request, res: Response) {
    return sendData(res, await adminService.indicators());
  }
}

export const adminController = new AdminController();
