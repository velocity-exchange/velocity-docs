"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

export type DiagramProps = {
  title?: string;
  /** Required. States what is shown, data source, and assumptions. */
  caption: string;
  /** Draw-in animation on first view. Default true. */
  animate?: boolean;
  children: (ids: { captionId: string }) => ReactNode;
};

/**
 * "static" is what the server sends, so the figure is drawn with no JavaScript.
 * A figure below the fold arms itself (hidden) and draws in when it is reached.
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
    let armed = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) {
          if (!armed) {
            armed = true;
            setPhase("armed");
          }
          return;
        }
        // Already on screen when this ran: leave it drawn rather than blink it out.
        if (armed) setPhase("drawn");
        io.disconnect();
      },
      { threshold: 0.35 },
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
      <div className="dg-scroll">{children({ captionId })}</div>
      <figcaption id={captionId} className="dg-caption">
        {caption}
      </figcaption>
    </figure>
  );
}
