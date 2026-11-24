/* The partner endpoints (PRD §7). The link itself is the API's; the family space it opens is still
   local (TODO(api): no family-space endpoints yet). */

import { loadSession } from "@/features/auth";
import { attempt, crisisOf, fail, failure, ok, type Result } from "@/lib/api/result";
import { get, set, uid } from "@/lib/mock-server";
import { notice } from "@/lib/notice";
import { checks, MSG, normalizeEmail } from "@/lib/rules/validation";
import { partnerApi } from "./api";

/* ---------------------------------------------------------------- Partner */

export const partnerService = {
  /** POST /profile/me/partner/invites. The note is crisis-checked server-side. */
  async invite(email: string, note: string): Promise<Result> {
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
    const inv = get().partner.invite;
    if (!inv?.id) return fail("There's no invite to resend.");
    const r = await attempt(() => partnerApi.resend(inv.id ?? ""));
    if (r.ok) await loadSession();
    return r;
  },
  /** DELETE /profile/me/partner/invites/{id}. */
  async cancel(): Promise<Result> {
    const inv = get().partner.invite;
    if (!inv?.id) return ok();
    const r = await attempt(() => partnerApi.cancel(inv.id ?? ""));
    if (r.ok) await loadSession();
    else notice(r.error);
    return r;
  },
  /** The partner accepts on their own device; this re-reads the link to pick it up. */
  async demoAccept() {
    await loadSession();
  },
  /** GET /partner-invites/{token}: the inviter's first name and note, or null when expired. */
  async publicInvite(token: string) {
    try {
      return await partnerApi.publicInvite(token);
    } catch {
      return null;
    }
  },
  /** POST /partner-invites/{token}/accept, signed in as the invited partner. */
  async accept(token: string): Promise<Result> {
    const r = await attempt(() => partnerApi.accept(token));
    if (r.ok) await loadSession();
    return r;
  },
  /** DELETE /profile/me/partner. The family space (local until its API lands) closes too. */
  async unlink() {
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
