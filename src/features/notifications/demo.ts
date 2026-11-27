/* The offline demo (the /demo personas): this feature's prototype behaviour on the local store,
   restored from before the backend was connected. The service routes here while `isDemo()`; a real
   session never does. */

import { set } from "@/lib/mock-server";

export const demo = {
  markAllRead() {
    set((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) }));
  },
};
