import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

const run = promisify(execFile);

// Regression test: the bin shim must actually invoke the parser. A guard added
// in #6 compared import.meta.url against argv[1], which never matches when the
// entry is bin/cli.js — the CLI exited 0 having done nothing.
describe('cli entry', () => {
  it('prints usage when run through bin/cli.js', async () => {
    const { stdout } = await run('node', ['bin/cli.js', '--help']);
    expect(stdout).toContain('Usage: shopify-geo-audit');
    expect(stdout).toContain('--min-score');
  });

  it('exits non-zero on a missing url argument', async () => {
    await expect(run('node', ['bin/cli.js'])).rejects.toMatchObject({ code: 1 });
  });
});
