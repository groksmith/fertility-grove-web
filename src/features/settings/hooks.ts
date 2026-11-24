/* The member's own Dashboard reads: tab counts (GET /profile/me/dashboard) and "How others see me"
   (GET /profile/me/preview), which applies the same visibility rules other members get. */

import { useQuery } from "@tanstack/react-query";
import { type MySunlight, sunlightHistory } from "@/features/auth";
import { badgesOf, memberFromRef } from "@/lib/api/members";
import { labelsOf } from "@/lib/api/options";
import { PAGE_SIZE, type Paged, useCachedPages } from "@/lib/api/query";
import { httpClient } from "@/lib/http";
import { useStore } from "@/lib/mock-server";
import type { Member } from "@/types/domain";

interface PreviewDto {
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
  treeLevel: string;
  mentor: { badge: string | null } | null;
  showsPartnerBadge: boolean;
}

export interface DashboardCounts {
  posts: number;
  replies: number;
  groups: number;
  saved: number;
}

export interface DashboardView {
  counts: DashboardCounts;
  recentActivity: {
    kind: "Post" | "Reply";
    postId: string;
    commentId: string | null;
    groupId: string | null;
    groupName: string | null;
    isSuccessStory: boolean;
    postTitle: string | null;
    score: number;
    replyCount: number;
    replyText: string | null;
    status: "Published" | "HiddenForReview" | "Removed";
    createdAt: string;
  }[];
  mentoring: {
    mentorshipId: string;
    iAmMentor: boolean;
    roleText: string | null;
    otherMemberHandle: string | null;
    otherMemberDisplayName: string | null;
    otherMemberAvatarCode: string | null;
    otherMemberTreeLevel: string;
    status: string;
    statusText: string | null;
  }[];
}

/** GET /profile/me/dashboard: tab counts, Recent activity (4) and the Mentoring card (up to 4),
    ordered and filtered by the server as PRD §6 sets out. */
export function useDashboard() {
  const ready = useStore((s) => s.session === "ready");
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => httpClient.get<DashboardView>("/profile/me/dashboard"),
    enabled: ready,
  });
}

/** The tab counts ("Posts N", "Replies N"…) from the dashboard read. */
export function useDashboardCounts() {
  const q = useDashboard();
  return { ...q, data: q.data?.counts };
}

/** GET /profile/me/preview: my profile exactly as another member sees it, as a `Member`. */
export function useProfilePreview(enabled: boolean, me: Member) {
  const ready = useStore((s) => s.session === "ready");
  return useQuery({
    queryKey: ["profile", "preview"],
    queryFn: async (): Promise<Member> => {
      const d = await httpClient.get<PreviewDto>("/profile/me/preview");
      const base = memberFromRef({
        handle: d.handle,
        displayName: d.displayName,
        avatarCode: d.avatarCode,
        treeLevel: d.treeLevel,
        pronouns: d.pronouns,
      });
      const stages = labelsOf(d.journeyStages);
      const diagnoses = labelsOf(d.diagnoses);
      const paths = labelsOf(d.paths);
      return {
        ...me,
        ...base,
        id: "me",
        sunlight: me.sunlight,
        aboutMe: d.aboutMe ?? undefined,
        myStory: d.myStory ?? undefined,
        stages,
        diagnoses,
        paths,
        shareJourney: stages.length + diagnoses.length + paths.length > 0,
        followers: d.followerCount,
        badges: [
          ...badgesOf(d.mentor?.badge),
          ...(d.showsPartnerBadge ? (["partner"] as const) : []),
        ],
      };
    },
    enabled: ready && enabled,
  });
}

/** GET /profile/me/sunlight, page by page: the Dashboard's Sunlight history (newest first). */
export function useSunlightHistory() {
  return useCachedPages({
    queryKey: ["profile", "sunlight"],
    fetchPage: (page) =>
      httpClient.get<MySunlight & Paged>("/profile/me/sunlight", {
        query: { page, pageSize: PAGE_SIZE },
      }),
    apply: (s, d, page) => {
      const events = sunlightHistory(d);
      return {
        ...s,
        me: {
          ...s.me,
          sunlight: d.sunlight,
          history: page === 1 ? events : [...s.me.history, ...events],
        },
      };
    },
  });
}
