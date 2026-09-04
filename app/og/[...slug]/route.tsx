import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { metadataImage, OG_IMAGE_SIZE } from "@/lib/metadata";
import { fitTitle, LINE_HEIGHT_RATIO, MAX_WIDTH } from "../fit-title";

/**
 * The docs share banner, one per page.
 *
 * This reproduces Figma frame 400:4647 "style B" on the "Docs stuffs" page of
 * Velocity Logo & Branding (Nehp9rbiJ5zEFjY78Z9VBr), with its title layer made
 * dynamic. Every position below was read from the Figma API, not measured off a
 * screenshot:
 *
 *   400:4647  frame        0,0    1200x675   #05060c, the card's ground
 *   400:4650  lockup       50,60  281x60     exported as og-lockup.png
 *   400:4649  title        60,481 543x110    Cal Sans 100px, line 110, #ffffff
 *   400:4651  artwork      716,0  484x675    exported as og-art.png
 *
 * The frame also holds a rectangle 400:4648 filled #0b1624, but it is hidden,
 * so the visible ground is the frame's own fill. That is color/main-bg in the
 * Velocity design system. Reading the rectangle instead gives the wrong colour.
 *
 * The title keeps its bottom edge at y=591 and grows upward, so a title short
 * enough for one line at 100px lands exactly where the Figma layer sits.
 */

const CARD = {
  background: "#05060c",
  artwork: { left: 716, top: 0, width: 484, height: 675 },
  lockup: { left: 50, top: 60, width: 281, height: 60 },
  /** 675 - 591, the Figma title layer's bottom edge. */
  title: { left: 60, bottom: 84, color: "#ffffff" },
} as const;

const asset = (name: string) => join(process.cwd(), "public", "assets", name);

/**
 * Read once at module scope. Satori cannot fetch a relative URL during a build,
 * so the artwork goes in as a data URI rather than as a path.
 */
const [calSans, artwork, lockup] = await Promise.all([
  readFile(join(process.cwd(), "app", "og", "CalSans-SemiBold.ttf")),
  readFile(asset("og-art.png")),
  readFile(asset("og-lockup.png")),
]);

const dataUri = (png: Buffer) =>
  `data:image/png;base64,${png.toString("base64")}`;

const artworkUri = dataUri(artwork);
const lockupUri = dataUri(lockup);

export function generateStaticParams() {
  return metadataImage.generateParams();
}

export const GET = metadataImage.createAPI((page) => {
  const { fontSize, lines } = fitTitle(page.data.title);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          position: "relative",
          width: OG_IMAGE_SIZE.width,
          height: OG_IMAGE_SIZE.height,
          backgroundColor: CARD.background,
        }}
      >
        <img
          src={artworkUri}
          width={CARD.artwork.width}
          height={CARD.artwork.height}
          style={{
            position: "absolute",
            left: CARD.artwork.left,
            top: CARD.artwork.top,
          }}
        />
        <img
          src={lockupUri}
          width={CARD.lockup.width}
          height={CARD.lockup.height}
          style={{
            position: "absolute",
            left: CARD.lockup.left,
            top: CARD.lockup.top,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: CARD.title.left,
            bottom: CARD.title.bottom,
            width: MAX_WIDTH,
            display: "flex",
            flexDirection: "column",
            fontFamily: "Cal Sans",
            fontSize,
            lineHeight: LINE_HEIGHT_RATIO,
            letterSpacing: 0,
            color: CARD.title.color,
          }}
        >
          {lines.map((line, index) => (
            <div key={index} style={{ display: "flex" }}>
              {line}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      width: OG_IMAGE_SIZE.width,
      height: OG_IMAGE_SIZE.height,
      fonts: [
        {
          name: "Cal Sans",
          data: calSans,
          style: "normal",
          weight: 600,
        },
      ],
    },
  );
});
