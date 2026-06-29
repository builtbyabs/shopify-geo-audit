import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseHtml } from '../src/parser.js';
import { checkMetaBasics } from '../src/checks/meta-basics.js';
import type { StoreFetch } from '../src/types.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const fix = (name: string) => readFileSync(join(__dir, 'fixtures', name), 'utf8');
const BASE_URL = 'https://example.com/';

function makeStore(homepageHtml: string): StoreFetch {
  return {
    homepage: parseHtml(BASE_URL, homepageHtml),
    productPages: [],
    robotsTxt: undefined,
    sitemapReachable: true,
    llmsTxtReachable: false,
    storeUrl: BASE_URL,
    storeName: 'Example',
  };
}

describe('checkMetaBasics', () => {
  it('pass — all meta tags present', () => {
    const result = checkMetaBasics(makeStore(fix('homepage-full-schema.html')));
    expect(result.status).toBe('pass');
  });

  it('warn — missing canonical and OG (1–2 missing tags)', () => {
    const result = checkMetaBasics(makeStore(fix('homepage-meta-partial.html')));
    // partial has title + description but no canonical or OG
    expect(['warn', 'fail']).toContain(result.status);
  });

  it('fail — bare page with no meta', () => {
    const result = checkMetaBasics(makeStore(fix('homepage-no-schema.html')));
    expect(result.status).toBe('fail');
  });
});
