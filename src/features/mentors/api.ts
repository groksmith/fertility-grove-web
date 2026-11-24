/* Mentoring (PRD §12): my mentor setup, mentorships both ways, and mentor matches. */

import { httpClient } from "@/lib/http";

export interface MentorshipDto {
  id: string;
  iAmMentor: boolean;
  otherMemberHandle: string | null;
  otherMemberDisplayName: string | null;
  otherMemberAvatarCode: string | null;
  otherMemberTreeLevel: string;
  otherMemberIsAway: boolean;
  status: "Requested" | "Declined" | "Expired" | "Active" | "Ended";
  message: string | null;
  helpWith: string[];
  responseNote: string | null;
  statusMessage: string | null;
  offerOtherMentors: boolean;
  conversationId: string | null;
  endedBy: "Me" | "Them" | "Nobody";
  thankYouNote: string | null;
  canLeaveFeedback: boolean;
  createdAt: string;
  answeredAt: string | null;
  endedAt: string | null;
}

export interface MentorMatchDto {
  memberId: string;
  handle: string | null;
  displayName: string | null;
  avatarCode: string | null;
  treeLevel: string;
  badge: string | null;
  bio: string | null;
  reason: string | null;
}

export const mentorsApi = {
  mentorships: () => httpClient.get<{ mentorships: MentorshipDto[] }>("/mentorships"),
  matches: () =>
    httpClient.get<{ wantsMentor: boolean; mentors: MentorMatchDto[] }>("/matches/mentors"),
  request: (handle: string, message: string, helpWith: string[]) =>
    httpClient.send<{ id: string; showCrisisResources: boolean }>(
      "POST",
      `/members/${encodeURIComponent(handle)}/mentor-requests`,
      { message, helpWith },
    ),
  answer: (id: string, accept: boolean, note: string) =>
    httpClient.send<{ conversationId: string | null }>("POST", `/mentorships/${id}/answer`, {
      mentorshipId: id,
      accept,
      note: note || null,
    }),
  end: (id: string) => httpClient.post(`/mentorships/${id}/end`),
  feedback: (id: string, helpful: "Yes" | "Somewhat" | "No", thankYouNote: string) =>
    httpClient.put(`/mentorships/${id}/feedback`, {
      mentorshipId: id,
      helpful,
      thankYouNote: thankYouNote || null,
    }),
  setup: (body: unknown) => httpClient.send("PUT", "/profile/me/mentoring", body),
  turnOff: () => httpClient.delete("/profile/me/mentoring"),
  notForMe: (memberId: string) => httpClient.post(`/matches/Mentor/${memberId}/not-for-me`),
  pause: (paused: boolean) => httpClient.put("/profile/me/mentoring/paused", paused),
};
