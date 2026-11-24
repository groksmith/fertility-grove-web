/* Queries that fill the groups cache (and the joined / muted lists) the screens read. */

import { merge } from "@/lib/api/cache";
import { toGroup, withGroups } from "@/lib/api/content";
import { useCachedQuery } from "@/lib/api/query";
import { ApiRequestError } from "@/lib/http";
import { groupsApi, type Placement } from "./api";

export const groupKeys = {
  all: ["groups"] as const,
  list: ["groups", "list"] as const,
  detail: (id: string) => ["groups", "detail", id] as const,
  matches: (placement: Placement) => ["groups", "matches", placement] as const,
};

/** GET /groups: every group, with joined and muted. */
export function useGroups() {
  return useCachedQuery({
    queryKey: groupKeys.list,
    queryFn: () => groupsApi.list(),
    apply: (s, d) => withGroups(s, d.groups),
  });
}

/** GET /groups/{id}: header, rules, posters, reading links. Null when it isn't available. */
export function useGroup(id: string) {
  return useCachedQuery({
    queryKey: groupKeys.detail(id),
    queryFn: async () => {
      try {
        return await groupsApi.get(id);
      } catch (error) {
        if (error instanceof ApiRequestError && error.status === 404) return null;
        throw error;
      }
    },
    apply: (s, d) => (d ? withGroups(s, [d]) : s),
    enabled: !!id,
  });
}

/** GET /matches/groups for a placement (onboarding, the Groups page, the feed). */
export function useGroupMatches(placement: Placement, enabled = true) {
  return useCachedQuery({
    queryKey: groupKeys.matches(placement),
    queryFn: () => groupsApi.matches(placement),
    apply: (s, d) => ({
      ...s,
      groups: merge(
        s.groups,
        d.groups.map((m) => {
          const had = s.groups.find((g) => g.id === m.groupId);
          return toGroup(
            {
              id: m.groupId,
              name: m.name,
              description: m.description,
              type: had?.type ?? "Topic",
              isMembersOnly: m.isMembersOnly,
              isArchived: false,
              memberCount: m.memberCount,
            },
            had,
          );
        }),
      ),
      matchedGroups: d.groups.map((m) => ({
        groupId: m.groupId,
        why: m.reason ?? "Popular in the grove",
      })),
    }),
    staleTime: 5 * 60_000,
    enabled,
  });
}
