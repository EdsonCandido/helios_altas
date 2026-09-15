import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  partnerAvailabilityWindows,
  partners,
  partnerServices,
  serviceRequests,
  users,
} from "../../db/schema/index.js";

export class MatchingRepository {
  async findCandidates(input: {
    serviceRequestId: string;
    categoryId: string;
    latitude: number;
    longitude: number;
  }) {
    const origin = sql`ST_SetSRID(ST_MakePoint(${input.longitude}, ${input.latitude}), 4326)::geography`;
    const distance = sql<number>`ST_Distance(${partners.location}, ${origin})`;

    return db
      .select({
        partnerId: partners.id,
        userId: partners.userId,
        userStatus: users.status,
        isAvailable: partners.isAvailable,
        isProfileComplete: partners.isProfileComplete,
        serviceActive: partnerServices.isActive,
        distanceMeters: distance,
      })
      .from(partners)
      .innerJoin(users, eq(users.id, partners.userId))
      .innerJoin(partnerServices, eq(partnerServices.partnerId, partners.id))
      .where(
        and(
          eq(partnerServices.categoryId, input.categoryId),
          eq(partnerServices.isActive, true),
          eq(partners.isAvailable, true),
          eq(partners.isProfileComplete, true),
          eq(users.status, "ACTIVE"),
          sql`${partners.location} IS NOT NULL`,
          sql`ST_DWithin(${partners.location}, ${origin}, ${partners.serviceRadiusMeters})`,
        ),
      )
      .orderBy(distance);
  }

  async listActiveWindows(partnerId: string) {
    return db
      .select()
      .from(partnerAvailabilityWindows)
      .where(
        and(
          eq(partnerAvailabilityWindows.partnerId, partnerId),
          eq(partnerAvailabilityWindows.isActive, true),
        ),
      );
  }

  async listOpenAssignments(partnerIds: string[]) {
    if (partnerIds.length === 0) {
      return [];
    }

    return db
      .select({
        partnerId: serviceRequests.acceptedPartnerId,
      })
      .from(serviceRequests)
      .where(
        and(
          inArray(serviceRequests.acceptedPartnerId, partnerIds),
          sql`${serviceRequests.status} in ('ACCEPTED', 'IN_PROGRESS')`,
        ),
      );
  }
}

export const matchingRepository = new MatchingRepository();
