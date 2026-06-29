import type { CheckResult, StoreFetch, JsonLdNode } from '../types.js';

const IMAGE_TYPES = new Set(['imageobject', 'image']);

function hasImageSchema(jsonld: JsonLdNode[]): boolean {
  return jsonld.some((n) => {
    const raw = n['@type'];
    const types = Array.isArray(raw)
      ? raw.map((t) => String(t).toLowerCase())
      : [String(raw ?? '').toLowerCase()];
    return types.some((t) => IMAGE_TYPES.has(t));
  });
}

export function checkImageAlt(store: StoreFetch): CheckResult {
  // Audit product pages; fall back to homepage if none
  const pages =
    store.productPages.length > 0 ? store.productPages : [store.homepage];

  const allImages = pages.flatMap((p) => p.images);
  const total = allImages.length;

  if (total === 0) {
    return {
      id: 'image-alt',
      label: 'Image alt text + image schema',
      status: 'warn',
      impact: 'low',
      detail: 'No images found on audited pages.',
    };
  }

  // alt="" counts as intentionally decorative (ok), missing attr counts as fail
  const withAlt = allImages.filter((img) => img.alt !== undefined).length;
  const pct = Math.round((withAlt / total) * 100);

  const hasSchema =
    pages.some((p) => hasImageSchema(p.jsonld)) ||
    hasImageSchema(store.homepage.jsonld);

  if (pct >= 90 && hasSchema) {
    return {
      id: 'image-alt',
      label: 'Image alt text + image schema',
      status: 'pass',
      impact: 'low',
      detail: `${pct}% of images have alt text. ImageObject schema present.`,
    };
  }

  if (pct >= 70) {
    return {
      id: 'image-alt',
      label: 'Image alt text + image schema',
      status: 'warn',
      impact: 'low',
      detail: `${pct}% of images have alt text${!hasSchema ? '; no ImageObject schema' : ''}. Aim for 90%+.`,
    };
  }

  return {
    id: 'image-alt',
    label: 'Image alt text + image schema',
    status: 'fail',
    impact: 'low',
    detail: `Only ${pct}% of ${total} images have alt text — AI cannot understand your product visuals.`,
  };
}
