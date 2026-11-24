/* Derived views the screens read: pure functions of the cached state. */

import type { State } from "@/lib/mock-server";
import type { Member } from "@/types/domain";

/** The mentors GET /matches/mentors returned (load them with `useMentorMatches`). */
export const mentorMatches = (s: State, limit = 3): { member: Member; why: string }[] =>
  (s.matchedMentors ?? [])
    .filter((p) => !s.blocked.includes(p.id) && !s.notForMe.includes(p.id))
    .flatMap((p) => {
      const member = s.members.find((m) => m.id === p.id);
      return member ? [{ member, why: p.why }] : [];
    })
    .slice(0, limit);
