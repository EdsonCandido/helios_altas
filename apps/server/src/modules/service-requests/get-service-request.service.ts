import {
  ServiceRequestNotFoundError,
  UnauthorizedServiceRequestAccessError,
} from "../../utils/errors.js";
import { partnerRepository } from "../partners/partner.repository.js";
import { userRepository } from "../users/user.repository.js";
import { serviceRequestRepository } from "./service-request.repository.js";

export class GetServiceRequest {
  async execute(actor: { id: string; role: "CLIENT" | "PARTNER" | "ADMIN" }, serviceRequestId: string) {
    const detail = await serviceRequestRepository.getDetail(serviceRequestId);
    if (!detail) {
      throw new ServiceRequestNotFoundError();
    }

    const request = detail.request;
    const isOwner = detail.clientUserId === actor.id;
    const isAcceptedPartner = detail.acceptedPartnerUserId === actor.id;
    let isInvitedPartner = false;

    if (actor.role === "PARTNER") {
      const partner = await partnerRepository.findByUserId(actor.id);
      if (partner) {
        const invitation = await serviceRequestRepository.findInvitation(serviceRequestId, partner.id);
        isInvitedPartner = Boolean(invitation);
      }
    }

    if (actor.role !== "ADMIN" && !isOwner && !isAcceptedPartner && !isInvitedPartner) {
      throw new UnauthorizedServiceRequestAccessError();
    }

    const canSeeExactLocation = isOwner || isAcceptedPartner || actor.role === "ADMIN";

    return {
      id: request.id,
      status: request.status,
      description: request.description,
      categoryName: detail.categoryName,
      isHomeService: request.isHomeService,
      city: request.city,
      neighborhood: request.neighborhood,
      address: canSeeExactLocation ? request.address : undefined,
      addressNumber: canSeeExactLocation ? request.addressNumber : undefined,
      latitude: canSeeExactLocation ? Number(request.latitude) : undefined,
      longitude: canSeeExactLocation ? Number(request.longitude) : undefined,
      acceptedPartnerName: detail.acceptedPartnerName,
      createdAt: request.createdAt,
      expiresAt: request.expiresAt,
    };
  }

  async list(actor: { id: string; role: "CLIENT" | "PARTNER" | "ADMIN" }) {
    if (actor.role === "CLIENT") {
      const client = await userRepository.findClientByUserId(actor.id);
      if (!client) {
        return [];
      }
      return serviceRequestRepository.listForClient(client.id);
    }

    if (actor.role === "PARTNER") {
      const partner = await partnerRepository.findByUserId(actor.id);
      if (!partner) {
        return [];
      }
      return serviceRequestRepository.listForPartner(partner.id);
    }

    return serviceRequestRepository.listForAdmin({});
  }
}

export const getServiceRequest = new GetServiceRequest();
