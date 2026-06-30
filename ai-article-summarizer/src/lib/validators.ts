import "server-only";

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import type { LookupAddress } from "node:dns";

import { AppError } from "./errors";

const MAX_URL_LENGTH = 2_048;
const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",
  "169.254.169.254",
]);

/**
 * Parses and normalizes a user-supplied article URL.
 *
 * Only http and https URLs are accepted; credentials, local hostnames, and
 * malformed inputs are rejected before any network request is attempted.
 */
export function parseArticleUrl(input: unknown): URL {
  if (typeof input !== "string" || input.trim().length === 0) {
    throw new AppError("BAD_REQUEST", "请提供文章 URL。", 400);
  }

  const trimmed = input.trim();

  if (trimmed.length > MAX_URL_LENGTH) {
    throw new AppError("INVALID_URL", "URL 过长，请提供有效的文章链接。", 400);
  }

  let url: URL;

  try {
    url = new URL(trimmed);
  } catch {
    throw new AppError("INVALID_URL", "URL 格式不正确。", 400);
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new AppError("INVALID_URL", "只支持 http 或 https 文章链接。", 400);
  }

  if (url.username || url.password) {
    throw new AppError("INVALID_URL", "URL 不能包含用户名或密码。", 400);
  }

  url.hash = "";

  return url;
}

/**
 * Verifies that a URL resolves only to public network addresses.
 *
 * This protects server-side fetching from localhost, private network, link-local,
 * and metadata-service targets, including hostnames that resolve to those IPs.
 */
export async function assertPublicArticleUrl(input: string | URL): Promise<URL> {
  const url = parseArticleUrl(input.toString());
  const hostname = url.hostname.replace(/\.$/, "").toLowerCase();

  if (isBlockedHostname(hostname) || isBlockedIpAddress(hostname)) {
    throw new AppError("BLOCKED_URL", "出于安全原因，不能抓取本地或内网地址。", 400);
  }

  let addresses: LookupAddress[];

  try {
    addresses = await lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new AppError("FETCH_FAILED", "无法解析文章域名，请检查链接是否可访问。", 400);
  }

  if (addresses.length === 0 || addresses.some((entry) => isBlockedIpAddress(entry.address))) {
    throw new AppError("BLOCKED_URL", "出于安全原因，不能抓取本地或内网地址。", 400);
  }

  return url;
}

/**
 * Checks hostnames that should never be fetched directly.
 *
 * This catches localhost-style names before DNS and keeps common cloud metadata
 * aliases out of the fetch path.
 */
function isBlockedHostname(hostname: string) {
  return BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith(".localhost");
}

/**
 * Checks whether an IP address belongs to a non-public range.
 *
 * Both IPv4 and the most common IPv6 local ranges are blocked, including
 * loopback, private, link-local, multicast, and IPv4-mapped IPv6 addresses.
 */
function isBlockedIpAddress(address: string) {
  const ipVersion = isIP(address);

  if (ipVersion === 4) {
    return isBlockedIpv4(address);
  }

  if (ipVersion === 6) {
    const normalized = address.toLowerCase();
    const mappedIpv4 = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);

    if (mappedIpv4) {
      return isBlockedIpv4(mappedIpv4[1]);
    }

    return (
      normalized === "::1" ||
      normalized === "::" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      /^fe[89ab]:/.test(normalized) ||
      normalized.startsWith("ff")
    );
  }

  return false;
}

/**
 * Checks IPv4 ranges that are unsafe for server-side article fetching.
 *
 * The blocked ranges cover loopback, private networks, link-local addresses,
 * carrier-grade NAT, benchmark ranges, multicast, and reserved addresses.
 */
function isBlockedIpv4(address: string) {
  const parts = address.split(".").map((part) => Number.parseInt(part, 10));

  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return true;
  }

  const [a, b] = parts;

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}
