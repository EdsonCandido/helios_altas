import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db, type Transaction } from "../../db/index.js";
import { clients, refreshTokens, users, type NewUser, type User } from "../../db/schema/index.js";

type Executor = typeof db | Transaction;

function use(executor?: Executor) {
  return executor ?? db;
}

export class UserRepository {
  async findById(id: string, executor?: Executor): Promise<User | null> {
    const [row] = await use(executor).select().from(users).where(eq(users.id, id)).limit(1);
    return row ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const [row] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return row ?? null;
  }

  async create(input: NewUser, executor?: Executor): Promise<User> {
    const [row] = await use(executor).insert(users).values(input).returning();
    if (!row) {
      throw new Error("Failed to create user");
    }
    return row;
  }

  async update(
    id: string,
    values: Partial<Pick<User, "name" | "phone" | "passwordHash" | "status" | "isActive" | "updatedBy">>,
    executor?: Executor,
  ): Promise<User> {
    const [row] = await use(executor)
      .update(users)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    if (!row) {
      throw new Error("Failed to update user");
    }

    return row;
  }

  async createClient(userId: string, executor?: Executor) {
    const [row] = await use(executor).insert(clients).values({ userId }).returning();
    if (!row) {
      throw new Error("Failed to create client");
    }
    return row;
  }

  async findClientByUserId(userId: string) {
    const [row] = await db.select().from(clients).where(eq(clients.userId, userId)).limit(1);
    return row ?? null;
  }

  async findClientById(id: string) {
    const [row] = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
    return row ?? null;
  }

  async updateClient(
    userId: string,
    values: Partial<{
      homeAddress: string | null;
      homeCity: string | null;
      homeState: string | null;
      homeNeighborhood: string | null;
      homeLatitude: string | null;
      homeLongitude: string | null;
    }>,
  ) {
    const [row] = await db
      .update(clients)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(clients.userId, userId))
      .returning();
    return row ?? null;
  }

  async saveRefreshToken(input: { userId: string; tokenHash: string; expiresAt: Date }) {
    await db.insert(refreshTokens).values(input);
  }

  async findRefreshToken(tokenHash: string) {
    const [row] = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, tokenHash))
      .limit(1);
    return row ?? null;
  }

  async revokeRefreshToken(tokenHash: string) {
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.tokenHash, tokenHash));
  }

  async list(input: { query?: string; role?: User["role"]; status?: User["status"]; page: number; pageSize: number }) {
    const filters = [];

    if (input.query) {
      filters.push(
        or(ilike(users.name, `%${input.query}%`), ilike(users.email, `%${input.query}%`)),
      );
    }
    if (input.role) {
      filters.push(eq(users.role, input.role));
    }
    if (input.status) {
      filters.push(eq(users.status, input.status));
    }

    const where = filters.length > 0 ? and(...filters) : undefined;
    const offset = (input.page - 1) * input.pageSize;

    const items = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        phone: users.phone,
        role: users.role,
        status: users.status,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(where)
      .orderBy(desc(users.createdAt))
      .limit(input.pageSize)
      .offset(offset);

    const [countRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(where);

    return { items, total: countRow?.count ?? 0 };
  }
}

export const userRepository = new UserRepository();
