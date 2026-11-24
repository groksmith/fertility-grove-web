/* Learn helpers the screens share: covers, section anchors, the disclaimer and a group's
   "From the library" links. Articles themselves come from the API into the store's cache. */

import { coverFor } from "@/lib/api/articles";
import type { Article, Group } from "@/types/domain";

/** The six sample launch articles, for the landing page's illustrations only. */
export { ARTICLES } from "@/lib/mock-server/seed/articles";

export const DISCLAIMER =
  "This article shares general, reviewed information. It isn't medical advice and can't replace a conversation with your own doctor, who knows your history.";

/** The cover image for an article (by its id). */
export const articleCover = (slug: string) => coverFor(slug);

/** A section's anchor, as the API writes them: lower case letters and digits, other runs "-". */
export const sectionId = (heading: string) =>
  heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export interface ReadingLink {
  href: string;
  label: string;
  article: Article;
}

/** A group's "From the library" links (GET /groups/{id} `readingLinks`, up to 3, in order). */
export function readingFor(group: Group | undefined, articles: Article[]): ReadingLink[] {
  return (group?.readingLinks ?? []).slice(0, 3).map((r) => {
    const cached = articles.find((a) => a.slug === r.articleId);
    const article: Article = cached ?? {
      slug: r.articleId,
      title: r.articleTitle ?? "",
      summary: "",
      diagnosis: "",
      diagnoses: [],
      stages: [],
      topics: [],
      reviewedBy: "",
      lastReviewed: "",
      nextReview: "",
      readMinutes: 5,
      sections: [],
      sources: [],
      relatedGroups: [],
      hue: "green",
    };
    return {
      href: `/learn/${r.articleId}${r.sectionSlug ? `#${r.sectionSlug}` : ""}`,
      label: r.label ?? r.articleTitle ?? "",
      article,
    };
  });
}
