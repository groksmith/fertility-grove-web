/* Conversations and threads, into the cache the Messages screens and the shell's badge read. */

import { upsert } from "@/lib/api/cache";
import { minutesSince } from "@/lib/api/enums";
import { mergeMembers } from "@/lib/api/members";
import { useCachedPages } from "@/lib/api/query";
import type { State } from "@/lib/mock-server";
import type { Conversation, Message, Post } from "@/types/domain";
import { type ConversationDto, messagesApi, type ThreadDto } from "./api";

export const messageKeys = {
  all: ["conversations"] as const,
  list: (filter: string, q: string) => ["conversations", "list", filter, q] as const,
  thread: (id: string) => ["conversations", "thread", id] as const,
};

const oldest = (list: Message[]) => Math.max(...list.map((m) => m.minutesAgo), 0);

const otherOf = (c: { otherMemberHandle: string | null; id: string }) =>
  c.otherMemberHandle || `gone:${c.id}`;

const requestOf = (c: { isRequest: boolean; awaitingAcceptance: boolean }) =>
  c.isRequest ? ("incoming" as const) : c.awaitingAcceptance ? ("outgoing" as const) : undefined;

function fromList(c: ConversationDto, had?: Conversation): Conversation {
  // Until the thread is opened, the last message stands in for it (the list shows only that).
  const preview: Message = {
    id: `preview-${c.id}`,
    from: c.lastMessageIsMine ? "me" : "them",
    body: c.lastMessagePreview ?? "",
    minutesAgo: minutesSince(c.lastMessageAt),
  };
  const loaded = had?.messages.some((m) => !m.id.startsWith("preview-"));
  return {
    id: c.id,
    memberId: otherOf(c),
    kind: c.isMentoring ? "mentoring" : "dm",
    request: requestOf(c),
    muted: c.isMuted,
    unread: c.hasUnread,
    messages: loaded && had ? had.messages : [preview],
    crisisFlagged: had?.crisisFlagged,
  };
}

function withThread(s: State, t: ThreadDto, page: number): State {
  const fetched: Message[] = t.messages.map((m) => ({
    id: m.id,
    from: m.isMine ? "me" : "them",
    body: m.isDeleted ? "" : (m.body ?? ""),
    minutesAgo: minutesSince(m.createdAt),
    edited: !!m.editedAt || undefined,
    deleted: m.isDeleted || undefined,
    attachedPostId: m.post?.postId,
  }));
  // Pages arrive newest first; older pages add to what's loaded, page 1 refreshes the newest.
  const had = s.conversations.find((c) => c.id === t.id);
  const kept = (had?.messages ?? []).filter(
    (m) => !m.id.startsWith("preview-") && !fetched.some((f) => f.id === m.id),
  );
  const messages = [
    ...(page === 1 ? kept.filter((m) => m.minutesAgo > oldest(fetched)) : kept),
    ...fetched,
  ].sort((a, b) => b.minutesAgo - a.minutesAgo);
  // An attached post the cache doesn't hold: a stub with its title and group for the card.
  const stubs: Post[] = t.messages
    .flatMap((m) => (m.post ? [m.post] : []))
    .filter((p) => !s.posts.some((x) => x.id === p.postId))
    .map((p) => ({
      id: p.postId,
      groupId: "",
      authorId: "",
      type: "Just sharing",
      title: p.title ?? "",
      body: "",
      tags: [],
      allowSharing: false,
      showToVisitors: false,
      minutesAgo: 0,
      up: 0,
      down: 0,
      myVote: 0,
      saved: false,
      status: p.isAvailable ? "published" : "deleted",
    }));
  const conv: Conversation = {
    id: t.id,
    memberId: otherOf(t),
    kind: t.isMentoring ? "mentoring" : "dm",
    request: requestOf(t),
    muted: t.isMuted,
    unread: false,
    messages,
    crisisFlagged: had?.crisisFlagged,
  };
  return {
    ...s,
    conversations: upsert(s.conversations, [conv]),
    posts: upsert(s.posts, stubs),
    members: mergeMembers(s.members, [
      {
        handle: t.otherMemberHandle,
        displayName: t.otherMemberDisplayName,
        avatarCode: t.otherMemberAvatarCode,
        treeLevel: t.otherMemberTreeLevel,
      },
    ]),
  };
}

const FILTER: Record<string, string> = {
  all: "All",
  unread: "Unread",
  requests: "Requests",
  mentoring: "Mentoring",
};

/** GET /conversations, filtered and searched on the server, page by page. The shell polls the
    first page for the unread badge. Each page's conversations are merged into the cache. */
export function useConversations(
  opts: { filter?: string; q?: string; refetchInterval?: number } = {},
) {
  const filter = FILTER[opts.filter ?? "all"] ?? "All";
  const q = opts.q?.trim() ?? "";
  return useCachedPages({
    queryKey: messageKeys.list(filter, q),
    fetchPage: (page) => messagesApi.list(page, filter, q),
    apply: (s, d) => {
      const byId = new Map(s.conversations.map((c) => [c.id, c]));
      const fresh = d.conversations.map((c) => fromList(c, byId.get(c.id)));
      return {
        ...s,
        conversations: upsert(s.conversations, fresh),
        conversationRequests: d.requestCount,
        members: mergeMembers(
          s.members,
          d.conversations.map((c) => ({
            handle: c.otherMemberHandle,
            displayName: c.otherMemberDisplayName,
            avatarCode: c.otherMemberAvatarCode,
            treeLevel: c.otherMemberTreeLevel,
          })),
        ),
      };
    },
    refetchInterval: opts.refetchInterval,
  });
}

/** GET /conversations/{id}/messages, newest page first; older pages load as the thread scrolls up. */
export function useConversation(id: string | null) {
  return useCachedPages({
    queryKey: messageKeys.thread(id ?? ""),
    fetchPage: (page) => messagesApi.thread(id ?? "", page),
    apply: (s, d, page) => withThread(s, d, page),
    enabled: !!id && !id.startsWith("cv-support"),
    refetchInterval: 20_000,
  });
}
