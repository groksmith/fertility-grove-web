/* The posts endpoints: write, edit, delete, vote and save posts and comments (PRD §9). Votes and
   saves show at once and are put back if the API refuses; writes wait for the answer, which says
   whether the crisis card shows or the item was held for review. */

import { apiPostType, apiSource } from "@/lib/api/enums";
import { codesOf } from "@/lib/api/options";
import { refresh } from "@/lib/api/query-client";
import { attempt, crisisOf, fail, failure, ok, type Result } from "@/lib/api/result";
import { get, set } from "@/lib/mock-server";
import { notice } from "@/lib/notice";
import { MSG } from "@/lib/rules/validation";
import type { Post, Source, Vote } from "@/types/domain";
import { postsApi } from "./api";
import { postKeys } from "./hooks";
import type { PostInput } from "./schema";

/** Unconfirmed members can't post, comment or vote (PRD §4); the API agrees, this just asks first. */
function gate(groupId?: string, action = "post"): Result | null {
  const s = get();
  if (s.me.status === "unconfirmed") return fail(MSG.unconfirmed(s.me.email), "unconfirmed");
  if (groupId && !s.joined.includes(groupId)) return fail(`Join this group to ${action}.`, "join");
  return null;
}

const refreshPosts = () => refresh(postKeys.all, ["groups"], ["dashboard"]);

/** The next vote after a tap: the same direction again removes it (PRD §9). */
const nextVote = (current: Vote, tapped: Vote): Vote => (current === tapped ? 0 : tapped);

function shiftVotes<T extends { myVote: Vote; up: number; down: number }>(x: T, next: Vote): T {
  return {
    ...x,
    myVote: next,
    up: x.up - (x.myVote === 1 ? 1 : 0) + (next === 1 ? 1 : 0),
    down: x.down - (x.myVote === -1 ? 1 : 0) + (next === -1 ? 1 : 0),
  };
}

export const postService = {
  /** POST /groups/{id}/posts. */
  async create(p: PostInput): Promise<Result> {
    const blocked = gate(p.groupId, "post in it");
    if (blocked) return blocked;
    try {
      const sent = await postsApi.create(p.groupId, {
        groupId: p.groupId,
        type: apiPostType(p.type),
        title: p.title.trim(),
        body: p.body.trim(),
        source: apiSource(p.source),
        sourceLink: p.sourceLink.trim() || null,
        topicTags: codesOf(p.tags),
        acceptGuidelines: true,
        allowSharingOutside: p.allowSharing || p.showToVisitors,
        showToVisitors: p.showToVisitors,
      });
      set((s) => ({ ...s, me: { ...s.me, guidelinesAccepted: true } }));
      void refreshPosts();
      return ok({ id: sent.data.id, crisis: crisisOf(sent, sent.data) });
    } catch (error) {
      return failure(error);
    }
  },

  /** PUT /posts/{id}. The API takes the whole post, so the cached copy fills what isn't changing. */
  async edit(
    id: string,
    patch: Partial<Pick<Post, "title" | "body" | "allowSharing" | "showToVisitors">>,
  ): Promise<Result> {
    const post = get().posts.find((p) => p.id === id);
    if (!post) return fail("This post isn't available.");
    const next = { ...post, ...patch };
    if (next.showToVisitors) next.allowSharing = true;
    try {
      const sent = await postsApi.edit(id, {
        postId: id,
        type: apiPostType(next.type),
        title: next.title.trim(),
        body: next.body.trim(),
        source: apiSource(next.source),
        sourceLink: next.sourceLink ?? null,
        topicTags: codesOf(next.tags),
        allowSharingOutside: next.allowSharing,
        showToVisitors: next.showToVisitors,
      });
      set((s) => ({
        ...s,
        posts: s.posts.map((p) =>
          p.id === id
            ? {
                ...next,
                edited: patch.title !== undefined || patch.body !== undefined ? true : p.edited,
                status: sent.data.heldForReview ? "held" : p.status,
              }
            : p,
        ),
      }));
      void refreshPosts();
      return ok({ crisis: crisisOf(sent, sent.data) });
    } catch (error) {
      const f = failure(error);
      if (!f.ok) notice(f.error);
      return f;
    }
  },

  /** Appeal a moderator's removal (PRD §19). TODO(api): no moderation endpoints yet (M4). */
  appeal(id: string) {
    set((s) => ({ ...s, posts: s.posts.map((p) => (p.id === id ? { ...p, appealed: true } : p)) }));
  },

  /** DELETE /posts/{id}. */
  async remove(id: string): Promise<Result> {
    const r = await attempt(() => postsApi.remove(id));
    if (!r.ok) {
      notice(r.error);
      return r;
    }
    set((s) => ({
      ...s,
      posts: s.posts.map((p) => (p.id === id ? { ...p, status: "deleted" } : p)),
      stories: s.stories.filter((x) => x.id !== id),
    }));
    void refreshPosts();
    return r;
  },

  /** PUT /posts/{id}/vote: the same direction again removes the vote. */
  async vote(id: string, v: Vote): Promise<Result> {
    const s = get();
    const post = s.posts.find((p) => p.id === id);
    if (!post) return fail("This post isn't available.");
    if (post.authorId === "me") return fail("You can't vote on your own post.");
    const blocked = gate(post.groupId || undefined, "vote");
    if (blocked) return blocked;
    if (v === 0) return ok();
    const next = nextVote(post.myVote, v);
    set((x) => ({ ...x, posts: x.posts.map((p) => (p.id === id ? shiftVotes(p, next) : p)) }));
    try {
      await postsApi.vote(id, v === 1 ? "Up" : "Down");
      return ok();
    } catch (error) {
      set((x) => ({ ...x, posts: x.posts.map((p) => (p.id === id ? post : p)) }));
      return failure(error);
    }
  },

  /** PUT /posts/{id}/saved. Posts and success stories alike. */
  async toggleSave(id: string): Promise<Result> {
    const s = get();
    const saved = !(
      s.posts.find((p) => p.id === id)?.saved ?? s.stories.find((x) => x.id === id)?.saved
    );
    const apply = (value: boolean) =>
      set((x) => ({
        ...x,
        posts: x.posts.map((p) => (p.id === id ? { ...p, saved: value } : p)),
        stories: x.stories.map((p) => (p.id === id ? { ...p, saved: value } : p)),
      }));
    apply(saved);
    try {
      await postsApi.save(id, saved);
      void refresh(postKeys.saved, ["dashboard"]);
      return ok();
    } catch (error) {
      apply(!saved);
      const f = failure(error);
      if (!f.ok) notice(f.error);
      return f;
    }
  },

  /** POST /posts/{id}/comments. Replies go one level deep. */
  async comment(
    postId: string,
    body: string,
    opts: { parentId?: string; mention?: string; source?: Source } = {},
  ): Promise<Result> {
    const post = get().posts.find((p) => p.id === postId);
    const blocked = gate(post?.groupId || undefined, "comment");
    if (blocked) return blocked;
    if (!body.trim()) return fail(MSG.commentEmpty);
    try {
      const sent = await postsApi.comment(postId, {
        postId,
        body: body.trim(),
        source: apiSource(opts.source),
        replyToCommentId: opts.parentId ?? null,
      });
      void refreshPosts();
      return ok({ id: sent.data.id, crisis: crisisOf(sent, sent.data) });
    } catch (error) {
      return failure(error);
    }
  },

  /** PUT /comments/{id}/vote. */
  async voteComment(id: string, v: Vote): Promise<Result> {
    const c = get().comments.find((x) => x.id === id);
    if (!c) return fail("This comment isn't available.");
    if (c.authorId === "me") return fail("You can't vote on your own comment.");
    const post = get().posts.find((p) => p.id === c.postId);
    const blocked = gate(post?.groupId || undefined, "vote");
    if (blocked) return blocked;
    if (v === 0) return ok();
    const next = nextVote(c.myVote, v);
    set((x) => ({
      ...x,
      comments: x.comments.map((k) => (k.id === id ? shiftVotes(k, next) : k)),
    }));
    try {
      await postsApi.voteComment(id, v === 1 ? "Up" : "Down");
      return ok();
    } catch (error) {
      set((x) => ({ ...x, comments: x.comments.map((k) => (k.id === id ? c : k)) }));
      return failure(error);
    }
  },

  /** PUT /comments/{id}. */
  async editComment(id: string, body: string): Promise<Result> {
    const c = get().comments.find((x) => x.id === id);
    try {
      const sent = await postsApi.editComment(id, {
        commentId: id,
        body: body.trim(),
        source: apiSource(c?.source),
      });
      set((s) => ({
        ...s,
        comments: s.comments.map((k) =>
          k.id === id
            ? { ...k, body, edited: true, status: sent.data.heldForReview ? "held" : k.status }
            : k,
        ),
      }));
      return ok({ crisis: crisisOf(sent, sent.data) });
    } catch (error) {
      const f = failure(error);
      if (!f.ok) notice(f.error);
      return f;
    }
  },

  /** TODO(api): no moderation endpoints yet (M4). */
  appealComment(id: string) {
    set((s) => ({
      ...s,
      comments: s.comments.map((c) => (c.id === id ? { ...c, appealed: true } : c)),
    }));
  },

  /** DELETE /comments/{id}. */
  async removeComment(id: string): Promise<Result> {
    const r = await attempt(() => postsApi.removeComment(id));
    if (!r.ok) {
      notice(r.error);
      return r;
    }
    set((s) => ({
      ...s,
      comments: s.comments.map((c) => (c.id === id ? { ...c, status: "deleted" } : c)),
    }));
    void refreshPosts();
    return r;
  },
};
