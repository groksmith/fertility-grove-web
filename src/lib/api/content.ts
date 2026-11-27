/* Posts, success stories, comments and groups as the API sends them, mapped into the domain shapes
   the screens and selectors use, plus the cache merges every feature that lists them shares. */

import type { State } from "@/lib/mock-server";
import type { Comment, Group, Post, Story } from "@/types/domain";
import { merge, replaceWhere, upsert } from "./cache";
import { contentStatus, minutesSince, postType, source, storyType, vote } from "./enums";
import { decodeAvatar, type MemberRef, mergeMembers } from "./members";
import { labelsOf } from "./options";

/* ------------------------------------------------------------------ DTOs */

export interface PostSummaryDto {
  id: string;
  groupId: string | null;
  groupName: string | null;
  isSuccessStory: boolean;
  storyType: string | null;
  storyDiagnoses: string[];
  whatHelped: string[];
  type: string;
  title: string | null;
  body: string | null;
  source: string;
  sourceLink: string | null;
  topicTags: string[];
  isSaved: boolean;
  allowSharingOutside: boolean;
  showToVisitors: boolean;
  status: string;
  authorDisplayName: string | null;
  authorHandle: string | null;
  authorTreeLevel: string;
  isMine: boolean;
  score: number;
  commentCount: number;
  myVote: string | null;
  allowsDownvotes: boolean;
  isCollapsed: boolean;
  isEdited: boolean;
  createdAt: string;
}

export interface CommentDto {
  id: string;
  parentCommentId: string | null;
  mentionedDisplayName: string | null;
  body: string | null;
  source: string;
  status: string;
  authorDisplayName: string | null;
  authorHandle: string | null;
  authorTreeLevel: string;
  isMine: boolean;
  score: number;
  myVote: string | null;
  isCollapsed: boolean;
  isEdited: boolean;
  createdAt: string;
  replies: CommentDto[];
}

export interface PostListDto {
  posts: PostSummaryDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface GroupDto {
  id: string;
  name: string | null;
  description: string | null;
  type: string;
  isMembersOnly: boolean;
  isArchived: boolean;
  memberCount?: number | null;
  isJoined?: boolean;
  isMuted?: boolean;
  visibleToGuests?: boolean;
  canReadPosts?: boolean;
  membersOnlyNotice?: string | null;
  rules?: string | null;
  postsThisWeek?: number | null;
  posterAvatars?: { avatarCode: string | null }[];
  readingLinks?: {
    articleId: string;
    articleTitle: string | null;
    sectionSlug: string | null;
    label: string | null;
  }[];
  communities?: string[];
}

/* --------------------------------------------------------------- Mapping */

const authorOf = (x: {
  authorHandle: string | null;
  authorDisplayName: string | null;
  authorTreeLevel: string;
  isMine: boolean;
}): MemberRef => ({
  handle: x.authorHandle,
  displayName: x.authorDisplayName,
  treeLevel: x.authorTreeLevel,
  isMe: x.isMine,
});

const authorId = (x: { authorHandle: string | null; isMine: boolean; id: string }) =>
  x.isMine ? "me" : x.authorHandle || `gone:${x.id}`;

/** A score as the up/down pair the vote controls read (their difference is what shows). */
const votes = (score: number) => ({ up: Math.max(0, score), down: Math.max(0, -score) });

export function toPost(p: PostSummaryDto): Post {
  return {
    id: p.id,
    groupId: p.groupId ?? "",
    authorId: authorId(p),
    type: postType(p.type),
    title: p.title ?? "",
    body: p.body ?? "",
    source: source(p.source),
    sourceLink: p.sourceLink ?? undefined,
    tags: labelsOf(p.topicTags),
    allowSharing: p.allowSharingOutside,
    showToVisitors: p.showToVisitors,
    minutesAgo: minutesSince(p.createdAt),
    ...votes(p.score),
    myVote: vote(p.myVote),
    saved: p.isSaved,
    edited: p.isEdited || undefined,
    status: contentStatus(p.status),
    commentCount: p.commentCount,
  };
}

export function toStory(p: PostSummaryDto): Story {
  return {
    id: p.id,
    authorId: authorId(p),
    type: storyType(p.storyType),
    title: p.title ?? "",
    body: p.body ?? "",
    diagnoses: labelsOf(p.storyDiagnoses),
    whatHelped: labelsOf(p.whatHelped),
    source: source(p.source) ?? "Personal experience",
    minutesAgo: minutesSince(p.createdAt),
    up: p.score,
    myVote: vote(p.myVote),
    comments: p.commentCount,
    saved: p.isSaved,
  };
}

/** A thread as the flat list the selectors read: replies point at their top comment. */
export function toComments(postId: string, list: CommentDto[]): Comment[] {
  const out: Comment[] = [];
  const walk = (c: CommentDto, top?: string) => {
    out.push({
      id: c.id,
      postId,
      authorId: authorId(c),
      parentId: top ?? c.parentCommentId ?? undefined,
      mention: c.mentionedDisplayName ?? undefined,
      body: c.body ?? "",
      source: source(c.source),
      minutesAgo: minutesSince(c.createdAt),
      ...votes(c.score),
      myVote: vote(c.myVote),
      edited: c.isEdited || undefined,
      status: contentStatus(c.status),
    });
    for (const r of c.replies ?? []) walk(r, top ?? c.id);
  };
  for (const c of list) walk(c);
  return out;
}

export function toGroup(g: GroupDto, had?: Group): Group {
  return {
    ...(had ?? {
      whoFor: "",
      tags: [],
      community: "both" as const,
    }),
    id: g.id,
    name: g.name ?? had?.name ?? "",
    description: g.description ?? had?.description ?? "",
    type: (g.type as Group["type"]) || had?.type || "Topic",
    readAccess: g.isMembersOnly ? "members-only" : "any",
    rules: g.rules ?? had?.rules,
    status: g.isArchived ? "archived" : "active",
    visibleToGuests: g.visibleToGuests ?? had?.visibleToGuests ?? false,
    members: g.memberCount ?? had?.members ?? 0,
    postsThisWeek: g.postsThisWeek ?? had?.postsThisWeek,
    posterAvatars:
      g.posterAvatars?.map((a) => {
        const { hue, preset } = decodeAvatar(a.avatarCode);
        return { hue: hue ?? "green", preset };
      }) ?? had?.posterAvatars,
    readingLinks: g.readingLinks ?? had?.readingLinks,
    canReadPosts: g.canReadPosts ?? had?.canReadPosts,
    membersOnlyNotice: g.membersOnlyNotice ?? had?.membersOnlyNotice,
  };
}

/* ----------------------------------------------------------------- Cache */

/** Merge posts and stories (and their authors and group names) into the cache. */
export function withPosts(s: State, list: PostSummaryDto[]): State {
  const posts = list.filter((p) => !p.isSuccessStory).map(toPost);
  const stories = list.filter((p) => p.isSuccessStory).map(toStory);
  const stubs = list
    .filter((p) => p.groupId && !s.groups.some((g) => g.id === p.groupId))
    .map((p) => ({ id: p.groupId ?? "", name: p.groupName ?? "" }));
  return {
    ...s,
    posts: upsert(s.posts, posts),
    stories: upsert(s.stories, stories),
    members: mergeMembers(s.members, list.map(authorOf)),
    groups: merge(
      s.groups,
      stubs.map((g) =>
        toGroup({
          id: g.id,
          name: g.name,
          description: "",
          type: "Topic",
          isMembersOnly: false,
          isArchived: false,
        }),
      ),
    ),
  };
}

/** A post's whole thread replaces what the cache held for it. */
export function withThread(s: State, postId: string, list: CommentDto[]): State {
  const comments = toComments(postId, list);
  const flat: CommentDto[] = [];
  const walk = (c: CommentDto) => {
    flat.push(c);
    for (const r of c.replies ?? []) walk(r);
  };
  for (const c of list) walk(c);
  return {
    ...s,
    comments: replaceWhere(s.comments, (c) => c.postId === postId, comments),
    members: mergeMembers(s.members, flat.map(authorOf)),
  };
}

export function withGroups(s: State, list: GroupDto[]): State {
  const byId = new Map(s.groups.map((g) => [g.id, g]));
  const groups = upsert(
    s.groups,
    list.map((g) => toGroup(g, byId.get(g.id))),
  );
  const joinedNow = list.filter((g) => g.isJoined !== undefined);
  const joined = new Set(s.joined);
  const muted = new Set(s.muted);
  for (const g of joinedNow) {
    if (g.isJoined) joined.add(g.id);
    else joined.delete(g.id);
    if (g.isMuted) muted.add(g.id);
    else muted.delete(g.id);
  }
  return { ...s, groups, joined: [...joined], muted: [...muted] };
}
