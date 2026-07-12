import { describe, expect, it } from 'vitest';

import { isBelowMinScore, parseMinScore } from '../src/index.js';

describe('min score option', () => {
  it('parses an integer threshold', () => {
    expect(parseMinScore('80')).toBe(80);
  });

  it('rejects thresholds outside 0-100', () => {
    expect(() => parseMinScore('-1')).toThrow('--min-score must be an integer between 0 and 100');
    expect(() => parseMinScore('101')).toThrow('--min-score must be an integer between 0 and 100');
    expect(() => parseMinScore('80.5')).toThrow('--min-score must be an integer between 0 and 100');
  });

  it('flags scores below the requested threshold', () => {
    expect(isBelowMinScore(79, 80)).toBe(true);
    expect(isBelowMinScore(80, 80)).toBe(false);
    expect(isBelowMinScore(79, undefined)).toBe(false);
  });
});
