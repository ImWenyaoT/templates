import { NextResponse } from "next/server";

import { getSummaries } from "@/lib/db";
import { createRequestId, toApiError, toApiSuccess } from "@/lib/errors";
import { serializeSummaryRecord } from "@/lib/summary-serializer";

export const runtime = "nodejs";

/**
 * Returns the latest summary history records with one-based pagination.
 *
 * The limit defaults to 50 and is capped at 50 so the route stays predictable
 * for the sidebar/history UI.
 */
export async function GET(request: Request) {
  const requestId = createRequestId();

  try {
    const { searchParams } = new URL(request.url);
    const page = parsePositiveInteger(searchParams.get("page"), 1);
    const limit = Math.min(parsePositiveInteger(searchParams.get("limit"), 50), 50);
    const records = await getSummaries(page, limit);

    return NextResponse.json(
      toApiSuccess(
        {
          page,
          limit,
          items: records.map(serializeSummaryRecord),
        },
        requestId,
      ),
    );
  } catch (error) {
    const { body, status } = toApiError(error, requestId);

    return NextResponse.json(body, { status });
  }
}

/**
 * Parses positive integer query parameters with a safe fallback.
 */
function parsePositiveInteger(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
