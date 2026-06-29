import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseHtml } from '../src/parser.js';
import { generateProductJsonLd } from '../src/fixers/product-jsonld.js';
import { generateLlmsTxt } from '../src/fixers/llms-txt.js';
import { generateRobotsFixes } from '../src/fixers/robots-fixes.js';
import { generatePriorityList } from '../src/fixers/priority-list.js';
import { ProductJsonLdSchema } from '../src/types.js';
import type { StoreFetch, CheckResult } from '../src/types.js';
import type { ShopifyProduct } from '../src/shopify.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const fix = (name: string) => readFileSync(join(__dir, 'fixtures', name), 'utf8');
const BASE_URL = 'https://acme-store.com/';

const sampleProduct: ShopifyProduct = {
  id: 1,
  title: 'Trail Runner X',
  handle: 'trail-runner-x',
  body_html: '<p>The best trail shoe for technical terrain.</p>',
  vendor: 'Acme',
  product_type: 'Footwear',
  images: [{ src: 'https://acme-store.com/img/shoe.jpg', alt: 'Trail Runner X' }],
  variants: [{ price: '129.00', available: true, sku: 'TRX-001', compare_at_price: null }],
};

const store: StoreFetch = {
  homepage: parseHtml(BASE_URL, fix('homepage-full-schema.html')),
  productPages: [],
  robotsTxt: fix('robots-blocks-ai.txt'),
  sitemapReachable: true,
  llmsTxtReachable: false,
  storeUrl: BASE_URL,
  storeName: 'Acme Store',
};

describe('product-jsonld fixer', () => {
  it('emits valid Product JSON-LD that parses and validates', () => {
    const output = generateProductJsonLd(sampleProduct, BASE_URL);
    const jsonMatch = output.match(/<script[^>]*>([\s\S]+?)<\/script>/);
    expect(jsonMatch).toBeTruthy();
    const parsed: unknown = JSON.parse(jsonMatch![1]!);
    const result = ProductJsonLdSchema.safeParse(parsed);
    expect(result.success).toBe(true);
  });

  it('includes real product data — no placeholders', () => {
    const output = generateProductJsonLd(sampleProduct, BASE_URL);
    expect(output).toContain('Trail Runner X');
    expect(output).toContain('129.00');
    expect(output).toContain('Acme');
    expect(output).toContain('InStock');
  });

  it('never emits AggregateRating (no genuine review data)', () => {
    const output = generateProductJsonLd(sampleProduct, BASE_URL);
    expect(output).not.toContain('AggregateRating');
    expect(output).not.toContain('aggregateRating');
  });

  it('availability = OutOfStock when variant.available is false', () => {
    const unavailable: ShopifyProduct = {
      ...sampleProduct,
      variants: [{ price: '129.00', available: false, sku: null, compare_at_price: null }],
    };
    const output = generateProductJsonLd(unavailable, BASE_URL);
    expect(output).toContain('OutOfStock');
  });
});

describe('llms-txt fixer', () => {
  it('includes store name and domain', () => {
    const output = generateLlmsTxt(store, [sampleProduct]);
    expect(output).toContain('Acme Store');
    expect(output).toContain('acme-store.com');
  });

  it('includes product URLs', () => {
    const output = generateLlmsTxt(store, [sampleProduct]);
    expect(output).toContain('/products/trail-runner-x');
  });

  it('includes product type when available', () => {
    const output = generateLlmsTxt(store, [sampleProduct]);
    expect(output).toContain('Footwear');
  });
});

describe('robots-fixes fixer', () => {
  it('lists blocked bots and fix lines', () => {
    const output = generateRobotsFixes(store);
    expect(output).toContain('GPTBot');
    expect(output).toContain('Allow: /');
  });

  it('no-op message when no bots are blocked', () => {
    const clean: StoreFetch = { ...store, robotsTxt: fix('robots-allows-ai.txt') };
    const output = generateRobotsFixes(clean);
    expect(output).toContain('No changes needed');
  });

  it('handles missing robots.txt', () => {
    const noRobots: StoreFetch = { ...store, robotsTxt: undefined };
    const output = generateRobotsFixes(noRobots);
    expect(output).toContain('no robots.txt');
  });
});

describe('priority-list fixer', () => {
  it('sorts high-impact failures first', () => {
    const checks: CheckResult[] = [
      { id: 'sitemap', label: 'Sitemap', status: 'fail', impact: 'low', detail: 'missing' },
      { id: 'product-jsonld', label: 'Product JSON-LD', status: 'fail', impact: 'high', detail: 'none' },
      { id: 'meta-basics', label: 'Meta', status: 'warn', impact: 'med', detail: 'partial' },
    ];
    const output = generatePriorityList(checks);
    const highPos = output.indexOf('[HIGH]');
    const medPos = output.indexOf('[MED]');
    const lowPos = output.indexOf('[LOW]');
    expect(highPos).toBeLessThan(medPos);
    expect(medPos).toBeLessThan(lowPos);
  });

  it('all-pass gives clean message', () => {
    const checks: CheckResult[] = [
      { id: 'sitemap', label: 'Sitemap', status: 'pass', impact: 'low', detail: 'ok' },
    ];
    const output = generatePriorityList(checks);
    expect(output).toContain('no immediate fixes');
  });
});
