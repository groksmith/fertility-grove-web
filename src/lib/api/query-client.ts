/* The one TanStack Query client: the provider hands it to React, and services refresh what a write
   changed (`refresh(["posts"])`) without needing a hook. */

import { QueryClient, type QueryKey } from "@tanstack/react-query";
import { ApiRequestError } from "@/lib/http";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // A refused read (4xx) won't change on retry; a network blip or 5xx might.
      retry: (count, error) =>
        count < 2 && !(error instanceof ApiRequestError && error.status < 500),
    },
    mutations: { retry: false },
  },
});

/** Re-fetch every active query under these keys (and mark the rest stale). */
export function refresh(...keys: QueryKey[]) {
  return Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
}
