export type DomainEventName =
  | "ServiceRequestCreated"
  | "ServiceRequestMatched"
  | "PartnerNotified"
  | "PartnerAcceptedRequest"
  | "PartnerRejectedRequest"
  | "ServiceRequestCancelled"
  | "ServiceRequestStarted"
  | "ServiceRequestCompleted";

export type DomainEvent = {
  name: DomainEventName;
  occurredAt: string;
  payload: Record<string, unknown>;
};
