import pc from 'picocolors';
import type { AuditResults, CheckResult } from '../types.js';

const IMPACT_LABEL: Record<string, string> = {
  high: pc.bold(pc.red(' HIGH ')),
  med:  pc.yellow(' MED  '),
  low:  pc.dim(  ' LOW  '),
};

function statusIcon(status: CheckResult['status']): string {
  if (status === 'pass') return pc.green('✓');
  if (status === 'warn') return pc.yellow('⚠');
  return pc.red('✗');
}

function bandColor(band: string, value: number): string {
  if (band === 'Strong')     return pc.bold(pc.green(`${value}/100  ■ ${band.toUpperCase()}`));
  if (band === 'Needs work') return pc.bold(pc.yellow(`${value}/100  ■ ${band.toUpperCase()}`));
  return pc.bold(pc.red(`${value}/100  ■ ${band.toUpperCase()}`));
}

export function printTerminalReport(results: AuditResults, outDir: string): void {
  const { checks, score, storeUrl, storeName } = results;

  console.log('');
  console.log(pc.dim('─'.repeat(60)));
  console.log('');

  // Store name + URL
  console.log(
    `  ${pc.bold(storeName ?? storeUrl)}`
  );
  if (storeName && storeName !== storeUrl) {
    console.log(`  ${pc.dim(storeUrl)}`);
  }

  console.log('');

  // Score
  console.log(`  SRO Score: ${bandColor(score.band, score.value)}`);
  console.log('');
  console.log(pc.dim('─'.repeat(60)));
  console.log('');

  // Sort: fail first, then warn, then pass; within each group by impact weight
  const impactOrder: Record<string, number> = { high: 0, med: 1, low: 2 };
  const statusOrder: Record<string, number> = { fail: 0, warn: 1, pass: 2 };
  const sorted = [...checks].sort((a, b) => {
    const sd = (statusOrder[a.status] ?? 2) - (statusOrder[b.status] ?? 2);
    if (sd !== 0) return sd;
    return (impactOrder[a.impact] ?? 2) - (impactOrder[b.impact] ?? 2);
  });

  for (const c of sorted) {
    const icon   = statusIcon(c.status);
    const impact = IMPACT_LABEL[c.impact] ?? '';
    console.log(`  ${icon}  ${impact}  ${c.label}`);
    if (c.status !== 'pass') {
      console.log(`         ${pc.dim(c.detail)}`);
    }
  }

  console.log('');
  console.log(pc.dim('─'.repeat(60)));
  console.log('');

  const failing = checks.filter((c) => c.status !== 'pass').length;
  if (failing > 0) {
    console.log(`  ${pc.bold('Generated fixes')} → ${pc.cyan(outDir)}/`);
    console.log(`  ${pc.dim('product-jsonld.html  ·  llms.txt  ·  robots-fixes.txt  ·  priority-list.txt')}`);
  } else {
    console.log(`  ${pc.green(pc.bold('All checks passed.'))} No fixes needed right now.`);
  }
  console.log('');
}
