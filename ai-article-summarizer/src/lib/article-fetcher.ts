import "server-only";

import { AppError } from "./errors";
import { assertPublicArticleUrl } from "./validators";

export type ArticleFetchSource = "direct" | "fallback";

export type FetchedArticleHtml = {
  html: string;
  finalUrl: string;
  source: ArticleFetchSource;
};

const FETCH_TIMEOUT_MS = 12_000;
const FALLBACK_FETCH_TIMEOUT_MS = 15_000;
const MAX_REDIRECTS = 5;
const MAX_HTML_BYTES = 2_000_000;
const USER_AGENT =
  "AIArticleSummarizer/0.1 (+https://example.com; static-html-fetcher)";

/**
 * Fetches static article HTML with redirect, timeout, and size controls.
 *
 * Each requested and redirected URL is checked for SSRF-sensitive targets before
 * fetching. If direct fetching fails and ARTICLE_FETCH_FALLBACK_URL is set, a
 * configured reader/rendering service is tried as a bounded degradation path.
 */
export async function fetchArticleHtml(inputUrl: string): Promise<FetchedArticleHtml> {
  const initialUrl = await assertPublicArticleUrl(inputUrl);

  try {
    return await fetchArticleHtmlDirect(initialUrl);
  } catch (error) {
    if (!shouldAttemptFallback(error)) {
      throw error;
    }

    return fetchArticleHtmlViaFallback(initialUrl, error);
  }
}

/**
 * Fetches an article through the primary static HTML path.
 *
 * Redirects are followed manually so every hop can be validated before the next
 * network request is issued.
 */
async function fetchArticleHtmlDirect(initialUrl: URL): Promise<FetchedArticleHtml> {
  let currentUrl = initialUrl;

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    const response = await fetchWithTimeout(currentUrl, FETCH_TIMEOUT_MS);

    if (isRedirect(response.status)) {
      const location = response.headers.get("location");

      if (!location) {
        throw new AppError("FETCH_FAILED", "文章链接重定向异常，无法继续抓取。", 502);
      }

      currentUrl = await assertPublicArticleUrl(new URL(location, currentUrl).toString());
      continue;
    }

    if (!response.ok) {
      throw new AppError("FETCH_FAILED", "文章页面暂时无法访问。", 502);
    }

    assertHtmlResponse(response);

    return {
      html: await readLimitedBody(response),
      finalUrl: currentUrl.toString(),
      source: "direct",
    };
  }

  throw new AppError("FETCH_FAILED", "文章链接重定向次数过多。", 502);
}

/**
 * Tries the optional article reader/rendering fallback after direct fetch fails.
 *
 * The fallback URL must be an http(s) template containing `{url}`. Its host is
 * SSRF-checked too, and the original safe error is preserved if fallback fails.
 */
async function fetchArticleHtmlViaFallback(
  originalUrl: URL,
  originalError: unknown,
): Promise<FetchedArticleHtml> {
  const fallbackUrl = await buildFallbackUrl(originalUrl);

  if (!fallbackUrl) {
    throw originalError;
  }

  try {
    const response = await fetchWithTimeout(fallbackUrl, FALLBACK_FETCH_TIMEOUT_MS);

    if (!response.ok) {
      throw originalError;
    }

    return {
      html: await readLimitedBody(response),
      finalUrl: originalUrl.toString(),
      source: "fallback",
    };
  } catch {
    throw originalError;
  }
}

/**
 * Builds and validates the optional fallback service URL.
 *
 * ARTICLE_FETCH_FALLBACK_URL should be a template such as
 * `https://reader.example.com/render?url={url}`; without a placeholder the
 * fallback is disabled to avoid accidentally sending malformed requests.
 */
async function buildFallbackUrl(originalUrl: URL) {
  const template = process.env.ARTICLE_FETCH_FALLBACK_URL?.trim();

  if (!template || !template.includes("{url}")) {
    return null;
  }

  return assertPublicArticleUrl(
    template.replace("{url}", encodeURIComponent(originalUrl.toString())),
  );
}

/**
 * Decides whether a direct-fetch failure is safe and useful to degrade.
 *
 * Validation and SSRF failures are never sent to a fallback provider; transient
 * network/status failures and unsupported direct content are eligible.
 */
function shouldAttemptFallback(error: unknown) {
  return (
    error instanceof AppError &&
    (error.code === "FETCH_FAILED" || error.code === "UNSUPPORTED_CONTENT")
  );
}

/**
 * Performs one fetch request with manual redirects and an abort timeout.
 *
 * The caller owns redirect handling so every redirected target can be validated
 * before the next network request.
 */
async function fetchWithTimeout(url: URL, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      headers: {
        accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.1",
        "user-agent": USER_AGENT,
      },
      redirect: "manual",
      signal: controller.signal,
    });
  } catch {
    throw new AppError("FETCH_FAILED", "抓取文章超时或网络不可用。", 502);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Verifies that a response looks like static HTML.
 *
 * Binary files, JSON APIs, downloads, and other non-article responses are
 * rejected before body parsing.
 */
function assertHtmlResponse(response: Response) {
  const contentLength = Number.parseInt(response.headers.get("content-length") ?? "0", 10);
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";

  if (contentLength > MAX_HTML_BYTES) {
    throw new AppError("UNSUPPORTED_CONTENT", "文章页面过大，暂时无法处理。", 413);
  }

  if (
    contentType &&
    !contentType.includes("text/html") &&
    !contentType.includes("application/xhtml+xml")
  ) {
    throw new AppError("UNSUPPORTED_CONTENT", "链接内容不是可解析的网页文章。", 415);
  }
}

/**
 * Reads a response body up to the configured byte limit.
 *
 * The function aborts parsing as soon as the response exceeds the limit so the
 * API route does not buffer unexpectedly large pages in memory.
 */
async function readLimitedBody(response: Response) {
  if (!response.body) {
    throw new AppError("FETCH_FAILED", "文章页面没有可读取的内容。", 502);
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    totalBytes += value.byteLength;

    if (totalBytes > MAX_HTML_BYTES) {
      await reader.cancel();
      throw new AppError("UNSUPPORTED_CONTENT", "文章页面过大，暂时无法处理。", 413);
    }

    chunks.push(value);
  }

  return Buffer.concat(chunks).toString("utf8");
}

/**
 * Checks whether an HTTP status is a redirect that should be followed manually.
 */
function isRedirect(status: number) {
  return status >= 300 && status < 400;
}
