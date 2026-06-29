import type { CheckResult, StoreFetch } from '../types.js';

export function checkHeadings(store: StoreFetch): CheckResult {
  const { h1s, h2s } = store.homepage;

  const h1Count = h1s.length;

  if (h1Count === 1 && h2s.length >= 2) {
    return {
      id: 'headings',
      label: 'Heading structure (H1 + H2s)',
      status: 'pass',
      impact: 'low',
      detail: `One H1 and ${h2s.length} H2s — clean semantic structure for AI parsing.`,
    };
  }

  if (h1Count === 0) {
    return {
      id: 'headings',
      label: 'Heading structure (H1 + H2s)',
      status: 'fail',
      impact: 'low',
      detail: 'No H1 on homepage. AI engines use the H1 as the primary topic signal.',
    };
  }

  if (h1Count > 1) {
    return {
      id: 'headings',
      label: 'Heading structure (H1 + H2s)',
      status: 'warn',
      impact: 'low',
      detail: `${h1Count} H1 tags found — multiple H1s dilute the primary topic signal for AI crawlers.`,
    };
  }

  // h1Count === 1 but h2s < 2
  return {
    id: 'headings',
    label: 'Heading structure (H1 + H2s)',
    status: 'warn',
    impact: 'low',
    detail: `One H1 but only ${h2s.length} H2${h2s.length !== 1 ? 's' : ''} — add H2 sub-sections to improve content hierarchy.`,
  };
}
