import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const summaries = sqliteTable(
  "summaries",
  {
    id: text("id").primaryKey(),
    url: text("url").notNull(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    oneLine: text("one_line").notNull(),
    short: text("short").notNull(),
    detailed: text("detailed").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    index("summaries_url_idx").on(table.url),
    index("summaries_created_at_idx").on(table.createdAt),
  ],
);

export type Summary = typeof summaries.$inferSelect;
export type NewSummary = typeof summaries.$inferInsert;
