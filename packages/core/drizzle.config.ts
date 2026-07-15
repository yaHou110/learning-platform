import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit config.
 *
 * Connection string is read from DATABASE_URL at runtime. For migrations, see
 * scripts/migrate.ts (uses the same URL via dotenv if needed).
 */
export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://learning_platform:learning_platform@localhost:5432/learning_platform",
  },
  strict: true,
  verbose: true,
});
