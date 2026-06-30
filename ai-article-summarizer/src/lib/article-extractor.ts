import "server-only";

import { AppError } from "./errors";

export type ExtractedArticle = {
  title: string | null;
  text: string;
  excerpt: string;
};

const MIN_ARTICLE_CHARS = 200;

/**
 * Extracts readable article text from static HTML.
 *
 * This lightweight extractor removes common navigation, advertising, script,
 * and style blocks, then prefers article/main content before falling back to the
 * full body text.
 */
export function extractArticle(html: string): ExtractedArticle {
  const title = extractTitle(html);
  const preferredHtml = extractPreferredContent(html) ?? extractBody(html) ?? html;
  const text = htmlToReadableText(preferredHtml);

  if (text.length < MIN_ARTICLE_CHARS) {
    throw new AppError("ARTICLE_TOO_SHORT", "没有提取到足够的正文内容。", 422);
  }

  return {
    title,
    text,
    excerpt: createExcerpt(text),
  };
}

/**
 * Finds the best available document title from metadata or the title tag.
 */
function extractTitle(html: string) {
  const metaTitle =
    extractMetaContent(html, "property", "og:title") ??
    extractMetaContent(html, "name", "twitter:title");
  const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  const rawTitle = metaTitle ?? titleTag ?? null;

  return rawTitle ? normalizeWhitespace(decodeHtmlEntities(stripTags(rawTitle))) : null;
}

/**
 * Extracts a meta tag content value by attribute name and expected value.
 */
function extractMetaContent(html: string, attribute: "name" | "property", value: string) {
  const metaTag = html.match(
    new RegExp(`<meta[^>]+${attribute}=["']${escapeRegExp(value)}["'][^>]*>`, "i"),
  )?.[0];

  return metaTag?.match(/\scontent=["']([^"']+)["']/i)?.[1] ?? null;
}

/**
 * Chooses likely article-bearing HTML before broad cleanup.
 *
 * Specific article/main blocks usually avoid global navigation and sidebars; if
 * no such block exists, the caller falls back to body-level extraction.
 */
function extractPreferredContent(html: string) {
  return (
    extractFirstBlock(html, "article") ??
    extractFirstBlock(html, "main") ??
    extractFirstBlockByClass(html, "article") ??
    extractFirstBlockByClass(html, "post") ??
    null
  );
}

/**
 * Extracts the first matching tag block using a simple static HTML pattern.
 */
function extractFirstBlock(html: string, tagName: string) {
  return html.match(new RegExp(`<${tagName}\\b[^>]*>[\\s\\S]*?<\\/${tagName}>`, "i"))?.[0] ?? null;
}

/**
 * Extracts a div/section block whose class hints at article content.
 */
function extractFirstBlockByClass(html: string, classHint: string) {
  return (
    html.match(
      new RegExp(
        `<(?:div|section)\\b[^>]*class=["'][^"']*${escapeRegExp(
          classHint,
        )}[^"']*["'][^>]*>[\\s\\S]*?<\\/(?:div|section)>`,
        "i",
      ),
    )?.[0] ?? null
  );
}

/**
 * Extracts the body tag when present.
 */
function extractBody(html: string) {
  return html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? null;
}

/**
 * Converts cleaned HTML into readable plain text.
 *
 * Common non-content blocks are removed first, block-level tags become
 * line-breaks, and remaining entities and whitespace are normalized.
 */
function htmlToReadableText(html: string) {
  const withoutNoise = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, " ")
    .replace(/<iframe\b[\s\S]*?<\/iframe>/gi, " ")
    .replace(/<(nav|header|footer|aside|form|button)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(
      /<[^>]+(?:class|id)=["'][^"']*(advert|ads|banner|cookie|modal|popup|subscribe|share|sidebar|related|recommend|comment)[^"']*["'][^>]*>[\s\S]*?<\/[^>]+>/gi,
      " ",
    )
    .replace(/<(p|br|li|h[1-6]|blockquote|pre|div|section)\b[^>]*>/gi, "\n")
    .replace(/<\/(p|li|h[1-6]|blockquote|pre|div|section)>/gi, "\n");

  return normalizeWhitespace(decodeHtmlEntities(stripTags(withoutNoise)));
}

/**
 * Removes any remaining HTML tags from a string.
 */
function stripTags(value: string) {
  return value.replace(/<[^>]*>/g, " ");
}

/**
 * Builds a short excerpt without storing the full article body.
 */
function createExcerpt(text: string) {
  return text.length > 280 ? `${text.slice(0, 277)}...` : text;
}

/**
 * Collapses whitespace into readable plain text.
 */
function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

/**
 * Decodes common HTML entities and numeric character references.
 */
function decodeHtmlEntities(value: string) {
  const namedEntities: Record<string, string> = {
    amp: "&",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
    apos: "'",
  };

  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity: string) => {
    const normalized = entity.toLowerCase();

    if (normalized.startsWith("#x")) {
      return String.fromCodePoint(Number.parseInt(normalized.slice(2), 16));
    }

    if (normalized.startsWith("#")) {
      return String.fromCodePoint(Number.parseInt(normalized.slice(1), 10));
    }

    return namedEntities[normalized] ?? match;
  });
}

/**
 * Escapes user-facing strings before embedding them into regular expressions.
 */
function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
