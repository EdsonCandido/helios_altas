import type { Request, Response } from "express";
import { sendData } from "../../utils/http.js";
import { changePasswordSchema, updateClientSchema, updateProfileSchema } from "../auth/auth.schemas.js";
import { userRepository } from "./user.repository.js";
import { updateUserProfile } from "./update-user-profile.service.js";

export class UserController {
  async updateMe(req: Request, res: Response) {
    const input = updateProfileSchema.parse(req.body);
    const result = await updateUserProfile.execute(req.authUser!.id, input);
    return sendData(res, result);
  }

  async changePassword(req: Request, res: Response) {
    const input = changePasswordSchema.parse(req.body);
    await updateUserProfile.changePassword(req.authUser!.id, input);
    return sendData(res, { ok: true });
  }

  async getClientMe(req: Request, res: Response) {
    const client = await userRepository.findClientByUserId(req.authUser!.id);
    return sendData(res, client);
  }

  async updateClientMe(req: Request, res: Response) {
    const input = updateClientSchema.parse(req.body);
    const client = await userRepository.updateClient(req.authUser!.id, {
      homeAddress: input.homeAddress,
      homeCity: input.homeCity,
      homeState: input.homeState,
      homeNeighborhood: input.homeNeighborhood,
      homeLatitude: input.homeLatitude !== undefined ? String(input.homeLatitude) : undefined,
      homeLongitude: input.homeLongitude !== undefined ? String(input.homeLongitude) : undefined,
    });
    return sendData(res, client);
  }
}

export const userController = new UserController();
