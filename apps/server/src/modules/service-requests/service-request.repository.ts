import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db, type Transaction } from "../../db/index.js";
import {
  clients,
  partners,
  serviceCategories,
  serviceRequestPartners,
  serviceRequests,
  users,
  type ServiceRequest,
} from "../../db/schema/index.js";
import type { ServiceRequestStatus } from "./service-request-status.js";

type Executor = typeof db | Transaction;

function use(executor?: Executor) {
  return executor ?? db;
}

export class ServiceRequestRepository {
  async create(input: {
    clientId: string;
    categoryId: string;
    description: string;
    address: string;
    city: string;
    state: string;
    neighborhood?: string;
    latitude: string;
    longitude: string;
    isHomeService: boolean;
    expiresAt: Date;
  }) {
    const [row] = await db.insert(serviceRequests).values(input).returning();
    if (!row) {
      throw new Error("Failed to create service request");
    }
    return row;
  }

  async findById(id: string, executor?: Executor) {
    const [row] = await use(executor)
      .select()
      .from(serviceRequests)
      .where(eq(serviceRequests.id, id))
      .limit(1);
    return row ?? null;
  }

  async lockById(id: string, executor: Transaction) {
    const [row] = await executor
      .select()
      .from(serviceRequests)
      .where(eq(serviceRequests.id, id))
      .for("update")
      .limit(1);
    return row ?? null;
  }

  async updateStatus(
    id: string,
    values: Partial<Pick<ServiceRequest, "status" | "acceptedPartnerId">>,
    executor?: Executor,
  ) {
    const [row] = await use(executor)
      .update(serviceRequests)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(serviceRequests.id, id))
      .returning();
    return row ?? null;
  }

  async listForClient(clientId: string) {
    return db
      .select({
        id: serviceRequests.id,
        status: serviceRequests.status,
        description: serviceRequests.description,
        categoryName: serviceCategories.name,
        createdAt: serviceRequests.createdAt,
        expiresAt: serviceRequests.expiresAt,
      })
      .from(serviceRequests)
      .innerJoin(serviceCategories, eq(serviceCategories.id, serviceRequests.categoryId))
      .where(eq(serviceRequests.clientId, clientId))
      .orderBy(desc(serviceRequests.createdAt));
  }

  async listForPartner(partnerId: string) {
    return db
      .select({
        id: serviceRequests.id,
        status: serviceRequests.status,
        description: serviceRequests.description,
        categoryName: serviceCategories.name,
        city: serviceRequests.city,
        neighborhood: serviceRequests.neighborhood,
        inviteStatus: serviceRequestPartners.status,
        createdAt: serviceRequests.createdAt,
      })
      .from(serviceRequestPartners)
      .innerJoin(serviceRequests, eq(serviceRequests.id, serviceRequestPartners.serviceRequestId))
      .innerJoin(serviceCategories, eq(serviceCategories.id, serviceRequests.categoryId))
      .where(eq(serviceRequestPartners.partnerId, partnerId))
      .orderBy(desc(serviceRequests.createdAt));
  }

  async listForAdmin(input: {
    status?: ServiceRequestStatus;
    categoryId?: string;
    from?: Date;
    to?: Date;
  }) {
    const filters = [];
    if (input.status) {
      filters.push(eq(serviceRequests.status, input.status));
    }
    if (input.categoryId) {
      filters.push(eq(serviceRequests.categoryId, input.categoryId));
    }
    if (input.from) {
      filters.push(gte(serviceRequests.createdAt, input.from));
    }
    if (input.to) {
      filters.push(lte(serviceRequests.createdAt, input.to));
    }

    return db
      .select({
        id: serviceRequests.id,
        status: serviceRequests.status,
        description: serviceRequests.description,
        categoryName: serviceCategories.name,
        city: serviceRequests.city,
        createdAt: serviceRequests.createdAt,
      })
      .from(serviceRequests)
      .innerJoin(serviceCategories, eq(serviceCategories.id, serviceRequests.categoryId))
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(desc(serviceRequests.createdAt))
      .limit(200);
  }

  async findInvitation(serviceRequestId: string, partnerId: string, executor?: Executor) {
    const [row] = await use(executor)
      .select()
      .from(serviceRequestPartners)
      .where(
        and(
          eq(serviceRequestPartners.serviceRequestId, serviceRequestId),
          eq(serviceRequestPartners.partnerId, partnerId),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  async createInvitations(
    serviceRequestId: string,
    partnerIds: string[],
    executor?: Executor,
  ) {
    if (partnerIds.length === 0) {
      return [];
    }

    return use(executor)
      .insert(serviceRequestPartners)
      .values(
        partnerIds.map((partnerId) => ({
          serviceRequestId,
          partnerId,
          notifiedAt: new Date(),
        })),
      )
      .returning();
  }

  async markInvitationAccepted(id: string, executor: Transaction) {
    await executor
      .update(serviceRequestPartners)
      .set({ status: "ACCEPTED", respondedAt: new Date(), updatedAt: new Date() })
      .where(eq(serviceRequestPartners.id, id));
  }

  async expirePendingInvitations(serviceRequestId: string, exceptPartnerId: string, executor: Transaction) {
    await executor
      .update(serviceRequestPartners)
      .set({ status: "EXPIRED", updatedAt: new Date() })
      .where(
        and(
          eq(serviceRequestPartners.serviceRequestId, serviceRequestId),
          eq(serviceRequestPartners.status, "PENDING"),
          sql`${serviceRequestPartners.partnerId} <> ${exceptPartnerId}`,
        ),
      );
  }

  async markInvitationRejected(id: string, reason: string, executor?: Executor) {
    await use(executor)
      .update(serviceRequestPartners)
      .set({
        status: "REJECTED",
        rejectionReason: reason,
        respondedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(serviceRequestPartners.id, id));
  }

  async listPendingOrphans(status: ServiceRequestStatus) {
    return db.select().from(serviceRequests).where(eq(serviceRequests.status, status)).limit(50);
  }

  async listExpiredSearching(now = new Date()) {
    return db
      .select()
      .from(serviceRequests)
      .where(
        and(
          eq(serviceRequests.status, "SEARCHING"),
          sql`${serviceRequests.expiresAt} IS NOT NULL`,
          lte(serviceRequests.expiresAt, now),
        ),
      );
  }

  async partnerHasOpenAssignment(partnerId: string) {
    const [row] = await db
      .select({ id: serviceRequests.id })
      .from(serviceRequests)
      .where(
        and(
          eq(serviceRequests.acceptedPartnerId, partnerId),
          sql`${serviceRequests.status} in ('ACCEPTED', 'IN_PROGRESS')`,
        ),
      )
      .limit(1);
    return Boolean(row);
  }

  async getDetail(id: string) {
    const [row] = await db
      .select({
        request: serviceRequests,
        categoryName: serviceCategories.name,
        clientUserId: clients.userId,
        acceptedPartnerUserId: users.id,
        acceptedPartnerName: users.name,
      })
      .from(serviceRequests)
      .innerJoin(serviceCategories, eq(serviceCategories.id, serviceRequests.categoryId))
      .innerJoin(clients, eq(clients.id, serviceRequests.clientId))
      .leftJoin(partners, eq(partners.id, serviceRequests.acceptedPartnerId))
      .leftJoin(users, eq(users.id, partners.userId))
      .where(eq(serviceRequests.id, id))
      .limit(1);

    return row ?? null;
  }

  async listAdminClusters(input: {
    categoryId?: string;
    status?: ServiceRequestStatus;
    from?: Date;
    to?: Date;
    gridSize: number;
  }) {
    const filters = [sql`${serviceRequests.location} IS NOT NULL`];

    if (input.categoryId) {
      filters.push(eq(serviceRequests.categoryId, input.categoryId));
    }
    if (input.status) {
      filters.push(eq(serviceRequests.status, input.status));
    }
    if (input.from) {
      filters.push(gte(serviceRequests.createdAt, input.from));
    }
    if (input.to) {
      filters.push(lte(serviceRequests.createdAt, input.to));
    }

    return db
      .select({
        latitude: sql<number>`ST_Y(ST_SnapToGrid(${serviceRequests.location}::geometry, ${input.gridSize}))`,
        longitude: sql<number>`ST_X(ST_SnapToGrid(${serviceRequests.location}::geometry, ${input.gridSize}))`,
        count: sql<number>`count(*)::int`,
      })
      .from(serviceRequests)
      .where(and(...filters))
      .groupBy(sql`ST_SnapToGrid(${serviceRequests.location}::geometry, ${input.gridSize})`);
  }

  async indicators() {
    const [row] = await db
      .select({
        total: sql<number>`count(*)::int`,
        searching: sql<number>`count(*) filter (where ${serviceRequests.status} = 'SEARCHING')::int`,
        accepted: sql<number>`count(*) filter (where ${serviceRequests.status} = 'ACCEPTED')::int`,
        inProgress: sql<number>`count(*) filter (where ${serviceRequests.status} = 'IN_PROGRESS')::int`,
        completed: sql<number>`count(*) filter (where ${serviceRequests.status} = 'COMPLETED')::int`,
        cancelled: sql<number>`count(*) filter (where ${serviceRequests.status} = 'CANCELLED')::int`,
        expired: sql<number>`count(*) filter (where ${serviceRequests.status} = 'EXPIRED')::int`,
      })
      .from(serviceRequests);

    return row ?? {
      total: 0,
      searching: 0,
      accepted: 0,
      inProgress: 0,
      completed: 0,
      cancelled: 0,
      expired: 0,
    };
  }
}

export const serviceRequestRepository = new ServiceRequestRepository();
