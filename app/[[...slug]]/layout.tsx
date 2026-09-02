import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { getSidebarTabs } from "fumadocs-ui/utils/get-sidebar-tabs";
import { source } from "@/lib/source";
import { baseOptions } from "../layout.config";
import { Separator } from "@/components/docs/sidebar";

// getSidebarTabs walks the tree in root-folder scan order, which is
// alphabetical by directory name ("developers" before "protocol"), not
// reading order. Protocol is the front door, so it goes first regardless.
const tabs = getSidebarTabs(source.pageTree).sort((a, b) =>
  a.title === "Velocity Protocol" ? -1 : b.title === "Velocity Protocol" ? 1 : 0,
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <DocsLayout
      tree={source.pageTree}
      {...baseOptions}
      // Default puts the Protocol/Developers switcher inside a collapsed
      // dropdown at the top of the sidebar, one click nobody finds. "top"
      // renders both roots as a persistent tab bar under the navbar instead.
      tabMode="top"
      sidebar={{
        tabs,
        components: { Separator },
      }}
    >
      {children}
    </DocsLayout>
  );
}
