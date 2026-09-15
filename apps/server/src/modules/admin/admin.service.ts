import { CategoryNotFoundError, ConflictError, NotFoundError } from "../../utils/errors.js";
import { categoryRepository } from "../categories/category.repository.js";
import { partnerRepository } from "../partners/partner.repository.js";
import { serviceRequestRepository } from "../service-requests/service-request.repository.js";
import type { ServiceRequestStatus } from "../service-requests/service-request-status.js";
import { userRepository } from "../users/user.repository.js";

export class AdminService {
  listUsers(input: {
    query?: string;
    role?: "CLIENT" | "PARTNER" | "ADMIN";
    status?: "ACTIVE" | "INACTIVE" | "BLOCKED";
    page: number;
    pageSize: number;
  }) {
    return userRepository.list(input);
  }

  async updateUser(
    actorId: string,
    userId: string,
    input: { status?: "ACTIVE" | "INACTIVE" | "BLOCKED"; isActive?: boolean },
  ) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("USER_NOT_FOUND", "User was not found.");
    }

    return userRepository.update(userId, {
      status: input.status,
      isActive: input.isActive ?? (input.status ? input.status === "ACTIVE" : undefined),
      updatedBy: actorId,
    });
  }

  listCategories() {
    return categoryRepository.listAll();
  }

  async createCategory(input: { name: string; slug: string; description?: string }) {
    const existing = await categoryRepository.findBySlug(input.slug);
    if (existing) {
      throw new ConflictError("CATEGORY_ALREADY_EXISTS", "Category slug already exists.");
    }
    return categoryRepository.create(input);
  }

  async updateCategory(
    id: string,
    input: Partial<{ name: string; slug: string; description: string | null; isActive: boolean }>,
  ) {
    const category = await categoryRepository.update(id, input);
    if (!category) {
      throw new CategoryNotFoundError();
    }
    return category;
  }

  listRequests(input: {
    status?: ServiceRequestStatus;
    categoryId?: string;
    from?: Date;
    to?: Date;
  }) {
    return serviceRequestRepository.listForAdmin(input);
  }

  mapPartners(input: { categoryId?: string; available?: boolean }) {
    return partnerRepository.listForAdminMap(input);
  }

  mapClusters(input: {
    categoryId?: string;
    status?: ServiceRequestStatus;
    from?: Date;
    to?: Date;
  }) {
    return serviceRequestRepository.listAdminClusters({
      ...input,
      gridSize: 0.05,
    });
  }

  indicators() {
    return serviceRequestRepository.indicators();
  }
}

export const adminService = new AdminService();
