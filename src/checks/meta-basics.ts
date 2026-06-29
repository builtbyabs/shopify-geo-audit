import type { CheckResult, StoreFetch } from '../types.js';

export function checkMetaBasics(store: StoreFetch): CheckResult {
  const { meta } = store.homepage;

  const missing: string[] = [];
  if (!meta.title) missing.push('title');
  if (!meta.description) missing.push('meta description');
  if (!meta.canonical) missing.push('canonical');
  if (!meta.ogTitle && !meta.ogDescription) missing.push('Open Graph tags');

  if (missing.length === 0) {
    return {
      id: 'meta-basics',
      label: 'Title, meta description, canonical, Open Graph',
      status: 'pass',
      impact: 'med',
      detail: 'All core meta tags present on homepage.',
    };
  }

  if (missing.length <= 1) {
    return {
      id: 'meta-basics',
      label: 'Title, meta description, canonical, Open Graph',
      status: 'warn',
      impact: 'med',
      detail: `Missing: ${missing.join(', ')} — minor gaps reduce AI-citation clarity.`,
    };
  }

  return {
    id: 'meta-basics',
    label: 'Title, meta description, canonical, Open Graph',
    status: 'fail',
    impact: 'med',
    detail: `Missing: ${missing.join(', ')}. Without these, AI engines can't form an accurate summary of your store.`,
  };
}
