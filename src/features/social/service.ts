import { loadSession } from "@/features/auth";
import { refresh } from "@/lib/api/query-client";
import { fail, failure, ok, type Result } from "@/lib/api/result";
import { get, type State, set, uid } from "@/lib/mock-server";
import { notice } from "@/lib/notice";
import { MSG } from "@/lib/rules/validation";
import type { ReportReason } from "@/types/domain";
import { socialApi } from "./api";

/* ---------------------------------------------------------------- Social */

const memberOf = (id: string) => get().members.find((m) => m.id === id);
const handleOf = (id: string) => memberOf(id)?.handle || id;

/** Show a change now; put it back with a toast if the API refuses. */
async function optimistic(change: (s: State) => State, run: () => Promise<unknown>) {
  const before = get();
  set(change);
  try {
    await run();
    void refresh(["members"], ["matches"], ["posts", "following"]);
    return ok();
  } catch (error) {
    set((s) => ({
      ...s,
      following: before.following,
      followers: before.followers,
      blocked: before.blocked,
      notForMe: before.notForMe,
      members: before.members,
    }));
    const f = failure(error);
    if (!f.ok) notice(f.error);
    return f;
  }
}

export const socialService = {
  /** POST / DELETE /members/{handle}/follow. */
  toggleFollow(id: string): Promise<Result> {
    const on = get().following.includes(id);
    return optimistic(
      (s) => ({
        ...s,
        following: on ? s.following.filter((x) => x !== id) : [...s.following, id],
        matchedPeers: s.matchedPeers?.filter((p) => p.id !== id),
        members: s.members.map((m) =>
          m.id === id ? { ...m, followers: Math.max(0, m.followers + (on ? -1 : 1)) } : m,
        ),
      }),
      () => (on ? socialApi.unfollow(handleOf(id)) : socialApi.follow(handleOf(id))),
    );
  },
  /** DELETE /profile/me/followers/{handle}. */
  removeFollower(id: string): Promise<Result> {
    return optimistic(
      (s) => ({ ...s, followers: s.followers.filter((x) => x !== id) }),
      () => socialApi.removeFollower(handleOf(id)),
    );
  },
  /** POST /members/{handle}/block: follows end both ways, mentoring ends, and so does a partner link. */
  block(id: string): Promise<Result> {
    return optimistic(
      (s) => ({
        ...s,
        blocked: Array.from(new Set([...s.blocked, id])),
        following: s.following.filter((x) => x !== id),
        followers: s.followers.filter((x) => x !== id),
        conversations: s.conversations.filter((c) => c.memberId !== id || c.kind === "support"),
        mentorRequests: s.mentorRequests.map((r) =>
          (r.mentorId === id || r.menteeId === id) &&
          (r.status === "accepted" || r.status === "waiting")
            ? { ...r, status: "ended", feedbackGiven: true }
            : r,
        ),
      }),
      async () => {
        await socialApi.block(handleOf(id));
        await loadSession();
      },
    );
  },
  /** DELETE /profile/me/blocked/{memberId}. */
  unblock(id: string): Promise<Result> {
    const apiId = memberOf(id)?.apiId;
    return optimistic(
      (s) => ({ ...s, blocked: s.blocked.filter((x) => x !== id) }),
      () => (apiId ? socialApi.unblock(apiId) : Promise.reject(new Error("unknown member"))),
    );
  },
  /** POST /matches/Peer/{memberId}/not-for-me. */
  notForMe(id: string): Promise<Result> {
    const apiId = memberOf(id)?.apiId;
    return optimistic(
      (s) => ({
        ...s,
        notForMe: [...s.notForMe, id],
        matchedPeers: s.matchedPeers?.filter((p) => p.id !== id),
        matchedMentors: s.matchedMentors?.filter((p) => p.id !== id),
      }),
      () => (apiId ? socialApi.notForMe("Peer", apiId) : Promise.resolve()),
    );
  },
  /** Reports: TODO(api) — no reporting endpoint yet (moderation, M4). Kept locally. */
  report(target: string, reason: ReportReason | "", details: string, alsoBlock?: string): Result {
    const s = get();
    if (!reason) return fail("Choose a reason.");
    if (reason === "Other" && !details.trim()) return fail(MSG.reportDetails);
    if (s.counters.reports >= 20) return fail(MSG.reportLimit);
    set((x) => ({
      ...x,
      counters: { ...x.counters, reports: x.counters.reports + 1 },
      reports: [
        ...x.reports,
        { id: uid("r"), target, reason, details: details.trim() || undefined, minutesAgo: 0 },
      ],
    }));
    if (alsoBlock) void socialService.block(alsoBlock);
    return ok({
      note: reason === "Self-harm or crisis concern" ? MSG.reportCrisisThanks : MSG.reportThanks,
    });
  },
};
