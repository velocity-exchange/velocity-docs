import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { source } from "@/lib/source";
import { baseOptions } from "../layout.config";
import { Separator } from "@/components/docs/sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <DocsLayout
      tree={source.pageTree}
      {...baseOptions}
      sidebar={{
        tabs: { transform: (option) => option },
        components: { Separator },
      }}
    >
      {children}
    </DocsLayout>
  );
}
