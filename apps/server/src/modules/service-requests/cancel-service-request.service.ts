import { domainEvents } from "../../events/bus.js";
import {
  ClientNotFoundError,
  InvalidServiceRequestStateError,
  ServiceRequestNotFoundError,
  UnauthorizedServiceRequestAccessError,
} from "../../utils/errors.js";
import { userRepository } from "../users/user.repository.js";
import { canClientCancel } from "./service-request-status.js";
import { serviceRequestRepository } from "./service-request.repository.js";

export class CancelServiceRequest {
  async execute(userId: string, serviceRequestId: string) {
    const client = await userRepository.findClientByUserId(userId);
    if (!client) {
      throw new ClientNotFoundError();
    }

    const request = await serviceRequestRepository.findById(serviceRequestId);
    if (!request) {
      throw new ServiceRequestNotFoundError();
    }

    if (request.clientId !== client.id) {
      throw new UnauthorizedServiceRequestAccessError();
    }

    if (!canClientCancel(request.status)) {
      throw new InvalidServiceRequestStateError();
    }

    const updated = await serviceRequestRepository.updateStatus(serviceRequestId, {
      status: "CANCELLED",
    });

    domainEvents.publish("ServiceRequestCancelled", {
      serviceRequestId,
      clientId: client.id,
    });

    return updated;
  }
}

export const cancelServiceRequest = new CancelServiceRequest();
