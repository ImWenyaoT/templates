import { NextResponse } from "next/server";

import { AppError, createRequestId, toApiError, toApiSuccess } from "@/lib/errors";
import { summarizeArticle } from "@/lib/summarizer";

export const runtime = "nodejs";

/**
 * Handles article summarization requests.
 *
 * The route accepts a JSON body containing only { url }, then delegates fetching,
 * extraction, OpenAI generation, and persistence to server-only lib modules.
 */
export async function POST(request: Request) {
  const requestId = createRequestId();

  try {
    const body = await parseJsonBody(request);
    const record = await summarizeArticle(body?.url);

    return NextResponse.json(toApiSuccess(record, requestId), { status: 201 });
  } catch (error) {
    const { body, status } = toApiError(error, requestId);

    return NextResponse.json(body, { status });
  }
}

/**
 * Parses the request body and maps malformed JSON to a safe client error.
 */
async function parseJsonBody(request: Request) {
  try {
    return await request.json();
  } catch {
    throw new AppError("BAD_REQUEST", "请求体必须是有效 JSON。", 400);
  }
}
