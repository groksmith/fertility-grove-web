/* The Learn library (PRD §16): articles, recommendations, saves and "Was this helpful?". */

import type { ArticleCardDto, ArticleDto } from "@/lib/api/articles";
import { PAGE_SIZE, type Paged } from "@/lib/api/query";
import { httpClient } from "@/lib/http";

export interface ArticleListDto extends Paged {
  articles: ArticleCardDto[];
}

/** Filters the library list takes (option codes for diagnosis and topic). */
export interface ArticleFilters {
  search?: string;
  diagnosis?: string;
  topic?: string;
}

export const learnApi = {
  list: (page: number, f: ArticleFilters = {}, anonymous = false) =>
    httpClient.get<ArticleListDto>("/learn/articles", {
      anonymous,
      query: {
        search: f.search || undefined,
        diagnosis: f.diagnosis || undefined,
        topic: f.topic || undefined,
        page,
        pageSize: PAGE_SIZE,
      },
    }),
  recommended: () =>
    httpClient.get<{ isPersonal: boolean; articles: ArticleCardDto[] }>("/learn/recommended"),
  article: (id: string, anonymous = false) =>
    httpClient.get<ArticleDto>(`/learn/articles/${id}`, { anonymous }),
  saved: (page: number) =>
    httpClient.get<ArticleListDto>("/profile/me/saved/articles", {
      query: { page, pageSize: PAGE_SIZE },
    }),
  suggestions: () => httpClient.get<ArticleListDto>("/profile/me/saved/suggestions"),
  save: (id: string, saved: boolean) => httpClient.put(`/learn/articles/${id}/saved`, saved),
  helpful: (id: string, helpful: boolean) =>
    httpClient.put(`/learn/articles/${id}/helpful`, helpful),
};
