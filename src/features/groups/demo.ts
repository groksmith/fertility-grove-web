/* The offline demo (the /demo personas): this feature's prototype behaviour on the local store,
   restored from before the backend was connected. The service routes here while `isDemo()`; a real
   session never does. */

import { set } from "@/lib/mock-server";

/* ----------------------------------------------------------------- Groups */

export const demo = {
  toggleJoin(id: string) {
    set((s) => {
      const joined = s.joined.includes(id);
      return {
        ...s,
        joined: joined ? s.joined.filter((g) => g !== id) : [...s.joined, id],
        muted: joined ? s.muted.filter((g) => g !== id) : s.muted,
        groups: s.groups.map((g) =>
          g.id === id ? { ...g, members: g.members + (joined ? -1 : 1) } : g,
        ),
      };
    });
  },
  toggleMute(id: string) {
    set((s) => ({
      ...s,
      muted: s.muted.includes(id) ? s.muted.filter((g) => g !== id) : [...s.muted, id],
    }));
  },
  notForMe(id: string) {
    set((s) => ({ ...s, notForMe: [...s.notForMe, id] }));
  },
};
