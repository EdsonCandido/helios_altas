import { describe, expect, it } from "vitest";
import {
  isPartnerEligibleForMatching,
  isWithinWeeklyWindow,
  roundDistanceMeters,
} from "./matching-criteria.js";

describe("matching eligibility", () => {
  it("requires an active and available partner", () => {
    expect(
      isPartnerEligibleForMatching({
        userStatus: "ACTIVE",
        isAvailable: true,
        isProfileComplete: true,
        serviceActive: true,
        hasOpenAssignment: false,
        withinWindow: true,
      }),
    ).toBe(true);

    expect(
      isPartnerEligibleForMatching({
        userStatus: "BLOCKED",
        isAvailable: true,
        isProfileComplete: true,
        serviceActive: true,
        hasOpenAssignment: false,
        withinWindow: true,
      }),
    ).toBe(false);
  });

  it("treats empty windows as always open", () => {
    expect(isWithinWeeklyWindow({ weekday: 1, minutesOfDay: 600, windows: [] })).toBe(true);
  });

  it("checks weekday windows", () => {
    expect(
      isWithinWeeklyWindow({
        weekday: 1,
        minutesOfDay: 600,
        windows: [{ weekday: 1, startMinutes: 480, endMinutes: 720 }],
      }),
    ).toBe(true);
    expect(
      isWithinWeeklyWindow({
        weekday: 1,
        minutesOfDay: 800,
        windows: [{ weekday: 1, startMinutes: 480, endMinutes: 720 }],
      }),
    ).toBe(false);
  });

  it("rounds distance to 100 meters", () => {
    expect(roundDistanceMeters(349)).toBe(300);
    expect(roundDistanceMeters(350)).toBe(400);
  });
});
