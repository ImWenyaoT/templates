"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  formatSummaryDate,
  type SummaryViewModel,
  summaryTabs,
} from "./summary-view-model";

/**
 * Checks whether a summary matches the current history search query.
 */
function matchesSearch(summary: SummaryViewModel, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  const searchableText = [
    summary.title,
    summary.url,
    summary.source,
    summary.excerpt,
    summary.articleHash,
    ...summary.highlights,
  ]
    .join(" ")
    .toLowerCase();

  return searchableText.includes(normalizedQuery);
}

/**
 * Renders searchable, expandable history records from persisted summaries.
 */
export function HistoryWorkspace({
  summaries,
}: {
  summaries: SummaryViewModel[];
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(
    summaries[0]?.id ?? null,
  );

  const filteredSummaries = useMemo(
    () => summaries.filter((summary) => matchesSearch(summary, searchQuery)),
    [searchQuery, summaries],
  );

  /**
   * Toggles the expanded detail panel for a history item.
   */
  function toggleSummary(summaryId: string) {
    setExpandedId((currentId) => (currentId === summaryId ? null : summaryId));
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal text-stone-950 sm:text-3xl">
              历史记录
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
              搜索和回看已经生成并保存的文章摘要。
            </p>
          </div>
          <div className="w-full lg:max-w-sm">
            <label
              className="text-sm font-medium text-stone-800"
              htmlFor="history-search"
            >
              搜索摘要
            </label>
            <input
              className="mt-2 min-h-11 w-full rounded-md border border-stone-300 bg-stone-50 px-3 text-base text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
              id="history-search"
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="按标题、URL、来源或关键点过滤"
              type="search"
              value={searchQuery}
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        {filteredSummaries.length > 0 ? (
          filteredSummaries.map((summary) => {
            const isExpanded = expandedId === summary.id;

            return (
              <article
                className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm"
                key={summary.id}
              >
                <button
                  aria-expanded={isExpanded}
                  className="flex w-full flex-col gap-3 p-5 text-left transition hover:bg-stone-50 sm:p-6"
                  onClick={() => toggleSummary(summary.id)}
                  type="button"
                >
                  <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-sm font-medium text-emerald-800">
                        {summary.source} · {formatSummaryDate(summary.createdAt)}
                      </p>
                      <h2 className="mt-2 text-xl font-semibold tracking-normal text-stone-950">
                        {summary.title}
                      </h2>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
                        {summary.excerpt}
                      </p>
                    </div>
                    <span className="inline-flex min-h-9 items-center justify-center rounded-md border border-stone-200 px-3 text-sm font-medium text-stone-700">
                      {isExpanded ? "收起详情" : "展开详情"}
                    </span>
                  </div>
                  <p className="break-all text-xs text-stone-500">
                    {summary.url}
                  </p>
                </button>

                {isExpanded ? (
                  <div className="border-t border-stone-200 px-5 py-5 sm:px-6">
                    <Link
                      className="mb-5 inline-flex text-sm font-medium text-emerald-800 hover:text-emerald-950"
                      href={`/summaries/${summary.id}`}
                    >
                      打开摘要结果页
                    </Link>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-md bg-stone-50 p-3">
                        <span className="text-xs text-stone-500">阅读时间</span>
                        <strong className="mt-1 block text-sm font-semibold text-stone-950">
                          {summary.readingTimeMinutes} 分钟
                        </strong>
                      </div>
                      <div className="rounded-md bg-stone-50 p-3">
                        <span className="text-xs text-stone-500">文章 Hash</span>
                        <strong className="mt-1 block text-sm font-semibold text-stone-950">
                          {summary.articleHash}
                        </strong>
                      </div>
                      <div className="rounded-md bg-stone-50 p-3">
                        <span className="text-xs text-stone-500">摘要版本</span>
                        <strong className="mt-1 block text-sm font-semibold text-stone-950">
                          3 种长度
                        </strong>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 lg:grid-cols-3">
                      {summaryTabs.map((tab) => (
                        <section
                          className="rounded-md border border-stone-200 p-4"
                          key={tab.id}
                        >
                          <h3 className="text-sm font-semibold text-stone-950">
                            {tab.label}
                          </h3>
                          <p className="mt-3 text-sm leading-6 text-stone-700">
                            {summary.summaries[tab.id]}
                          </p>
                        </section>
                      ))}
                    </div>

                    <div className="mt-5">
                      <h3 className="text-sm font-semibold text-stone-950">
                        关键点
                      </h3>
                      <ul className="mt-3 grid gap-2 md:grid-cols-3">
                        {summary.highlights.map((highlight) => (
                          <li
                            className="rounded-md bg-emerald-50 px-3 py-3 text-sm leading-6 text-emerald-950"
                            key={highlight}
                          >
                            {highlight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })
        ) : (
          <div className="rounded-lg border border-stone-200 bg-white px-5 py-12 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-stone-950">
              {summaries.length > 0 ? "没有匹配的历史记录" : "还没有历史记录"}
            </h2>
            <p className="mt-2 text-sm text-stone-600">
              {summaries.length > 0
                ? "换一个关键词，或清空搜索框后查看全部摘要。"
                : "回到首页生成第一篇摘要后，会在这里显示。"}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
