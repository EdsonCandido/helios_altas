import { env } from "../../config/env.js";
import { domainEvents } from "../../events/bus.js";
import { matchingQueue } from "../../queues/queues.js";
import { CategoryNotFoundError, ClientNotFoundError } from "../../utils/errors.js";
import { categoryRepository } from "../categories/category.repository.js";
import { userRepository } from "../users/user.repository.js";
import { serviceRequestRepository } from "./service-request.repository.js";

export class CreateServiceRequest {
  async execute(userId: string, input: {
    categoryId: string;
    description: string;
    address: string;
    city: string;
    state: string;
    neighborhood?: string;
    latitude: number;
    longitude: number;
    isHomeService: boolean;
  }) {
    const client = await userRepository.findClientByUserId(userId);
    if (!client) {
      throw new ClientNotFoundError();
    }

    const category = await categoryRepository.findById(input.categoryId);
    if (!category || !category.isActive) {
      throw new CategoryNotFoundError();
    }

    const expiresAt = new Date(Date.now() + env.SERVICE_REQUEST_TTL_MINUTES * 60_000);
    const request = await serviceRequestRepository.create({
      clientId: client.id,
      categoryId: input.categoryId,
      description: input.description,
      address: input.address,
      city: input.city,
      state: input.state,
      neighborhood: input.neighborhood,
      latitude: String(input.latitude),
      longitude: String(input.longitude),
      isHomeService: input.isHomeService,
      expiresAt,
    });

    domainEvents.publish("ServiceRequestCreated", {
      serviceRequestId: request.id,
      clientId: client.id,
      categoryId: input.categoryId,
    });

    await matchingQueue.add("match", { serviceRequestId: request.id });

    return request;
  }
}

export const createServiceRequest = new CreateServiceRequest();
