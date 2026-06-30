import path from "node:path";

import { migrate } from "drizzle-orm/better-sqlite3/migrator";

import { db, resolveSqlitePath } from "../src/lib/db";

/**
 * Applies checked-in Drizzle migrations to the configured SQLite database.
 *
 * The database file defaults to data/summaries.db and is created on demand by
 * the shared database client before migrations run.
 */
function runMigrations() {
  const migrationsFolder = path.resolve(
    process.cwd(),
    "src/lib/db/migrations",
  );
  const sqlitePath = resolveSqlitePath();

  migrate(db, { migrationsFolder });

  console.log(`Migrations applied to ${sqlitePath}`);
}

runMigrations();
