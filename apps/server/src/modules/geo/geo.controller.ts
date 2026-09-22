import type { Request, Response } from "express";
import { sendData } from "../../utils/http.js";
import { cepParamSchema, reverseQuerySchema } from "./geo.schemas.js";
import { geoService } from "./geo.service.js";

export class GeoController {
  async lookupCep(req: Request, res: Response) {
    const { cep } = cepParamSchema.parse({ cep: req.params.cep });
    const result = await geoService.lookupCep(cep);
    return sendData(res, result);
  }

  async reverse(req: Request, res: Response) {
    const { lat, lng } = reverseQuerySchema.parse(req.query);
    const result = await geoService.reverse(lat, lng);
    return sendData(res, result);
  }
}

export const geoController = new GeoController();
