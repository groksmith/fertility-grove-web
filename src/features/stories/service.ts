/* Success stories (PRD §10): list, publish, upvote and save. A story is a post without a group, so
   votes and saves use the post endpoints. */

import { apiSource, apiStoryType } from "@/lib/api/enums";
import { codesOf } from "@/lib/api/options";
import { refresh } from "@/lib/api/query-client";
import { crisisOf, fail, failure, ok, type Result } from "@/lib/api/result";
import { isApiId, sampleOnly } from "@/lib/api/samples";
import { httpClient } from "@/lib/http";
import { demoResult, get, isDemo, set } from "@/lib/mock-server";
import { notice } from "@/lib/notice";
import { MSG } from "@/lib/rules/validation";
import type { Source, StoryType } from "@/types/domain";
import { demo } from "./demo";

interface WriteDto {
  id: string;
  showCrisisResources: boolean;
  heldForReview: boolean;
}

export const storyService = {
  /** POST /success-stories. */
  async create(st: {
    type: StoryType | "";
    title: string;
    body: string;
    diagnoses: string[];
    whatHelped: string[];
    source: Source | "";
  }): Promise<Result> {
    if (isDemo()) return demoResult(demo.create(st));
    const me = get().me;
    if (me.status === "unconfirmed") return fail(MSG.unconfirmed(me.email), "unconfirmed");
    if (!st.type || !st.title.trim() || !st.body.trim() || !st.source)
      return fail(MSG.storyMissing);
    try {
      const sent = await httpClient.send<WriteDto>("POST", "/success-stories", {
        storyType: apiStoryType(st.type),
        title: st.title.trim(),
        story: st.body.trim(),
        source: apiSource(st.source),
        sourceLink: null,
        diagnoses: codesOf(st.diagnoses),
        whatHelped: codesOf(st.whatHelped),
        acceptGuidelines: true,
        allowSharingOutside: false,
      });
      void refresh(["stories"], ["posts"], ["dashboard"]);
      return ok({ id: sent.data.id, crisis: crisisOf(sent, sent.data) });
    } catch (error) {
      return failure(error);
    }
  },

  /** PUT /success-stories/{id}: the author edits the whole story (checked for crisis words again). */
  async edit(
    id: string,
    st: {
      type: StoryType | "";
      title: string;
      body: string;
      diagnoses: string[];
      whatHelped: string[];
      source: Source | "";
    },
  ): Promise<Result> {
    if (!st.type || !st.title.trim() || !st.body.trim() || !st.source)
      return fail(MSG.storyMissing);
    if (isDemo()) {
      set((s) => ({
        ...s,
        stories: s.stories.map((x) =>
          x.id === id
            ? {
                ...x,
                type: st.type as StoryType,
                title: st.title.trim(),
                body: st.body.trim(),
                diagnoses: st.diagnoses,
                whatHelped: st.whatHelped,
                source: st.source as Source,
                edited: true,
              }
            : x,
        ),
      }));
      return ok();
    }
    try {
      const sent = await httpClient.send<WriteDto>("PUT", `/success-stories/${id}`, {
        postId: id,
        storyType: apiStoryType(st.type),
        title: st.title.trim(),
        story: st.body.trim(),
        source: apiSource(st.source),
        sourceLink: null,
        diagnoses: codesOf(st.diagnoses),
        whatHelped: codesOf(st.whatHelped),
        allowSharingOutside: false,
      });
      set((s) => ({
        ...s,
        stories: s.stories.map((x) =>
          x.id === id
            ? {
                ...x,
                type: st.type as StoryType,
                title: st.title.trim(),
                body: st.body.trim(),
                diagnoses: st.diagnoses,
                whatHelped: st.whatHelped,
                source: st.source as Source,
              }
            : x,
        ),
      }));
      void refresh(["stories"], ["posts"], ["dashboard"]);
      return ok({ id, crisis: crisisOf(sent, sent.data) });
    } catch (error) {
      return failure(error);
    }
  },

  /** DELETE /posts/{id}: a story is a post without a group. */
  async remove(id: string): Promise<Result> {
    if (isDemo()) {
      set((s) => ({ ...s, stories: s.stories.filter((x) => x.id !== id) }));
      return ok();
    }
    if (!isApiId(id)) return sampleOnly("story");
    try {
      await httpClient.delete(`/posts/${id}`);
      set((s) => ({ ...s, stories: s.stories.filter((x) => x.id !== id) }));
      void refresh(["stories"], ["posts"], ["dashboard"]);
      return ok();
    } catch (error) {
      const f = failure(error);
      if (!f.ok) notice(f.error);
      return f;
    }
  },

  /** PUT /posts/{id}/vote "Up"; again removes it. Stories take no downvotes. */
  async upvote(id: string): Promise<Result> {
    if (isDemo()) return demoResult(demo.upvote(id));
    if (!isApiId(id)) return sampleOnly("story");
    const s = get();
    if (s.me.status === "unconfirmed") return fail(MSG.unconfirmed(s.me.email), "unconfirmed");
    const story = s.stories.find((x) => x.id === id);
    if (!story || story.authorId === "me") return ok();
    const flip = () =>
      set((x) => ({
        ...x,
        stories: x.stories.map((k) =>
          k.id === id
            ? { ...k, myVote: k.myVote === 1 ? 0 : 1, up: k.up + (k.myVote === 1 ? -1 : 1) }
            : k,
        ),
      }));
    flip();
    try {
      await httpClient.put(`/posts/${id}/vote`, "Up");
      return ok();
    } catch (error) {
      flip();
      return failure(error);
    }
  },

  /** PUT /posts/{id}/saved. */
  async toggleSave(id: string): Promise<Result> {
    if (isDemo()) return demoResult(demo.toggleSave(id));
    if (!isApiId(id)) return sampleOnly("story");
    const story = get().stories.find((x) => x.id === id);
    if (!story) return ok();
    const apply = (saved: boolean) =>
      set((s) => ({ ...s, stories: s.stories.map((x) => (x.id === id ? { ...x, saved } : x)) }));
    apply(!story.saved);
    try {
      await httpClient.put(`/posts/${id}/saved`, !story.saved);
      void refresh(["posts", "saved"], ["dashboard"]);
      return ok();
    } catch (error) {
      apply(story.saved);
      const f = failure(error);
      if (!f.ok) notice(f.error);
      return f;
    }
  },
};
