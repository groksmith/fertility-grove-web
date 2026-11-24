/* Direct messages (PRD §14): conversations, threads, requests, mute, edit and delete. */

import { PAGE_SIZE, type Paged } from "@/lib/api/query";
import { httpClient } from "@/lib/http";

export interface ConversationDto {
  id: string;
  otherMemberHandle: string | null;
  otherMemberDisplayName: string | null;
  otherMemberAvatarCode: string | null;
  otherMemberTreeLevel: string;
  lastMessagePreview: string | null;
  lastMessageIsMine: boolean;
  lastMessageHasPost: boolean;
  lastMessageAt: string;
  hasUnread: boolean;
  isMuted: boolean;
  isMentoring: boolean;
  isRequest: boolean;
  awaitingAcceptance: boolean;
}

export interface MessageDto {
  id: string;
  isMine: boolean;
  body: string | null;
  isDeleted: boolean;
  post: {
    postId: string;
    isAvailable: boolean;
    title: string | null;
    groupName: string | null;
  } | null;
  createdAt: string;
  editedAt: string | null;
  canEdit: boolean;
}

export interface ThreadDto {
  id: string;
  otherMemberHandle: string | null;
  otherMemberDisplayName: string | null;
  otherMemberAvatarCode: string | null;
  otherMemberTreeLevel: string;
  isMuted: boolean;
  isMentoring: boolean;
  isRequest: boolean;
  awaitingAcceptance: boolean;
  canReply: boolean;
  messages: MessageDto[];
}

export interface MessageWriteDto {
  id: string;
  conversationId: string;
  awaitingAcceptance: boolean;
  showCrisisResources: boolean;
}

export const messagesApi = {
  /** `filter`: All | Unread | Requests | Mentoring; `q` searches names and message words. */
  list: (page: number, filter = "All", q?: string) =>
    httpClient.get<{ conversations: ConversationDto[]; requestCount: number } & Paged>(
      "/conversations",
      { query: { filter, q: q || undefined, page, pageSize: PAGE_SIZE } },
    ),
  /** Newest first; page 2 is older. 50 a page (the maximum is 100). */
  thread: (id: string, page: number) =>
    httpClient.get<ThreadDto & Paged>(`/conversations/${id}/messages`, {
      query: { page, pageSize: 50 },
    }),
  start: (handle: string, body: string, postId?: string) =>
    httpClient.send<MessageWriteDto>("POST", `/members/${encodeURIComponent(handle)}/messages`, {
      body: body || null,
      postId: postId ?? null,
    }),
  send: (id: string, body: string, postId?: string) =>
    httpClient.send<MessageWriteDto>("POST", `/conversations/${id}/messages`, {
      body: body || null,
      postId: postId ?? null,
    }),
  accept: (id: string) => httpClient.post(`/conversations/${id}/accept`),
  read: (id: string) => httpClient.post(`/conversations/${id}/read`),
  mute: (id: string, muted: boolean) => httpClient.put(`/conversations/${id}/muted`, muted),
  remove: (id: string) => httpClient.delete(`/conversations/${id}`),
  edit: (messageId: string, body: string) =>
    httpClient.send<MessageWriteDto>("PUT", `/messages/${messageId}`, { messageId, body }),
  removeMessage: (messageId: string) => httpClient.delete(`/messages/${messageId}`),
};
