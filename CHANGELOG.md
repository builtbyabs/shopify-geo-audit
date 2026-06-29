# Changelog

## 0.1.0

First release.

- Nine GEO checks: product JSON-LD, AI crawler access, org/website schema,
  llms.txt, meta basics, content depth, headings, image alt, sitemap.
- Weighted SRO score (0-100) with strong / needs-work / at-risk bands.
- Fix generators: Product JSON-LD, llms.txt, robots.txt lines, priority list.
- Terminal report, `--html` report, `--json` output.
- SSRF-guarded fetching, zod validation on everything parsed off the network.
