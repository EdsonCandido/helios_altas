import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { serviceCategories } from "../../db/schema/index.js";

export class CategoryRepository {
  async listActive() {
    return db.select().from(serviceCategories).where(eq(serviceCategories.isActive, true));
  }

  async listAll() {
    return db.select().from(serviceCategories);
  }

  async findById(id: string) {
    const [row] = await db.select().from(serviceCategories).where(eq(serviceCategories.id, id)).limit(1);
    return row ?? null;
  }

  async findBySlug(slug: string) {
    const [row] = await db.select().from(serviceCategories).where(eq(serviceCategories.slug, slug)).limit(1);
    return row ?? null;
  }

  async create(input: { name: string; slug: string; description?: string }) {
    const [row] = await db.insert(serviceCategories).values(input).returning();
    if (!row) {
      throw new Error("Failed to create category");
    }
    return row;
  }

  async update(
    id: string,
    values: Partial<{ name: string; slug: string; description: string | null; isActive: boolean }>,
  ) {
    const [row] = await db
      .update(serviceCategories)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(serviceCategories.id, id))
      .returning();
    return row ?? null;
  }
}

export const categoryRepository = new CategoryRepository();
