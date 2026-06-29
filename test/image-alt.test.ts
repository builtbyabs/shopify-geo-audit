import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseHtml } from '../src/parser.js';
import { checkImageAlt } from '../src/checks/image-alt.js';
import type { StoreFetch } from '../src/types.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const fix = (name: string) => readFileSync(join(__dir, 'fixtures', name), 'utf8');
const BASE_URL = 'https://example.com/';

function makeStore(homepageHtml: string, productHtml?: string): StoreFetch {
  return {
    homepage: parseHtml(BASE_URL, homepageHtml),
    productPages: productHtml ? [parseHtml(`${BASE_URL}products/x`, productHtml)] : [],
    robotsTxt: undefined,
    sitemapReachable: true,
    llmsTxtReachable: false,
    storeUrl: BASE_URL,
    storeName: 'Example',
  };
}

describe('checkImageAlt', () => {
  it('pass — all images have alt + ImageObject schema', () => {
    const html = `<html><head>
      <script type="application/ld+json">{"@context":"https://schema.org","@type":"ImageObject","url":"https://example.com/img.jpg"}</script>
    </head><body>
      <img src="/a.jpg" alt="Product A">
      <img src="/b.jpg" alt="Product B">
      <img src="/c.jpg" alt="">
    </body></html>`;
    const result = checkImageAlt(makeStore(fix('homepage-full-schema.html'), html));
    expect(result.status).toBe('pass');
  });

  it('fail — most images missing alt', () => {
    const html = `<html><body>
      <img src="/a.jpg">
      <img src="/b.jpg">
      <img src="/c.jpg">
      <img src="/d.jpg" alt="Only one">
    </body></html>`;
    const result = checkImageAlt(makeStore(fix('homepage-no-schema.html'), html));
    expect(result.status).toBe('fail');
  });

  it('warn — no images at all', () => {
    const html = '<html><body><p>No images here.</p></body></html>';
    const result = checkImageAlt(makeStore(html));
    expect(result.status).toBe('warn');
  });

  it('pass — alt="" (decorative) counts as present', () => {
    const html = `<html><head>
      <script type="application/ld+json">{"@context":"https://schema.org","@type":"ImageObject","url":"x"}</script>
    </head><body>
      <img src="/a.jpg" alt="">
      <img src="/b.jpg" alt="Product">
    </body></html>`;
    const result = checkImageAlt(makeStore(fix('homepage-full-schema.html'), html));
    expect(result.status).toBe('pass');
  });
});
