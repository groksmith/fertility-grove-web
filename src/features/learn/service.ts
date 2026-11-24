/* Saving an article and "Was this helpful?" (PUT /learn/articles/{id}/saved, /helpful). Both show
   at once and are put back if the API refuses. */

import { refresh } from "@/lib/api/query-client";
import { failure, ok, type Result } from "@/lib/api/result";
import { get, set } from "@/lib/mock-server";
import { notice } from "@/lib/notice";
import { learnApi } from "./api";
import { learnKeys } from "./hooks";

export const learnService = {
  async toggleSave(id: string): Promise<Result> {
    const was = get().savedArticles.includes(id);
    const apply = (saved: boolean) =>
      set((s) => ({
        ...s,
        savedArticles: saved
          ? [...s.savedArticles.filter((x) => x !== id), id]
          : s.savedArticles.filter((x) => x !== id),
        suggestedArticles: saved
          ? s.suggestedArticles?.filter((x) => x !== id)
          : s.suggestedArticles,
      }));
    apply(!was);
    try {
      await learnApi.save(id, !was);
      void refresh(learnKeys.saved, learnKeys.suggestions, ["dashboard"]);
      return ok();
    } catch (error) {
      apply(was);
      const f = failure(error);
      if (!f.ok) notice(f.error);
      return f;
    }
  },

  async rate(id: string, v: "yes" | "no"): Promise<Result> {
    const before = get().articleHelpful[id];
    set((s) => ({ ...s, articleHelpful: { ...s.articleHelpful, [id]: v } }));
    try {
      await learnApi.helpful(id, v === "yes");
      return ok();
    } catch (error) {
      set((s) => {
        const next = { ...s.articleHelpful };
        if (before) next[id] = before;
        else delete next[id];
        return { ...s, articleHelpful: next };
      });
      const f = failure(error);
      if (!f.ok) notice(f.error);
      return f;
    }
  },
};
