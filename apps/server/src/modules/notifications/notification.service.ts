import { domainEvents } from "../../events/bus.js";
import { notificationQueue } from "../../queues/queues.js";
import { realtimeGateway } from "../../realtime/realtime-gateway.js";
import { notificationRepository } from "./notification.repository.js";

export class NotificationService {
  async deliver(input: {
    userId: string;
    type: string;
    title: string;
    body: string;
    payload?: Record<string, unknown>;
  }) {
    const notification = await notificationRepository.create(input);
    realtimeGateway.emitToUser(input.userId, "notification", notification);
    return notification;
  }

  async list(userId: string) {
    return notificationRepository.listForUser(userId);
  }

  async markRead(userId: string, id: string) {
    return notificationRepository.markRead(id, userId);
  }

  async markAllRead(userId: string) {
    await notificationRepository.markAllRead(userId);
  }
}

export const notificationService = new NotificationService();

export function registerNotificationHandlers(): void {
  domainEvents.on("PartnerAcceptedRequest", async (event) => {
    const { serviceRequestId } = event.payload;
    await notificationQueue.add("notify-request-parties", {
      serviceRequestId,
      type: event.name,
      title: "Parceiro aceitou a solicitação",
      body: "Um parceiro aceitou sua solicitação.",
    });
  });

  domainEvents.on("ServiceRequestCancelled", async (event) => {
    await notificationQueue.add("notify-request-parties", {
      serviceRequestId: event.payload.serviceRequestId,
      type: event.name,
      title: "Solicitação cancelada",
      body: "A solicitação foi cancelada.",
    });
  });

  domainEvents.on("ServiceRequestStarted", async (event) => {
    await notificationQueue.add("notify-request-parties", {
      serviceRequestId: event.payload.serviceRequestId,
      type: event.name,
      title: "Atendimento iniciado",
      body: "O atendimento foi iniciado.",
    });
  });

  domainEvents.on("ServiceRequestCompleted", async (event) => {
    await notificationQueue.add("notify-request-parties", {
      serviceRequestId: event.payload.serviceRequestId,
      type: event.name,
      title: "Atendimento concluído",
      body: "O atendimento foi concluído.",
    });
  });
}
