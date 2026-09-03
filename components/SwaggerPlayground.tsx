"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";

// swagger-ui-react is roughly 860kB of client JS and is used on exactly one
// page. Loading it dynamically with ssr:false keeps it out of the route chunk
// that all 122 pages share, so the other 121 never pay for it.
// swagger-ui-react ships no types, hence the cast.
const SwaggerUI = dynamic(
  () => import("swagger-ui-react") as Promise<{
    default: React.ComponentType<{ url: string }>;
  }>,
  {
    ssr: false,
    loading: () => <p>Loading the API playground...</p>,
  },
);

export function SwaggerPlayground({ url }: { url: string }) {
  return <SwaggerUI url={url} />;
}
