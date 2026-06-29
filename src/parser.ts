import * as cheerio from 'cheerio';
import type { ParsedPage, JsonLdNode, ImageInfo, MetaTags } from './types.js';

// ─── JSON-LD extraction (fuzz-resistant) ─────────────────────────────────────

function extractJsonLd($: cheerio.CheerioAPI): JsonLdNode[] {
  const nodes: JsonLdNode[] = [];

  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).html() ?? '';
    if (!raw.trim()) return;
    try {
      const parsed: unknown = JSON.parse(raw);
      // Flatten @graph arrays
      if (
        parsed !== null &&
        typeof parsed === 'object' &&
        '@graph' in parsed &&
        Array.isArray((parsed as Record<string, unknown>)['@graph'])
      ) {
        const graph = (parsed as Record<string, unknown>)['@graph'] as unknown[];
        for (const item of graph) {
          if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
            nodes.push(item as JsonLdNode);
          }
        }
        return;
      }
      // Top-level array
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
            nodes.push(item as JsonLdNode);
          }
        }
        return;
      }
      // Single object
      if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
        nodes.push(parsed as JsonLdNode);
      }
    } catch {
      // malformed JSON-LD — skip silently
    }
  });

  return nodes;
}

// ─── Meta tag extraction ──────────────────────────────────────────────────────

function extractMeta($: cheerio.CheerioAPI): MetaTags {
  return {
    title: $('title').first().text().trim() || undefined,
    description:
      $('meta[name="description"]').attr('content')?.trim() || undefined,
    canonical: $('link[rel="canonical"]').attr('href')?.trim() || undefined,
    ogTitle:       $('meta[property="og:title"]').attr('content')?.trim()       || undefined,
    ogDescription: $('meta[property="og:description"]').attr('content')?.trim() || undefined,
    ogImage:       $('meta[property="og:image"]').attr('content')?.trim()       || undefined,
    ogSiteName:    $('meta[property="og:site_name"]').attr('content')?.trim()   || undefined,
  };
}

// ─── Image extraction ─────────────────────────────────────────────────────────

function extractImages($: cheerio.CheerioAPI): ImageInfo[] {
  const images: ImageInfo[] = [];
  $('img').each((_, el) => {
    const src = $(el).attr('src') ?? $(el).attr('data-src') ?? '';
    if (!src) return;
    const alt = $(el).attr('alt');
    images.push({ src, alt: alt !== undefined ? alt : undefined });
  });
  return images;
}

// ─── Body text extraction (strip nav/footer/script/style) ─────────────────────

function extractBodyText($: cheerio.CheerioAPI): string {
  const $clone = cheerio.load($.html());
  $clone('script, style, nav, header, footer, [aria-hidden="true"]').remove();
  return $clone('body').text().replace(/\s+/g, ' ').trim();
}

// ─── Main parser ──────────────────────────────────────────────────────────────

export function parseHtml(url: string, html: string): ParsedPage {
  const $ = cheerio.load(html);

  const jsonld = extractJsonLd($);
  const meta = extractMeta($);
  const images = extractImages($);
  const bodyText = extractBodyText($);
  const wordCount = bodyText ? bodyText.split(/\s+/).length : 0;

  const h1s: string[] = [];
  $('h1').each((_, el) => {
    const text = $(el).text().trim();
    if (text) h1s.push(text);
  });

  const h2s: string[] = [];
  $('h2').each((_, el) => {
    const text = $(el).text().trim();
    if (text) h2s.push(text);
  });

  return { url, jsonld, meta, h1s, h2s, images, bodyText, wordCount };
}
