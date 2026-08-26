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

export function Diagram({ title, caption, animate = true, children }: DiagramProps) {
  const ref = useRef<HTMLElement>(null);
  const captionId = useId();
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!animate) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
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
      data-animate={animate ? "" : undefined}
      data-inview={inView ? "" : undefined}
    >
      {title ? <p className="dg-title">{title}</p> : null}
      <div className="dg-scroll">{children({ captionId })}</div>
      <figcaption id={captionId} className="dg-caption">
        {caption}
      </figcaption>
    </figure>
  );
}
