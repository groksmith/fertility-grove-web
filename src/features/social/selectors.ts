/* Derived views the screens read: pure functions of the cached state. */

import { journey } from "@/features/auth";
import type { State } from "@/lib/mock-server";
import { matchPeople } from "@/lib/rules/matching";
import type { Member } from "@/types/domain";

/** The people GET /matches/peers returned (load them with `usePeerMatches`); the offline demo
    matches its sample members itself, as the prototype did. */
export const peopleMatches = (s: State, limit = 5): { member: Member; why: string }[] =>
  s.demo
    ? matchPeople(journey(s), s.members, {
        exclude: [...s.blocked, ...s.notForMe, ...s.following],
        limit,
      })
    : (s.matchedPeers ?? [])
        .filter((p) => !s.blocked.includes(p.id) && !s.notForMe.includes(p.id))
        .filter((p) => !s.following.includes(p.id))
        .flatMap((p) => {
          const member = s.members.find((m) => m.id === p.id);
          return member ? [{ member, why: p.why }] : [];
        })
        .slice(0, limit);
