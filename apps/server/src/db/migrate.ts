import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

async function run(): Promise<void> {
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  const database = drizzle(pool);

  await migrate(database, {
    migrationsFolder: path.resolve(currentDir, "../../drizzle"),
  });

  logger.info({ event: "migrations_applied" }, "Database migrations applied");
  await pool.end();
}

run().catch((error: unknown) => {
  logger.error({ err: error }, "Failed to apply migrations");
  process.exit(1);
});
