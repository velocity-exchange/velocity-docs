"use client";

import { useSearchContext } from "fumadocs-ui/provider";
import Link from "next/link";
import { BoltMark } from "../components/BoltMark";
import styles from "./not-found.module.css";

function SearchTrigger() {
  const { setOpenSearch } = useSearchContext();
  return (
    <button type="button" onClick={() => setOpenSearch(true)}>
      Search the docs
    </button>
  );
}

export default function NotFound() {
  return (
    <div className={styles.root}>
      <BoltMark className={styles.mark} />
      <p className={styles.code}>Error 404</p>
      <h1 className={styles.title}>We couldn&rsquo;t find that page</h1>
      <p className={styles.desc}>
        The page may have been moved, renamed, or never existed. Search the docs
        below, or head back to the overview to get your bearings.
      </p>

      <div className={styles.search}>
        <SearchTrigger />
      </div>

      <div className={styles.actions}>
        <Link href="/" className={styles.button}>
          <svg
            className={styles.arrow}
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M10 3.5 5.5 8l4.5 4.5"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to docs home
        </Link>
      </div>

      <nav className={styles.links} aria-label="Popular pages">
        <span>Popular:</span>
        <Link href="/protocol">Velocity Overview</Link>
        <span className={styles.dot} aria-hidden="true">
          ·
        </span>
        <Link href="/protocol/getting-started">Getting Started</Link>
        <span className={styles.dot} aria-hidden="true">
          ·
        </span>
        <Link href="/developers">Developers</Link>
      </nav>
    </div>
  );
}
