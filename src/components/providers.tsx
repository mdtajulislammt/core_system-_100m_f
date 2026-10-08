"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 2, // 2 minutes fresh cache
            gcTime: 1000 * 60 * 10, // 10 minutes memory garbage collection
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              // Don't retry cancelled abort requests or client 4xx errors
              if (error instanceof Error && error.name === "AbortError") {
                return false;
              }
              return failureCount < 2;
            },
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
