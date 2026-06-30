import "server-only";

import OpenAI from "openai";

import { AppError } from "./errors";

export type GeneratedSummaries = {
  one_line: string;
  short: string;
  detailed: string;
};

const DEFAULT_BASE_URL = "https://api.deepseek.com";
const DEFAULT_MODEL = "deepseek-chat";
const OPENAI_TIMEOUT_MS = 30_000;
const OPENAI_MAX_ATTEMPTS = 3;
const OPENAI_RETRY_BASE_DELAY_MS = 400;

/**
 * Generates three summary lengths for extracted article text with DeepSeek.
 *
 * DeepSeek exposes an OpenAI-compatible chat completions API, so the official
 * OpenAI SDK is used here with a DeepSeek base URL and API key.
 */
export async function generateArticleSummaries(input: {
  title: string | null;
  url: string;
  text: string;
}): Promise<GeneratedSummaries> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseURL = process.env.DEEPSEEK_BASE_URL ?? DEFAULT_BASE_URL;
  const model = process.env.DEEPSEEK_MODEL ?? DEFAULT_MODEL;

  if (!apiKey) {
    throw new AppError(
      "DEEPSEEK_NOT_CONFIGURED",
      "服务端未配置 DEEPSEEK_API_KEY，暂时无法生成摘要。",
      500,
    );
  }

  const client = new OpenAI({
    apiKey,
    baseURL,
    maxRetries: 0,
    timeout: OPENAI_TIMEOUT_MS,
  });

  const completion = await createCompletionWithRetry(client, {
    max_tokens: 2_000,
    messages: [
      {
        role: "system",
        content:
          "你是严谨的文章摘要助手。必须只输出有效 json 对象，不要输出 Markdown 代码块、解释、前言或后记。摘要要忠实于原文，不编造未出现的事实、数字、观点或来源。",
      },
      {
        role: "user",
        content: buildPrompt(input),
      },
    ],
    model,
    response_format: {
      type: "json_object",
    },
    temperature: 0.2,
  });

  const content = completion.choices[0]?.message.content;

  if (!content) {
    throw new AppError("MODEL_OUTPUT_INVALID", "模型没有返回可用摘要。", 502);
  }

  return parseGeneratedSummaries(content);
}

/**
 * Calls the OpenAI-compatible chat completions API with bounded retries.
 *
 * Timeout, rate-limit, and 5xx failures are retried with short exponential
 * backoff; validation errors and malformed model output are never retried here.
 */
async function createCompletionWithRetry(
  client: OpenAI,
  params: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming,
) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= OPENAI_MAX_ATTEMPTS; attempt += 1) {
    try {
      return await client.chat.completions.create(params);
    } catch (error) {
      lastError = error;

      if (!isRetryableOpenAiError(error) || attempt === OPENAI_MAX_ATTEMPTS) {
        break;
      }

      await delay(OPENAI_RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
    }
  }

  if (isOpenAiTimeoutError(lastError)) {
    throw new AppError("DEEPSEEK_TIMEOUT", "摘要生成服务响应超时，请稍后重试。", 504);
  }

  throw new AppError("DEEPSEEK_FAILED", "摘要生成服务暂时不可用，请稍后重试。", 502);
}

/**
 * Checks whether an OpenAI-compatible SDK error should be retried.
 */
function isRetryableOpenAiError(error: unknown) {
  if (isOpenAiTimeoutError(error)) {
    return true;
  }

  const status = readErrorStatus(error);

  return status === 429 || (typeof status === "number" && status >= 500);
}

/**
 * Detects SDK timeout and abort failures without depending on provider internals.
 */
function isOpenAiTimeoutError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as { code?: unknown; name?: unknown; message?: unknown };
  const name = typeof candidate.name === "string" ? candidate.name.toLowerCase() : "";
  const code = typeof candidate.code === "string" ? candidate.code.toLowerCase() : "";
  const message = typeof candidate.message === "string" ? candidate.message.toLowerCase() : "";

  return (
    name.includes("timeout") ||
    name.includes("abort") ||
    code === "etimedout" ||
    code === "timeout" ||
    message.includes("timeout") ||
    message.includes("timed out")
  );
}

/**
 * Reads a numeric HTTP status from OpenAI SDK errors when available.
 */
function readErrorStatus(error: unknown) {
  if (!error || typeof error !== "object") {
    return null;
  }

  const status = (error as { status?: unknown }).status;

  return typeof status === "number" ? status : null;
}

/**
 * Sleeps between retry attempts.
 */
function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Builds the summarization prompt with a bounded article excerpt.
 *
 * The body is capped to keep request size predictable while still providing
 * enough context for long-form article summaries.
 */
function buildPrompt(input: { title: string | null; url: string; text: string }) {
  const boundedText = input.text.slice(0, 24_000);

  return [
    `文章标题：${input.title ?? "未提供"}`,
    `文章 URL：${input.url}`,
    "",
    "请基于正文生成三种摘要，并保持与文章主要语言一致。",
    "必须输出 json 对象，格式示例：",
    '{"one_line":"...","short":"...","detailed":"..."}',
    "",
    "字段要求：",
    "- one_line: 一句话总结；中文 <50 字，英文 <35 words。",
    "- short: 短摘要；中文 100-200 字，英文 80-140 words。",
    "- detailed: 详细摘要；中文 300-500 字，英文 220-360 words。",
    "",
    "正文：",
    boundedText,
  ].join("\n");
}

/**
 * Parses and validates the JSON summary payload returned by the model.
 */
function parseGeneratedSummaries(content: string): GeneratedSummaries {
  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = parseEmbeddedJsonObject(content);
  }

  const normalized = normalizeGeneratedSummaries(parsed);

  if (!normalized) {
    throw new AppError("MODEL_OUTPUT_INVALID", "模型摘要缺少必要字段。", 502);
  }

  return normalized;
}

/**
 * Extracts and parses the first JSON object from model output.
 *
 * DeepSeek JSON mode should return a raw JSON string, but this fallback keeps
 * the endpoint resilient if a provider wraps the object in incidental text.
 */
function parseEmbeddedJsonObject(content: string) {
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new AppError("MODEL_OUTPUT_INVALID", "模型摘要格式无法解析。", 502);
  }

  try {
    return JSON.parse(content.slice(start, end + 1));
  } catch {
    throw new AppError("MODEL_OUTPUT_INVALID", "模型摘要格式无法解析。", 502);
  }
}

/**
 * Normalizes common model output field variants into the API summary shape.
 *
 * The prompt asks for snake_case fields, but accepting a small set of aliases
 * makes the endpoint more robust across OpenAI-compatible providers.
 */
function normalizeGeneratedSummaries(value: unknown): GeneratedSummaries | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const oneLine = readNonEmptyString(candidate, [
    "one_line",
    "oneLine",
    "one_sentence",
    "oneSentence",
  ]);
  const short = readNonEmptyString(candidate, ["short", "short_summary", "shortSummary"]);
  const detailed = readNonEmptyString(candidate, [
    "detailed",
    "detailed_summary",
    "detailedSummary",
  ]);

  if (!oneLine || !short || !detailed) {
    return null;
  }

  return {
    one_line: oneLine,
    short,
    detailed,
  };
}

/**
 * Reads the first non-empty string from a list of candidate object keys.
 */
function readNonEmptyString(candidate: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = candidate[key];

    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}
