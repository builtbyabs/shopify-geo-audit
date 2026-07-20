# Changelog

## 0.2.0

- MCP server: `shopify-geo-audit-mcp` exposes the audit as an `audit_shopify_store`
  tool for Claude, Cursor and other MCP clients. Same pipeline, same fixes,
  returned as JSON instead of written to disk.
- `--min-score <n>` exits 1 when the score is below the threshold (#6, thanks
  @MFA-G).
- Fixed: the entry guard added in #6 never matched when invoked through
  `bin/cli.js`, so the installed CLI parsed nothing and exited 0. The bin now
  imports `program` and parses explicitly; a regression test covers the shim.

## 0.1.0

First release.

- Nine GEO checks: product JSON-LD, AI crawler access, org/website schema,
  llms.txt, meta basics, content depth, headings, image alt, sitemap.
- Weighted SRO score (0-100) with strong / needs-work / at-risk bands.
- Fix generators: Product JSON-LD, llms.txt, robots.txt lines, priority list.
- Terminal report, `--html` report, `--json` output.
- SSRF-guarded fetching, zod validation on everything parsed off the network.
