/* Marking what the member saw as read: POST /notifications/read (50 ids at a time). */

import { refresh } from "@/lib/api/query-client";
import { attempt } from "@/lib/api/result";
import { httpClient } from "@/lib/http";
import { get, set } from "@/lib/mock-server";

export const notificationService = {
  async markAllRead() {
    const ids = get()
      .notifications.filter((n) => !n.read)
      .map((n) => n.id);
    set((s) => ({
      ...s,
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
      unreadNotificationCount: Math.max(0, (s.unreadNotificationCount ?? 0) - ids.length),
    }));
    for (let i = 0; i < ids.length; i += 50) {
      await attempt(() =>
        httpClient.post("/notifications/read", { notificationIds: ids.slice(i, i + 50) }),
      );
    }
    void refresh(["notifications", "count"]);
  },
};
