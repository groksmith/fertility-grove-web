/* The member's own profile and settings (PUT /api/v1/profile/me/*), consent, data export and
   account deletion. Screens patch the store's `me` as before; each patch is shown at once and sent
   to the endpoint that owns those fields, and rolled back with a toast if it's refused. */

import { authService, commands, loadSession } from "@/features/auth";
import { refresh } from "@/lib/api/query-client";
import { attempt, fail, failure, ok, type Result } from "@/lib/api/result";
import { httpClient } from "@/lib/http";
import { demoResult, get, isDemo, type Me, set } from "@/lib/mock-server";
import { notice } from "@/lib/notice";
import { checks } from "@/lib/rules/validation";
import type { MessagePolicy } from "@/types/domain";
import { demo } from "./demo";

type Group = "publicProfile" | "aboutYou" | "health" | "lookingFor" | "community" | "settings";

/** Which endpoint owns each field of `Me`. */
const OWNER: Partial<Record<keyof Me, Group>> = {
  firstName: "publicProfile",
  lastName: "publicProfile",
  showRealName: "publicProfile",
  avatarHue: "publicProfile",
  avatarPreset: "publicProfile",
  aboutMe: "publicProfile",
  myStory: "publicProfile",
  gender: "aboutYou",
  genderSelf: "aboutYou",
  pronouns: "aboutYou",
  pronounsSelf: "aboutYou",
  ageRange: "aboutYou",
  zip: "aboutYou",
  stages: "health",
  treatments: "health",
  nextDate: "health",
  diagnoses: "health",
  otherDiagnosis: "health",
  paths: "health",
  lookingFor: "lookingFor",
  connectStyle: "lookingFor",
  community: "community",
  suggestMe: "settings",
  messagePolicy: "settings",
  wantMentor: "settings",
  showStories: "settings",
  shareJourney: "settings",
  showPartner: "settings",
  notify: "settings",
};

const SEND: Record<Group, (m: Me) => Promise<unknown>> = {
  publicProfile: (m) => httpClient.send("PUT", "/profile/me", commands.publicProfile(m)),
  aboutYou: (m) => httpClient.put("/profile/me/about-you", commands.aboutYou(m)),
  health: (m) => httpClient.put("/profile/me/health", commands.health(m)),
  lookingFor: (m) => httpClient.put("/profile/me/looking-for", commands.lookingFor(m)),
  community: (m) => httpClient.put("/profile/me/community", commands.community(m)),
  settings: (m) => httpClient.put("/profile/me/settings", commands.settings(m)),
};

/** Show the patch now, send it, and put the old values back if any part is refused. */
async function save(patch: Partial<Me>): Promise<Result> {
  const before = get().me;
  const next: Me = { ...before, ...patch };
  set((s) => ({ ...s, me: { ...s.me, ...patch } }));
  const groups = new Set<Group>();
  for (const key of Object.keys(patch) as (keyof Me)[]) {
    const g = OWNER[key];
    if (g) groups.add(g);
  }
  try {
    // About me and My story are crisis-checked: the header opens the card.
    await Promise.all([...groups].map((g) => SEND[g](next)));
    if (groups.has("community") || groups.has("health")) await loadSession();
    void refresh(["profile"]);
    return ok();
  } catch (error) {
    const restore = Object.fromEntries(
      Object.keys(patch).map((k) => [k, before[k as keyof Me]]),
    ) as Partial<Me>;
    set((s) => ({ ...s, me: { ...s.me, ...restore } }));
    const f = failure(error);
    if (!f.ok) notice(f.error);
    return f;
  }
}

/* -------------------------------------------------------------- Exports */

export type ExportStatus = "none" | "preparing" | "ready";

interface ExportDto {
  id: string | null;
  status: "Preparing" | "Ready" | "Expired" | null;
}

function exportStatus(e: ExportDto): ExportStatus {
  return e.status === "Preparing" ? "preparing" : e.status === "Ready" ? "ready" : "none";
}

let exportId: string | null = null;

/* ------------------------------------------------------------- Settings */

export const settingsService = {
  update(patch: Partial<Me>): Promise<Result> {
    if (isDemo()) return Promise.resolve(demoResult(demo.update(patch)));
    return save(patch);
  },
  setMessagePolicy(p: MessagePolicy): Promise<Result> {
    if (isDemo()) return Promise.resolve(demoResult(demo.setMessagePolicy(p)));
    return save({ messagePolicy: p });
  },

  /** PUT /profile/me/handle. Once every 30 days; the API says when the next change opens. */
  async changeHandle(next: string): Promise<Result> {
    if (isDemo()) return demoResult(demo.changeHandle(next));
    const h = next.trim();
    if (h === get().me.handle) return ok();
    const e = checks.handle(h);
    if (e) return fail(e);
    const r = await attempt(() => httpClient.put("/profile/me/handle", { handle: h }));
    if (r.ok) await loadSession();
    return r;
  },

  /** DELETE /profile/me/health-consent: withdrawing deletes the screen 1–2 health answers. */
  async withdrawConsent(): Promise<Result> {
    if (isDemo()) return demoResult(demo.withdrawConsent());
    const r = await attempt(() => httpClient.delete("/profile/me/health-consent"));
    if (!r.ok) {
      notice(r.error);
      return r;
    }
    set((s) => ({
      ...s,
      useProfileAnswers: false,
      me: {
        ...s.me,
        healthConsent: false,
        stages: [],
        treatments: [],
        nextDate: "",
        diagnoses: [],
        otherDiagnosis: "",
        paths: [],
        shareJourney: false,
      },
    }));
    await loadSession();
    return r;
  },
  /** POST /profile/me/health-consent. */
  async giveConsent(): Promise<Result> {
    if (isDemo()) return demoResult(demo.giveConsent());
    set((s) => ({ ...s, useProfileAnswers: true, me: { ...s.me, healthConsent: true } }));
    const r = await attempt(() => httpClient.post("/profile/me/health-consent"));
    if (!r.ok) {
      set((s) => ({ ...s, me: { ...s.me, healthConsent: false } }));
      notice(r.error);
    }
    return r;
  },

  /** GET /profile/me/data-exports/latest. */
  async exportStatus(): Promise<ExportStatus> {
    const e = await httpClient.get<ExportDto>("/profile/me/data-exports/latest");
    exportId = e.id;
    const status = exportStatus(e);
    set((s) => ({ ...s, dataExport: status }));
    return status;
  },
  /** POST /profile/me/data-exports. Idempotent while one is being prepared. */
  async requestExport(): Promise<Result> {
    if (isDemo()) return demoResult(demo.requestExport());
    try {
      const e = await httpClient.post<ExportDto>("/profile/me/data-exports");
      exportId = e.id;
      set((s) => ({ ...s, dataExport: "preparing" }));
      return ok();
    } catch (error) {
      const f = failure(error);
      if (!f.ok) notice(f.error);
      return f;
    }
  },
  /** POST /profile/me/data-exports/{id}/download with the password: the zip, saved by the browser. */
  async downloadExport(password: string): Promise<Result> {
    if (isDemo()) return ok();
    if (!exportId) await settingsService.exportStatus();
    if (!exportId) return fail("This download is no longer available.");
    try {
      const { blob, filename } = await httpClient.download(
        `/profile/me/data-exports/${exportId}/download`,
        { password },
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename ?? "fertility-grove-data.zip";
      a.click();
      URL.revokeObjectURL(url);
      return ok();
    } catch (error) {
      return failure(error);
    }
  },

  /** POST /auth/account/deletion: signed out everywhere; signing in within 14 days restores. */
  async deleteAccount(deletePosts: boolean): Promise<Result> {
    if (isDemo()) return demoResult(demo.deleteAccount(deletePosts));
    const r = await authService.requestDeletion(deletePosts);
    if (!r.ok) {
      notice(r.error);
      return r;
    }
    const days = r.note
      ? Math.max(1, Math.ceil((Date.parse(r.note) - Date.now()) / 86_400_000))
      : 14;
    set((s) => ({ ...s, deletion: { daysLeft: days, deletePosts } }));
    return r;
  },
  /** There is no restore call: signing in restores. This clears the notice and goes to sign-in. */
  restoreAccount() {
    if (isDemo()) return demoResult(demo.restoreAccount());
    set((s) => ({ ...s, deletion: undefined }));
  },
  acknowledgeLevelUp() {
    if (isDemo()) return demoResult(demo.acknowledgeLevelUp());
    set((s) => ({ ...s, pendingLevelUp: undefined }));
  },
  /** "Hide for 30 days": POST /profile/me/completion-card/dismiss. */
  async dismissProfileCard(): Promise<Result> {
    if (isDemo()) return demoResult(demo.dismissProfileCard());
    set((s) => ({
      ...s,
      me: { ...s.me, profileCardHiddenUntil: Date.now() + 30 * 24 * 60 * 60 * 1000 },
    }));
    return attempt(() => httpClient.post("/profile/me/completion-card/dismiss"));
  },
  /** Suspension appeals: TODO(api) — no moderation endpoints yet (M4). */
  appeal() {
    if (isDemo()) return demoResult(demo.appeal());
    set((s) => ({ ...s, suspension: s.suspension && { ...s.suspension, appealed: true } }));
  },
};
