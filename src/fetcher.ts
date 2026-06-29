import { type StoreFetch } from './types.js';
import {
  type ShopifyProduct,
  ShopifyProductsResponseSchema,
} from './shopify.js';
import { parseHtml } from './parser.js';
import { fetchText } from './http.js';

// ─── Store name resolution ────────────────────────────────────────────────────

function resolveStoreName(
  meta: { ogSiteName?: string | undefined; ogTitle?: string | undefined; title?: string | undefined },
  fallback: string
): string {
  // og:site_name is the cleanest signal — purpose-built for brand name
  if (meta.ogSiteName) return meta.ogSiteName;

  // Strip common page-title suffixes: "Home | Brand" → "Brand"
  // or "Brand - Home" → "Brand"
  const raw = meta.title ?? meta.ogTitle;
  if (raw) {
    const pipeParts = raw.split('|').map((p) => p.trim());
    const dashParts = raw.split(' - ').map((p) => p.trim());
    // Pick the part that doesn't look like a page name
    const pageWords = /^(home|shop|welcome|store|index)$/i;
    for (const parts of [pipeParts, dashParts]) {
      if (parts.length > 1) {
        const candidate = parts.find((p) => !pageWords.test(p));
        if (candidate) return candidate;
      }
    }
    return raw;
  }

  return fallback;
}

// ─── URL normalization ────────────────────────────────────────────────────────

export function normalizeUrl(raw: string): string {
  const s = raw.trim();
  const withProto = /^https?:\/\//i.test(s) ? s : `https://${s}`;
  const u = new URL(withProto);
  u.pathname = '/';
  u.search = '';
  u.hash = '';
  return u.toString();
}

// ─── Product URL discovery ─────────────────────────────────────────────────────

async function discoverProductUrls(
  base: string,
  limit: number
): Promise<{ urls: string[]; products: ShopifyProduct[] }> {
  const apiUrl = new URL('/products.json', base).toString();
  const { text, status } = await fetchText(`${apiUrl}?limit=${limit}`);

  if (status === 200 && text) {
    try {
      const parsed = ShopifyProductsResponseSchema.safeParse(JSON.parse(text));
      if (parsed.success) {
        const products = parsed.data.products.slice(0, limit);
        const urls = products.map(
          (p) => new URL(`/products/${p.handle}`, base).toString()
        );
        return { urls, products };
      }
    } catch {
      // fall through to sitemap
    }
  }

  // sitemap fallback
  const { text: sitemap, status: sitemapStatus } = await fetchText(
    new URL('/sitemap.xml', base).toString()
  );
  if (sitemapStatus === 200 && sitemap) {
    const matches = [...sitemap.matchAll(/<loc>(https?:\/\/[^<]+\/products\/[^<]+)<\/loc>/gi)];
    const urls = [...new Set(matches.map((m) => m[1]))].slice(0, limit) as string[];
    return { urls, products: [] };
  }

  return { urls: [], products: [] };
}

// ─── Main fetch orchestrator ───────────────────────────────────────────────────

export async function fetchStore(
  rawUrl: string,
  productLimit: number
): Promise<{ storeFetch: StoreFetch; products: ShopifyProduct[] }> {
  const base = normalizeUrl(rawUrl);

  // Parallel fetch of sidebar resources
  const [homepageResult, robotsResult, sitemapResult, llmsResult] =
    await Promise.all([
      fetchText(base),
      fetchText(new URL('/robots.txt', base).toString()),
      fetchText(new URL('/sitemap.xml', base).toString()),
      fetchText(new URL('/llms.txt', base).toString()),
    ]);

  if (homepageResult.status === 0) {
    throw new Error(`Could not reach ${base} — check the URL and your connection.`);
  }
  const homepage = parseHtml(base, homepageResult.text);

  const { urls: productUrls, products } = await discoverProductUrls(
    base,
    productLimit
  );

  // Fetch product pages (sequential to be polite)
  const productPages = [];
  for (const url of productUrls) {
    const { text, status } = await fetchText(url);
    if (status === 200 && text) {
      productPages.push(parseHtml(url, text));
    }
  }

  const storeName = resolveStoreName(homepage.meta, new URL(base).hostname);

  const storeFetch: StoreFetch = {
    homepage,
    productPages,
    robotsTxt: robotsResult.status === 200 ? robotsResult.text : undefined,
    sitemapReachable: sitemapResult.status === 200,
    llmsTxtReachable: llmsResult.status === 200,
    storeUrl: base,
    storeName,
  };

  return { storeFetch, products };
}
