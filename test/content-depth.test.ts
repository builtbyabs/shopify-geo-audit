import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseHtml } from '../src/parser.js';
import { checkContentDepth } from '../src/checks/content-depth.js';
import type { StoreFetch } from '../src/types.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const fix = (name: string) => readFileSync(join(__dir, 'fixtures', name), 'utf8');
const BASE_URL = 'https://example.com/';

function makeStore(productHtmls: string[]): StoreFetch {
  return {
    homepage: parseHtml(BASE_URL, fix('homepage-full-schema.html')),
    productPages: productHtmls.map((html, i) =>
      parseHtml(`${BASE_URL}products/p${i}`, html)
    ),
    robotsTxt: undefined,
    sitemapReachable: true,
    llmsTxtReachable: false,
    storeUrl: BASE_URL,
    storeName: 'Example',
  };
}

const richProduct = `<html><body>
  <h1>Trail Runner X</h1>
  <p>Shop our best trail running shoe designed for athletes who demand performance on technical terrain.
  Built with a grippy outsole and a responsive midsole, the Trail Runner X delivers stability and speed
  whether you are climbing switchbacks or descending loose scree on a long mountain run.
  Discover the difference that properly engineered footwear makes when the trail gets technical.
  Our team of experienced runners tested every version of this shoe over hundreds of miles of varied terrain
  before we called it ready for market. The upper uses a seamless knit construction that reduces hot spots
  and adapts to foot swell on long efforts. Buy with confidence — free returns on all orders within 30 days.
  Available in five colorways and sizes 5 through 15, including half sizes.</p>
</body></html>`;

const thinProduct = `<html><body>
  <h1>Product</h1>
  <p>Buy now.</p>
</body></html>`;

describe('checkContentDepth', () => {
  it('pass — rich descriptions, answer-first lead', () => {
    const result = checkContentDepth(makeStore([richProduct, richProduct]));
    expect(result.status).toBe('pass');
  });

  it('fail — very thin product descriptions', () => {
    const result = checkContentDepth(makeStore([thinProduct, thinProduct]));
    expect(result.status).toBe('fail');
    expect(result.detail).toContain('words');
  });

  it('warn — no product pages', () => {
    const result = checkContentDepth(makeStore([]));
    expect(result.status).toBe('warn');
  });
});
