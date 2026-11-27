/* Guest browsing (PRD §10): the public feed, groups open to visitors and a shared post. No sign-in;
   each answer is mapped straight to the `PublicPost` the guest pages render. */

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { type GroupDto, toGroup } from "@/lib/api/content";
import { minutesSince, postType, source } from "@/lib/api/enums";
import { badgesOf, memberFromRef } from "@/lib/api/members";
import { labelsOf } from "@/lib/api/options";
import { isApiId, withSampleGroups } from "@/lib/api/samples";
import { ApiRequestError } from "@/lib/http";
import { get } from "@/lib/mock-server";
import type { Group } from "@/types/domain";
import { postsApi, type VisitorPostDto } from "./api";
import { guestGroups, type PublicPost, publicFeed, publicGroup, publicPost } from "./selectors";

/** The prototype's community, for visitors while the API has no public groups or posts yet. */
const samples = () =>
  withSampleGroups({ ...get(), groups: [], posts: [], comments: [], members: [] }, false);

function stubGroup(id: string, name: string | null): Group {
  return toGroup({
    id,
    name,
    description: "",
    type: "Topic",
    isMembersOnly: false,
    isArchived: false,
    visibleToGuests: true,
  });
}

export function toPublicPost(v: VisitorPostDto, listed: boolean, group?: Group): PublicPost {
  const author = memberFromRef({
    // Guests see the display identity only, never a profile link.
    handle: v.authorDisplayName?.startsWith("@") ? v.authorDisplayName.slice(1) : "",
    displayName: v.authorDisplayName,
    treeLevel: v.authorTreeLevel,
    pronouns: v.authorPronouns,
  });
  return {
    post: {
      id: v.id,
      groupId: v.groupId,
      authorId: author.id,
      type: postType(v.type),
      title: v.title ?? "",
      body: v.body ?? "",
      source: source(v.source),
      sourceLink: v.sourceLink ?? undefined,
      tags: labelsOf(v.topicTags),
      allowSharing: true,
      showToVisitors: listed,
      minutesAgo: minutesSince(v.createdAt),
      up: Math.max(0, v.score),
      down: Math.max(0, -v.score),
      myVote: 0,
      saved: false,
      edited: v.isEdited || undefined,
      status: "published",
      commentCount: v.replyCount,
    },
    group: group ?? stubGroup(v.groupId, v.groupName),
    author: { ...author, badges: badgesOf(v.authorBadge), unavailable: undefined },
    replies: v.replyCount,
    listed,
  };
}

const orNull = async <T>(run: () => Promise<T>) => {
  try {
    return await run();
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) return null;
    throw error;
  }
};

/** GET /public/groups: the groups guests can filter by. */
export function usePublicGroups() {
  return useQuery({
    queryKey: ["public", "groups"],
    queryFn: async () => {
      const groups = (await postsApi.publicGroups()).groups.map((g: GroupDto) => toGroup(g));
      return groups.length ? groups : guestGroups(samples());
    },
  });
}

/** GET /public/feed, newest first, optionally one group's, page by page. */
export function usePublicFeed(groupId?: string) {
  return useInfiniteQuery({
    queryKey: ["public", "feed", groupId ?? ""],
    initialPageParam: 1,
    // A sample group's feed never goes to the API.
    queryFn: ({ pageParam }) =>
      groupId && !isApiId(groupId)
        ? Promise.resolve({ posts: [], totalCount: 0, page: 1, pageSize: 20 })
        : postsApi.publicFeed(groupId, pageParam),
    getNextPageParam: (last) =>
      last.page * last.pageSize < last.totalCount ? last.page + 1 : undefined,
    select: (data) => {
      const items = data.pages.flatMap((p) => p.posts.map((v) => toPublicPost(v, true)));
      // Nothing public yet: the prototype's posts stand in until there is.
      const empty = !items.length && data.pages[0]?.totalCount === 0;
      return { ...data, items: empty ? publicFeed(samples(), groupId) : items };
    },
  });
}

/** GET /public/groups/{id} and its posts; null when the group isn't open to visitors. */
export function usePublicGroup(id: string) {
  return useQuery({
    queryKey: ["public", "group", id],
    queryFn: async () => {
      if (!isApiId(id)) return publicGroup(samples(), id);
      const g = await orNull(() => postsApi.publicGroup(id));
      if (!g) return null;
      const group = toGroup({ ...g, visibleToGuests: true });
      const feed = await postsApi.publicFeed(id);
      return { group, posts: feed.posts.map((v) => toPublicPost(v, true, group)) };
    },
    enabled: !!id,
  });
}

/** GET /public/posts/{id}; null for "This post isn't available." */
export function usePublicPost(id: string) {
  return useQuery({
    queryKey: ["public", "post", id],
    queryFn: async () => {
      if (!isApiId(id)) return publicPost(samples(), id);
      const p = await orNull(() => postsApi.publicPost(id));
      return p?.visitor ? toPublicPost(p.visitor, p.shownToVisitors) : null;
    },
    enabled: !!id,
  });
}
