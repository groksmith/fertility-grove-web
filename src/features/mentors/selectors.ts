/* Derived views the screens read: pure functions of the cached state. */

import { journey } from "@/features/auth";
import type { State } from "@/lib/mock-server";
import { matchPeople } from "@/lib/rules/matching";
import type { Member } from "@/types/domain";

/** The mentors GET /matches/mentors returned (load them with `useMentorMatches`); the offline
    demo matches its sample mentors itself, as the prototype did. */
export const mentorMatches = (s: State, limit = 3): { member: Member; why: string }[] =>
  s.demo
    ? matchPeople(journey(s), s.members, {
        exclude: [...s.blocked, ...s.notForMe],
        mentorsOnly: true,
        limit,
      })
    : (s.matchedMentors ?? [])
        .filter((p) => !s.blocked.includes(p.id) && !s.notForMe.includes(p.id))
        .flatMap((p) => {
          const member = s.members.find((m) => m.id === p.id);
          return member ? [{ member, why: p.why }] : [];
        })
        .slice(0, limit);
