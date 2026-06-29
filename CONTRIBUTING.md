# Contributing to shopify-geo-audit

Thanks for improving this. A few things to know before you start.

## What to work on

**Good first issues** are tagged in the issue tracker. Each one maps to a single module — you don't need to understand the whole codebase.

The most useful contributions right now:

- **New checks** — one check = one file in `src/checks/`. Add it, add a test in `test/`, add a fixture in `test/fixtures/`, wire it into `src/index.ts`.
- **Fixer improvements** — more accurate Liquid templates, better llms.txt structure, smarter robots.txt parsing edge cases.
- **Real-store test coverage** — open an issue with a store whose output looks wrong; include the terminal output.
- **Bug fixes** — parse failures, edge cases, incorrect pass/fail on real stores.

## Architecture

The pipeline is a straight line with strict separation:

```
fetcher → parser → checks[] → scorer → fixers[] → reporters
```

- `src/checks/` — pure functions: `(StoreFetch) => CheckResult`. No side effects.
- `src/fixers/` — pure functions: emit strings, never write files.
- `src/reporters/` — the only layer that touches stdout or the filesystem.
- `src/types.ts` — Zod schemas first. Everything is typed from those schemas.

**Hard rules that all PRs must follow:**

- TypeScript strict, zero `any`.
- Every module `< 150 lines`.
- Every check has a unit test + fixture. Tests must cover pass, warn, and fail states.
- No new runtime dependencies without discussion. Keep deps minimal.
- No API keys required for core functionality.
- Fixers must not fabricate data — only emit what was fetched from the real store.

## Adding a check

1. Create `src/checks/your-check-id.ts`

```ts
import type { CheckResult, StoreFetch } from '../types.js';

export function checkYourCheckId(store: StoreFetch): CheckResult {
  // pure function — no side effects
  return {
    id: 'your-check-id',
    label: 'Human-readable label',
    status: 'pass' | 'warn' | 'fail',
    impact: 'high' | 'med' | 'low',
    detail: 'One sentence explaining why.',
  };
}
```

2. Add a fixture: `test/fixtures/your-fixture.html`
3. Add a test: `test/your-check-id.test.ts` — cover all three statuses.
4. Wire into `src/index.ts` — import + add to the `checks[]` array.
5. Add a one-line fix action to `src/fixers/priority-list.ts`.

## Running locally

```bash
npm install
npm run build
node bin/cli.js https://your-test-store.com --html
npm test
npm run typecheck
```

## Pull requests

- Small and focused. One check per PR if possible.
- Tests must pass: `npm test && npm run typecheck`.
- Describe the real-store behavior you verified against.

## Issues

Open an issue before starting large work. If a check produces a wrong result on a real store, include the store URL (or a trimmed HTML snippet), the terminal output, and what you expected.
