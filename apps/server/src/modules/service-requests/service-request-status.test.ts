import { describe, expect, it } from "vitest";
import {
  canClientCancel,
  canPartnerComplete,
  canPartnerStart,
  canSystemExpire,
  canTransition,
} from "./service-request-status.js";

describe("service request transitions", () => {
  it("allows the happy path", () => {
    expect(canTransition("PENDING", "SEARCHING")).toBe(true);
    expect(canTransition("SEARCHING", "ACCEPTED")).toBe(true);
    expect(canTransition("ACCEPTED", "IN_PROGRESS")).toBe(true);
    expect(canTransition("IN_PROGRESS", "COMPLETED")).toBe(true);
  });

  it("blocks invalid transitions", () => {
    expect(canTransition("PENDING", "COMPLETED")).toBe(false);
    expect(canTransition("COMPLETED", "CANCELLED")).toBe(false);
    expect(canTransition("EXPIRED", "SEARCHING")).toBe(false);
  });

  it("limits client cancel", () => {
    expect(canClientCancel("SEARCHING")).toBe(true);
    expect(canClientCancel("ACCEPTED")).toBe(true);
    expect(canClientCancel("IN_PROGRESS")).toBe(false);
  });

  it("limits partner progress", () => {
    expect(canPartnerStart("ACCEPTED")).toBe(true);
    expect(canPartnerComplete("IN_PROGRESS")).toBe(true);
    expect(canSystemExpire("SEARCHING")).toBe(true);
    expect(canSystemExpire("ACCEPTED")).toBe(false);
  });
});
