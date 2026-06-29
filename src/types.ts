import { z } from 'zod';

// ─── Raw fetch results ───────────────────────────────────────────────────────

export const RawPageSchema = z.object({
  url: z.string().url(),
  html: z.string(),
  status: z.number(),
});
export type RawPage = z.infer<typeof RawPageSchema>;

export const RawTextSchema = z.object({
  url: z.string().url(),
  text: z.string(),
  status: z.number(),
});
export type RawText = z.infer<typeof RawTextSchema>;

// ─── JSON-LD ─────────────────────────────────────────────────────────────────

export const JsonLdNodeSchema = z.record(z.string(), z.unknown());
export type JsonLdNode = z.infer<typeof JsonLdNodeSchema>;

// Minimal Product shape for validation
export const ProductJsonLdSchema = z.object({
  '@context': z.string().optional(),
  '@type': z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  image: z.union([z.string(), z.array(z.string())]).optional(),
  offers: z
    .union([
      z.object({
        '@type': z.string().optional(),
        price: z.union([z.string(), z.number()]).optional(),
        priceCurrency: z.string().optional(),
        availability: z.string().optional(),
      }),
      z.array(
        z.object({
          '@type': z.string().optional(),
          price: z.union([z.string(), z.number()]).optional(),
          priceCurrency: z.string().optional(),
          availability: z.string().optional(),
        })
      ),
    ])
    .optional(),
  aggregateRating: z
    .object({
      '@type': z.string().optional(),
      ratingValue: z.union([z.string(), z.number()]).optional(),
      reviewCount: z.union([z.string(), z.number()]).optional(),
    })
    .optional(),
  sku: z.string().optional(),
  brand: z
    .union([z.string(), z.object({ '@type': z.string().optional(), name: z.string().optional() })])
    .optional(),
});
export type ProductJsonLd = z.infer<typeof ProductJsonLdSchema>;

// ─── Parsed page ─────────────────────────────────────────────────────────────

export const MetaTagsSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  canonical: z.string().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().optional(),
  ogSiteName: z.string().optional(),
});
export type MetaTags = z.infer<typeof MetaTagsSchema>;

export const ImageInfoSchema = z.object({
  src: z.string(),
  alt: z.string().optional(),
});
export type ImageInfo = z.infer<typeof ImageInfoSchema>;

export const ParsedPageSchema = z.object({
  url: z.string().url(),
  jsonld: z.array(JsonLdNodeSchema),
  meta: MetaTagsSchema,
  h1s: z.array(z.string()),
  h2s: z.array(z.string()),
  images: z.array(ImageInfoSchema),
  bodyText: z.string(),
  wordCount: z.number().int().nonnegative(),
});
export type ParsedPage = z.infer<typeof ParsedPageSchema>;

// ─── Store fetch bundle ───────────────────────────────────────────────────────

export const StoreFetchSchema = z.object({
  homepage: ParsedPageSchema,
  productPages: z.array(ParsedPageSchema),
  robotsTxt: z.string().optional(),
  sitemapReachable: z.boolean(),
  llmsTxtReachable: z.boolean(),
  storeUrl: z.string().url(),
  storeName: z.string().optional(),
});
export type StoreFetch = z.infer<typeof StoreFetchSchema>;

// ─── Check result ─────────────────────────────────────────────────────────────

export const CheckStatusSchema = z.enum(['pass', 'warn', 'fail']);
export type CheckStatus = z.infer<typeof CheckStatusSchema>;

export const ImpactSchema = z.enum(['high', 'med', 'low']);
export type Impact = z.infer<typeof ImpactSchema>;

export const CheckResultSchema = z.object({
  id: z.string(),
  label: z.string(),
  status: CheckStatusSchema,
  impact: ImpactSchema,
  detail: z.string(),
});
export type CheckResult = z.infer<typeof CheckResultSchema>;

// ─── Score ────────────────────────────────────────────────────────────────────

export const BandSchema = z.enum(['Strong', 'Needs work', 'At risk']);
export type Band = z.infer<typeof BandSchema>;

export const ScoreSchema = z.object({
  value: z.number().int().min(0).max(100),
  band: BandSchema,
  earned: z.number(),
  total: z.number(),
});
export type Score = z.infer<typeof ScoreSchema>;

// ─── Audit results ────────────────────────────────────────────────────────────

export const AuditResultsSchema = z.object({
  storeUrl: z.string().url(),
  storeName: z.string().optional(),
  checks: z.array(CheckResultSchema),
  score: ScoreSchema,
  generatedAt: z.string(),
});
export type AuditResults = z.infer<typeof AuditResultsSchema>;
