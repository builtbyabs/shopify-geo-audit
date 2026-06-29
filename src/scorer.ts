import type { CheckResult, Score, Band } from './types.js';

const IMPACT_WEIGHT: Record<string, number> = {
  high: 3,
  med: 2,
  low: 1,
};

const STATUS_CREDIT: Record<string, number> = {
  pass: 1,
  warn: 0.5,
  fail: 0,
};

function band(value: number): Band {
  if (value >= 80) return 'Strong';
  if (value >= 50) return 'Needs work';
  return 'At risk';
}

export function score(checks: CheckResult[]): Score {
  if (checks.length === 0) {
    return { value: 0, band: 'At risk', earned: 0, total: 0 };
  }

  let earned = 0;
  let total = 0;

  for (const c of checks) {
    const weight = IMPACT_WEIGHT[c.impact] ?? 1;
    const credit = STATUS_CREDIT[c.status] ?? 0;
    earned += weight * credit;
    total += weight;
  }

  const value = total === 0 ? 0 : Math.round((earned / total) * 100);

  return { value, band: band(value), earned, total };
}
