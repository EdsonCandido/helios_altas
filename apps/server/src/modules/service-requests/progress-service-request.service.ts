import { domainEvents } from "../../events/bus.js";
import {
  InvalidServiceRequestStateError,
  PartnerNotFoundError,
  ServiceRequestNotFoundError,
  UnauthorizedServiceRequestAccessError,
} from "../../utils/errors.js";
import { partnerRepository } from "../partners/partner.repository.js";
import { canPartnerComplete, canPartnerStart } from "./service-request-status.js";
import { serviceRequestRepository } from "./service-request.repository.js";

export class ProgressServiceRequest {
  async start(userId: string, serviceRequestId: string) {
    const { request, partner } = await this.loadOwned(userId, serviceRequestId);

    if (!canPartnerStart(request.status)) {
      throw new InvalidServiceRequestStateError();
    }

    const updated = await serviceRequestRepository.updateStatus(serviceRequestId, {
      status: "IN_PROGRESS",
    });

    domainEvents.publish("ServiceRequestStarted", {
      serviceRequestId,
      partnerId: partner.id,
    });

    return updated;
  }

  async complete(userId: string, serviceRequestId: string) {
    const { request, partner } = await this.loadOwned(userId, serviceRequestId);

    if (!canPartnerComplete(request.status)) {
      throw new InvalidServiceRequestStateError();
    }

    const updated = await serviceRequestRepository.updateStatus(serviceRequestId, {
      status: "COMPLETED",
    });

    await partnerRepository.incrementCompletedJobs(partner.id);

    domainEvents.publish("ServiceRequestCompleted", {
      serviceRequestId,
      partnerId: partner.id,
    });

    return updated;
  }

  private async loadOwned(userId: string, serviceRequestId: string) {
    const partner = await partnerRepository.findByUserId(userId);
    if (!partner) {
      throw new PartnerNotFoundError();
    }

    const request = await serviceRequestRepository.findById(serviceRequestId);
    if (!request) {
      throw new ServiceRequestNotFoundError();
    }

    if (request.acceptedPartnerId !== partner.id) {
      throw new UnauthorizedServiceRequestAccessError();
    }

    return { request, partner };
  }
}

export const progressServiceRequest = new ProgressServiceRequest();
