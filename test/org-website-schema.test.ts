import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseHtml } from '../src/parser.js';
import { checkOrgWebsiteSchema } from '../src/checks/org-website-schema.js';
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

describe('checkOrgWebsiteSchema', () => {
  it('pass — both Organization and WebSite present', () => {
    const result = checkOrgWebsiteSchema(makeStore(fix('homepage-full-schema.html')));
    expect(result.status).toBe('pass');
  });

  it('fail — no schema at all', () => {
    const result = checkOrgWebsiteSchema(makeStore(fix('homepage-no-schema.html')));
    expect(result.status).toBe('fail');
  });

  it('warn — only Organization present', () => {
    const html = `<html><head>
      <script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"Test"}</script>
    </head><body><h1>Test</h1></body></html>`;
    const result = checkOrgWebsiteSchema(makeStore(html));
    expect(result.status).toBe('warn');
    expect(result.detail).toContain('WebSite');
  });

  it('warn — only WebSite present', () => {
    const html = `<html><head>
      <script type="application/ld+json">{"@context":"https://schema.org","@type":"WebSite","name":"Test"}</script>
    </head><body><h1>Test</h1></body></html>`;
    const result = checkOrgWebsiteSchema(makeStore(html));
    expect(result.status).toBe('warn');
    expect(result.detail).toContain('Organization');
  });
});
