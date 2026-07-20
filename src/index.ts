import { Command } from 'commander';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import pc from 'picocolors';

import { normalizeUrl } from './fetcher.js';
import { auditStore } from './audit.js';
import { printTerminalReport } from './reporters/terminal.js';
import { generateHtmlReport } from './reporters/html.js';
import { formatJson } from './reporters/json.js';

interface CliOptions {
  products: string;
  out: string;
  html: boolean;
  json: boolean;
  minScore?: string;
}

export function parseMinScore(value: string | undefined): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  const minScore = Number(value);
  if (!Number.isInteger(minScore) || minScore < 0 || minScore > 100) {
    throw new Error('--min-score must be an integer between 0 and 100');
  }

  return minScore;
}

export function isBelowMinScore(scoreValue: number, minScore: number | undefined): boolean {
  return minScore !== undefined && scoreValue < minScore;
}

export const program = new Command();

program
  .name('shopify-geo-audit')
  .description(
    'Audit any Shopify storefront for AI-search (GEO) readiness and generate paste-ready fixes.'
  )
  .version('0.2.0')
  .argument('<url>', 'Shopify storefront URL')
  .option('-n, --products <number>', 'number of product pages to audit', '5')
  .option('-o, --out <dir>', 'output directory for generated fixes', './geo-audit-output')
  .option('--html', 'generate a self-contained HTML report')
  .option('--json', 'dump raw results as JSON to stdout')
  .option('--min-score <number>', 'exit with status 1 when the audit score is below this threshold')
  .action(async (url: string, opts: CliOptions) => {
    const productLimit = Math.max(1, Math.min(20, parseInt(opts.products, 10) || 5));

    let minScore: number | undefined;
    try {
      minScore = parseMinScore(opts.minScore);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(pc.red(msg));
      process.exit(1);
    }

    let storeUrl: string;
    try {
      storeUrl = normalizeUrl(url);
    } catch {
      console.error(pc.red(`Invalid URL: ${url}`));
      process.exit(1);
    }

    if (!opts.json) {
      console.log(pc.dim(`\nAuditing ${storeUrl} …`));
    }

    let outcome;
    try {
      outcome = await auditStore(storeUrl, productLimit);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(pc.red(`\nFetch error: ${msg}`));
      process.exit(1);
    }

    const { results, fixes } = outcome;

    // stdout: JSON for machines (keep it clean — no other stdout), or the
    // pretty terminal report for humans. Either way, the fixes still generate.
    if (opts.json) {
      process.stdout.write(formatJson(results) + '\n');
    } else {
      printTerminalReport(results, opts.out);
    }

    // Generate the fixes — this is the product, so it always runs.
    // The optional HTML report is written when --html is passed.
    try {
      await mkdir(opts.out, { recursive: true });

      await Promise.all([
        writeFile(join(opts.out, 'product-jsonld.html'), fixes.productJsonLd, 'utf8'),
        writeFile(join(opts.out, 'llms.txt'),            fixes.llmsTxt,       'utf8'),
        writeFile(join(opts.out, 'robots-fixes.txt'),    fixes.robotsFixes,   'utf8'),
        writeFile(join(opts.out, 'priority-list.txt'),   fixes.priorityList,  'utf8'),
      ]);

      if (opts.html) {
        const html = generateHtmlReport(results);
        await writeFile(join(opts.out, 'report.html'), html, 'utf8');
        // Suppress this confirmation in --json mode to keep stdout pure JSON.
        if (!opts.json) {
          console.log(pc.dim(`  report.html → ${opts.out}/report.html\n`));
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(pc.red(`\nWrite error: ${msg}`));
      process.exit(1);
    }

    if (isBelowMinScore(results.score.value, minScore)) {
      console.error(
        pc.red(`Score ${results.score.value} is below required minimum ${minScore}.`)
      );
      process.exit(1);
    }
  });

// Only self-parse when this module *is* the entry script (node dist/index.js).
// bin/cli.js imports `program` and parses explicitly — the previous guard never
// matched through the bin shim, which left `npx shopify-geo-audit` a silent no-op.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  program.parse();
}
