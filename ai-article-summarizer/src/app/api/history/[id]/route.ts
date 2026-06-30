import { NextResponse } from "next/server";

import { getSummaryById } from "@/lib/db";
import { AppError, createRequestId, toApiError, toApiSuccess } from "@/lib/errors";
import { serializeSummaryRecord } from "@/lib/summary-serializer";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * Returns one summary history record by id.
 *
 * Missing records are reported as a safe 404 JSON response rather than leaking
 * database details.
 */
export async function GET(_request: Request, context: RouteContext) {
  const requestId = createRequestId();

  try {
    const { id } = await context.params;
    const record = await getSummaryById(id);

    if (!record) {
      throw new AppError("NOT_FOUND", "没有找到这条摘要记录。", 404);
    }

    return NextResponse.json(toApiSuccess(serializeSummaryRecord(record), requestId));
  } catch (error) {
    const { body, status } = toApiError(error, requestId);

    return NextResponse.json(body, { status });
  }
}
