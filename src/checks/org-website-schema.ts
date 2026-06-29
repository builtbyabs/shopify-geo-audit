import type { CheckResult, StoreFetch, JsonLdNode } from '../types.js';

const ORG_TYPES = new Set(['organization', 'localbusiness', 'corporation', 'store']);
const WEBSITE_TYPES = new Set(['website']);

function hasType(node: JsonLdNode, typeSet: Set<string>): boolean {
  const raw = node['@type'];
  const types = Array.isArray(raw)
    ? raw.map((t) => String(t).toLowerCase())
    : [String(raw ?? '').toLowerCase()];
  return types.some((t) => typeSet.has(t));
}

export function checkOrgWebsiteSchema(store: StoreFetch): CheckResult {
  const { jsonld } = store.homepage;

  const hasOrg = jsonld.some((n) => hasType(n, ORG_TYPES));
  const hasWebsite = jsonld.some((n) => hasType(n, WEBSITE_TYPES));

  if (hasOrg && hasWebsite) {
    return {
      id: 'org-website-schema',
      label: 'Organization + WebSite schema (homepage)',
      status: 'pass',
      impact: 'med',
      detail: 'Organization and WebSite JSON-LD present on homepage.',
    };
  }

  if (hasOrg || hasWebsite) {
    const missing = hasOrg ? 'WebSite' : 'Organization';
    return {
      id: 'org-website-schema',
      label: 'Organization + WebSite schema (homepage)',
      status: 'warn',
      impact: 'med',
      detail: `${missing} JSON-LD missing on homepage — AI can't fully identify your brand entity.`,
    };
  }

  return {
    id: 'org-website-schema',
    label: 'Organization + WebSite schema (homepage)',
    status: 'fail',
    impact: 'med',
    detail: 'No Organization or WebSite JSON-LD on homepage. AI search cannot establish your brand identity.',
  };
}
