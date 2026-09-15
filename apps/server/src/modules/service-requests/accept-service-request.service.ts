import { db } from "../../db/index.js";
import { domainEvents } from "../../events/bus.js";
import {
  InvalidServiceRequestStateError,
  PartnerNotFoundError,
  ServiceRequestAlreadyAcceptedError,
  ServiceRequestNotFoundError,
  UnauthorizedServiceRequestAccessError,
} from "../../utils/errors.js";
import { partnerRepository } from "../partners/partner.repository.js";
import { canTransition } from "./service-request-status.js";
import { serviceRequestRepository } from "./service-request.repository.js";

export class AcceptServiceRequest {
  async execute(userId: string, serviceRequestId: string) {
    const partner = await partnerRepository.findByUserId(userId);
    if (!partner) {
      throw new PartnerNotFoundError();
    }

    const result = await db.transaction(async (tx) => {
      const request = await serviceRequestRepository.lockById(serviceRequestId, tx);
      if (!request) {
        throw new ServiceRequestNotFoundError();
      }

      if (!canTransition(request.status, "ACCEPTED")) {
        if (request.status === "ACCEPTED") {
          throw new ServiceRequestAlreadyAcceptedError();
        }
        throw new InvalidServiceRequestStateError();
      }

      const invitation = await serviceRequestRepository.findInvitation(
        serviceRequestId,
        partner.id,
        tx,
      );

      if (!invitation || invitation.status !== "PENDING") {
        throw new UnauthorizedServiceRequestAccessError();
      }

      const updated = await serviceRequestRepository.updateStatus(
        serviceRequestId,
        { status: "ACCEPTED", acceptedPartnerId: partner.id },
        tx,
      );

      await serviceRequestRepository.markInvitationAccepted(invitation.id, tx);
      await serviceRequestRepository.expirePendingInvitations(serviceRequestId, partner.id, tx);

      return updated;
    });

    domainEvents.publish("PartnerAcceptedRequest", {
      serviceRequestId,
      partnerId: partner.id,
    });

    return result;
  }
}

export const acceptServiceRequest = new AcceptServiceRequest();
