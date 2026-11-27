/* Articles into the cache the Learn, Saved and group screens read. */

import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ArticleCardDto, toArticle } from "@/lib/api/articles";
import { codeOf } from "@/lib/api/options";
import { useCachedPages, useCachedQuery } from "@/lib/api/query";
import { isApiId, withSamples } from "@/lib/api/samples";
import { ApiRequestError } from "@/lib/http";
import type { State } from "@/lib/mock-server";
import { ARTICLES as SAMPLE_ARTICLES } from "@/lib/mock-server/seed/articles";
import type { Article } from "@/types/domain";
import { type ArticleFilters, learnApi } from "./api";

export const learnKeys = {
  all: ["learn"] as const,
  list: (f: ArticleFilters) =>
    ["learn", "list", f.search ?? "", f.diagnosis ?? "", f.topic ?? ""] as const,
  recommended: ["learn", "recommended"] as const,
  article: (id: string) => ["learn", "article", id] as const,
  saved: ["learn", "saved"] as const,
  suggestions: ["learn", "suggestions"] as const,
};

function withCards(s: State, cards: ArticleCardDto[]): State {
  const byId = new Map(s.articles.map((a) => [a.slug, a]));
  for (const c of cards) byId.set(c.id, toArticle(c, byId.get(c.id)));
  const saved = new Set(s.savedArticles);
  for (const c of cards) {
    if (c.isSaved) saved.add(c.id);
    else saved.delete(c.id);
  }
  return { ...s, articles: [...byId.values()], savedArticles: [...saved] };
}

/** GET /learn/articles: the library, or what matches a search, diagnosis or topic (labels in,
    codes sent), page by page. Each page's ids, in the API's order, are in the query's data. */
export function useArticles(filters: { search?: string; diagnosis?: string; topic?: string } = {}) {
  const f: ArticleFilters = {
    search: filters.search?.trim() || undefined,
    diagnosis: filters.diagnosis ? codeOf(filters.diagnosis) : undefined,
    topic: filters.topic ? codeOf(filters.topic) : undefined,
  };
  return useCachedPages({
    queryKey: learnKeys.list(f),
    fetchPage: (page) => learnApi.list(page, f),
    apply: (s, d, page) => {
      const next = withCards(s, d.articles);
      // The whole library answered empty: show the prototype's articles until it has some.
      const whole = !f.search && !f.diagnosis && !f.topic && page === 1;
      return whole
        ? {
            ...next,
            articles: withSamples(next.articles, d.totalCount > 0, SAMPLE_ARTICLES, (a) => a.slug),
          }
        : next;
    },
  });
}

/** A prototype sample article by its slug, for links to one (the Guide's citations, samples in
    the library) while the API has none. Undefined for an API id. */
export function sampleArticle(slug: string): Article | undefined {
  if (isApiId(slug)) return undefined;
  const a = SAMPLE_ARTICLES.find((x) => x.slug === slug);
  return a && { ...a, sample: true };
}

/** GET /learn/recommended: up to 6, each with its reason. */
export function useRecommendedArticles(enabled = true) {
  return useCachedQuery({
    queryKey: learnKeys.recommended,
    queryFn: learnApi.recommended,
    apply: (s, d) => ({
      ...withCards(s, d.articles),
      recommendedArticles: d.isPersonal
        ? d.articles.map((a) => ({ slug: a.id, why: a.reason ?? "A good place to start" }))
        : [],
    }),
    enabled,
  });
}

/** GET /learn/articles/{id}: the full article, with the member's save and "helpful" answer. */
export function useArticle(id: string) {
  return useCachedQuery({
    queryKey: learnKeys.article(id),
    queryFn: async () => {
      try {
        return await learnApi.article(id);
      } catch (error) {
        if (error instanceof ApiRequestError && error.status === 404) return null;
        throw error;
      }
    },
    apply: (s, d) => {
      if (!d) return { ...s, articles: s.articles.filter((a) => a.slug !== id) };
      const next = withCards(s, [d]);
      const had = next.articles.find((a) => a.slug === d.id);
      const helpful = { ...next.articleHelpful };
      if (d.myHelpful === null) delete helpful[d.id];
      else helpful[d.id] = d.myHelpful ? "yes" : "no";
      return {
        ...next,
        articles: next.articles.map((a) => (a.slug === d.id ? toArticle(d, had) : a)),
        articleHelpful: helpful,
      };
    },
    // A sample's slug never goes to the API.
    enabled: !!id && isApiId(id),
  });
}

/** GET /profile/me/saved/articles and the "Worth saving" suggestions. */
export function useSavedArticles() {
  useCachedQuery({
    queryKey: learnKeys.suggestions,
    queryFn: learnApi.suggestions,
    apply: (s, d) => ({
      ...withCards(s, d.articles),
      suggestedArticles: d.articles.map((a) => a.id),
    }),
  });
  return useCachedPages({
    queryKey: learnKeys.saved,
    fetchPage: learnApi.saved,
    apply: (s, d, page) => {
      const next = withCards(s, d.articles);
      const ids = d.articles.map((a) => a.id);
      return {
        ...next,
        // Newest saved first; page 1 starts the list again.
        savedArticles:
          page === 1 ? ids : [...next.savedArticles.filter((x) => !ids.includes(x)), ...ids],
      };
    },
  });
}

/* ------------------------------------------------------------- Visitors */

/** GET /learn/articles without signing in (PRD §16: guests see Learn home), page by page. */
export function usePublicArticles(search = "") {
  const q = search.trim();
  const client = useQueryClient();
  return useInfiniteQuery({
    queryKey: ["public", "learn", q],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => learnApi.list(pageParam, { search: q || undefined }, true),
    getNextPageParam: (last) =>
      last.page * last.pageSize < last.totalCount ? last.page + 1 : undefined,
    select: (data) => {
      const articles = data.pages.flatMap((p) => p.articles.map((a) => toArticle(a)));
      // An empty library shows the prototype's articles (searched here) until it has some.
      const whole = q
        ? client.getQueryData<typeof data>(["public", "learn", ""])?.pages[0]
        : data.pages[0];
      if (articles.length || whole?.totalCount !== 0) return { ...data, articles };
      const needle = q.toLowerCase();
      return {
        ...data,
        articles: withSamples([] as Article[], false, SAMPLE_ARTICLES, (a) => a.slug).filter(
          (a) => !needle || `${a.title} ${a.summary}`.toLowerCase().includes(needle),
        ),
      };
    },
  });
}

/** GET /learn/articles/{id} as a guest: title and summary only, with the API's join message. */
export function usePublicArticle(id: string) {
  return useQuery({
    queryKey: ["public", "learn", "article", id],
    queryFn: async () => {
      // A sample's slug never goes to the API: visitors see its title and summary.
      const sample = sampleArticle(id);
      if (sample) return { article: sample, joinMessage: null };
      try {
        const a = await learnApi.article(id, true);
        return { article: toArticle(a), joinMessage: a.joinMessage };
      } catch (error) {
        if (error instanceof ApiRequestError && error.status === 404) return null;
        throw error;
      }
    },
    enabled: !!id,
  });
}
