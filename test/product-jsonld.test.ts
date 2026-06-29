import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseHtml } from '../src/parser.js';
import { checkProductJsonLd } from '../src/checks/product-jsonld.js';
import type { StoreFetch } from '../src/types.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const fix = (name: string) =>
  readFileSync(join(__dir, 'fixtures', name), 'utf8');

const BASE_URL = 'https://example.com/';
const PRODUCT_URL = 'https://example.com/products/test';

function makeStore(productHtml: string): StoreFetch {
  return {
    homepage: parseHtml(BASE_URL, fix('homepage-full-schema.html')),
    productPages: [parseHtml(PRODUCT_URL, productHtml)],
    robotsTxt: undefined,
    sitemapReachable: true,
    llmsTxtReachable: false,
    storeUrl: BASE_URL,
    storeName: 'Example',
  };
}

describe('checkProductJsonLd', () => {
  it('pass — valid Product JSON-LD with Offer', () => {
    const result = checkProductJsonLd(makeStore(fix('product-with-jsonld.html')));
    expect(result.status).toBe('pass');
    expect(result.impact).toBe('high');
  });

  it('fail — no JSON-LD at all', () => {
    const result = checkProductJsonLd(makeStore(fix('product-no-jsonld.html')));
    expect(result.status).toBe('fail');
    expect(result.impact).toBe('high');
  });

  it('fail — malformed JSON ignored, Product without Offer fails', () => {
    const result = checkProductJsonLd(makeStore(fix('product-malformed-jsonld.html')));
    expect(result.status).toBe('fail');
  });

  it('pass — Product inside @graph block', () => {
    const result = checkProductJsonLd(makeStore(fix('product-graph-jsonld.html')));
    expect(result.status).toBe('pass');
  });

  it('warn — no product pages found', () => {
    const store: StoreFetch = {
      homepage: parseHtml(BASE_URL, fix('homepage-full-schema.html')),
      productPages: [],
      robotsTxt: undefined,
      sitemapReachable: true,
      llmsTxtReachable: false,
      storeUrl: BASE_URL,
      storeName: 'Example',
    };
    const result = checkProductJsonLd(store);
    expect(result.status).toBe('warn');
  });

  it('warn — partial coverage (one pass, one fail)', () => {
    const store: StoreFetch = {
      homepage: parseHtml(BASE_URL, fix('homepage-full-schema.html')),
      productPages: [
        parseHtml(PRODUCT_URL, fix('product-with-jsonld.html')),
        parseHtml(PRODUCT_URL + '2', fix('product-no-jsonld.html')),
      ],
      robotsTxt: undefined,
      sitemapReachable: true,
      llmsTxtReachable: false,
      storeUrl: BASE_URL,
      storeName: 'Example',
    };
    const result = checkProductJsonLd(store);
    expect(result.status).toBe('warn');
  });
});
