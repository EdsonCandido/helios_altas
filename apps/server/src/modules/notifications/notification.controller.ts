import type { Request, Response } from "express";
import { sendData } from "../../utils/http.js";
import { notificationService } from "./notification.service.js";

export class NotificationController {
  async list(req: Request, res: Response) {
    const result = await notificationService.list(req.authUser!.id);
    return sendData(res, result);
  }

  async read(req: Request, res: Response) {
    const result = await notificationService.markRead(req.authUser!.id, req.params.id!);
    return sendData(res, result);
  }

  async readAll(req: Request, res: Response) {
    await notificationService.markAllRead(req.authUser!.id);
    return sendData(res, { ok: true });
  }
}

export const notificationController = new NotificationController();
