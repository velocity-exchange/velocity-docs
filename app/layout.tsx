import "./global.css";
import "../components/diagrams/tokens.css";
import "../components/diagrams/flowchart.css";
import "../components/diagrams/sequence.css";
import "../components/diagrams/price-ramp.css";
import type { Metadata } from "next";
import { RootProvider } from "fumadocs-ui/provider";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { Providers } from "./providers";

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
  title: {
    default: "Velocity Protocol",
    template: "%s | Velocity Protocol",
  },
  description:
    "Velocity brings on-chain, cross-margined perpetual futures to Solana.",
  openGraph: {
    title: "Velocity Protocol",
    description:
      "Velocity brings on-chain, cross-margined perpetual futures to Solana.",
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
