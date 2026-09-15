import { eq } from "drizzle-orm";
import { env } from "../config/env.js";
import { db } from "./index.js";
import { serviceCategories, users } from "./schema/index.js";
import { hashPassword } from "../utils/password.js";
import { logger } from "../utils/logger.js";

const categories = [
  { name: "Pedreiro", slug: "pedreiro" },
  { name: "Eletricista", slug: "eletricista" },
  { name: "Marceneiro", slug: "marceneiro" },
  { name: "Borracheiro", slug: "borracheiro" },
  { name: "Encanador", slug: "encanador" },
  { name: "Pintor", slug: "pintor" },
  { name: "Mecânico", slug: "mecanico" },
  { name: "Jardinagem", slug: "jardinagem" },
  { name: "Limpeza", slug: "limpeza" },
  { name: "Manutenção", slug: "manutencao" },
  { name: "Técnico de informática", slug: "tecnico-informatica" },
];

async function seed(): Promise<void> {
  for (const category of categories) {
    const [existing] = await db
      .select()
      .from(serviceCategories)
      .where(eq(serviceCategories.slug, category.slug))
      .limit(1);

    if (!existing) {
      await db.insert(serviceCategories).values(category);
    }
  }

  if (env.ADMIN_EMAIL && env.ADMIN_PASSWORD) {
    const [existingAdmin] = await db
      .select()
      .from(users)
      .where(eq(users.email, env.ADMIN_EMAIL))
      .limit(1);

    if (!existingAdmin) {
      await db.insert(users).values({
        email: env.ADMIN_EMAIL,
        passwordHash: await hashPassword(env.ADMIN_PASSWORD),
        name: "Administrador",
        phone: "00000000000",
        role: "ADMIN",
        status: "ACTIVE",
      });
    }
  }

  logger.info({ event: "seed_completed" }, "Seed completed");
  process.exit(0);
}

seed().catch((error: unknown) => {
  logger.error({ err: error }, "Seed failed");
  process.exit(1);
});
