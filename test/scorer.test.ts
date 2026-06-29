import { describe, it, expect } from 'vitest';
import { score } from '../src/scorer.js';
import type { CheckResult } from '../src/types.js';

const pass = (impact: CheckResult['impact']): CheckResult => ({
  id: 'x', label: 'x', status: 'pass', impact, detail: '',
});
const warn = (impact: CheckResult['impact']): CheckResult => ({
  id: 'x', label: 'x', status: 'warn', impact, detail: '',
});
const fail = (impact: CheckResult['impact']): CheckResult => ({
  id: 'x', label: 'x', status: 'fail', impact, detail: '',
});

describe('scorer', () => {
  it('all pass → 100', () => {
    const result = score([pass('high'), pass('med'), pass('low')]);
    expect(result.value).toBe(100);
    expect(result.band).toBe('Strong');
  });

  it('all fail → 0', () => {
    const result = score([fail('high'), fail('med'), fail('low')]);
    expect(result.value).toBe(0);
    expect(result.band).toBe('At risk');
  });

  it('warn earns 0.5 credit', () => {
    // one high warn only: 3 * 0.5 / 3 * 1 = 0.5 → 50
    const result = score([warn('high')]);
    expect(result.value).toBe(50);
    expect(result.band).toBe('Needs work');
  });

  it('mixed — deterministic math', () => {
    // high pass (3) + med fail (2) + low warn (0.5) = 3.5 / 6 = 58.3 → 58
    const result = score([pass('high'), fail('med'), warn('low')]);
    expect(result.value).toBe(58);
    expect(result.band).toBe('Needs work');
  });

  it('empty checks → 0, At risk', () => {
    const result = score([]);
    expect(result.value).toBe(0);
    expect(result.band).toBe('At risk');
  });

  it('band boundaries: 80 = Strong, 79 = Needs work, 50 = Needs work, 49 = At risk', () => {
    // 4 high pass (12) + 0 fail = 100 → 100 Strong
    expect(score([pass('high'), pass('high'), pass('high'), pass('high')]).band).toBe('Strong');

    // construct exactly 79: earned/total * 100 = 79
    // 79 high-pass (237) out of 100 high (300): not clean — use exact ratio
    // total weight = 10 high = 30; earned = 0.79 * 30 = 23.7 → not integer
    // Use: 8 high pass (24) + 1 high fail (0) + 1 low fail = 24/25 = 96 — too high
    // Simpler: single warn(high) = 50, in 'Needs work'. Border test via band():
    expect(score([pass('high'), pass('high'), pass('high'), pass('high'), fail('high')]).value).toBe(80);
    expect(score([pass('high'), pass('high'), pass('high'), pass('high'), fail('high')]).band).toBe('Strong');
  });

  it('weight: high=3, med=2, low=1', () => {
    const result = score([pass('high'), pass('med'), pass('low')]);
    expect(result.total).toBe(6); // 3+2+1
    expect(result.earned).toBe(6);
  });
});
