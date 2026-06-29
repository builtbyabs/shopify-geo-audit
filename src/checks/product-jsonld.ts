import { ProductJsonLdSchema } from '../types.js';
import type { CheckResult, StoreFetch } from '../types.js';

const PRODUCT_TYPES = new Set([
  'product',
  'productgroup',
  'individualarticle',
]);

function hasValidProductSchema(jsonld: Record<string, unknown>[]): boolean {
  for (const node of jsonld) {
    const rawType = node['@type'];
    const types = Array.isArray(rawType)
      ? rawType.map((t) => String(t).toLowerCase())
      : [String(rawType ?? '').toLowerCase()];

    if (!types.some((t) => PRODUCT_TYPES.has(t))) continue;

    const result = ProductJsonLdSchema.safeParse(node);
    if (!result.success) continue;

    const { offers } = result.data;
    if (!offers) continue;

    const offer = Array.isArray(offers) ? offers[0] : offers;
    if (!offer) continue;

    // Require at least price or availability — bare Product without Offer is insufficient
    if (offer.price !== undefined || offer.availability !== undefined) {
      return true;
    }
  }
  return false;
}

export function checkProductJsonLd(store: StoreFetch): CheckResult {
  const { productPages } = store;

  if (productPages.length === 0) {
    return {
      id: 'product-jsonld',
      label: 'Product structured data (JSON-LD)',
      status: 'warn',
      impact: 'high',
      detail: 'No product pages found — could not audit product schema.',
    };
  }

  const passing = productPages.filter((p) => hasValidProductSchema(p.jsonld));
  const total = productPages.length;
  const ratio = passing.length / total;

  if (ratio === 1) {
    return {
      id: 'product-jsonld',
      label: 'Product structured data (JSON-LD)',
      status: 'pass',
      impact: 'high',
      detail: `Valid Product JSON-LD with Offer on all ${total} product page${total > 1 ? 's' : ''}.`,
    };
  }

  if (ratio > 0) {
    return {
      id: 'product-jsonld',
      label: 'Product structured data (JSON-LD)',
      status: 'warn',
      impact: 'high',
      detail: `Product JSON-LD present on ${passing.length}/${total} pages — incomplete coverage.`,
    };
  }

  return {
    id: 'product-jsonld',
    label: 'Product structured data (JSON-LD)',
    status: 'fail',
    impact: 'high',
    detail: `No valid Product JSON-LD found on ${total} product page${total > 1 ? 's' : ''}. AI can't parse your products.`,
  };
}
