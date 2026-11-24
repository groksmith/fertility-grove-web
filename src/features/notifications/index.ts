// Barrel: named re-exports of what other layers consume.
export { notificationKeys, useNotifications, useUnreadCount } from "./hooks";
export { unreadNotifications } from "./selectors";
export { notificationService } from "./service";
export type { Notification, NotificationKind } from "./types";
