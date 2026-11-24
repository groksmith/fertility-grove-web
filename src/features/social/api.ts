/* Follows, blocks, member search and profiles (PRD §6, §10), and people matches (§11). */

import { httpClient } from "@/lib/http";

export interface MemberProfileDto {
  handle: string | null;
  displayName: string | null;
  pronouns: string | null;
  avatarCode: string | null;
  aboutMe: string | null;
  myStory: string | null;
  journeyStages: string[];
  diagnoses: string[];
  paths: string[];
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  treeLevel: string;
  isMe: boolean;
  canMessage: boolean;
  mentor: {
    badge: string | null;
    bio: string | null;
    helpsWith: string[];
    isTakingRequests: boolean;
    canRequest: boolean;
  } | null;
  showsPartnerBadge: boolean;
}

export interface MemberItemDto {
  memberId: string;
  handle: string | null;
  displayName: string | null;
  avatarCode: string | null;
  treeLevel: string;
}

export interface PeerMatchDto extends MemberItemDto {
  isFollowing: boolean;
  reason: string | null;
}

const at = (handle: string) => `/members/${encodeURIComponent(handle)}`;

export const socialApi = {
  member: (handle: string) => httpClient.get<MemberProfileDto>(at(handle)),
  search: (q: string) => httpClient.get<{ members: MemberItemDto[] }>("/members", { query: { q } }),
  follow: (handle: string) => httpClient.post(`${at(handle)}/follow`),
  unfollow: (handle: string) => httpClient.delete(`${at(handle)}/follow`),
  removeFollower: (handle: string) =>
    httpClient.delete(`/profile/me/followers/${encodeURIComponent(handle)}`),
  block: (handle: string) => httpClient.post(`${at(handle)}/block`),
  unblock: (memberId: string) => httpClient.delete(`/profile/me/blocked/${memberId}`),
  peers: () => httpClient.get<{ peers: PeerMatchDto[] }>("/matches/peers"),
  notForMe: (kind: "Peer" | "Mentor", memberId: string) =>
    httpClient.post(`/matches/${kind}/${memberId}/not-for-me`),
};
