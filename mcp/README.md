# shopify-geo-audit-mcp

MCP server for [shopify-geo-audit](https://www.npmjs.com/package/shopify-geo-audit) — audit any Shopify store for AI search (GEO/AEO) readiness from Claude, Cursor, or any MCP client.

Exposes one tool, `audit_shopify_store`: give it a store URL and it runs nine weighted checks (Product JSON-LD, AI crawler access, `Organization`/`WebSite` schema, `llms.txt`, meta basics, content depth, headings, image alt, sitemap), returns an SRO score 0–100 with per-check results, and generates the fixes (Product JSON-LD from the store's real data, `llms.txt`, robots.txt lines, a ranked priority list).

## Install

```json
{
  "mcpServers": {
    "shopify-geo-audit": {
      "command": "npx",
      "args": ["-y", "shopify-geo-audit-mcp"]
    }
  }
}
```

No account, no API key. Same audit engine as the `shopify-geo-audit` CLI.

## License

[MIT](LICENSE) © Abhishek Chauhan
