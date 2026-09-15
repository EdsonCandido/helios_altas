import type { Request, Response } from "express";
import { sendData } from "../../utils/http.js";
import { refreshCookieOptions } from "../../utils/tokens.js";
import { updateUserProfile } from "../users/update-user-profile.service.js";
import { loginSchema, registerSchema } from "./auth.schemas.js";
import { registerUser } from "./register-user.service.js";

function setRefreshCookie(res: Response, token: string): void {
  res.cookie("refreshToken", token, refreshCookieOptions());
}

export class AuthController {
  async register(req: Request, res: Response) {
    const input = registerSchema.parse(req.body);
    const result = await registerUser.execute(input);
    setRefreshCookie(res, result.refreshToken);
    return sendData(res, { user: result.user, accessToken: result.accessToken }, 201);
  }

  async login(req: Request, res: Response) {
    const input = loginSchema.parse(req.body);
    const result = await registerUser.login(input);
    setRefreshCookie(res, result.refreshToken);
    return sendData(res, { user: result.user, accessToken: result.accessToken });
  }

  async refresh(req: Request, res: Response) {
    const token = req.cookies.refreshToken as string | undefined;
    const result = await registerUser.refresh(token ?? "");
    setRefreshCookie(res, result.refreshToken);
    return sendData(res, { user: result.user, accessToken: result.accessToken });
  }

  async logout(req: Request, res: Response) {
    await registerUser.logout(req.cookies.refreshToken as string | undefined);
    res.clearCookie("refreshToken", refreshCookieOptions());
    return sendData(res, { ok: true });
  }

  async me(req: Request, res: Response) {
    const result = await updateUserProfile.me(req.authUser!.id);
    return sendData(res, result);
  }
}

export const authController = new AuthController();
