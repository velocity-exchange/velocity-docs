import "nextra-theme-docs/style.css";
import "../styles/theme.css";
import type { Metadata } from "next";
import Link from "next/link";
import { Footer, Layout, Navbar } from "nextra-theme-docs";
import { getPageMap } from "nextra/page-map";
import { Logo } from "../components/Logo";

export const metadata: Metadata = {
  title: {
    default: "Velocity Protocol",
    template: "%s – Velocity Protocol",
  },
  description:
    "Velocity brings on-chain, cross-margined perpetual futures to Solana. Making futures DEXs the best way to trade.",
  openGraph: {
    title: "Velocity Protocol",
    description:
      "Velocity brings on-chain, cross-margined perpetual futures to Solana. Making futures DEXs the best way to trade.",
    images: ["/assets/meta-introduction.png"],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/assets/meta-introduction.png"],
  },
  icons: {
    icon: [
      { url: "/assets/favicon.svg", type: "image/svg+xml" },
      { url: "/assets/favicon.png", type: "image/png" },
      {
        url: "/assets/favicon-dark.svg",
        type: "image/svg+xml",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/assets/favicon-dark.png",
        type: "image/png",
        media: "(prefers-color-scheme: dark)",
      },
    ],
  },
};

const logo = (
  <div className="nx-flex nx-items-center">
    <Link href="/" className="nx-flex nx-items-center">
      <Logo />
    </Link>
  </div>
);

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pageMap = await getPageMap();

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Layout
          pageMap={pageMap}
          navbar={
            <Navbar
              logo={logo}
              logoLink={false}
              projectLink="https://github.com/velocity-exchange"
              chatLink="https://discord.com/invite/95kByNnDy5"
            >
            </Navbar>
          }
          sidebar={{
            defaultMenuCollapseLevel: 1,
            toggleButton: true,
          }}
          docsRepositoryBase="https://github.com/velocity-exchange/velocity-docs/tree/master"
          footer={
            <Footer>
              <a
                target="_blank"
                rel="noopener noreferrer"
                title="Velocity Protocol Landing Page"
                href="https://www.velocity.exchange/"
              >
                <p>© {new Date().getFullYear()} Velocity Protocol</p>
              </a>
            </Footer>
          }
        >
          {children}
        </Layout>
      </body>
    </html>
  );
}
