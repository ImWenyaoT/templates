import "server-only";

import type { Summary } from "./schema";

export type SummaryApiRecord = {
  id: string;
  url: string;
  normalized_url: string;
  title: string;
  excerpt: string;
  summaries: {
    one_line: string;
    short: string;
    detailed: string;
  };
  status: "completed";
  created_at: string;
  updated_at: string;
};

/**
 * Serializes a database summary row into the public API shape.
 *
 * The database stores a compact content excerpt, while route responses group
 * the three generated summary lengths under a stable `summaries` object.
 */
export function serializeSummaryRecord(record: Summary): SummaryApiRecord {
  const createdAt = record.createdAt.toISOString();

  return {
    id: record.id,
    url: record.url,
    normalized_url: record.url,
    title: record.title,
    excerpt: record.content,
    summaries: {
      one_line: record.oneLine,
      short: record.short,
      detailed: record.detailed,
    },
    status: "completed",
    created_at: createdAt,
    updated_at: createdAt,
  };
}
