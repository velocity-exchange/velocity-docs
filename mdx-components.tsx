// Nextra's `tsdoc` helper (used by components/sdkdoc) transitively imports
// nextra's MDX runtime, which resolves the alias `next-mdx-import-source-file`
// to this file. The site itself renders through Fumadocs; this shim exists
// only so that import resolves.
import { getMDXComponents } from "./components/mdx";

export function useMDXComponents(components?: Record<string, unknown>) {
  return getMDXComponents(components as never);
}
