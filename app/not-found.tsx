import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "nextra/components";
import styles from "./not-found.module.css";

export const metadata: Metadata = {
  title: "Page not found",
};

// Velocity mark (rounded square + bolt) lifted from components/Logo.tsx so the
// dead-end still feels like home rather than a bare framework 404.
function BoltMark() {
  return (
    <svg
      className={styles.mark}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M0 10.3226C0 4.62158 4.62158 0 10.3226 0H53.6774C59.3784 0 64 4.62158 64 10.3226V53.6774C64 59.3784 59.3784 64 53.6774 64H10.3226C4.62158 64 0 59.3784 0 53.6774V10.3226Z"
        fill="#08AA18"
      />
      <path
        d="M24.588 13.1442C24.4557 13.4931 24.7134 13.8663 25.0865 13.8664H32.3874C32.7331 13.8664 32.9874 14.1904 32.9056 14.5262L28.275 33.5116C28.1414 34.0598 28.8395 34.4129 29.202 33.9803L45.8975 14.0575C45.9989 13.9366 46.1485 13.8664 46.3063 13.8664H57.0145C57.4705 13.8664 57.7161 14.4022 57.4187 14.748L15.0618 64H11.087L20.1097 26.2576C20.1898 25.9224 19.9357 25.5999 19.5911 25.5998H6.99077C6.54111 25.5997 6.29353 25.0776 6.57797 24.7293L26.7735 0H29.5729L24.588 13.1442Z"
        fill="white"
      />
    </svg>
  );
}

export default function NotFound() {
  return (
    <div className={styles.root}>
      <BoltMark />
      <p className={styles.code}>Error 404</p>
      <h1 className={styles.title}>We couldn&rsquo;t find that page</h1>
      <p className={styles.desc}>
        The page may have been moved, renamed, or never existed. Search the docs
        below, or head back to the overview to get your bearings.
      </p>

      <div className={styles.search}>
        <Search placeholder="Search the docs…" />
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
