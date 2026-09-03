import { loader } from "fumadocs-core/source";
import { icons } from "lucide-react";
import { createElement } from "react";
import { docs } from "@/.source";

export const source = loader({
  baseUrl: "/",
  source: docs.toFumadocsSource(),
  // meta.json carries an icon by name. Without this resolver Fumadocs renders
  // the literal string, so the root switcher reads "Zap Velocity Protocol".
  icon(icon) {
    if (!icon) return;
    if (icon in icons) {
      return createElement(icons[icon as keyof typeof icons], {
        // match the 16px sidebar rhythm rather than the 36px default box
        className: "size-4",
      });
    }
  },
});
