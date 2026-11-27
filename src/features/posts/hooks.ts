/* Queries that fill the cache the post selectors read. Screens call the one for what they show;
   the selectors (`feed`, `commentsFor`, `savedItems`…) stay as they were. */

import { upsert } from "@/lib/api/cache";
import { withPosts, withThread } from "@/lib/api/content";
import { apiPostType, contentStatus, minutesSince } from "@/lib/api/enums";
import { useCachedPages, useCachedQuery } from "@/lib/api/query";
import { isApiId } from "@/lib/api/samples";
import { ApiRequestError } from "@/lib/http";
import { set } from "@/lib/mock-server";
import type { Comment, Post } from "@/types/domain";
import { postsApi } from "./api";

type Sort = "newest" | "top" | "discussed";
const SORT: Record<Sort, string> = {
  newest: "Newest",
  top: "TopThisWeek",
  discussed: "MostDiscussed",
};

export const postKeys = {
  all: ["posts"] as const,
  feed: (sort: Sort, groups: string[], types: string[]) =>
    ["posts", "feed", sort, groups, types] as const,
  following: ["posts", "following"] as const,
  group: (id: string, sort: Sort) => ["posts", "group", id, sort] as const,
  post: (id: string, sort: string) => ["posts", "detail", id, sort] as const,
  mine: ["posts", "mine"] as const,
  saved: ["posts", "saved"] as const,
  matched: ["posts", "matched"] as const,
};

/** GET /feed (For you), filtered by group and post type on the server, page by page, and GET
    /matches/posts (the matched-group extras). */
export function useFeed(
  sort: Sort = "newest",
  filters: { groups?: string[]; types?: string[] } = {},
) {
  const groups = filters.groups ?? [];
  const types = filters.types ?? [];
  useCachedQuery({
    queryKey: postKeys.matched,
    queryFn: postsApi.matched,
    apply: (s, d) => ({
      ...withPosts(
        s,
        d.posts.map((m) => m.post),
      ),
      matchedPosts: d.posts.map((m) => ({ postId: m.post.id, reason: m.reason ?? "" })),
    }),
    staleTime: 5 * 60_000,
  });
  return useCachedPages({
    queryKey: postKeys.feed(sort, groups, types),
    fetchPage: (page) =>
      postsApi.feed(page, {
        sort: SORT[sort],
        groupIds: groups,
        types: types.map(apiPostType),
      }),
    apply: (s, d) => withPosts(s, d.posts),
  });
}

/** GET /feed/following. */
export function useFollowingFeed(enabled = true) {
  return useCachedPages({
    queryKey: postKeys.following,
    fetchPage: postsApi.followingFeed,
    apply: (s, d) => withPosts(s, d.posts),
    enabled,
  });
}

/** GET /groups/{id}/posts. */
export function useGroupPosts(groupId: string, sort: Sort = "newest", enabled = true) {
  return useCachedPages({
    queryKey: postKeys.group(groupId, sort),
    fetchPage: (page) => postsApi.groupPosts(groupId, SORT[sort], page),
    apply: (s, d) => withPosts(s, d.posts),
    enabled: enabled && !!groupId && isApiId(groupId),
  });
}

/** GET /posts/{id} with its thread. A post that isn't available leaves the cache. */
export function usePost(id: string, sort: "top" | "newest" = "top") {
  return useCachedQuery({
    queryKey: postKeys.post(id, sort),
    queryFn: async () => {
      try {
        return await postsApi.post(id, sort === "top" ? "Top" : "Newest");
      } catch (error) {
        if (error instanceof ApiRequestError && error.status === 404) {
          set((s) => ({
            ...s,
            posts: s.posts.map((p) => (p.id === id ? { ...p, status: "deleted" } : p)),
          }));
          return null;
        }
        throw error;
      }
    },
    apply: (s, d) => (d ? withThread(withPosts(s, [d.post]), d.post.id, d.comments) : s),
    // A sample post's id never goes to the API.
    enabled: !!id && isApiId(id),
  });
}

/** The Dashboard's Posts and Replies tabs: GET /profile/me/posts, /stories and /replies, each
    page by page. Returns the three queries so the tabs can load more as they scroll. */
export function useMyContent() {
  const posts = useCachedPages({
    queryKey: [...postKeys.mine, "posts"],
    fetchPage: postsApi.myPosts,
    apply: (s, d) => withPosts(s, d.posts),
  });
  const stories = useCachedPages({
    queryKey: [...postKeys.mine, "stories"],
    fetchPage: postsApi.myStories,
    apply: (s, d) => withPosts(s, d.posts),
  });
  const replies = useCachedPages({
    queryKey: [...postKeys.mine, "replies"],
    fetchPage: postsApi.myReplies,
    apply: (s, d) => {
      const mine: Comment[] = d.replies.map((r) => ({
        ...(s.comments.find((x) => x.id === r.commentId) ?? {}),
        id: r.commentId,
        postId: r.postId,
        authorId: "me",
        body: r.body ?? "",
        minutesAgo: minutesSince(r.createdAt),
        up: Math.max(0, r.score),
        down: Math.max(0, -r.score),
        myVote: 0,
        edited: r.isEdited || undefined,
        status: contentStatus(r.status),
      }));
      // A reply's post may not be cached: a stub carries its title and group for the row.
      const stubs: Post[] = d.replies
        .filter((r) => !s.posts.some((p) => p.id === r.postId))
        .map((r) => ({
          id: r.postId,
          groupId: r.groupId ?? "",
          authorId: "",
          type: "Just sharing",
          title: r.postTitle ?? "",
          body: "",
          tags: [],
          allowSharing: false,
          showToVisitors: false,
          minutesAgo: 0,
          up: 0,
          down: 0,
          myVote: 0,
          saved: false,
          status: r.postTitle === null ? "deleted" : "published",
        }));
      return { ...s, posts: upsert(s.posts, stubs), comments: upsert(s.comments, mine) };
    },
  });
  return { posts, stories, replies };
}

/** GET /profile/me/saved: saved posts and stories, page by page (articles come with Learn). */
export function useSaved() {
  return useCachedPages({
    queryKey: postKeys.saved,
    fetchPage: postsApi.saved,
    apply: (s, d) => withPosts(s, d.posts),
  });
}
