"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  // Created once per browser session via useState's lazy initializer, so the
  // client (and its cache) survives re-renders without being module-level
  // shared state across concurrent requests on the server.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // The on-chain data route is revalidated hourly server-side and
            // rarely changes; there's no interval invalidation on the client.
            staleTime: Infinity,
            gcTime: Infinity,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
