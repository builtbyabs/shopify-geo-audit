# shopify-geo-audit

[![npm](https://img.shields.io/npm/v/shopify-geo-audit.svg)](https://www.npmjs.com/package/shopify-geo-audit)
[![ci](https://github.com/builtbyabs/shopify-geo-audit/actions/workflows/ci.yml/badge.svg)](https://github.com/builtbyabs/shopify-geo-audit/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/shopify-geo-audit.svg)](LICENSE)

Audit any Shopify store for AI-search readiness, then generate the fixes you actually paste in.

```bash
npx shopify-geo-audit https://your-store.com
```

![Terminal demo — auditing a live Shopify store, getting an SRO score with every check graded, and the paste-ready fixes written to disk](docs/demo.gif)

No account, no API key, no config. It fetches the storefront, runs a set of checks for the signals that ChatGPT, Perplexity, Gemini and Google's AI Overviews read, scores the store 0-100, and writes paste-ready fixes to `./geo-audit-output/`.

Want it on your PATH instead of `npx`? `npm i -g shopify-geo-audit`.

## Why I built this

I do a lot of Shopify work, and "are we showing up in AI answers?" became a real client question fast. The field goes by a pile of names — GEO, AEO, AI SEO, LLM SEO, answer engine optimization — but the question is the same: when someone asks ChatGPT or Perplexity for product recommendations, is your store citable? The existing tools mostly hand you a dashboard that says you're invisible and stop there. The useful part, the part that takes an afternoon by hand, is producing the actual structured data and config. So I wrote the thing that does that part.

It's deliberately small and offline. One command, runs locally, nothing leaves your machine except the requests to the store you're auditing.

## What it checks

Nine checks, weighted by how much they matter for getting cited:

| Check | Weight |
| --- | --- |
| Product JSON-LD (`Product`/`Offer`) on product pages | high |
| robots.txt isn't blocking GPTBot / ClaudeBot / PerplexityBot / Google-Extended | high |
| `Organization` + `WebSite` schema on the homepage | medium |
| `/llms.txt` exists | medium |
| Title, meta description, canonical, Open Graph | medium |
| Product description depth + answer-first lead | medium |
| One H1, sensible H2s | low |
| Image alt text + image schema | low |
| `sitemap.xml` reachable | low |

The result is an **SRO Score** (Search Readiness for AI): 80-100 strong, 50-79 needs work, below 50 at risk.

The premise — that deliberate changes to your pages measurably move how often engines cite you — comes from the original GEO paper ([Aggarwal et al., KDD 2024](https://arxiv.org/abs/2311.09735)), which measured visibility gains of up to ~40% from exactly this kind of work.

## What it generates

The output isn't a report you read and forget. It's files:

- `product-jsonld.html` — a valid `Product` block filled from your store's real data, ready for your theme
- `llms.txt` — a content manifest for your domain
- `robots-fixes.txt` — the exact lines to stop blocking AI crawlers
- `priority-list.txt` — every failing check, ranked, each with a one-line fix

Pass `--html` and you also get a self-contained `report.html` you can screenshot or send a client:

![shopify-geo-audit's HTML report for Allbirds — an SRO score of 82/100, every check graded high/medium/low, and the paste-ready fixes it generated](docs/report.png)

## Example

```
$ npx shopify-geo-audit https://acme-coffee.com

  ────────────────────────────────────────────────────────────

  Acme Coffee
  https://acme-coffee.com/

  SRO Score: 41/100  ■ AT RISK

  ────────────────────────────────────────────────────────────

  ✗    HIGH   Product structured data (JSON-LD)
              No valid Product JSON-LD found on 4 product pages. AI can't parse your products.
  ✗    MED    llms.txt present
              /llms.txt not found — no content manifest for AI crawlers.
  ✗    MED    Product description depth (answer-first content)
              Avg 38 words per product page — too thin.
  ✗    HIGH   AI crawler access (robots.txt)
              robots.txt blocks: GPTBot, ClaudeBot.
  ✓    MED    Title, meta description, canonical, Open Graph
  ✓    LOW    Sitemap reachable (/sitemap.xml)

  ────────────────────────────────────────────────────────────

  Generated fixes → ./geo-audit-output/
  product-jsonld.html  ·  llms.txt  ·  robots-fixes.txt  ·  priority-list.txt
```

## Usage

```bash
shopify-geo-audit <url> [options]

  -n, --products <n>   how many product pages to audit   (default: 5)
  -o, --out <dir>      where to write the fixes          (default: ./geo-audit-output)
  --html               also write a self-contained report.html
  --json               print raw results as JSON (for CI); fixes still get written
  --min-score <n>      exit 1 if the score is below n (0-100)
```

`--json` keeps stdout clean so you can pipe it, and `--min-score` lets CI fail on weak audits:

```bash
shopify-geo-audit https://store.com --json --min-score 80 | jq '.score.value'
```

## MCP server

The audit also runs as an MCP tool, so Claude, Cursor or any MCP client can audit a store mid-conversation:

```json
{
  "mcpServers": {
    "shopify-geo-audit": {
      "command": "npx",
      "args": ["-y", "--package=shopify-geo-audit", "shopify-geo-audit-mcp"]
    }
  }
}
```

One tool, `audit_shopify_store` — takes a URL, returns the full results and generated fixes as JSON. Same pipeline as the CLI, nothing else running.

## How it works

It's a straight pipeline with the side effects pushed to the edges:

```
fetch → parse → checks[] → score → fixers[] → report
```

Checks are pure functions `(store) => result`, one per file, so each is trivially testable and adding a new one is a single module. Fetching is SSRF-guarded (no requests to private or reserved addresses, redirects re-validated each hop) and everything parsed off the network is validated with [zod](https://zod.dev) before it's trusted.

## Development

```bash
git clone https://github.com/builtbyabs/shopify-geo-audit.git
cd shopify-geo-audit
npm install
npm run build
node bin/cli.js https://some-store.com

npm test          # vitest, one spec per check
npm run typecheck # strict, no any
```

## FAQ

**Is this just SEO with a new name?**
Overlapping, not the same. A store can rank fine on Google and still hand ChatGPT nothing it can quote — no Product JSON-LD, thin descriptions, a robots.txt that blocks the crawlers. The checks here are specifically about what AI engines parse and cite.

**Why Shopify only?**
Because Shopify is predictable. Product discovery uses `/products.json` (with a sitemap fallback), and the generated fixes assume Shopify's theme conventions, so they actually fit instead of being generic advice. It will run against any URL, but on a non-Shopify site the product-level checks won't find much.

**Does any of my data leave my machine?**
No. The only network requests are to the store you're auditing. No telemetry, no account, nothing phoned home.

**My score is low. Where do I start?**
`priority-list.txt` in the output folder — it's every failing check ranked by weight, each with a one-line fix. The two highs (Product JSON-LD, robots.txt) are usually an hour of work combined.

## Contributing

Adding a check is the easiest contribution: drop a file in `src/checks/`, add a fixture and a test, wire it into `src/index.ts`. See [CONTRIBUTING.md](CONTRIBUTING.md). Issues and PRs welcome; `good first issue` is tagged.

And if the tool saved you an afternoon, a star is how other Shopify folks find it.

## License

[MIT](LICENSE) © Abhishek Chauhan
