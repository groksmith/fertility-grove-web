/* Derived views the screens read: pure functions of the cached state. */

import type { State } from "@/lib/mock-server";
import type { Member } from "@/types/domain";

/** The people GET /matches/peers returned (load them with `usePeerMatches`). */
export const peopleMatches = (s: State, limit = 5): { member: Member; why: string }[] =>
  (s.matchedPeers ?? [])
    .filter((p) => !s.blocked.includes(p.id) && !s.notForMe.includes(p.id))
    .filter((p) => !s.following.includes(p.id))
    .flatMap((p) => {
      const member = s.members.find((m) => m.id === p.id);
      return member ? [{ member, why: p.why }] : [];
    })
    .slice(0, limit);
