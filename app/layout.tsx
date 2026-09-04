import "./global.css";
import "../components/diagrams/tokens.css";
import "../components/diagrams/flowchart.css";
import "../components/diagrams/sequence.css";
import "../components/diagrams/price-ramp.css";
import type { Metadata } from "next";
import { RootProvider } from "fumadocs-ui/provider";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { Providers } from "./providers";
import { SITE_DESCRIPTION } from "@/lib/metadata";

/**
 * Slack and X have to fetch the card image, so og:image must be absolute.
 * metadataBase is what makes Next.js write it that way, and it was set nowhere
 * before, so the URLs resolved by luck. A preview deployment points at its own
 * host, otherwise a card on a preview would show production's image.
 */
const siteUrl =
  process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production"
    ? `https://${process.env.VERCEL_URL}`
    : "https://docs.velocity.exchange";

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
  display: "swap",
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Velocity Protocol",
    template: "%s | Velocity Protocol",
  },
  description: SITE_DESCRIPTION,
  // Kept as the fallback rather than removed. app/not-found.tsx and the two
  // api routes have no generateMetadata, so they would otherwise have no card
  // at all. Doc pages override all three of these in their own metadata.
  openGraph: {
    title: "Velocity Protocol",
    description: SITE_DESCRIPTION,
    images: ["/assets/meta-introduction.png"],
  },
  twitter: { card: "summary_large_image", images: ["/assets/meta-introduction.png"] },
  icons: {
    icon: [
      { url: "/assets/favicon.svg", type: "image/svg+xml" },
      { url: "/assets/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/assets/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/assets/favicon.ico",
    apple: "/assets/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col">
        <RootProvider>
          <Providers>{children}</Providers>
        </RootProvider>
      </body>
    </html>
  );
}
