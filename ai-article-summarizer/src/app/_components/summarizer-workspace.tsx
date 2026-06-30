"use client";

import { type ClipboardEvent, type FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  formatSummaryDate,
  type SummaryRecordPayload,
  type SummaryLength,
  type SummaryViewModel,
  summaryTabs,
  toSummaryViewModel,
} from "./summary-view-model";

type SummaryStatus = "idle" | "loading" | "success" | "error";

type ApiErrorPayload = {
  ok: false;
  error: {
    code: string;
    message: string;
    request_id: string;
    retryable: boolean;
  };
};

type ApiSuccessPayload = {
  ok: true;
  data: SummaryRecordPayload;
  request_id: string;
};

type ErrorState = {
  code: string;
  message: string;
  requestId: string | null;
  retryable: boolean;
};


/**
 * Checks whether the provided string is an HTTP(S) URL the UI can submit.
 */
function isValidArticleUrl(value: string): boolean {
  try {
    const parsedUrl = new URL(value);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Builds a typed error state from the unified API error envelope.
 */
function toErrorState(payload: ApiErrorPayload | null, fallbackMessage: string): ErrorState {
  return {
    code: payload?.error.code ?? "NETWORK_ERROR",
    message: payload?.error.message ?? fallbackMessage,
    requestId: payload?.error.request_id ?? null,
    retryable: payload?.error.retryable ?? true,
  };
}

/**
 * Renders the URL input workflow, loading state, error UI, and tabbed result.
 */
export function SummarizerWorkspace({
  initialRecentSummaries,
}: {
  initialRecentSummaries: SummaryViewModel[];
}) {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<SummaryStatus>("idle");
  const [activeTab, setActiveTab] = useState<SummaryLength>("short");
  const [summary, setSummary] = useState<SummaryViewModel | null>(null);
  const [error, setError] = useState<ErrorState | null>(null);

  const recentSummaries = useMemo(
    () =>
      summary
        ? [
            summary,
            ...initialRecentSummaries.filter((item) => item.id !== summary.id),
          ].slice(0, 3)
        : initialRecentSummaries,
    [initialRecentSummaries, summary],
  );

  /**
   * Calls POST /api/summarize and maps unified API errors into UI state.
   */
  async function runSummary(nextUrl = url) {
    const normalizedUrl = nextUrl.trim();

    if (!isValidArticleUrl(normalizedUrl)) {
      setStatus("error");
      setSummary(null);
      setError({
        code: "INVALID_URL",
        message: "请输入以 http:// 或 https:// 开头的文章 URL。",
        requestId: null,
        retryable: false,
      });
      return;
    }

    setUrl(normalizedUrl);
    setStatus("loading");
    setError(null);

    try {
      const response = await fetch("/api/summarize", {
        body: JSON.stringify({ url: normalizedUrl }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as
        | ApiSuccessPayload
        | ApiErrorPayload
        | null;

      if (!response.ok || !payload?.ok) {
        setSummary(null);
        setError(
          toErrorState(
            payload && !payload.ok ? payload : null,
            "生成摘要时遇到网络问题，请稍后重试。",
          ),
        );
        setStatus("error");
        return;
      }

      setSummary(toSummaryViewModel(payload.data));
      setActiveTab("short");
      setStatus("success");
    } catch {
      setSummary(null);
      setError(toErrorState(null, "无法连接摘要服务，请检查网络后重试。"));
      setStatus("error");
    }
  }

  /**
   * Handles normal form submission for manual URL entry.
   */
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runSummary();
  }

  /**
   * Starts the summarization flow immediately when a URL is pasted.
   */
  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    const pastedValue = event.clipboardData.getData("text").trim();

    if (!pastedValue) {
      return;
    }

    setUrl(pastedValue);
    window.setTimeout(() => void runSummary(pastedValue), 0);
  }

  const activeSummaryText = summary?.summaries[activeTab] ?? "";
  const activeTabMeta = summaryTabs.find((tab) => tab.id === activeTab);
  const formErrorId = error ? "article-url-error" : undefined;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-center">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-semibold tracking-normal text-stone-950 sm:text-3xl">
                输入文章 URL，生成三种长度的摘要
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-stone-600">
                服务端会抓取静态正文，必要时使用已配置的抓取降级方案，并在
                API 超时后自动重试。
              </p>
            </div>
            <Image
              alt="摘要结果卡片预览"
              className="hidden h-auto w-full rounded-md border border-stone-200 bg-stone-50 lg:block"
              height={158}
              priority
              src="/summary-preview.svg"
              width={240}
            />
          </div>

          <form className="mt-6" onSubmit={handleSubmit}>
            <label
              className="text-sm font-medium text-stone-800"
              htmlFor="article-url"
            >
              文章 URL
            </label>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input
                aria-describedby={formErrorId}
                aria-invalid={status === "error"}
                className="min-h-12 flex-1 rounded-md border border-stone-300 bg-stone-50 px-3 text-base text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15 aria-invalid:border-red-300 aria-invalid:bg-red-50"
                disabled={status === "loading"}
                id="article-url"
                name="article-url"
                onChange={(event) => setUrl(event.target.value)}
                onPaste={handlePaste}
                placeholder="https://example.com/article"
                type="url"
                value={url}
              />
              <button
                className="inline-flex min-h-12 items-center justify-center rounded-md bg-stone-950 px-5 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
                disabled={status === "loading"}
                type="submit"
              >
                {status === "loading" ? "生成中..." : "生成摘要"}
              </button>
            </div>
            {error ? (
              <p className="mt-3 text-sm text-red-700" id="article-url-error">
                {error.message}
              </p>
            ) : null}
          </form>
        </div>

        <aside className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-stone-950">最近摘要</h2>
            <Link
              className="text-sm font-medium text-emerald-800 hover:text-emerald-950"
              href="/history"
            >
              查看全部
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {recentSummaries.length > 0 ? (
              recentSummaries.map((item) => (
                <article
                  className="rounded-md border border-stone-200 bg-stone-50 p-3"
                  key={item.id}
                >
                  <p className="line-clamp-2 text-sm font-medium leading-5 text-stone-900">
                    {item.title}
                  </p>
                  <p className="mt-2 text-xs text-stone-500">
                    {formatSummaryDate(item.createdAt)} · {item.source}
                  </p>
                  <Link
                    className="mt-3 inline-flex text-xs font-medium text-emerald-800 hover:text-emerald-950"
                    href={`/summaries/${item.id}`}
                  >
                    打开摘要结果页
                  </Link>
                </article>
              ))
            ) : (
              <p className="rounded-md border border-dashed border-stone-200 bg-stone-50 p-3 text-sm leading-6 text-stone-600">
                暂无历史摘要。生成第一篇后会显示在这里。
              </p>
            )}
          </div>
        </aside>
      </section>

      <section className="rounded-lg border border-stone-200 bg-white shadow-sm">
        {status === "idle" ? (
          <div className="flex min-h-80 flex-col items-center justify-center px-5 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-lg font-semibold text-emerald-800">
              AI
            </div>
            <h2 className="mt-4 text-xl font-semibold text-stone-950">
              摘要结果会显示在这里
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-stone-600">
              粘贴文章链接会自动开始生成，也可以输入后点击提交按钮。
            </p>
          </div>
        ) : null}

        {status === "loading" ? (
          <div className="min-h-80 px-5 py-6 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-stone-300 border-t-emerald-800" />
              <p className="text-sm font-medium text-stone-800">
                正在抓取文章并生成摘要...
              </p>
            </div>
            <div className="mt-6 space-y-4">
              <div className="h-5 w-2/3 animate-pulse rounded bg-stone-200" />
              <div className="h-28 animate-pulse rounded-md bg-stone-100" />
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="h-20 animate-pulse rounded-md bg-stone-100" />
                <div className="h-20 animate-pulse rounded-md bg-stone-100" />
                <div className="h-20 animate-pulse rounded-md bg-stone-100" />
              </div>
            </div>
          </div>
        ) : null}

        {status === "error" && error ? (
          <div className="min-h-80 px-5 py-8 sm:px-6">
            <div className="rounded-lg border border-red-200 bg-red-50 p-5">
              <p className="text-sm font-semibold text-red-900">生成失败</p>
              <h2 className="mt-2 text-xl font-semibold text-stone-950">
                {error.message}
              </h2>
              <p className="mt-3 text-sm leading-6 text-stone-700">
                可以换一个公开文章链接，确认页面无需登录且正文可直接访问；如果是临时网络或模型超时问题，可以稍后重试。
              </p>
              <dl className="mt-4 grid gap-2 text-xs text-stone-600 sm:grid-cols-2">
                <div className="rounded-md bg-white/70 p-3">
                  <dt className="font-medium text-stone-800">错误代码</dt>
                  <dd className="mt-1 font-mono">{error.code}</dd>
                </div>
                <div className="rounded-md bg-white/70 p-3">
                  <dt className="font-medium text-stone-800">请求 ID</dt>
                  <dd className="mt-1 font-mono">{error.requestId ?? "本地校验"}</dd>
                </div>
              </dl>
              {error.retryable ? (
                <button
                  className="mt-5 inline-flex min-h-10 items-center justify-center rounded-md bg-red-900 px-4 text-sm font-semibold text-white transition hover:bg-red-800"
                  onClick={() => void runSummary()}
                  type="button"
                >
                  重试生成
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {status === "success" && summary ? (
          <div className="px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 border-b border-stone-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-800">
                  {summary.source}
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-normal text-stone-950">
                  {summary.title}
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
                  {summary.excerpt}
                </p>
                <Link
                  className="mt-3 inline-flex text-sm font-medium text-emerald-800 hover:text-emerald-950"
                  href={`/summaries/${summary.id}`}
                >
                  查看摘要结果页
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm text-stone-600 sm:min-w-64">
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
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2" role="tablist">
              {summaryTabs.map((tab) => (
                <button
                  aria-selected={activeTab === tab.id}
                  className="rounded-md border px-3 py-2 text-sm font-medium transition aria-selected:border-emerald-800 aria-selected:bg-emerald-800 aria-selected:text-white border-stone-200 text-stone-700 hover:border-emerald-700"
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  role="tab"
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <article className="mt-5 rounded-md bg-stone-50 p-4 sm:p-5">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-base font-semibold text-stone-950">
                  {activeTabMeta?.label}
                </h3>
                <p className="text-sm text-stone-500">{activeTabMeta?.helper}</p>
              </div>
              <p className="mt-4 whitespace-pre-line text-base leading-8 text-stone-800">
                {activeSummaryText}
              </p>
            </article>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {summary.highlights.map((highlight) => (
                <div
                  className="rounded-md border border-stone-200 p-3 text-sm leading-6 text-stone-700"
                  key={highlight}
                >
                  {highlight}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
