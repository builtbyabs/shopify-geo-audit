import type { CheckResult, StoreFetch } from '../types.js';

export function checkSitemap(store: StoreFetch): CheckResult {
  if (store.sitemapReachable) {
    return {
      id: 'sitemap',
      label: 'Sitemap reachable (/sitemap.xml)',
      status: 'pass',
      impact: 'low',
      detail: '/sitemap.xml is reachable — AI crawlers can discover all pages.',
    };
  }

  return {
    id: 'sitemap',
    label: 'Sitemap reachable (/sitemap.xml)',
    status: 'fail',
    impact: 'low',
    detail: '/sitemap.xml not reachable — crawlers must discover pages through links alone.',
  };
}
