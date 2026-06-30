import "server-only";

import { deleteSummary, getSummaries, getSummaryById, insertSummary } from "../database";
import type { InsertSummaryData } from "../database";

/**
 * Lists recent summary records for older UI call sites.
 *
 * This compatibility wrapper keeps the original query module path available
 * while delegating to the root database facade.
 */
export async function listRecentSummaries(limit = 20) {
  return getSummaries(1, limit);
}

/**
 * Finds a single summary record by id through the shared database facade.
 */
export { getSummaryById };

/**
 * Inserts a summary record through the shared database facade.
 */
export async function insertSummaryRecord(record: InsertSummaryData) {
  return insertSummary(record);
}

/**
 * Inserts a summary record using the public database helper naming.
 */
export { insertSummary };

/**
 * Deletes a summary record by id through the shared database facade.
 */
export async function deleteSummaryRecord(id: string) {
  return deleteSummary(id);
}
