import { createMetadataImage } from "fumadocs-core/server";
import { source } from "@/lib/source";

/**
 * Shared metadata for the docs site.
 *
 * The share card used to be one committed PNG with the word "Introduction"
 * drawn into it, served from the root layout for all 107 pages. The card is
 * now generated per page by app/og/[...slug]/route.tsx.
 */

/** Used when a page has no description of its own. 76 of 110 pages have none. */
export const SITE_DESCRIPTION =
  "Velocity brings on-chain, cross-margined perpetual futures to Solana.";

/**
 * The card is Figma frame 400:4647, which is 1200x675. This is not the 1200x630
 * that fumadocs' own getImageMeta hardcodes, so the tags are written from these
 * values rather than taken from withImage.
 */
export const OG_IMAGE_SIZE = { width: 1200, height: 675 } as const;

/**
 * Wires a page's slug to its image route and generates the route's static
 * params. getImageMeta builds the URL as `${imageRoute}/${...slugs}/${filename}`
 * and generateParams appends the filename to the slug, so the route handler is
 * the catch-all app/og/[...slug]/route.tsx and it receives "image.png" as the
 * last segment.
 */
export const metadataImage = createMetadataImage({
  source,
  imageRoute: "/og",
  filename: "image.png",
});
