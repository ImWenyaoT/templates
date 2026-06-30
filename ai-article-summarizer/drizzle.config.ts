import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL ?? "file:./data/summaries.db";

export default defineConfig({
  schema: "./src/lib/schema.ts",
  out: "./src/lib/db/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: databaseUrl.replace(/^file:/, ""),
  },
});
