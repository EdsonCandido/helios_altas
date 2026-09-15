import { domainEvents } from "../../events/bus.js";
import {
  PartnerNotFoundError,
  ServiceRequestNotFoundError,
  UnauthorizedServiceRequestAccessError,
} from "../../utils/errors.js";
import { partnerRepository } from "../partners/partner.repository.js";
import { serviceRequestRepository } from "./service-request.repository.js";

export class RejectServiceRequest {
  async execute(userId: string, serviceRequestId: string, reason: string) {
    const partner = await partnerRepository.findByUserId(userId);
    if (!partner) {
      throw new PartnerNotFoundError();
    }

    const request = await serviceRequestRepository.findById(serviceRequestId);
    if (!request) {
      throw new ServiceRequestNotFoundError();
    }

    const invitation = await serviceRequestRepository.findInvitation(serviceRequestId, partner.id);
    if (!invitation || invitation.status !== "PENDING") {
      throw new UnauthorizedServiceRequestAccessError();
    }

    await serviceRequestRepository.markInvitationRejected(invitation.id, reason);

    domainEvents.publish("PartnerRejectedRequest", {
      serviceRequestId,
      partnerId: partner.id,
    });

    return { id: serviceRequestId, status: invitation.status };
  }
}

export const rejectServiceRequest = new RejectServiceRequest();
