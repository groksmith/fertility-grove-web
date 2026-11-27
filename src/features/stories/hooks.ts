/* The success stories list, filtered by diagnosis and what helped on the server and loaded page
   by page, into the cache the Stories page reads. */

import { type PostListDto, withPosts } from "@/lib/api/content";
import { codesOf } from "@/lib/api/options";
import { PAGE_SIZE, useCachedPages } from "@/lib/api/query";
import { withSampleStories } from "@/lib/api/samples";
import { httpClient } from "@/lib/http";

/** GET /success-stories?diagnoses&whatHelped (labels in, codes sent). */
export function useStories(filters: { diagnoses?: string[]; whatHelped?: string[] } = {}) {
  const diagnoses = codesOf(filters.diagnoses ?? []);
  const whatHelped = codesOf(filters.whatHelped ?? []);
  return useCachedPages({
    queryKey: ["stories", diagnoses, whatHelped],
    fetchPage: (page) =>
      httpClient.get<PostListDto>("/success-stories", {
        query: { diagnoses, whatHelped, page, pageSize: PAGE_SIZE },
      }),
    apply: (s, d, page) => {
      const next = withPosts(s, d.posts);
      // No stories shared yet: the prototype's sample stories stand in until there are.
      const whole = !diagnoses.length && !whatHelped.length && page === 1;
      return whole ? withSampleStories(next, d.totalCount > 0) : next;
    },
  });
}
