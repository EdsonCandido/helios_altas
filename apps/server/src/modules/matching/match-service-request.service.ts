import { env } from "../../config/env.js";
import { domainEvents } from "../../events/bus.js";
import { notificationQueue } from "../../queues/queues.js";
import { getZonedClock } from "../../utils/timezone.js";
import { serviceRequestRepository } from "../service-requests/service-request.repository.js";
import { canTransition } from "../service-requests/service-request-status.js";
import { isPartnerEligibleForMatching, isWithinWeeklyWindow } from "./matching-criteria.js";
import { matchingRepository } from "./matching.repository.js";

export class MatchServiceRequest {
  async execute(serviceRequestId: string) {
    const request = await serviceRequestRepository.findById(serviceRequestId);
    if (!request) {
      return;
    }

    if (request.status !== "PENDING" && request.status !== "SEARCHING") {
      return;
    }

    if (request.status === "PENDING" && canTransition("PENDING", "SEARCHING")) {
      await serviceRequestRepository.updateStatus(serviceRequestId, { status: "SEARCHING" });
    }

    const candidates = await matchingRepository.findCandidates({
      serviceRequestId,
      categoryId: request.categoryId,
      latitude: Number(request.latitude),
      longitude: Number(request.longitude),
    });

    const partnerIds = candidates.map((item) => item.partnerId);
    const openAssignments = await matchingRepository.listOpenAssignments(partnerIds);
    const busy = new Set(openAssignments.map((item) => item.partnerId).filter(Boolean));
    const clock = getZonedClock(env.APP_TIMEZONE);

    const selected: string[] = [];
    const userIds: string[] = [];

    for (const candidate of candidates) {
      const windows = await matchingRepository.listActiveWindows(candidate.partnerId);
      const eligible = isPartnerEligibleForMatching({
        userStatus: candidate.userStatus,
        isAvailable: candidate.isAvailable,
        isProfileComplete: candidate.isProfileComplete,
        serviceActive: candidate.serviceActive,
        hasOpenAssignment: busy.has(candidate.partnerId),
        withinWindow: isWithinWeeklyWindow({
          weekday: clock.weekday,
          minutesOfDay: clock.minutesOfDay,
          windows,
        }),
      });

      if (!eligible) {
        continue;
      }

      const existing = await serviceRequestRepository.findInvitation(serviceRequestId, candidate.partnerId);
      if (existing) {
        continue;
      }

      selected.push(candidate.partnerId);
      userIds.push(candidate.userId);
    }

    await serviceRequestRepository.createInvitations(serviceRequestId, selected);

    domainEvents.publish("ServiceRequestMatched", {
      serviceRequestId,
      partnerIds: selected,
    });

    for (const userId of userIds) {
      await notificationQueue.add("notify", {
        userId,
        type: "PartnerNotified",
        title: "Nova solicitação próxima",
        body: "Uma solicitação compatível está aguardando sua resposta.",
        payload: { serviceRequestId },
      });
    }
  }
}

export const matchServiceRequest = new MatchServiceRequest();
