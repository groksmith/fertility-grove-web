/* Mentorships and mentor matches, into the cache the Mentors page, profiles and messages read. */

import { daysSince } from "@/lib/api/enums";
import { badgesOf, mergeMembers } from "@/lib/api/members";
import { labelsOf } from "@/lib/api/options";
import { useCachedQuery } from "@/lib/api/query";
import type { MentorRequest, MentorRequestStatus } from "@/types/domain";
import { type MentorshipDto, mentorsApi } from "./api";

export const mentorKeys = {
  mentorships: ["mentorships"] as const,
  matches: ["matches", "mentors"] as const,
};

const STATUS: Record<MentorshipDto["status"], MentorRequestStatus> = {
  Requested: "waiting",
  Active: "accepted",
  Declined: "declined",
  Expired: "expired",
  Ended: "ended",
};

export function toRequest(m: MentorshipDto): MentorRequest {
  const other = m.otherMemberHandle || `gone:${m.id}`;
  return {
    id: m.id,
    mentorId: m.iAmMentor ? "me" : other,
    menteeId: m.iAmMentor ? other : "me",
    message: m.message ?? "",
    helpWith: labelsOf(m.helpWith),
    status: STATUS[m.status],
    note: m.responseNote ?? m.statusMessage ?? undefined,
    daysAgo: daysSince(m.createdAt),
    feedbackGiven: !m.canLeaveFeedback,
  };
}

/** GET /mentorships: both ways, newest first. */
export function useMentorships() {
  return useCachedQuery({
    queryKey: mentorKeys.mentorships,
    queryFn: mentorsApi.mentorships,
    apply: (s, d) => ({
      ...s,
      mentorRequests: d.mentorships.map(toRequest),
      members: mergeMembers(
        s.members,
        d.mentorships.map((m) => ({
          handle: m.otherMemberHandle,
          displayName: m.otherMemberDisplayName,
          avatarCode: m.otherMemberAvatarCode,
          treeLevel: m.otherMemberTreeLevel,
        })),
      ),
    }),
  });
}

/** GET /matches/mentors. */
export function useMentorMatches(enabled = true) {
  return useCachedQuery({
    queryKey: mentorKeys.matches,
    queryFn: mentorsApi.matches,
    apply: (s, d) => {
      const members = mergeMembers(s.members, d.mentors);
      return {
        ...s,
        wantsMentorMatches: d.wantsMentor,
        members: members.map((m) => {
          const match = d.mentors.find((x) => (x.handle || `gone:${x.memberId}`) === m.id);
          if (!match) return m;
          return {
            ...m,
            badges: badgesOf(match.badge),
            // Matches only list mentors taking requests, with no count of places or topics;
            // what the mentor's profile told us (GET /members/{handle}) is kept.
            mentor: {
              capacity: 1,
              activeMentees: 0,
              waiting: 0,
              paused: false,
              placesUnknown: true,
              ...m.mentor,
              bio: match.bio ?? m.mentor?.bio ?? "",
              helpsWith: m.mentor?.helpsWith ?? [],
            },
          };
        }),
        matchedMentors: d.mentors.map((x) => ({
          id: x.handle || `gone:${x.memberId}`,
          why: x.reason ?? "Similar journey",
        })),
      };
    },
    enabled,
    staleTime: 5 * 60_000,
  });
}
