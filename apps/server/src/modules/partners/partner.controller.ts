import type { Request, Response } from "express";
import { sendData } from "../../utils/http.js";
import { findNearbyPartners } from "./find-nearby-partners.service.js";
import {
  nearbyQuerySchema,
  partnerAvailabilitySchema,
  partnerServicesSchema,
  updatePartnerSchema,
} from "./partner.schemas.js";
import { updatePartner } from "./update-partner.service.js";

export class PartnerController {
  async me(req: Request, res: Response) {
    const result = await updatePartner.me(req.authUser!.id);
    return sendData(res, result);
  }

  async updateMe(req: Request, res: Response) {
    const input = updatePartnerSchema.parse(req.body);
    const result = await updatePartner.execute(req.authUser!.id, input);
    return sendData(res, result);
  }

  async availability(req: Request, res: Response) {
    const input = partnerAvailabilitySchema.parse(req.body);
    const result = await updatePartner.setAvailability(req.authUser!.id, input);
    return sendData(res, result);
  }

  async services(req: Request, res: Response) {
    const input = partnerServicesSchema.parse(req.body);
    const result = await updatePartner.setServices(req.authUser!.id, input.items);
    return sendData(res, result);
  }

  async nearby(req: Request, res: Response) {
    const input = nearbyQuerySchema.parse(req.query);
    const result = await findNearbyPartners.execute(input);
    return sendData(res, result);
  }

  async publicProfile(req: Request, res: Response) {
    const origin =
      req.query.latitude && req.query.longitude
        ? {
            latitude: Number(req.query.latitude),
            longitude: Number(req.query.longitude),
          }
        : undefined;
    const result = await findNearbyPartners.publicProfile(req.params.id!, origin);
    return sendData(res, result);
  }
}

export const partnerController = new PartnerController();
