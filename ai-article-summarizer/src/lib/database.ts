import { mkdirSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { desc, eq } from "drizzle-orm";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";

import { summaries, type NewSummary, type Summary } from "./schema";
import * as schema from "./schema";

export const defaultDatabaseUrl = "file:./data/summaries.db";

export type AppDatabase = BetterSQLite3Database<typeof schema>;
export type InsertSummaryData = Omit<NewSummary, "id" | "createdAt"> &
  Partial<Pick<NewSummary, "id" | "createdAt">>;

/**
 * Resolves a file-style SQLite database URL into a filesystem path.
 *
 * The app stores local SQLite files under the project-level data directory by
 * default. Hosted SQLite-compatible URLs are intentionally not handled by this
 * better-sqlite3 client.
 */
export function resolveSqlitePath(
  databaseUrl = process.env.DATABASE_URL ?? defaultDatabaseUrl,
) {
  const sqlitePath = databaseUrl.replace(/^file:/, "");

  if (sqlitePath === ":memory:" || path.isAbsolute(sqlitePath)) {
    return sqlitePath;
  }

  return path.resolve(/* turbopackIgnore: true */ process.cwd(), sqlitePath);
}

/**
 * Normalizes dates to the precision persisted by Drizzle's SQLite timestamp.
 *
 * The integer timestamp mode stores seconds, so the returned insert payload is
 * rounded the same way as records read back from SQLite.
 */
export function normalizeSqliteTimestamp(date: Date) {
  return new Date(Math.floor(date.getTime() / 1000) * 1000);
}

/**
 * Creates a Drizzle client backed by a local SQLite file.
 *
 * Parent directories are created automatically so first-run development and
 * migration commands can use the default data/summaries.db path without setup.
 */
export function createDb(
  databaseUrl = process.env.DATABASE_URL ?? defaultDatabaseUrl,
): AppDatabase {
  const sqlitePath = resolveSqlitePath(databaseUrl);

  if (sqlitePath !== ":memory:") {
    mkdirSync(path.dirname(sqlitePath), { recursive: true });
  }

  const sqlite = new Database(sqlitePath);
  sqlite.pragma("foreign_keys = ON");

  return drizzle(sqlite, { schema });
}

export const db = createDb();

/**
 * Inserts a summary row and returns the persisted record.
 *
 * Missing ids and timestamps are generated in application code so callers can
 * pass only article and summary fields.
 */
export async function insertSummary(data: InsertSummaryData): Promise<Summary> {
  const record: NewSummary = {
    id: data.id ?? randomUUID(),
    url: data.url,
    title: data.title,
    content: data.content,
    oneLine: data.oneLine,
    short: data.short,
    detailed: data.detailed,
    createdAt: normalizeSqliteTimestamp(data.createdAt ?? new Date()),
  };

  await db.insert(summaries).values(record);

  return record;
}

/**
 * Returns a paginated list of summaries ordered from newest to oldest.
 *
 * Page numbers are one-based and limits are clamped to keep accidental large
 * history queries from loading the full database.
 */
export async function getSummaries(
  page = 1,
  limit = 20,
): Promise<Summary[]> {
  const safePage = Math.max(1, Math.floor(page));
  const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)));

  return db
    .select()
    .from(summaries)
    .orderBy(desc(summaries.createdAt))
    .limit(safeLimit)
    .offset((safePage - 1) * safeLimit);
}

/**
 * Finds one summary by id.
 *
 * Undefined is returned when no row exists so route handlers can map that to a
 * not-found response without catching a database exception.
 */
export async function getSummaryById(id: string): Promise<Summary | undefined> {
  const [record] = await db
    .select()
    .from(summaries)
    .where(eq(summaries.id, id))
    .limit(1);

  return record;
}

/**
 * Deletes a summary by id and reports whether a row was removed.
 *
 * The boolean return value lets Server Actions distinguish a successful delete
 * from a request for a missing summary.
 */
export async function deleteSummary(id: string): Promise<boolean> {
  const deleted = await db
    .delete(summaries)
    .where(eq(summaries.id, id))
    .returning({ id: summaries.id });

  return deleted.length > 0;
}
