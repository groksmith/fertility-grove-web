/* The bell: GET /notifications (the list) and /notifications/unread-count (polled badge). */

import { upsert } from "@/lib/api/cache";
import { minutesSince, treeLevel } from "@/lib/api/enums";
import { PAGE_SIZE, type Paged, useCachedPages, useCachedQuery } from "@/lib/api/query";
import { httpClient } from "@/lib/http";
import type { Notification, NotificationKind } from "@/types/domain";

export interface NotificationDto {
  id: string;
  kind: string;
  actorDisplayName: string | null;
  actorHandle: string | null;
  level: string | null;
  postId: string | null;
  postTitle: string | null;
  commentId: string | null;
  conversationId: string | null;
  isRead: boolean;
  createdAt: string;
}

export const notificationKeys = {
  all: ["notifications"] as const,
  list: ["notifications", "list"] as const,
  count: ["notifications", "count"] as const,
};

/** What each kind says and where a tap goes (api-handoff, NotificationKind). */
export function toNotification(n: NotificationDto): Notification {
  const actor = n.actorDisplayName ?? "Someone";
  const title = n.postTitle ?? "your post";
  const post = n.postId ? `/posts/${n.postId}${n.commentId ? `#c-${n.commentId}` : ""}` : "/feed";
  const conv = n.conversationId ? `/messages/${n.conversationId}` : "/messages";
  const profile = n.actorHandle ? `/u/${n.actorHandle}` : "/dashboard";
  const rows: Record<string, [NotificationKind, string, string]> = {
    Reply: ["reply", `${actor} replied in ${title}`, post],
    NewFollower: ["follow", `${actor} started following you`, profile],
    FollowedMemberPosted: ["follow", `${actor} posted ${title}`, post],
    TreeLevelReached: ["level", `Your tree grew to ${treeLevel(n.level)}`, "/dashboard#sunlight"],
    MentoringAvailable: ["mentor", "You can now become a mentor", "/mentors/setup"],
    NewMessage: ["message", `New message from ${actor}`, conv],
    MessageRequest: ["message-request", `${actor} sent you a message request`, conv],
    MentorRequestReceived: ["mentor", `${actor} asked you to be their mentor`, "/mentors"],
    MentorRequestAccepted: [
      "mentor",
      `${actor} accepted your mentor request`,
      n.conversationId ? conv : "/mentors",
    ],
    MentorRequestDeclined: ["mentor", "Your mentor request wasn't accepted", "/mentors"],
    MentorRequestExpired: ["mentor", "Your mentor request expired", "/mentors"],
    MentoringEnded: [
      "mentor",
      n.actorDisplayName
        ? `Your mentoring connection with ${actor} ended`
        : "A mentoring connection ended",
      "/mentors",
    ],
    FoundingMentorBadgeGiven: ["mentor", "You were given the Founding mentor badge", "/dashboard"],
    NewMatches: ["match", "New matches this week", "/feed#people"],
    PartnerLinked: ["partner", `You're now linked with ${actor}`, "/family"],
    PartnerUnlinked: ["partner", `${actor} unlinked your accounts`, "/settings#partner"],
    PartnerInviteExpired: ["partner", "Your partner invite expired", "/family"],
    PartnerInviteNotPossible: ["partner", "Your partner invite couldn't be accepted", "/family"],
    PartnerBlockedYou: [
      "partner",
      "Your partner blocked you. Your accounts are no longer linked.",
      "/settings#partner",
    ],
    PartnerLeft: ["partner", "Your partner has left Fertility Grove", "/settings#partner"],
  };
  const [kind, text, href] =
    rows[n.kind] ?? (["match", "Something new in the grove", "/feed"] as const);
  return {
    id: n.id,
    kind,
    text,
    href,
    minutesAgo: minutesSince(n.createdAt),
    read: n.isRead,
    actorId: n.actorHandle ?? undefined,
  };
}

/** GET /notifications, newest first, page by page. Loading it marks nothing read. */
export function useNotifications() {
  return useCachedPages({
    queryKey: notificationKeys.list,
    fetchPage: (page) =>
      httpClient.get<{ notifications: NotificationDto[]; unreadCount: number } & Paged>(
        "/notifications",
        { query: { page, pageSize: PAGE_SIZE } },
      ),
    apply: (s, d, page) => {
      const fresh = d.notifications.map(toNotification);
      return {
        ...s,
        // Page 1 starts the list again; later pages add older ones.
        notifications: page === 1 ? fresh : upsert(s.notifications, fresh),
        unreadNotificationCount: d.unreadCount,
      };
    },
  });
}

/** GET /notifications/unread-count, polled for the bell. */
export function useUnreadCount(refetchInterval = 60_000) {
  return useCachedQuery({
    queryKey: notificationKeys.count,
    queryFn: () => httpClient.get<{ unreadCount: number }>("/notifications/unread-count"),
    apply: (s, d) => ({ ...s, unreadNotificationCount: d.unreadCount }),
    refetchInterval,
  });
}
