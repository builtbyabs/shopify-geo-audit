import dns from 'node:dns/promises';
import net from 'node:net';

const USER_AGENT =
  'shopify-geo-audit/0.1.0 (+https://github.com/builtbyabs/shopify-geo-audit)';
const TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 5;

// ─── SSRF guard ───────────────────────────────────────────────────────────────

const PRIVATE_RANGES = [
  // loopback
  /^127\./,
  /^::1$/,
  // link-local
  /^169\.254\./,
  /^fe80:/i,
  // private
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  // RFC 6598 shared
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
  // multicast
  /^22[4-9]\./,
  /^23\d\./,
  // metadata
  /^169\.254\.169\.254$/,
];

async function assertPublicHost(hostname: string): Promise<void> {
  if (net.isIP(hostname)) {
    if (PRIVATE_RANGES.some((r) => r.test(hostname))) {
      throw new Error(`SSRF: private/reserved IP blocked: ${hostname}`);
    }
    return;
  }
  let addresses: string[];
  try {
    addresses = (await dns.resolve4(hostname)).concat(
      await dns.resolve6(hostname).catch(() => [])
    );
  } catch {
    // DNS failure — let fetch fail naturally
    return;
  }
  for (const addr of addresses) {
    if (PRIVATE_RANGES.some((r) => r.test(addr))) {
      throw new Error(`SSRF: ${hostname} resolves to private IP ${addr}`);
    }
  }
}

// ─── Safe fetch with timeout + single retry ───────────────────────────────────

async function safeFetch(url: string, redirectHops = 0, isRetry = false): Promise<Response> {
  const parsed = new URL(url);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error(`Unsupported protocol: ${parsed.protocol}`);
  }
  await assertPublicHost(parsed.hostname);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      signal: controller.signal,
      redirect: 'manual',
      headers: { 'User-Agent': USER_AGENT },
    });
  } catch (err) {
    clearTimeout(timer);
    // Single retry on network error — but only on the initial request, not mid-redirect
    if (!isRetry && redirectHops === 0) return safeFetch(url, 0, true);
    throw err;
  }
  clearTimeout(timer);

  // Follow redirects manually (SSRF re-check each hop)
  if ([301, 302, 307, 308].includes(response.status)) {
    if (redirectHops >= MAX_REDIRECTS) {
      throw new Error(`Too many redirects (>${MAX_REDIRECTS}) for ${url}`);
    }
    const location = response.headers.get('location');
    if (!location) return response;
    const next = new URL(location, url).toString();
    return safeFetch(next, redirectHops + 1, isRetry);
  }

  return response;
}

/** Fetch a URL's text. SSRF-guarded, timeout, single retry. Returns status 0 on any failure. */
export async function fetchText(url: string): Promise<{ text: string; status: number }> {
  try {
    const res = await safeFetch(url);
    const text = await res.text();
    return { text, status: res.status };
  } catch {
    return { text: '', status: 0 };
  }
}
