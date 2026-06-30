export type SummaryLength = "brief" | "short" | "detailed";

export type SummaryViewModel = {
  id: string;
  title: string;
  url: string;
  source: string;
  excerpt: string;
  articleHash: string;
  createdAt: string;
  readingTimeMinutes: number;
  summaries: Record<SummaryLength, string>;
  highlights: string[];
};

export type SummaryRecordPayload = {
  id: string;
  url: string;
  title: string;
  excerpt: string;
  summaries: {
    one_line: string;
    short: string;
    detailed: string;
  };
  created_at: string;
};

export const summaryTabs: Array<{
  id: SummaryLength;
  label: string;
  helper: string;
}> = [
  {
    id: "brief",
    label: "一句话",
    helper: "适合先判断是否值得继续阅读。",
  },
  {
    id: "short",
    label: "短摘要",
    helper: "保留文章核心事实和结论。",
  },
  {
    id: "detailed",
    label: "详细摘要",
    helper: "覆盖背景、论证和可行动信息。",
  },
];

/**
 * Formats an ISO timestamp for compact user-facing history metadata.
 */
export function formatSummaryDate(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

/**
 * Converts a persisted API summary record into the shared UI view model.
 */
export function toSummaryViewModel(record: SummaryRecordPayload): SummaryViewModel {
  return {
    id: record.id,
    title: record.title,
    url: record.url,
    source: getSummarySource(record.url),
    excerpt: record.excerpt,
    articleHash: record.id.slice(0, 8),
    createdAt: record.created_at,
    readingTimeMinutes: estimateReadingTime(record),
    summaries: {
      brief: record.summaries.one_line,
      short: record.summaries.short,
      detailed: record.summaries.detailed,
    },
    highlights: createHighlights(record),
  };
}

/**
 * Builds a user-friendly display source from a summary URL.
 */
function getSummarySource(value: string): string {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "文章来源";
  }
}

/**
 * Estimates reading time from the generated excerpts and summaries.
 */
function estimateReadingTime(summary: SummaryRecordPayload): number {
  const textLength = [
    summary.excerpt,
    summary.summaries.one_line,
    summary.summaries.short,
    summary.summaries.detailed,
  ].join(" ").length;

  return Math.max(1, Math.ceil(textLength / 450));
}

/**
 * Creates compact highlights from the generated detailed summary.
 */
function createHighlights(summary: SummaryRecordPayload): string[] {
  const sentences = summary.summaries.detailed
    .replace(/([。！？.!?])\s*/g, "$1\n")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  return sentences.slice(0, 3).length > 0
    ? sentences.slice(0, 3)
    : [summary.summaries.one_line];
}
