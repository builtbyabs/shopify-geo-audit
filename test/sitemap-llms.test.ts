import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseHtml } from '../src/parser.js';
import { checkSitemap } from '../src/checks/sitemap.js';
import { checkLlmsTxt } from '../src/checks/llms-txt.js';
import type { StoreFetch } from '../src/types.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const fix = (name: string) => readFileSync(join(__dir, 'fixtures', name), 'utf8');
const BASE_URL = 'https://example.com/';
const homepage = parseHtml(BASE_URL, fix('homepage-full-schema.html'));

function makeStore(overrides: Partial<StoreFetch>): StoreFetch {
  return {
    homepage,
    productPages: [],
    robotsTxt: undefined,
    sitemapReachable: false,
    llmsTxtReachable: false,
    storeUrl: BASE_URL,
    storeName: 'Example',
    ...overrides,
  };
}

describe('checkSitemap', () => {
  it('pass — sitemap reachable', () => {
    expect(checkSitemap(makeStore({ sitemapReachable: true })).status).toBe('pass');
  });

  it('fail — sitemap not reachable', () => {
    expect(checkSitemap(makeStore({ sitemapReachable: false })).status).toBe('fail');
  });
});

describe('checkLlmsTxt', () => {
  it('pass — llms.txt reachable', () => {
    expect(checkLlmsTxt(makeStore({ llmsTxtReachable: true })).status).toBe('pass');
  });

  it('fail — llms.txt not found', () => {
    expect(checkLlmsTxt(makeStore({ llmsTxtReachable: false })).status).toBe('fail');
  });
});
