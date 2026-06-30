import type { Metadata } from "next";
import { HistoryWorkspace } from "../_components/history-workspace";
import { toSummaryViewModel } from "../_components/summary-view-model";
import { createPageMetadata } from "../seo";
import { getSummaries } from "@/lib/db";
import { serializeSummaryRecord } from "@/lib/summary-serializer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata: Metadata = createPageMetadata({
  title: "摘要历史记录 | AI Article Summarizer",
  description:
    "搜索和回看已生成的文章摘要，按标题、来源、URL 和关键点快速定位历史结果。",
  path: "/history",
});

/**
 * Renders the summary history page as a server-composed route.
 */
export default async function HistoryPage() {
  const summaries = await getHistoryViewModels();

  return <HistoryWorkspace summaries={summaries} />;
}

/**
 * Loads persisted history records for the searchable client-side list.
 */
async function getHistoryViewModels() {
  const records = await getSummaries(1, 50).catch(() => []);

  return records.map((record) =>
    toSummaryViewModel(serializeSummaryRecord(record)),
  );
}
