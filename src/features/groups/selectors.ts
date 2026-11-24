/* Derived views the screens read: pure functions of the cached state. */

import type { State } from "@/lib/mock-server";
import type { Group } from "@/types/domain";

/** The matched groups GET /matches/groups returned (load them with `useGroupMatches`). */
export const groupMatches = (s: State, limit = 5): { group: Group; why: string }[] =>
  (s.matchedGroups ?? [])
    .filter((m) => !s.notForMe.includes(m.groupId))
    .flatMap((m) => {
      const group = s.groups.find((g) => g.id === m.groupId);
      return group ? [{ group, why: m.why }] : [];
    })
    .slice(0, limit);
