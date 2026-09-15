export const matchingCriteriaOrder = [
  "compatibleCategory",
  "availablePartner",
  "withinRadius",
  "shortestDistance",
] as const;

export type MatchingCriterion = (typeof matchingCriteriaOrder)[number];

export const exclusiveAssignment = true;

export function isWithinWeeklyWindow(input: {
  weekday: number;
  minutesOfDay: number;
  windows: Array<{ weekday: number; startMinutes: number; endMinutes: number }>;
}): boolean {
  if (input.windows.length === 0) {
    return true;
  }

  return input.windows.some(
    (window) =>
      window.weekday === input.weekday &&
      input.minutesOfDay >= window.startMinutes &&
      input.minutesOfDay < window.endMinutes,
  );
}

export function isPartnerEligibleForMatching(input: {
  userStatus: "ACTIVE" | "INACTIVE" | "BLOCKED";
  isAvailable: boolean;
  isProfileComplete: boolean;
  serviceActive: boolean;
  hasOpenAssignment: boolean;
  withinWindow: boolean;
}): boolean {
  return (
    input.userStatus === "ACTIVE" &&
    input.isAvailable &&
    input.isProfileComplete &&
    input.serviceActive &&
    !input.hasOpenAssignment &&
    input.withinWindow
  );
}

export function roundDistanceMeters(meters: number): number {
  return Math.round(meters / 100) * 100;
}
