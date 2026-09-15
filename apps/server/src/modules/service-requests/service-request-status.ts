export const serviceRequestStatuses = [
  "PENDING",
  "SEARCHING",
  "ACCEPTED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "EXPIRED",
] as const;

export type ServiceRequestStatus = (typeof serviceRequestStatuses)[number];

const allowedTransitions: Record<ServiceRequestStatus, ServiceRequestStatus[]> = {
  PENDING: ["SEARCHING"],
  SEARCHING: ["ACCEPTED", "CANCELLED", "EXPIRED"],
  ACCEPTED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
  EXPIRED: [],
};

export function canTransition(
  from: ServiceRequestStatus,
  to: ServiceRequestStatus,
): boolean {
  return allowedTransitions[from].includes(to);
}

export function assertTransition(from: ServiceRequestStatus, to: ServiceRequestStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`INVALID_TRANSITION:${from}:${to}`);
  }
}

export function canClientCancel(status: ServiceRequestStatus): boolean {
  return status === "SEARCHING" || status === "ACCEPTED";
}

export function canPartnerStart(status: ServiceRequestStatus): boolean {
  return status === "ACCEPTED";
}

export function canPartnerComplete(status: ServiceRequestStatus): boolean {
  return status === "IN_PROGRESS";
}

export function canSystemExpire(status: ServiceRequestStatus): boolean {
  return status === "SEARCHING";
}
