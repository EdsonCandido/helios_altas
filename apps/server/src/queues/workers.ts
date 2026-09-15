import { Worker } from "bullmq";
import { domainEvents } from "../events/bus.js";
import { matchServiceRequest } from "../modules/matching/match-service-request.service.js";
import { notificationService } from "../modules/notifications/notification.service.js";
import { serviceRequestRepository } from "../modules/service-requests/service-request.repository.js";
import { canSystemExpire } from "../modules/service-requests/service-request-status.js";
import { logger } from "../utils/logger.js";
import { expirationQueue, matchingQueue } from "./queues.js";
import { redis } from "./redis.js";

export function startWorkers(): void {
  new Worker(
    "matching",
    async (job) => {
      await matchServiceRequest.execute(job.data.serviceRequestId as string);

      if (job.name === "match") {
        await matchingQueue.add(
          "retry-match",
          { serviceRequestId: job.data.serviceRequestId },
          { delay: 2 * 60_000 },
        );
      }
    },
    { connection: redis },
  );

  new Worker(
    "notifications",
    async (job) => {
      if (job.name === "notify" && job.data.userId) {
        await notificationService.deliver(job.data);
        domainEvents.publish("PartnerNotified", job.data.payload ?? {});
        return;
      }

      if (job.name === "notify-request-parties") {
        const detail = await serviceRequestRepository.getDetail(job.data.serviceRequestId as string);
        if (!detail) {
          return;
        }

        const targets = [detail.clientUserId];
        if (detail.acceptedPartnerUserId) {
          targets.push(detail.acceptedPartnerUserId);
        }

        for (const userId of targets) {
          await notificationService.deliver({
            userId,
            type: job.data.type,
            title: job.data.title,
            body: job.data.body,
            payload: { serviceRequestId: job.data.serviceRequestId },
          });
        }
      }
    },
    { connection: redis },
  );

  new Worker(
    "expiration",
    async () => {
      const expired = await serviceRequestRepository.listExpiredSearching();
      for (const request of expired) {
        if (canSystemExpire(request.status)) {
          await serviceRequestRepository.updateStatus(request.id, { status: "EXPIRED" });
        }
      }

      const pending = await serviceRequestRepository.listPendingOrphans("PENDING");
      for (const request of pending) {
        await matchingQueue.add("match", { serviceRequestId: request.id });
      }
    },
    { connection: redis },
  );

  void expirationQueue.add("sweep", {}, { repeat: { every: 60_000 } });

  logger.info({ event: "workers_started" }, "Background workers started");
}
