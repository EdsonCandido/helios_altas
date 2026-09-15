import { and, eq, sql } from "drizzle-orm";
import { db, type Transaction } from "../../db/index.js";
import {
  partnerAvailabilityWindows,
  partners,
  partnerServices,
  serviceCategories,
  users,
  type Partner,
} from "../../db/schema/index.js";

type Executor = typeof db | Transaction;

function use(executor?: Executor) {
  return executor ?? db;
}

export class PartnerRepository {
  async create(userId: string, executor?: Executor): Promise<Partner> {
    const [row] = await use(executor).insert(partners).values({ userId }).returning();
    if (!row) {
      throw new Error("Failed to create partner");
    }
    return row;
  }

  async findByUserId(userId: string) {
    const [row] = await db.select().from(partners).where(eq(partners.userId, userId)).limit(1);
    return row ?? null;
  }

  async findById(id: string) {
    const [row] = await db.select().from(partners).where(eq(partners.id, id)).limit(1);
    return row ?? null;
  }

  async update(userId: string, values: Partial<Partner>) {
    const [row] = await db
      .update(partners)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(partners.userId, userId))
      .returning();
    return row ?? null;
  }

  async incrementCompletedJobs(partnerId: string, executor?: Executor) {
    await use(executor)
      .update(partners)
      .set({
        completedJobsCount: sql`${partners.completedJobsCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(partners.id, partnerId));
  }

  async replaceAvailability(
    partnerId: string,
    windows: Array<{ weekday: number; startMinutes: number; endMinutes: number }>,
  ) {
    await db.transaction(async (tx) => {
      await tx
        .update(partnerAvailabilityWindows)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(partnerAvailabilityWindows.partnerId, partnerId));

      if (windows.length > 0) {
        await tx.insert(partnerAvailabilityWindows).values(
          windows.map((window) => ({ ...window, partnerId, isActive: true })),
        );
      }
    });
  }

  async listAvailability(partnerId: string) {
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

  async replaceServices(
    partnerId: string,
    items: Array<{ categoryId: string; minimumVisitFeeCents: number; isActive: boolean }>,
  ) {
    await db.transaction(async (tx) => {
      await tx
        .update(partnerServices)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(partnerServices.partnerId, partnerId));

      for (const item of items) {
        const [existing] = await tx
          .select()
          .from(partnerServices)
          .where(
            and(eq(partnerServices.partnerId, partnerId), eq(partnerServices.categoryId, item.categoryId)),
          )
          .limit(1);

        if (existing) {
          await tx
            .update(partnerServices)
            .set({
              minimumVisitFeeCents: item.minimumVisitFeeCents,
              isActive: item.isActive,
              updatedAt: new Date(),
            })
            .where(eq(partnerServices.id, existing.id));
        } else {
          await tx.insert(partnerServices).values({
            partnerId,
            categoryId: item.categoryId,
            minimumVisitFeeCents: item.minimumVisitFeeCents,
            isActive: item.isActive,
          });
        }
      }
    });
  }

  async listServices(partnerId: string) {
    return db
      .select({
        id: partnerServices.id,
        categoryId: partnerServices.categoryId,
        categoryName: serviceCategories.name,
        categorySlug: serviceCategories.slug,
        minimumVisitFeeCents: partnerServices.minimumVisitFeeCents,
        isActive: partnerServices.isActive,
      })
      .from(partnerServices)
      .innerJoin(serviceCategories, eq(serviceCategories.id, partnerServices.categoryId))
      .where(eq(partnerServices.partnerId, partnerId));
  }

  async findNearby(input: {
    latitude: number;
    longitude: number;
    radiusMeters: number;
    categoryId?: string;
    availableOnly?: boolean;
  }) {
    const origin = sql`ST_SetSRID(ST_MakePoint(${input.longitude}, ${input.latitude}), 4326)::geography`;
    const distance = sql<number>`ST_Distance(${partners.location}, ${origin})`;

    const filters = [
      eq(users.status, "ACTIVE"),
      eq(partners.isProfileComplete, true),
      sql`${partners.location} IS NOT NULL`,
      sql`ST_DWithin(${partners.location}, ${origin}, LEAST(${partners.serviceRadiusMeters}, ${input.radiusMeters}))`,
    ];

    if (input.availableOnly) {
      filters.push(eq(partners.isAvailable, true));
    }

    if (input.categoryId) {
      filters.push(eq(partnerServices.categoryId, input.categoryId));
      filters.push(eq(partnerServices.isActive, true));
    }

    return db
      .select({
        id: partners.id,
        name: users.name,
        description: partners.description,
        neighborhood: partners.neighborhood,
        city: partners.city,
        isAvailable: partners.isAvailable,
        minimumVisitFeeCents: partnerServices.minimumVisitFeeCents,
        categoryId: partnerServices.categoryId,
        categoryName: serviceCategories.name,
        distanceMeters: distance,
      })
      .from(partners)
      .innerJoin(users, eq(users.id, partners.userId))
      .innerJoin(partnerServices, eq(partnerServices.partnerId, partners.id))
      .innerJoin(serviceCategories, eq(serviceCategories.id, partnerServices.categoryId))
      .where(and(...filters))
      .orderBy(distance)
      .limit(50);
  }

  async findPublicById(id: string, origin?: { latitude: number; longitude: number }) {
    const distance = origin
      ? sql<number>`ST_Distance(
          ${partners.location},
          ST_SetSRID(ST_MakePoint(${origin.longitude}, ${origin.latitude}), 4326)::geography
        )`
      : sql<number>`null`;

    const [row] = await db
      .select({
        id: partners.id,
        name: users.name,
        description: partners.description,
        neighborhood: partners.neighborhood,
        city: partners.city,
        isAvailable: partners.isAvailable,
        distanceMeters: distance,
      })
      .from(partners)
      .innerJoin(users, eq(users.id, partners.userId))
      .where(and(eq(partners.id, id), eq(users.status, "ACTIVE")))
      .limit(1);

    return row ?? null;
  }

  async listForAdminMap(input: { categoryId?: string; available?: boolean }) {
    const filters = [sql`${partners.location} IS NOT NULL`];

    if (input.available !== undefined) {
      filters.push(eq(partners.isAvailable, input.available));
    }
    if (input.categoryId) {
      filters.push(eq(partnerServices.categoryId, input.categoryId));
    }

    return db
      .selectDistinctOn([partners.id], {
        id: partners.id,
        name: users.name,
        latitude: partners.latitude,
        longitude: partners.longitude,
        isAvailable: partners.isAvailable,
        status: users.status,
        categoryId: partnerServices.categoryId,
        categoryName: serviceCategories.name,
      })
      .from(partners)
      .innerJoin(users, eq(users.id, partners.userId))
      .leftJoin(partnerServices, eq(partnerServices.partnerId, partners.id))
      .leftJoin(serviceCategories, eq(serviceCategories.id, partnerServices.categoryId))
      .where(and(...filters));
  }
}

export const partnerRepository = new PartnerRepository();
