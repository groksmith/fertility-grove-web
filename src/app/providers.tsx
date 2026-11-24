"use client";

/* App-wide client providers: the TanStack Query cache every feature hook reads. */

import { QueryClientProvider } from "@tanstack/react-query";
import { useSessionSync } from "@/features/auth";
import { queryClient } from "@/lib/api/query-client";

/** Loads the API session into the store on start (and drops it when it ends). */
function SessionSync() {
  useSessionSync();
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionSync />
      {children}
    </QueryClientProvider>
  );
}
