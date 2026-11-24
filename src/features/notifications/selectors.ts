/* Derived views the screens read: pure functions of the cached state. */

import type { State } from "@/lib/mock-server";

/** The bell number: the API's unread count once polled, else what the loaded list says. */
export const unreadNotifications = (s: State) =>
  s.unreadNotificationCount ?? s.notifications.filter((n) => !n.read).length;
