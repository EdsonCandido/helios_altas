import { AccountNotActiveError, InvalidCredentialsError, UnauthorizedError } from "../../utils/errors.js";
import { hashPassword, verifyPassword } from "../../utils/password.js";
import { toPublicUser } from "../auth/to-public-user.js";
import { userRepository } from "./user.repository.js";

export class UpdateUserProfile {
  async execute(userId: string, input: { name?: string; phone?: string }) {
    const user = await userRepository.update(userId, input);
    return toPublicUser(user);
  }

  async changePassword(userId: string, input: { currentPassword: string; newPassword: string }) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedError();
    }

    const valid = await verifyPassword(user.passwordHash, input.currentPassword);
    if (!valid) {
      throw new InvalidCredentialsError();
    }

    await userRepository.update(userId, {
      passwordHash: await hashPassword(input.newPassword),
    });
  }

  async me(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user || user.status !== "ACTIVE") {
      throw new AccountNotActiveError();
    }

    const client = await userRepository.findClientByUserId(userId);
    return {
      ...toPublicUser(user),
      clientId: client?.id ?? null,
    };
  }
}

export const updateUserProfile = new UpdateUserProfile();
