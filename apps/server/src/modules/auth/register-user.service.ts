import { db } from "../../db/index.js";
import { AccountNotActiveError, InvalidCredentialsError, UnauthorizedError, UserAlreadyExistsError } from "../../utils/errors.js";
import { hashPassword, verifyPassword } from "../../utils/password.js";
import {
  createRefreshToken,
  hashRefreshToken,
  signAccessToken,
} from "../../utils/tokens.js";
import { env } from "../../config/env.js";
import { partnerRepository } from "../partners/partner.repository.js";
import { userRepository } from "../users/user.repository.js";
import { toPublicUser } from "./to-public-user.js";

export class RegisterUser {
  async execute(input: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: "CLIENT" | "PARTNER";
  }) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new UserAlreadyExistsError();
    }

    const passwordHash = await hashPassword(input.password);

    const user = await db.transaction(async (tx) => {
      const created = await userRepository.create(
        {
          name: input.name,
          email: input.email,
          phone: input.phone,
          passwordHash,
          role: input.role,
        },
        tx,
      );

      if (input.role === "CLIENT") {
        await userRepository.createClient(created.id, tx);
      } else {
        await partnerRepository.create(created.id, tx);
      }

      return created;
    });

    return this.issueSession(user);
  }

  async login(input: { email: string; password: string }) {
    const user = await userRepository.findByEmail(input.email);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    const valid = await verifyPassword(user.passwordHash, input.password);
    if (!valid) {
      throw new InvalidCredentialsError();
    }

    if (user.status !== "ACTIVE" || !user.isActive) {
      throw new AccountNotActiveError();
    }

    return this.issueSession(user);
  }

  async refresh(refreshToken: string) {
    const tokenHash = hashRefreshToken(refreshToken);
    const stored = await userRepository.findRefreshToken(tokenHash);

    if (!stored || stored.revokedAt || stored.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedError("Refresh token is invalid.");
    }

    const user = await userRepository.findById(stored.userId);
    if (!user || user.status !== "ACTIVE" || !user.isActive) {
      throw new AccountNotActiveError();
    }

    await userRepository.revokeRefreshToken(tokenHash);
    return this.issueSession(user);
  }

  async logout(refreshToken?: string) {
    if (!refreshToken) {
      return;
    }

    await userRepository.revokeRefreshToken(hashRefreshToken(refreshToken));
  }

  private async issueSession(user: Awaited<ReturnType<typeof userRepository.findById>> & object) {
    if (!user) {
      throw new UnauthorizedError();
    }

    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    const refreshToken = createRefreshToken();
    const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

    await userRepository.saveRefreshToken({
      userId: user.id,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt,
    });

    return {
      user: toPublicUser(user),
      accessToken,
      refreshToken,
    };
  }
}

export const registerUser = new RegisterUser();
