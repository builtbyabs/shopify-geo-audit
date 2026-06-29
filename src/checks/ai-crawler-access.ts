import type { CheckResult, StoreFetch } from '../types.js';

const AI_BOTS = [
  'gptbot',
  'claudebot',
  'claude-web',
  'perplexitybot',
  'google-extended',
];

interface RobotsRule {
  userAgent: string;
  disallowAll: boolean;
}

function parseRobots(text: string): RobotsRule[] {
  const rules: RobotsRule[] = [];
  let current: string[] = [];
  let inBlock = false;
  const disallowedPaths: string[] = [];

  for (const raw of text.split('\n')) {
    const line = raw.trim().toLowerCase();

    if (line.startsWith('user-agent:')) {
      if (inBlock && disallowedPaths.length > 0) {
        for (const ua of current) {
          rules.push({
            userAgent: ua,
            disallowAll: disallowedPaths.some((p) => p === '/' || p === ''),
          });
        }
      }
      if (!inBlock || current.length === 0) {
        current = [];
        disallowedPaths.length = 0;
      }
      current.push(line.replace('user-agent:', '').trim());
      inBlock = true;
    } else if (line.startsWith('disallow:') && inBlock) {
      const path = line.replace('disallow:', '').trim();
      // empty Disallow: means "allow everything" — only track non-empty paths
      if (path) disallowedPaths.push(path);
    } else if (line === '' && inBlock) {
      for (const ua of current) {
        rules.push({
          userAgent: ua,
          disallowAll: disallowedPaths.some((p) => p === '/' || p === ''),
        });
      }
      current = [];
      disallowedPaths.length = 0;
      inBlock = false;
    }
  }

  // flush last block
  if (inBlock && current.length > 0 && disallowedPaths.length > 0) {
    for (const ua of current) {
      rules.push({
        userAgent: ua,
        disallowAll: disallowedPaths.some((p) => p === '/' || p === ''),
      });
    }
  }

  return rules;
}

function blockedBots(robotsTxt: string): string[] {
  const rules = parseRobots(robotsTxt);
  const blocked: string[] = [];

  // Check wildcard Disallow: /
  const wildcardBlocksAll = rules.some(
    (r) => r.userAgent === '*' && r.disallowAll
  );

  for (const bot of AI_BOTS) {
    const explicit = rules.find((r) => r.userAgent === bot);
    if (explicit) {
      if (explicit.disallowAll) blocked.push(bot);
    } else if (wildcardBlocksAll) {
      blocked.push(bot);
    }
  }

  return [...new Set(blocked)];
}

export function checkAiCrawlerAccess(store: StoreFetch): CheckResult {
  if (!store.robotsTxt) {
    return {
      id: 'ai-crawler-access',
      label: 'AI crawler access (robots.txt)',
      status: 'warn',
      impact: 'high',
      detail: 'robots.txt not found — cannot verify AI crawler access.',
    };
  }

  const blocked = blockedBots(store.robotsTxt);

  if (blocked.length === 0) {
    return {
      id: 'ai-crawler-access',
      label: 'AI crawler access (robots.txt)',
      status: 'pass',
      impact: 'high',
      detail: 'No AI crawlers blocked — GPTBot, ClaudeBot, PerplexityBot, and Google-Extended can all access the store.',
    };
  }

  const names = blocked.map((b) =>
    b === 'gptbot' ? 'GPTBot' :
    b === 'claudebot' ? 'ClaudeBot' :
    b === 'claude-web' ? 'Claude-Web' :
    b === 'perplexitybot' ? 'PerplexityBot' :
    b === 'google-extended' ? 'Google-Extended' : b
  );

  return {
    id: 'ai-crawler-access',
    label: 'AI crawler access (robots.txt)',
    status: 'fail',
    impact: 'high',
    detail: `robots.txt blocks: ${names.join(', ')}. These AI engines cannot index your store.`,
  };
}

export { blockedBots };
