"use client";

import type * as PageTree from "fumadocs-core/page-tree";
import type { FC } from "react";

/**
 * Sidebar section label.
 *
 * Fumadocs renders a separator as a plain paragraph at the same size and
 * weight as the links around it, so a section heading reads as just another
 * row and the sections run together. This was previously a CSS override
 * reaching into the component's markup, which is fragile and broke whenever
 * the theme's class names moved. `DocsLayout` exposes `sidebar.components`
 * for exactly this, so the styling lives in a component we own and is written
 * in the theme's own utility classes and tokens.
 */
export const Separator: FC<{ item: PageTree.Separator }> = ({ item }) => (
  <p className="mt-6 mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-fd-muted-foreground first:mt-0">
    {item.icon}
    {item.name}
  </p>
);
