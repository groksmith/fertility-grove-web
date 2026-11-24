/* A TanStack query whose answer is merged into the store's cache, so the screens' selectors see
   it. The query's own data is the raw response, for the few screens that read it directly. */

import { type QueryKey, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { type State, set, useStore } from "@/lib/mock-server";

export function useCachedQuery<T>(options: {
  queryKey: QueryKey;
  queryFn: () => Promise<T>;
  /** Merge the response into the cache. */
  apply: (s: State, data: T) => State;
  enabled?: boolean;
  staleTime?: number;
  refetchInterval?: number;
}) {
  // Nothing member-only is asked before the session is ready.
  const ready = useStore((s) => s.session === "ready");
  return useQuery({
    queryKey: options.queryKey,
    queryFn: async () => {
      const data = await options.queryFn();
      set((s) => options.apply(s, data));
      return data;
    },
    enabled: ready && (options.enabled ?? true),
    staleTime: options.staleTime,
    refetchInterval: options.refetchInterval,
  });
}

/** A paged list (`page`, `pageSize`, `totalCount`, as every API list answers). */
export interface Paged {
  page: number;
  pageSize: number;
  totalCount: number;
}

/** The page size every list asks for: within each endpoint's maximum (conversations: 50). */
export const PAGE_SIZE = 20;

/** A paged list whose pages are merged into the cache one by one as they arrive. Screens put a
    `MoreOnScroll` marker after the list; the next page loads when it comes into view. */
export function useCachedPages<T extends Paged>(options: {
  queryKey: QueryKey;
  fetchPage: (page: number) => Promise<T>;
  /** Merge one page into the cache; page 1 may replace what the list is the whole truth for. */
  apply: (s: State, data: T, page: number) => State;
  enabled?: boolean;
  refetchInterval?: number;
  staleTime?: number;
}) {
  const ready = useStore((s) => s.session === "ready");
  return useInfiniteQuery({
    queryKey: options.queryKey,
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const data = await options.fetchPage(pageParam);
      set((s) => options.apply(s, data, pageParam));
      return data;
    },
    getNextPageParam: (last) =>
      last.page * last.pageSize < last.totalCount ? last.page + 1 : undefined,
    enabled: ready && (options.enabled ?? true),
    refetchInterval: options.refetchInterval,
    staleTime: options.staleTime,
  });
}
