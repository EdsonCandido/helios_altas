import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "../../db/index.js";
import { notifications } from "../../db/schema/index.js";

export class NotificationRepository {
  async create(input: {
    userId: string;
    type: string;
    title: string;
    body: string;
    payload?: Record<string, unknown>;
  }) {
    const [row] = await db.insert(notifications).values(input).returning();
    if (!row) {
      throw new Error("Failed to create notification");
    }
    return row;
  }

  async listForUser(userId: string) {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(100);
  }

  async markRead(id: string, userId: string) {
    const [row] = await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning();
    return row ?? null;
  }

  async markAllRead(userId: string) {
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  }
}

export const notificationRepository = new NotificationRepository();
