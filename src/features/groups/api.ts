/* The groups endpoints (PRD §8) and group matches (§11). */

import type { GroupDto } from "@/lib/api/content";
import { httpClient } from "@/lib/http";

export interface GroupMatchDto {
  groupId: string;
  name: string | null;
  description: string | null;
  isMembersOnly: boolean;
  memberCount: number;
  reason: string | null;
}

export type Placement = "Onboarding" | "GroupsPage" | "HomeFeed";

export const groupsApi = {
  list: (search?: string) =>
    httpClient.get<{ groups: GroupDto[] }>("/groups", { query: { search } }),
  get: (id: string) => httpClient.get<GroupDto>(`/groups/${id}`),
  join: (id: string) => httpClient.post(`/groups/${id}/membership`),
  leave: (id: string) => httpClient.delete(`/groups/${id}/membership`),
  mute: (id: string, muted: boolean) => httpClient.put(`/groups/${id}/membership/muted`, muted),
  matches: (placement: Placement) =>
    httpClient.get<{ groups: GroupMatchDto[] }>("/matches/groups", { query: { placement } }),
  notForMe: (id: string) => httpClient.post(`/matches/Group/${id}/not-for-me`),
};
