import { Command } from 'commander';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import pc from 'picocolors';

import { fetchStore, normalizeUrl } from './fetcher.js';
import { score } from './scorer.js';
import { printTerminalReport } from './reporters/terminal.js';
import { generateHtmlReport } from './reporters/html.js';
import { formatJson } from './reporters/json.js';

import { checkProductJsonLd }    from './checks/product-jsonld.js';
import { checkAiCrawlerAccess }  from './checks/ai-crawler-access.js';
import { checkOrgWebsiteSchema } from './checks/org-website-schema.js';
import { checkLlmsTxt }          from './checks/llms-txt.js';
import { checkMetaBasics }       from './checks/meta-basics.js';
import { checkContentDepth }     from './checks/content-depth.js';
import { checkHeadings }         from './checks/headings.js';
import { checkImageAlt }         from './checks/image-alt.js';
import { checkSitemap }          from './checks/sitemap.js';

import { generateProductJsonLdFix } from './fixers/product-jsonld.js';
import { generateLlmsTxt }          from './fixers/llms-txt.js';
import { generateRobotsFixes }      from './fixers/robots-fixes.js';
import { generatePriorityList }     from './fixers/priority-list.js';

import type { CheckResult, AuditResults } from './types.js';

interface CliOptions {
  products: string;
  out: string;
  html: boolean;
  json: boolean;
  minScore?: string;
}

function parseMinScore(value: string | undefined): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  const minScore = Number(value);
  if (!Number.isInteger(minScore) || minScore < 0 || minScore > 100) {
    throw new Error('--min-score must be an integer between 0 and 100');
  }

  return minScore;
}

const program = new Command();

program
  .name('shopify-geo-audit')
  .description(
    'Audit any Shopify storefront for AI-search (GEO) readiness and generate paste-ready fixes.'
  )
  .version('0.1.0')
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

    let storeFetch, products;
    try {
      ({ storeFetch, products } = await fetchStore(storeUrl, productLimit));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(pc.red(`\nFetch error: ${msg}`));
      process.exit(1);
    }

    // Run all checks
    const checks: CheckResult[] = [
      checkProductJsonLd(storeFetch),
      checkAiCrawlerAccess(storeFetch),
      checkOrgWebsiteSchema(storeFetch),
      checkLlmsTxt(storeFetch),
      checkMetaBasics(storeFetch),
      checkContentDepth(storeFetch),
      checkHeadings(storeFetch),
      checkImageAlt(storeFetch),
      checkSitemap(storeFetch),
    ];

    const scoreResult = score(checks);

    const results: AuditResults = {
      storeUrl: storeFetch.storeUrl,
      storeName: storeFetch.storeName,
      checks,
      score: scoreResult,
      generatedAt: new Date().toISOString(),
    };

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

      const productJsonLdFix = generateProductJsonLdFix(products, storeFetch);
      const llmsTxt          = generateLlmsTxt(storeFetch, products);
      const robotsFix        = generateRobotsFixes(storeFetch);
      const priorityList     = generatePriorityList(checks);

      await Promise.all([
        writeFile(join(opts.out, 'product-jsonld.html'), productJsonLdFix, 'utf8'),
        writeFile(join(opts.out, 'llms.txt'),            llmsTxt,          'utf8'),
        writeFile(join(opts.out, 'robots-fixes.txt'),    robotsFix,        'utf8'),
        writeFile(join(opts.out, 'priority-list.txt'),   priorityList,     'utf8'),
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

    if (minScore !== undefined && scoreResult.value < minScore) {
      console.error(
        pc.red(`Score ${scoreResult.value} is below required minimum ${minScore}.`)
      );
      process.exit(1);
    }
  });

program.parse();
