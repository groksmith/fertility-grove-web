/* Derived views the screens read: pure functions of the cached state. */

import { journey } from "@/features/auth";
import type { State } from "@/lib/mock-server";
import { matchGroups } from "@/lib/rules/matching";
import type { Group } from "@/types/domain";

/** The matched groups GET /matches/groups returned (load them with `useGroupMatches`); the
    offline demo matches its sample groups itself, as the prototype did. */
export const groupMatches = (s: State, limit = 5): { group: Group; why: string }[] =>
  s.demo
    ? matchGroups(journey(s), s.groups, s.notForMe, limit)
    : (s.matchedGroups ?? [])
        .filter((m) => !s.notForMe.includes(m.groupId))
        .flatMap((m) => {
          const group = s.groups.find((g) => g.id === m.groupId);
          return group ? [{ group, why: m.why }] : [];
        })
        .slice(0, limit);
