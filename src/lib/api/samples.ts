/* Prototype samples while the backend has no content yet. When an unfiltered list answers empty,
   the screens show the prototype's sample items (marked `sample: true`) so the approved layout stays
   visible; the first real item from the API replaces them. Samples are read-only: nothing about
   them is ever sent to the API. TODO(api): drop once the backend has launch content. */

import type { State } from "@/lib/mock-server";
import { GROUPS } from "@/lib/mock-server/seed/groups";
import { MEMBERS } from "@/lib/mock-server/seed/members";
import { COMMENTS, POSTS, STORIES } from "@/lib/mock-server/seed/posts";
import { notice } from "@/lib/notice";
import type { Post } from "@/types/domain";
import { fail, type Result } from "./result";

/** API ids are UUIDs; the samples use the prototype's slugs ("endometriosis", "g-ivf"). */
export const isApiId = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

const NOTE = {
  article: "This is a sample article. It goes live when the library is published.",
  group: "This is a sample group. It opens when groups are set up.",
  post: "This is a sample post. You can try this on real posts once the community opens.",
  story: "This is a sample story. You can try this on real stories once they're shared.",
  member: "This is a sample member. You can connect with real members once the community opens.",
} as const;

export type SampleKind = keyof typeof NOTE;

/** The answer for an action on a sample: say so, and change nothing. */
export function sampleOnly(kind: SampleKind): Result {
  notice(NOTE[kind]);
  return fail(NOTE[kind]);
}

/** Put samples in when the API list is empty; take them out as soon as it has items. */
export function withSamples<T extends { sample?: true }>(
  current: T[],
  apiHasItems: boolean,
  samples: readonly T[],
  key: (x: T) => string,
): T[] {
  const real = current.filter((x) => !x.sample);
  if (apiHasItems || real.length) return real;
  const have = new Set(real.map(key));
  return [
    ...real,
    ...samples.filter((x) => !have.has(key(x))).map((x) => ({ ...x, sample: true as const })),
  ];
}

/* ------------------------------------------------------ The sample community */

const mark = <T extends object>(x: T) => ({ ...x, sample: true as const });
const notMine = (p: { authorId: string }) => p.authorId !== "me";

/** The prototype's groups, with their posts, comments and authors, while GET /groups is empty.
    Taken out again as soon as it lists a group. */
export function withSampleGroups(s: State, apiHasGroups: boolean): State {
  const real = s.groups.filter((g) => !g.sample);
  if (apiHasGroups || real.length) {
    if (!s.groups.some((g) => g.sample)) return s;
    return {
      ...s,
      groups: real,
      posts: s.posts.filter((p) => !p.sample || !p.groupId || isApiId(p.groupId)),
      comments: s.comments.filter(
        (c) => isApiId(c.postId) || s.stories.some((x) => x.id === c.postId),
      ),
    };
  }
  if (s.groups.some((g) => g.sample)) return s;
  const posts: Post[] = POSTS.filter((p) => notMine(p) && p.status === "published").map(mark);
  const ids = new Set(posts.map((p) => p.id));
  return withSampleMembers({
    ...s,
    groups: [...real, ...GROUPS.map(mark)],
    posts: [...s.posts.filter((p) => !ids.has(p.id)), ...posts],
    comments: [
      ...s.comments.filter((c) => !ids.has(c.postId)),
      ...COMMENTS.filter((c) => ids.has(c.postId) && notMine(c)),
    ],
  });
}

/** The prototype's success stories while GET /success-stories is empty. */
export function withSampleStories(s: State, apiHasStories: boolean): State {
  const real = s.stories.filter((x) => !x.sample);
  if (apiHasStories || real.length) {
    return s.stories.some((x) => x.sample) ? { ...s, stories: real } : s;
  }
  if (s.stories.some((x) => x.sample)) return s;
  return withSampleMembers({ ...s, stories: [...real, ...STORIES.filter(notMine).map(mark)] });
}

/** The sample authors, for the sample posts and stories to name (the team account excepted). */
function withSampleMembers(s: State): State {
  const have = new Set(s.members.map((m) => m.id));
  return {
    ...s,
    members: [
      ...s.members,
      ...MEMBERS.filter((m) => !have.has(m.id) && !m.badges.includes("team")).map(mark),
    ],
  };
}
