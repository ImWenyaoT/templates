import { createDb } from "../database";

/**
 * Creates the local SQLite-backed Drizzle client for server-side code.
 *
 * This compatibility wrapper preserves older imports from src/lib/db/client
 * while the public database API lives in src/lib/db.ts.
 */
export function createDbClient() {
  return createDb();
}

export const db = createDbClient();
