import { z } from 'zod';

// Shapes for the public Shopify storefront /products.json endpoint.
// Kept separate from internal audit types — this models an external API.

export const ShopifyProductSchema = z.object({
  id: z.number(),
  title: z.string(),
  handle: z.string(),
  body_html: z.string().optional(),
  vendor: z.string().optional(),
  product_type: z.string().optional(),
  images: z
    .array(
      z.object({
        src: z.string(),
        alt: z.string().optional().nullable(),
      })
    )
    .optional(),
  variants: z
    .array(
      z.object({
        price: z.string().optional(),
        compare_at_price: z.string().nullable().optional(),
        available: z.boolean().optional(),
        sku: z.string().nullable().optional(),
      })
    )
    .optional(),
});
export type ShopifyProduct = z.infer<typeof ShopifyProductSchema>;

export const ShopifyProductsResponseSchema = z.object({
  products: z.array(ShopifyProductSchema),
});
export type ShopifyProductsResponse = z.infer<typeof ShopifyProductsResponseSchema>;
