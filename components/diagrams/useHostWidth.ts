"use client";

import { useLayoutEffect, useRef, useState, type RefObject } from "react";

/**
 * Width the host div actually has, never below minWidth. Server and first client
 * render use the minimum; the observer widens it before paint.
 */
export function useHostWidth(minWidth: number): [RefObject<HTMLDivElement | null>, number] {
  const hostRef = useRef<HTMLDivElement>(null);
  const [hostWidth, setHostWidth] = useState(0);

  useLayoutEffect(() => {
    const el = hostRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => setHostWidth(Math.floor(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return [hostRef, Math.max(minWidth, hostWidth)];
}
