import { blockedBots } from '../checks/ai-crawler-access.js';
import type { StoreFetch } from '../types.js';

const BOT_DISPLAY: Record<string, string> = {
  gptbot: 'GPTBot',
  claudebot: 'ClaudeBot',
  'claude-web': 'Claude-Web',
  perplexitybot: 'PerplexityBot',
  'google-extended': 'Google-Extended',
};

const ALL_AI_BOTS = Object.keys(BOT_DISPLAY);

export function generateRobotsFixes(store: StoreFetch): string {
  if (!store.robotsTxt) {
    return [
      '# robots.txt — AI crawler fix',
      '# Your store has no robots.txt. Create one at the root of your domain.',
      '# Add these lines to explicitly allow AI crawlers:',
      '',
      ...ALL_AI_BOTS.flatMap((bot) => [
        `User-agent: ${BOT_DISPLAY[bot]}`,
        'Allow: /',
        '',
      ]),
    ].join('\n');
  }

  const blocked = blockedBots(store.robotsTxt);

  if (blocked.length === 0) {
    return [
      '# robots.txt — AI crawler check',
      '# No AI crawlers are currently blocked. No changes needed.',
      '# Your current robots.txt allows GPTBot, ClaudeBot, PerplexityBot, and Google-Extended.',
    ].join('\n');
  }

  const lines: string[] = [
    '# robots.txt — AI crawler fix',
    `# Add these lines to your robots.txt to unblock ${blocked.length} AI crawler${blocked.length > 1 ? 's' : ''}:`,
    '# Place BEFORE any "User-agent: *" block that contains "Disallow: /"',
    '',
  ];

  for (const bot of blocked) {
    const display = BOT_DISPLAY[bot] ?? bot;
    lines.push(`User-agent: ${display}`);
    lines.push('Allow: /');
    lines.push('');
  }

  lines.push(
    '# If you use "User-agent: *\\nDisallow: /" (block all), add the above BEFORE that block.',
    '# Specific bot rules take precedence when placed first.',
    '',
    '# Verify at: https://search.google.com/search-console/robots-testing-tool',
  );

  return lines.join('\n');
}
