/* Join, leave and mute a group (PRD §8), and "Not for me" on a matched group (§11). Each shows at
   once and is put back, with a toast, if the API refuses. */

import { refresh } from "@/lib/api/query-client";
import { failure, ok, type Result } from "@/lib/api/result";
import { get, set } from "@/lib/mock-server";
import { notice } from "@/lib/notice";
import { groupsApi } from "./api";

function setJoined(id: string, joined: boolean) {
  set((s) => {
    const was = s.joined.includes(id);
    if (was === joined) return s;
    return {
      ...s,
      joined: joined ? [...s.joined, id] : s.joined.filter((g) => g !== id),
      muted: joined ? s.muted : s.muted.filter((g) => g !== id),
      groups: s.groups.map((g) =>
        g.id === id ? { ...g, members: Math.max(0, g.members + (joined ? 1 : -1)) } : g,
      ),
    };
  });
}

async function undoOnFail(run: () => Promise<unknown>, undo: () => void): Promise<Result> {
  try {
    await run();
    void refresh(["groups"], ["posts"], ["dashboard"]);
    return ok();
  } catch (error) {
    undo();
    const f = failure(error);
    if (!f.ok) notice(f.error);
    return f;
  }
}

export const groupService = {
  /** POST / DELETE /groups/{id}/membership. */
  toggleJoin(id: string): Promise<Result> {
    const joined = get().joined.includes(id);
    setJoined(id, !joined);
    return undoOnFail(
      () => (joined ? groupsApi.leave(id) : groupsApi.join(id)),
      () => setJoined(id, joined),
    );
  },
  /** PUT /groups/{id}/membership/muted. */
  toggleMute(id: string): Promise<Result> {
    const muted = get().muted.includes(id);
    const apply = (value: boolean) =>
      set((s) => ({
        ...s,
        muted: value ? [...s.muted.filter((g) => g !== id), id] : s.muted.filter((g) => g !== id),
      }));
    apply(!muted);
    return undoOnFail(
      () => groupsApi.mute(id, !muted),
      () => apply(muted),
    );
  },
  /** POST /matches/Group/{id}/not-for-me: never suggested again. */
  notForMe(id: string): Promise<Result> {
    set((s) => ({
      ...s,
      notForMe: [...s.notForMe, id],
      matchedGroups: s.matchedGroups?.filter((m) => m.groupId !== id),
    }));
    return undoOnFail(
      () => groupsApi.notForMe(id),
      () => set((s) => ({ ...s, notForMe: s.notForMe.filter((x) => x !== id) })),
    );
  },
};
