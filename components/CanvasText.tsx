"use client";

import { drawText } from "canvas-txt";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

// The canvas element does not resize itself to fit the text it is given, and
// this component used to require a caller to guess a height by hand. Legal
// text fetched from an S3 URL changes length independently of the docs
// deploy, so that guess was either too short (clipped text) or, as shipped,
// generously wrong: an 11,500px canvas for a document that renders to a
// fraction of that, which is the large empty block at the end of the page.
//
// `canvas-txt`'s drawText returns the real height it needed for the given
// width, independent of whatever height you passed in (it only bails at
// height <= 0). So measure on a detached, invisible canvas first, size the
// real one to match, then paint. `height`/`mobileHeight` are now only the
// height used for that one detached measuring pass and for the very first
// paint before content arrives; they no longer have to be exact, or even
// close.
const CanvasText = ({
  textContent: _textContent,
  textContentUrl,
  width,
  mobileWidth,
  height,
  mobileHeight,
  fontSize,
}: {
  textContent: string;
  textContentUrl?: string;
  width: number;
  mobileWidth: number;
  height: number;
  mobileHeight: number;
  fontSize: number;
}) => {
  const [textContent, setTextContent] = useState(_textContent);
  const theme = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [measuredHeight, setMeasuredHeight] = useState(
    isMobile ? mobileHeight : height,
  );

  const handleResize = () => {
    if (window.innerWidth < 930 && !isMobile) {
      setIsMobile(true);
    } else if (window.innerWidth >= 930 && isMobile) {
      setIsMobile(false);
    }
  };

  const activeWidth = isMobile ? mobileWidth : width;

  // Measure on a canvas that is never attached to the page, so a mid-flight
  // remeasure (content still loading, a resize crossing the mobile
  // breakpoint) never flashes the visible canvas at the wrong size.
  useEffect(() => {
    if (!textContent) return;
    const probe = document.createElement("canvas");
    probe.width = activeWidth;
    // Only a >0 height is required; drawText's returned height reflects the
    // text's own line wrapping, not this input.
    probe.height = 1;
    const ctx = probe.getContext("2d");
    if (!ctx) return;
    const { height: realHeight } = drawText(ctx, textContent, {
      x: 0,
      y: 0,
      width: activeWidth,
      height: 1,
      fontSize: fontSize ?? 24,
      align: "left",
      vAlign: "top",
      lineHeight: fontSize + 2,
    });
    // A few px of headroom: descenders on the last line sit right at the
    // measured edge, and rounding a fractional line height down can clip them.
    setMeasuredHeight(Math.ceil(realHeight) + 4);
  }, [textContent, activeWidth, fontSize]);

  // Paints the real, visible canvas once it has been resized to the
  // measured height, so nothing here draws into a box the wrong size.
  useEffect(() => {
    if (!textContent) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Prevent right click because you can "save image as" on the convas
    canvas.oncontextmenu = (e) => {
      return false;
    };

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = theme.resolvedTheme === "dark" ? "#fff" : "#000";

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawText(ctx, textContent, {
      x: 0,
      y: 0,
      width: activeWidth,
      height: measuredHeight,
      fontSize: fontSize ?? 24,
      align: "left",
      vAlign: "top",
      lineHeight: fontSize + 2,
    });
  }, [canvasRef.current, textContent, activeWidth, measuredHeight, fontSize, theme]);

  useEffect(() => {
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [isMobile]);

  useEffect(() => {
    if (!textContentUrl) return;

    if (!textContent && textContentUrl) {
      setTextContent("Loading...");
    }

    const fetchContent = async () => {
      try {
        const response = await fetch(textContentUrl);
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        const text = await response.text();
        setTextContent(text);
      } catch (err) {
        console.error(`Error fetching content: ${err.message}`);
      }
    };

    fetchContent();
  }, [textContentUrl]);

  return <canvas ref={canvasRef} width={activeWidth} height={measuredHeight} />;
};

export default CanvasText;
