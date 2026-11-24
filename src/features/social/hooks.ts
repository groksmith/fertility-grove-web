/* Member profiles, search and peer matches, into the member cache the screens read. */

import { badgesOf, memberFromRef, mergeMembers } from "@/lib/api/members";
import { labelsOf } from "@/lib/api/options";
import { useCachedQuery } from "@/lib/api/query";
import { ApiRequestError } from "@/lib/http";
import type { State } from "@/lib/mock-server";
import type { Member } from "@/types/domain";
import { type MemberProfileDto, socialApi } from "./api";

export const socialKeys = {
  member: (handle: string) => ["members", handle] as const,
  search: (q: string) => ["members", "search", q] as const,
  peers: ["matches", "peers"] as const,
};

function withProfile(s: State, d: MemberProfileDto): State {
  const handle = d.handle ?? "";
  const base = memberFromRef({
    handle,
    displayName: d.displayName,
    avatarCode: d.avatarCode,
    treeLevel: d.treeLevel,
    pronouns: d.pronouns,
  });
  const had = s.members.find((m) => m.id === base.id);
  const stages = labelsOf(d.journeyStages);
  const diagnoses = labelsOf(d.diagnoses);
  const paths = labelsOf(d.paths);
  const member: Member = {
    ...(had ?? base),
    ...base,
    apiId: had?.apiId,
    aboutMe: d.aboutMe ?? undefined,
    myStory: d.myStory ?? undefined,
    stages,
    diagnoses,
    paths,
    shareJourney: stages.length + diagnoses.length + paths.length > 0,
    followers: d.followerCount,
    badges: [...badgesOf(d.mentor?.badge), ...(d.showsPartnerBadge ? (["partner"] as const) : [])],
    canMessage: d.canMessage,
    canRequestMentor: d.mentor?.canRequest,
    mentor: d.mentor
      ? {
          bio: d.mentor.bio ?? "",
          helpsWith: labelsOf(d.mentor.helpsWith),
          // The API only says whether they take requests; full or paused reads as not.
          capacity: 1,
          activeMentees: d.mentor.isTakingRequests ? 0 : 1,
          waiting: 0,
          paused: !d.mentor.isTakingRequests,
        }
      : undefined,
  };
  const others = s.members.filter((m) => m.id !== member.id);
  const following = new Set(s.following);
  if (d.isFollowing) following.add(member.id);
  else following.delete(member.id);
  return { ...s, members: [...others, member], following: [...following] };
}

/** GET /members/{handle}. A profile that isn't available marks the member unavailable. */
export function useMember(handle: string) {
  return useCachedQuery({
    queryKey: socialKeys.member(handle),
    queryFn: async () => {
      try {
        return await socialApi.member(handle);
      } catch (error) {
        if (error instanceof ApiRequestError && error.status === 404) return null;
        throw error;
      }
    },
    apply: (s, d) =>
      d
        ? withProfile(s, d)
        : {
            ...s,
            members: s.members.map((m) =>
              m.handle === handle ? { ...m, unavailable: "deleting" as const } : m,
            ),
          },
    enabled: !!handle,
  });
}

/** GET /members?q (3+ characters, handles starting with it). */
export function useMemberSearch(q: string) {
  const term = q.trim().replace(/^@/, "");
  return useCachedQuery({
    queryKey: socialKeys.search(term.toLowerCase()),
    queryFn: () => socialApi.search(term),
    apply: (s, d) => ({ ...s, members: mergeMembers(s.members, d.members) }),
    enabled: term.length >= 3,
  });
}

/** GET /matches/peers: people on your path. */
export function usePeerMatches(enabled = true) {
  return useCachedQuery({
    queryKey: socialKeys.peers,
    queryFn: socialApi.peers,
    apply: (s, d) => ({
      ...s,
      members: mergeMembers(s.members, d.peers),
      matchedPeers: d.peers
        .filter((p) => !p.isFollowing)
        .map((p) => ({ id: p.handle || `gone:${p.memberId}`, why: p.reason ?? "Similar journey" })),
    }),
    staleTime: 5 * 60_000,
    enabled,
  });
}
