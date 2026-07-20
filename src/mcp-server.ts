import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { auditStore } from './audit.js';
import { normalizeUrl } from './fetcher.js';

const server = new McpServer({
  name: 'shopify-geo-audit',
  version: '0.2.0',
});

server.registerTool(
  'audit_shopify_store',
  {
    title: 'Audit a Shopify store for AI-search readiness',
    description:
      'Fetches a Shopify storefront, runs nine weighted GEO/AEO checks (Product JSON-LD, ' +
      'AI crawler access in robots.txt, Organization/WebSite schema, llms.txt, meta basics, ' +
      'content depth, headings, image alt text, sitemap), and returns an SRO score 0-100 ' +
      'with per-check results plus generated fixes: a Product JSON-LD block built from the ' +
      "store's real data, an llms.txt, robots.txt lines, and a ranked priority list.",
    inputSchema: {
      url: z.string().describe('Shopify storefront URL, e.g. https://your-store.com'),
      products: z
        .number()
        .int()
        .min(1)
        .max(20)
        .optional()
        .describe('How many product pages to audit (default 5)'),
    },
  },
  async ({ url, products }) => {
    let storeUrl: string;
    try {
      storeUrl = normalizeUrl(url);
    } catch {
      return {
        isError: true,
        content: [{ type: 'text', text: `Invalid URL: ${url}` }],
      };
    }

    try {
      const { results, fixes } = await auditStore(storeUrl, products ?? 5);
      return {
        content: [{ type: 'text', text: JSON.stringify({ ...results, fixes }, null, 2) }],
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        isError: true,
        content: [{ type: 'text', text: `Fetch error: ${msg}` }],
      };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
