import { NextResponse } from 'next/server'

import { AppError, createRequestId, toApiError, toApiSuccess } from '@/lib/errors'
import {
  renderMarkdownDocument,
  renderMarkdownFragment,
} from '@/lib/markdown-renderer'

export const runtime = 'nodejs'

const MAX_MARKDOWN_CHARS = 200_000

/**
 * Renders Markdown into HTML for the in-app Markdown converter.
 */
export async function POST(request: Request) {
  const requestId = createRequestId()

  try {
    const body = await parseJsonBody(request)
    const markdown = parseMarkdown(body)
    const title = parseTitle(body)

    return NextResponse.json(
      toApiSuccess(
        {
          document: renderMarkdownDocument({ markdown, title }),
          fragment: renderMarkdownFragment(markdown),
          output_filename: `${slugifyTitle(title)}.html`,
        },
        requestId,
      ),
    )
  } catch (error) {
    const { body, status } = toApiError(error, requestId)

    return NextResponse.json(body, { status })
  }
}

/**
 * Parses the request JSON body and maps invalid JSON to a public API error.
 */
async function parseJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    throw new AppError('BAD_REQUEST', '请求体必须是有效 JSON。', 400)
  }
}

/**
 * Reads and validates the Markdown source from an API payload.
 */
function parseMarkdown(body: unknown): string {
  const markdown =
    body && typeof body === 'object' ? (body as { markdown?: unknown }).markdown : null

  if (typeof markdown !== 'string' || markdown.trim().length === 0) {
    throw new AppError('BAD_REQUEST', '请提供 Markdown 内容。', 400)
  }

  if (markdown.length > MAX_MARKDOWN_CHARS) {
    throw new AppError('BAD_REQUEST', 'Markdown 内容过大，暂时无法处理。', 413)
  }

  return markdown
}

/**
 * Reads a safe document title from an API payload.
 */
function parseTitle(body: unknown): string {
  const title = body && typeof body === 'object' ? (body as { title?: unknown }).title : null

  if (typeof title === 'string' && title.trim()) {
    return title.trim().slice(0, 120)
  }

  return 'Markdown Export'
}

/**
 * Converts a title into a portable HTML filename stem.
 */
function slugifyTitle(title: string): string {
  const slug = title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '')

  return slug || 'markdown-export'
}
