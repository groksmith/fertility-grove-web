/* The onboarding endpoints (PRD §5): one PUT per screen, a skip for screens 2 and 7, and complete.
   Each save answers with the progress (`nextStep`), which becomes the store's step. */

import { commands, loadSession } from "@/features/auth";
import { failure, ok, type Result } from "@/lib/api/result";
import { httpClient } from "@/lib/http";
import { demoResult, get, isDemo, type Me, set } from "@/lib/mock-server";
import { demo } from "./demo";

interface Progress {
  status: "NotStarted" | "InProgress" | "Complete";
  nextStep: number;
}

const STEP_SAVES: Record<number, (m: Me) => Promise<Progress>> = {
  1: (m) => httpClient.put("/onboarding/journey", commands.journey(m)),
  2: (m) => httpClient.put("/onboarding/diagnosis", commands.diagnosis(m)),
  3: (m) => httpClient.put("/onboarding/about-you", commands.aboutYou(m)),
  4: (m) => httpClient.put("/onboarding/looking-for", commands.lookingFor(m)),
  5: (m) => httpClient.put("/onboarding/community", commands.community(m)),
  6: (m) => httpClient.put("/onboarding/profile", commands.onboardingProfile(m)),
  7: (m) => httpClient.put("/onboarding/connections", commands.connections(m)),
};

/** The API names the fields as it binds them; the onboarding form uses the store's names. */
const FIELDS: Record<string, string> = {
  journeyStages: "stages",
  nextTreatmentDate: "nextDate",
  genderIdentity: "gender",
  genderSelfDescription: "genderSelf",
  pronounsSelfDescription: "pronounsSelf",
  zipCode: "zip",
  connectPreference: "connectStyle",
  communityId: "community",
  avatarCode: "avatarPreset",
};

function applyProgress(p: Progress) {
  set((s) => ({
    ...s,
    step: p.status === "Complete" ? 9 : Math.max(s.step, Math.min(8, p.nextStep)),
  }));
}

export const onboardingService = {
  /** Save one screen's answers. A refusal (a taken handle, say) keeps the member on the screen. */
  async save(step: number, patch: Partial<Me>, skipped?: string[]): Promise<Result> {
    if (isDemo()) return demoResult(demo.save(step, patch, skipped));
    const before = get().me;
    const next: Me = { ...before, ...patch };
    set((s) => ({
      ...s,
      me: {
        ...next,
        skipped: Array.from(
          new Set([
            ...s.me.skipped.filter((k) => !Object.keys(patch).includes(k)),
            ...(skipped ?? []),
          ]),
        ),
      },
    }));
    try {
      const progress = skipped?.length
        ? await httpClient.post<Progress>(`/onboarding/steps/${step}/skip`)
        : await (STEP_SAVES[step]?.(next) ?? Promise.resolve(null));
      if (progress) applyProgress(progress);
      return ok();
    } catch (error) {
      set((s) => ({ ...s, me: { ...s.me, ...pick(before, Object.keys(patch)) } }));
      const f = failure(error);
      if (!f.ok && f.errs) {
        const errs: Record<string, string> = {};
        for (const [k, v] of Object.entries(f.errs)) errs[FIELDS[k] ?? k] = v;
        return { ...f, errs };
      }
      return f;
    }
  },

  /** POST /onboarding/complete. Safe to call twice. Planting the Seed is celebrated once. */
  async completeOnboarding(): Promise<Result> {
    if (isDemo()) return demoResult(demo.completeOnboarding());
    if (get().step >= 9) return ok();
    try {
      await httpClient.post<Progress>("/onboarding/complete");
      set((s) => ({ ...s, step: 9, pendingLevelUp: "Seed" }));
      await loadSession();
      return ok();
    } catch (error) {
      return failure(error);
    }
  },
};

function pick(me: Me, keys: string[]): Partial<Me> {
  return Object.fromEntries(keys.map((k) => [k, me[k as keyof Me]])) as Partial<Me>;
}
