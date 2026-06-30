import type { Metadata } from "next";
import { SummarizerWorkspace } from "./_components/summarizer-workspace";
import { toSummaryViewModel } from "./_components/summary-view-model";
import { createPageMetadata } from "./seo";
import { getSummaries } from "@/lib/db";
import { serializeSummaryRecord } from "@/lib/summary-serializer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata: Metadata = createPageMetadata({
  title: "AI Article Summarizer | 三档文章摘要工作台",
  description:
    "输入文章 URL，在同一个工作台查看一句话、短摘要和详细摘要，快速判断文章价值。",
  path: "/",
});

/**
 * Renders the primary summarization workspace as a server-composed page.
 */
export default async function Home() {
  const recentSummaries = await getRecentSummaryViewModels();

  return <SummarizerWorkspace initialRecentSummaries={recentSummaries} />;
}

/**
 * Loads the latest persisted summaries for the home sidebar.
 */
async function getRecentSummaryViewModels() {
  const records = await getSummaries(1, 3).catch(() => []);

  return records.map((record) =>
    toSummaryViewModel(serializeSummaryRecord(record)),
  );
}
