import type { Request, Response } from "express";
import { sendData } from "../../utils/http.js";
import { categoryRepository } from "./category.repository.js";

export class CategoryController {
  async list(_req: Request, res: Response) {
    return sendData(res, await categoryRepository.listActive());
  }
}

export const categoryController = new CategoryController();
