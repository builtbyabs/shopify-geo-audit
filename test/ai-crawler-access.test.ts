import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseHtml } from '../src/parser.js';
import { checkAiCrawlerAccess, blockedBots } from '../src/checks/ai-crawler-access.js';
import type { StoreFetch } from '../src/types.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const fix = (name: string) => readFileSync(join(__dir, 'fixtures', name), 'utf8');
const BASE_URL = 'https://example.com/';
const homepage = parseHtml(BASE_URL, fix('homepage-full-schema.html'));

function makeStore(robotsTxt: string | undefined): StoreFetch {
  return {
    homepage,
    productPages: [],
    robotsTxt,
    sitemapReachable: true,
    llmsTxtReachable: false,
    storeUrl: BASE_URL,
    storeName: 'Example',
  };
}

describe('checkAiCrawlerAccess', () => {
  it('pass — robots.txt allows AI crawlers', () => {
    const result = checkAiCrawlerAccess(makeStore(fix('robots-allows-ai.txt')));
    expect(result.status).toBe('pass');
  });

  it('fail — robots.txt explicitly blocks all AI bots', () => {
    const result = checkAiCrawlerAccess(makeStore(fix('robots-blocks-ai.txt')));
    expect(result.status).toBe('fail');
    expect(result.detail).toContain('GPTBot');
    expect(result.detail).toContain('ClaudeBot');
  });

  it('fail — wildcard Disallow: / blocks all bots including AI', () => {
    const result = checkAiCrawlerAccess(makeStore(fix('robots-wildcard-block.txt')));
    expect(result.status).toBe('fail');
  });

  it('warn — no robots.txt', () => {
    const result = checkAiCrawlerAccess(makeStore(undefined));
    expect(result.status).toBe('warn');
  });
});

describe('blockedBots (unit)', () => {
  it('detects explicit GPTBot block', () => {
    const blocked = blockedBots('User-agent: GPTBot\nDisallow: /\n');
    expect(blocked).toContain('gptbot');
  });

  it('detects wildcard block propagating to AI bots', () => {
    const blocked = blockedBots('User-agent: *\nDisallow: /\n');
    expect(blocked).toContain('gptbot');
    expect(blocked).toContain('claudebot');
    expect(blocked).toContain('perplexitybot');
  });

  it('empty when only /admin/ disallowed', () => {
    const blocked = blockedBots('User-agent: *\nDisallow: /admin/\n');
    expect(blocked).toHaveLength(0);
  });

  it('does not block bot with explicit Allow override', () => {
    const txt = 'User-agent: *\nDisallow: /\n\nUser-agent: GPTBot\nDisallow:\n';
    const blocked = blockedBots(txt);
    expect(blocked).not.toContain('gptbot');
  });
});
