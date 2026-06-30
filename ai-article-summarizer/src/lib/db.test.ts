import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import type { InsertSummaryData } from "./db";
import { summaries } from "./schema";

let tempDir: string;
let databaseModule: typeof import("./db");

/**
 * Creates summary data with safe defaults for CRUD tests.
 *
 * Individual tests can override fields without repeating the full row shape.
 */
function makeSummary(overrides: Partial<InsertSummaryData> = {}) {
  return {
    url: "https://example.com/article",
    title: "Example article",
    content: "Article body used for summarization.",
    oneLine: "One line summary.",
    short: "Short summary.",
    detailed: "Detailed summary.",
    ...overrides,
  } satisfies InsertSummaryData;
}

beforeAll(async () => {
  tempDir = mkdtempSync(path.join(tmpdir(), "summaries-db-"));
  process.env.DATABASE_URL = `file:${path.join(tempDir, "test.db")}`;

  databaseModule = await import("./db");
  migrate(databaseModule.db, {
    migrationsFolder: path.resolve(process.cwd(), "src/lib/db/migrations"),
  });
});

beforeEach(async () => {
  await databaseModule.db.delete(summaries);
});

afterAll(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe("summary database CRUD", () => {
  it("inserts and fetches a summary by id", async () => {
    const inserted = await databaseModule.insertSummary(
      makeSummary({ id: "summary-1" }),
    );

    const found = await databaseModule.getSummaryById("summary-1");

    expect(found).toEqual(inserted);
  });

  it("lists summaries with newest-first pagination", async () => {
    await databaseModule.insertSummary(
      makeSummary({
        id: "old",
        title: "Old",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      }),
    );
    await databaseModule.insertSummary(
      makeSummary({
        id: "new",
        title: "New",
        createdAt: new Date("2026-01-02T00:00:00.000Z"),
      }),
    );
    await databaseModule.insertSummary(
      makeSummary({
        id: "newest",
        title: "Newest",
        createdAt: new Date("2026-01-03T00:00:00.000Z"),
      }),
    );

    const firstPage = await databaseModule.getSummaries(1, 2);
    const secondPage = await databaseModule.getSummaries(2, 2);

    expect(firstPage.map((summary) => summary.id)).toEqual(["newest", "new"]);
    expect(secondPage.map((summary) => summary.id)).toEqual(["old"]);
  });

  it("deletes an existing summary and reports missing rows", async () => {
    await databaseModule.insertSummary(makeSummary({ id: "delete-me" }));

    await expect(databaseModule.deleteSummary("delete-me")).resolves.toBe(true);
    await expect(databaseModule.getSummaryById("delete-me")).resolves.toBe(
      undefined,
    );
    await expect(databaseModule.deleteSummary("delete-me")).resolves.toBe(false);
  });
});
