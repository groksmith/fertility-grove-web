/* The partner endpoints (PRD §7). The link itself is the API's; the family space it opens is still
   local (TODO(api): no family-space endpoints yet). */

import { loadSession } from "@/features/auth";
import { attempt, crisisOf, fail, failure, ok, type Result } from "@/lib/api/result";
import { demoResult, get, isDemo, set, uid } from "@/lib/mock-server";
import { notice } from "@/lib/notice";
import { checks, MSG, normalizeEmail } from "@/lib/rules/validation";
import { partnerApi } from "./api";
import { demo } from "./demo";

/* ---------------------------------------------------------------- Partner */

export const partnerService = {
  /** POST /profile/me/partner/invites. The note is crisis-checked server-side. */
  async invite(email: string, note: string): Promise<Result> {
    if (isDemo()) return demoResult(demo.invite(email, note));
    const s = get();
    if (s.partner.linked) return fail(MSG.alreadyPartnered);
    const e = checks.email(email);
    if (e) return fail(e);
    if (normalizeEmail(email) === s.me.email) return fail(MSG.selfInvite);
    try {
      const sent = await partnerApi.invite(normalizeEmail(email), note.trim());
      await loadSession();
      return ok({ crisis: crisisOf(sent) });
    } catch (error) {
      return failure(error);
    }
  },
  /** POST /profile/me/partner/invites/{id}/resend (3 resends at most). */
  async resend(): Promise<Result> {
    if (isDemo()) return demoResult(demo.resend());
    const inv = get().partner.invite;
    if (!inv?.id) return fail("There's no invite to resend.");
    const r = await attempt(() => partnerApi.resend(inv.id ?? ""));
    if (r.ok) await loadSession();
    return r;
  },
  /** DELETE /profile/me/partner/invites/{id}. */
  async cancel(): Promise<Result> {
    if (isDemo()) return demoResult(demo.cancel());
    const inv = get().partner.invite;
    if (!inv?.id) return ok();
    const r = await attempt(() => partnerApi.cancel(inv.id ?? ""));
    if (r.ok) await loadSession();
    else notice(r.error);
    return r;
  },
  /** The partner accepts on their own device; this re-reads the link to pick it up. */
  async demoAccept() {
    if (isDemo()) return demoResult(demo.demoAccept());
    await loadSession();
  },
  /** GET /partner-invites/{token}: the inviter's first name and note, or null when expired. */
  async publicInvite(token: string) {
    // The offline demo's invited partner sees the prototype's invite from Annie.
    if (isDemo()) {
      return {
        inviterFirstName: "Annie",
        note: "I've found people here who get it. I'd love for you to have that too, and for us to keep our appointment questions in one place.",
        expiresAt: new Date(Date.now() + 14 * 86_400_000).toISOString(),
      };
    }
    try {
      return await partnerApi.publicInvite(token);
    } catch {
      return null;
    }
  },
  /** POST /partner-invites/{token}/accept, signed in as the invited partner. */
  async accept(token: string): Promise<Result> {
    if (isDemo()) return demoResult(demo.demoAccept());
    const r = await attempt(() => partnerApi.accept(token));
    if (r.ok) await loadSession();
    return r;
  },
  /** DELETE /profile/me/partner. The family space (local until its API lands) closes too. */
  async unlink() {
    if (isDemo()) return demoResult(demo.unlink());
    const r = await attempt(() => partnerApi.unlink());
    if (!r.ok) {
      notice(r.error);
      return r;
    }
    set((s) => ({
      ...s,
      partner: { linked: false, firstName: "", showsBadge: false },
      family: {
        items: s.family.items.filter((i) => i.owner === "me" && i.kind !== "note").map((i) => i),
        notes: s.family.notes.map((n) => ({ ...n, past: true })),
        activity: [
          {
            id: uid("a"),
            text: "You unlinked from your partner. Sharing has ended.",
            minutesAgo: 0,
          },
          ...s.family.activity,
        ],
      },
    }));
    await loadSession();
    return r;
  },
};
