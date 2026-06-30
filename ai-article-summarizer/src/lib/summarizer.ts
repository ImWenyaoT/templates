import "server-only";

import { fetchArticleHtml } from "./article-fetcher";
import { extractArticle } from "./article-extractor";
import { insertSummary } from "./db";
import type { InsertSummaryData } from "./database";
import { AppError } from "./errors";
import { generateArticleSummaries } from "./openai-summarizer";
import { serializeSummaryRecord } from "./summary-serializer";

/**
 * Runs the full article summarization workflow for one URL.
 *
 * The workflow fetches static HTML, extracts readable text, asks the configured
 * model for three summary lengths, stores summary metadata, and returns the
 * public API record shape.
 */
export async function summarizeArticle(url: string) {
  const fetched = await fetchArticleHtml(url);
  const article = extractArticle(fetched.html);
  const summaries = await generateArticleSummaries({
    title: article.title,
    url: fetched.finalUrl,
    text: article.text,
  });
  const record = {
    url: fetched.finalUrl,
    title: article.title ?? fetched.finalUrl,
    content: article.excerpt,
    oneLine: summaries.one_line,
    short: summaries.short,
    detailed: summaries.detailed,
  } satisfies InsertSummaryData;

  const inserted = await insertSummary(record).catch(() => {
    throw new AppError("DATABASE_FAILED", "摘要已生成，但保存记录失败。", 500);
  });

  return serializeSummaryRecord(inserted);
}
