import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseHtml } from '../src/parser.js';
import { checkHeadings } from '../src/checks/headings.js';
import type { StoreFetch } from '../src/types.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const fix = (name: string) => readFileSync(join(__dir, 'fixtures', name), 'utf8');
const BASE_URL = 'https://example.com/';

function makeStore(html: string): StoreFetch {
  return {
    homepage: parseHtml(BASE_URL, html),
    productPages: [],
    robotsTxt: undefined,
    sitemapReachable: true,
    llmsTxtReachable: false,
    storeUrl: BASE_URL,
    storeName: 'Example',
  };
}

describe('checkHeadings', () => {
  it('pass — one H1, multiple H2s', () => {
    const result = checkHeadings(makeStore(fix('homepage-full-schema.html')));
    expect(result.status).toBe('pass');
  });

  it('fail — no H1', () => {
    const html = '<html><body><h2>Section</h2><h2>Other</h2></body></html>';
    const result = checkHeadings(makeStore(html));
    expect(result.status).toBe('fail');
  });

  it('warn — multiple H1s', () => {
    const html = '<html><body><h1>First</h1><h1>Second</h1><h2>Sub</h2></body></html>';
    const result = checkHeadings(makeStore(html));
    expect(result.status).toBe('warn');
    expect(result.detail).toContain('2 H1');
  });

  it('warn — one H1 but no H2s', () => {
    const html = '<html><body><h1>Only Heading</h1><p>Content.</p></body></html>';
    const result = checkHeadings(makeStore(html));
    expect(result.status).toBe('warn');
  });
});
