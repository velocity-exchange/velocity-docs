import { source } from "@/lib/source";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/page";
import { notFound } from "next/navigation";
import { getMDXComponents } from "@/components/mdx";
import type { Metadata } from "next";
import {
  metadataImage,
  OG_IMAGE_SIZE,
  SITE_DESCRIPTION,
} from "@/lib/metadata";

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;

  return (
    <DocsPage
      toc={page.data.toc}
      full={page.data.full}
      tableOfContent={{ style: "clerk", single: false }}
      editOnGithub={{
        owner: "velocity-exchange",
        repo: "velocity-docs",
        sha: "master",
        path: `content/${page.file.path}`,
      }}
    >
      <DocsTitle>{page.data.title}</DocsTitle>
      {page.data.description ? (
        <DocsDescription>{page.data.description}</DocsDescription>
      ) : null}
      <DocsBody>
        <MDX components={getMDXComponents()} />
      </DocsBody>
    </DocsPage>
  );
}

export function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const slug = params.slug ?? [];
  const description = page.data.description ?? SITE_DESCRIPTION;
  // Next.js never copies `title` into `openGraph.title`, so without these two
  // blocks every page inherits the root layout's "Velocity Protocol".
  const image = {
    ...metadataImage.getImageMeta(slug),
    alt: page.data.title,
    ...OG_IMAGE_SIZE,
  };

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      title: page.data.title,
      description,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: page.data.title,
      description,
      images: [image],
    },
  };
}
