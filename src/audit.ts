import { fetchStore } from './fetcher.js';
import { score } from './scorer.js';

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

export interface AuditFixes {
  productJsonLd: string;
  llmsTxt: string;
  robotsFixes: string;
  priorityList: string;
}

export interface AuditOutcome {
  results: AuditResults;
  fixes: AuditFixes;
}

/**
 * The whole pipeline minus the I/O: fetch the store, run every check,
 * score it, and generate the fixes as strings. Callers (CLI, MCP server)
 * decide what to do with them.
 */
export async function auditStore(storeUrl: string, productLimit: number): Promise<AuditOutcome> {
  const { storeFetch, products } = await fetchStore(storeUrl, productLimit);

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

  const results: AuditResults = {
    storeUrl: storeFetch.storeUrl,
    storeName: storeFetch.storeName,
    checks,
    score: score(checks),
    generatedAt: new Date().toISOString(),
  };

  const fixes: AuditFixes = {
    productJsonLd: generateProductJsonLdFix(products, storeFetch),
    llmsTxt: generateLlmsTxt(storeFetch, products),
    robotsFixes: generateRobotsFixes(storeFetch),
    priorityList: generatePriorityList(checks),
  };

  return { results, fixes };
}
