import "server-only";

export type AppErrorCode =
  | "BAD_REQUEST"
  | "INVALID_URL"
  | "BLOCKED_URL"
  | "FETCH_FAILED"
  | "UNSUPPORTED_CONTENT"
  | "ARTICLE_TOO_SHORT"
  | "DEEPSEEK_NOT_CONFIGURED"
  | "DEEPSEEK_FAILED"
  | "DEEPSEEK_TIMEOUT"
  | "OPENAI_NOT_CONFIGURED"
  | "OPENAI_FAILED"
  | "OPENAI_TIMEOUT"
  | "MODEL_OUTPUT_INVALID"
  | "DATABASE_FAILED"
  | "NOT_FOUND";

export type ApiErrorBody = {
  ok: false;
  error: {
    code: AppErrorCode | "INTERNAL_ERROR";
    message: string;
    request_id: string;
    retryable: boolean;
  };
};

export type ApiSuccessBody<TData> = {
  ok: true;
  data: TData;
  request_id: string;
};

const RETRYABLE_ERROR_CODES = new Set<AppErrorCode | "INTERNAL_ERROR">([
  "FETCH_FAILED",
  "DEEPSEEK_FAILED",
  "DEEPSEEK_TIMEOUT",
  "OPENAI_FAILED",
  "OPENAI_TIMEOUT",
  "DATABASE_FAILED",
  "INTERNAL_ERROR",
]);

/**
 * Represents an expected application failure with a safe public message.
 *
 * Third-party errors and stack traces stay server-side; route handlers expose
 * only the code, HTTP status, and public message from this class.
 */
export class AppError extends Error {
  public readonly code: AppErrorCode;
  public readonly status: number;
  public readonly publicMessage: string;

  constructor(code: AppErrorCode, publicMessage: string, status = 400) {
    super(publicMessage);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.publicMessage = publicMessage;
  }
}

/**
 * Creates a short request id for correlating browser errors with server logs.
 *
 * The id intentionally carries no user input, URL, article content, or secrets.
 */
export function createRequestId() {
  return `req_${crypto.randomUUID().replaceAll("-", "").slice(0, 16)}`;
}

/**
 * Wraps successful route data in the same top-level envelope used by all APIs.
 */
export function toApiSuccess<TData>(data: TData, requestId: string): ApiSuccessBody<TData> {
  return {
    ok: true,
    data,
    request_id: requestId,
  };
}

/**
 * Converts unknown failures into a safe JSON API error response shape.
 *
 * Known AppError instances preserve their status and code; unexpected failures
 * become a generic 500 without leaking implementation details.
 */
export function toApiError(
  error: unknown,
  requestId = createRequestId(),
): { body: ApiErrorBody; status: number } {
  if (error instanceof AppError) {
    return {
      body: {
        ok: false,
        error: {
          code: error.code,
          message: error.publicMessage,
          request_id: requestId,
          retryable: RETRYABLE_ERROR_CODES.has(error.code),
        },
      },
      status: error.status,
    };
  }

  return {
    body: {
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "服务器暂时无法完成请求，请稍后重试。",
        request_id: requestId,
        retryable: true,
      },
    },
    status: 500,
  };
}
