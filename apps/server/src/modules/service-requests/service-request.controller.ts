import type { Request, Response } from "express";
import { sendData } from "../../utils/http.js";
import { acceptServiceRequest } from "./accept-service-request.service.js";
import { cancelServiceRequest } from "./cancel-service-request.service.js";
import { createServiceRequest } from "./create-service-request.service.js";
import { getServiceRequest } from "./get-service-request.service.js";
import { progressServiceRequest } from "./progress-service-request.service.js";
import { rejectServiceRequest } from "./reject-service-request.service.js";
import { createServiceRequestSchema, rejectServiceRequestSchema } from "./service-request.schemas.js";

export class ServiceRequestController {
  async create(req: Request, res: Response) {
    const input = createServiceRequestSchema.parse(req.body);
    const result = await createServiceRequest.execute(req.authUser!.id, input);
    return sendData(res, result, 201);
  }

  async list(req: Request, res: Response) {
    const result = await getServiceRequest.list(req.authUser!);
    return sendData(res, result);
  }

  async get(req: Request, res: Response) {
    const result = await getServiceRequest.execute(req.authUser!, req.params.id!);
    return sendData(res, result);
  }

  async cancel(req: Request, res: Response) {
    const result = await cancelServiceRequest.execute(req.authUser!.id, req.params.id!);
    return sendData(res, result);
  }

  async accept(req: Request, res: Response) {
    const result = await acceptServiceRequest.execute(req.authUser!.id, req.params.id!);
    return sendData(res, result);
  }

  async reject(req: Request, res: Response) {
    const input = rejectServiceRequestSchema.parse(req.body);
    const result = await rejectServiceRequest.execute(req.authUser!.id, req.params.id!, input.reason);
    return sendData(res, result);
  }

  async start(req: Request, res: Response) {
    const result = await progressServiceRequest.start(req.authUser!.id, req.params.id!);
    return sendData(res, result);
  }

  async complete(req: Request, res: Response) {
    const result = await progressServiceRequest.complete(req.authUser!.id, req.params.id!);
    return sendData(res, result);
  }
}

export const serviceRequestController = new ServiceRequestController();
