import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  formatSummaryDate,
  summaryTabs,
  toSummaryViewModel,
} from "../../_components/summary-view-model";
import { createPageMetadata } from "../../seo";
import { getSummaryById } from "@/lib/db";
import { serializeSummaryRecord } from "@/lib/summary-serializer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type SummaryPageProps = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * Creates SEO metadata for each persisted summary result page.
 */
export async function generateMetadata({
  params,
}: SummaryPageProps): Promise<Metadata> {
  const { id } = await params;
  const record = await getSummaryById(id);

  if (!record) {
    return createPageMetadata({
      title: "摘要结果不存在 | AI Article Summarizer",
      description: "未找到对应的摘要结果，请返回历史记录查看可用摘要。",
      path: `/summaries/${id}`,
    });
  }

  const summary = toSummaryViewModel(serializeSummaryRecord(record));

  return createPageMetadata({
    title: `${summary.title} | 摘要结果`,
    description: summary.excerpt,
    path: `/summaries/${summary.id}`,
  });
}

/**
 * Renders a shareable summary result page from persisted summary records.
 */
export default async function SummaryResultPage({ params }: SummaryPageProps) {
  const { id } = await params;
  const record = await getSummaryById(id);

  if (!record) {
    notFound();
  }

  const summary = toSummaryViewModel(serializeSummaryRecord(record));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <nav aria-label="面包屑" className="text-sm text-stone-600">
        <Link className="font-medium text-emerald-800 hover:text-emerald-950" href="/history">
          历史记录
        </Link>
        <span className="mx-2 text-stone-400">/</span>
        <span>摘要结果</span>
      </nav>

      <article className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 border-b border-stone-200 pb-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-800">
              {summary.source} · {formatSummaryDate(summary.createdAt)}
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-normal text-stone-950 sm:text-3xl">
              {summary.title}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
              {summary.excerpt}
            </p>
            <p className="mt-4 break-all text-xs text-stone-500">{summary.url}</p>
          </div>
          <div className="grid gap-2 text-sm text-stone-600 sm:min-w-72 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-md bg-stone-50 p-3">
              <span className="block text-xs text-stone-500">阅读时间</span>
              <strong className="mt-1 block font-semibold text-stone-950">
                {summary.readingTimeMinutes} 分钟
              </strong>
            </div>
            <div className="rounded-md bg-stone-50 p-3">
              <span className="block text-xs text-stone-500">文章 Hash</span>
              <strong className="mt-1 block font-semibold text-stone-950">
                {summary.articleHash}
              </strong>
            </div>
            <div className="rounded-md bg-stone-50 p-3">
              <span className="block text-xs text-stone-500">渲染方式</span>
              <strong className="mt-1 block font-semibold text-stone-950">SSG</strong>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {summaryTabs.map((tab) => (
            <section className="rounded-md border border-stone-200 p-4" key={tab.id}>
              <h2 className="text-base font-semibold text-stone-950">{tab.label}</h2>
              <p className="mt-1 text-xs text-stone-500">{tab.helper}</p>
              <p className="mt-4 text-sm leading-6 text-stone-700">
                {summary.summaries[tab.id]}
              </p>
            </section>
          ))}
        </div>

        <section className="mt-6 rounded-md bg-emerald-50 p-4">
          <h2 className="text-base font-semibold text-emerald-950">关键点</h2>
          <ul className="mt-3 grid gap-2 md:grid-cols-3">
            {summary.highlights.map((highlight) => (
              <li className="rounded-md bg-white px-3 py-3 text-sm leading-6 text-emerald-950" key={highlight}>
                {highlight}
              </li>
            ))}
          </ul>
        </section>
      </article>
    </div>
  );
}
