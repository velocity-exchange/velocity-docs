"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

export type DiagramProps = {
  title?: string;
  /** States what is shown, data source, and assumptions. Omit only when the surrounding prose already carries them. */
  caption?: string;
  /** Draw-in animation on first view. Default true. */
  animate?: boolean;
  /** captionId is undefined when there is no caption, so aria-describedby is omitted. */
  children: (ids: { captionId?: string }) => ReactNode;
};

/**
 * "static" is what the server sends, so the figure is drawn with no JavaScript.
 * A figure with no pixel on screen arms itself (hidden) and waits; any figure
 * that is even partly visible goes straight to "drawn" and plays the draw-in.
 */
type Phase = "static" | "armed" | "drawn";

export function Diagram({ title, caption, animate = true, children }: DiagramProps) {
  const ref = useRef<HTMLElement>(null);
  const captionId = useId();
  const [phase, setPhase] = useState<Phase>("static");

  useEffect(() => {
    if (!animate) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[entries.length - 1].intersectionRatio === 0) {
          setPhase("armed");
          return;
        }
        // Both attributes land in one commit, so there is never a hidden frame.
        setPhase("drawn");
        io.disconnect();
      },
      { threshold: [0, 0.35] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [animate]);

  return (
    <figure
      ref={ref}
      className="dg"
      data-animate={phase === "static" ? undefined : ""}
      data-inview={phase === "drawn" ? "" : undefined}
    >
      {title ? <p className="dg-title">{title}</p> : null}
      <div className="dg-scroll">{children({ captionId: caption ? captionId : undefined })}</div>
      {caption ? (
        <figcaption id={captionId} className="dg-caption">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
