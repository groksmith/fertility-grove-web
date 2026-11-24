/* Mentoring (PRD §12): ask a mentor, answer a request, end, leave feedback, and the mentor setup
   (on, paused, off). Each write waits for the API, then re-reads the mentorships. */

import { DIAGNOSES, JOURNEY_STAGES, PATHS } from "@/config/options";
import { loadSession } from "@/features/auth";
import { codeOf } from "@/lib/api/options";
import { refresh } from "@/lib/api/query-client";
import { attempt, crisisOf, fail, failure, ok, type Result } from "@/lib/api/result";
import { get, set } from "@/lib/mock-server";
import { notice } from "@/lib/notice";
import { MSG } from "@/lib/rules/validation";
import { mentorsApi } from "./api";
import { mentorKeys } from "./hooks";

const after = () => refresh(mentorKeys.mentorships, ["conversations"], ["dashboard"]);

const inList = (list: readonly string[], v: string) => list.includes(v);

export const mentorService = {
  /** POST /members/{handle}/mentor-requests. */
  async request(mentorId: string, message: string, helpWith: string[]): Promise<Result> {
    const s = get();
    if (s.me.status === "unconfirmed") return fail(MSG.unconfirmed(s.me.email), "unconfirmed");
    if (!message.trim()) return fail(MSG.mentorMessage);
    const handle = s.members.find((m) => m.id === mentorId)?.handle ?? mentorId;
    try {
      const sent = await mentorsApi.request(handle, message.trim(), helpWith.map(codeOf));
      void after();
      return ok({ id: sent.data.id, crisis: crisisOf(sent, sent.data) });
    } catch (error) {
      return failure(error);
    }
  },

  /** POST /mentorships/{id}/answer. Accepting opens the mentoring conversation. */
  async respond(id: string, accept: boolean, note: string): Promise<Result> {
    try {
      const sent = await mentorsApi.answer(id, accept, note.trim());
      set((s) => ({
        ...s,
        mentorRequests: s.mentorRequests.map((x) =>
          x.id === id
            ? {
                ...x,
                status: accept ? "accepted" : "declined",
                note: note.trim() || (accept ? undefined : MSG.mentorDecline),
              }
            : x,
        ),
      }));
      void after();
      return ok({ crisis: crisisOf(sent) });
    } catch (error) {
      const f = failure(error);
      if (!f.ok) notice(f.error);
      return f;
    }
  },

  /** POST /mentorships/{id}/end. */
  async end(requestId: string): Promise<Result> {
    const r = await attempt(() => mentorsApi.end(requestId));
    if (!r.ok) {
      notice(r.error);
      return r;
    }
    set((s) => ({
      ...s,
      mentorRequests: s.mentorRequests.map((x) =>
        x.id === requestId ? { ...x, status: "ended" } : x,
      ),
    }));
    void after();
    return r;
  },

  /** PUT /mentorships/{id}/feedback: helpful yes / somewhat / no, and an optional thank-you. */
  async feedback(
    requestId: string,
    helpful: "Yes" | "Somewhat" | "No" = "Yes",
    thanks = "",
  ): Promise<Result> {
    const r = await attempt(() => mentorsApi.feedback(requestId, helpful, thanks.trim()));
    if (!r.ok) {
      notice(r.error);
      return r;
    }
    set((s) => ({
      ...s,
      mentorRequests: s.mentorRequests.map((x) =>
        x.id === requestId ? { ...x, feedbackGiven: true } : x,
      ),
    }));
    return r;
  },

  /** POST /matches/Mentor/{memberId}/not-for-me: that mentor isn't suggested again. */
  async notForMe(mentorId: string): Promise<Result> {
    const apiId = get().members.find((m) => m.id === mentorId)?.apiId;
    set((s) => ({
      ...s,
      notForMe: [...s.notForMe, mentorId],
      matchedMentors: s.matchedMentors?.filter((m) => m.id !== mentorId),
    }));
    if (!apiId) return ok();
    const r = await attempt(() => mentorsApi.notForMe(apiId));
    if (!r.ok) notice(r.error);
    return r;
  },

  /** PUT /profile/me/mentoring. Checked here first, so the setup guard gets its answer at once;
      a refusal from the API (bio crisis words, say) arrives as a toast. */
  setup(m: { bio: string; helpsWith: string[]; capacity: number; agreed: boolean }) {
    const errs: Record<string, string> = {};
    if (!m.bio.trim()) errs.bio = MSG.mentorBio;
    if (!m.helpsWith.length) errs.helpsWith = MSG.mentorHelps;
    if (!m.agreed) errs.agreed = MSG.mentorGuidelines;
    if (Object.keys(errs).length) return { ok: false as const, errs };
    const before = get().me.mentoring;
    set((s) => ({
      ...s,
      me: {
        ...s.me,
        mentoring: {
          on: true,
          paused: false,
          bio: m.bio.trim(),
          helpsWith: m.helpsWith,
          capacity: m.capacity,
        },
      },
    }));
    void mentorsApi
      .setup({
        bio: m.bio.trim(),
        diagnoses: m.helpsWith.filter((h) => inList(DIAGNOSES, h)).map(codeOf),
        journeyStages: m.helpsWith.filter((h) => inList(JOURNEY_STAGES, h)).map(codeOf),
        paths: m.helpsWith.filter((h) => inList(PATHS, h)).map(codeOf),
        capacity: m.capacity,
        acceptGuidelines: m.agreed,
      })
      .then(() => loadSession())
      .catch((error: unknown) => {
        set((s) => ({ ...s, me: { ...s.me, mentoring: before } }));
        const f = failure(error);
        if (!f.ok) notice(f.error);
      });
    return { ok: true as const, errs: {} };
  },

  /** PUT /profile/me/mentoring/paused. */
  async setPaused(paused: boolean): Promise<Result> {
    set((s) => ({ ...s, me: { ...s.me, mentoring: { ...s.me.mentoring, paused } } }));
    const r = await attempt(() => mentorsApi.pause(paused));
    if (!r.ok) {
      set((s) => ({ ...s, me: { ...s.me, mentoring: { ...s.me.mentoring, paused: !paused } } }));
      notice(r.error);
    }
    return r;
  },

  /** DELETE /profile/me/mentoring: waiting requests are declined with the default note. */
  async turnOff(): Promise<Result> {
    const r = await attempt(() => mentorsApi.turnOff());
    if (!r.ok) {
      notice(r.error);
      return r;
    }
    set((s) => ({
      ...s,
      me: { ...s.me, mentoring: { ...s.me.mentoring, on: false } },
      mentorRequests: s.mentorRequests.map((x) =>
        x.mentorId === "me" && x.status === "waiting"
          ? { ...x, status: "declined", note: MSG.mentorDecline }
          : x,
      ),
    }));
    void after();
    await loadSession();
    return r;
  },
};
