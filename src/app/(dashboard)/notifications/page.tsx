"use client";

/* Notifications (PRD §15). Opening the list marks what's shown as read; each
   item opens the exact thing it's about. Unread items keep a dot until the
   next visit so the member can see what was new. */

import {
  AtSign,
  Bell,
  HeartHandshake,
  Mail,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Sprout,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Avatar, EmptyState, MoreOnScroll, PageHeader } from "@/components/shared";
import { Panel } from "@/components/ui/panel";
import { person } from "@/features/auth";
import { notificationService, useNotifications } from "@/features/notifications";
import { timeAgo } from "@/lib/format";
import { useStore } from "@/lib/mock-server";
import type { Notification, NotificationKind } from "@/types/domain";

const ICON: Record<NotificationKind, React.ElementType> = {
  reply: AtSign,
  message: MessageCircle,
  "message-request": Mail,
  mentor: Sprout,
  follow: UserPlus,
  level: Sprout,
  match: Users,
  partner: HeartHandshake,
  family: HeartHandshake,
  safety: ShieldCheck,
  credits: Sparkles,
};

function Row({ n, wasUnread }: { n: Notification; wasUnread: boolean }) {
  const s = useStore();
  const actor = n.actorId ? person(s, n.actorId) : undefined;
  const Icon = ICON[n.kind] ?? Bell;
  return (
    <li>
      <Link href={n.href} className="flex items-center gap-4 px-5 py-4 hover:bg-ground">
        {actor ? (
          <Avatar member={actor} size={40} />
        ) : (
          <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center text-green-ink">
            <Icon size={22} strokeWidth={1.8} />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span
            className={`block text-[15px] leading-snug ${wasUnread ? "font-semibold text-ink" : "text-ink-soft"}`}
          >
            {n.text}
          </span>
          <span className="text-[13px] text-muted">{timeAgo(n.minutesAgo)} ago</span>
        </span>
        {wasUnread && (
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-accent">
            <span className="sr-only">New</span>
          </span>
        )}
      </Link>
    </li>
  );
}

export default function NotificationsPage() {
  const notifications = useStore((s) => s.notifications);
  // GET /notifications, page by page; what it shows is then marked read (POST /notifications/read).
  // The ones that were unread on arrival keep their highlight while the page is open, and the
  // lede counts every unread one, on any page.
  const query = useNotifications();
  const [arrivedUnread, setArrivedUnread] = useState<string[]>([]);
  const [newCount, setNewCount] = useState<number | null>(null);
  const unreadIds = arrivedUnread;

  useEffect(() => {
    const pages = query.data?.pages;
    if (!pages) return;
    if (newCount === null) setNewCount(pages[0]?.unreadCount ?? 0);
    const unread = pages.flatMap((p) => p.notifications.filter((n) => !n.isRead).map((n) => n.id));
    const fresh = unread.filter((id) => !arrivedUnread.includes(id));
    if (!fresh.length) return;
    setArrivedUnread((ids) => [...ids, ...fresh]);
    void notificationService.markAllRead();
  }, [query.data, arrivedUnread, newCount]);

  const today = notifications.filter((n) => n.minutesAgo < 1440);
  const earlier = notifications.filter((n) => n.minutesAgo >= 1440);

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Notifications"
        lede={
          (newCount ?? 0) > 0
            ? `${newCount} new since you last looked.`
            : "Nothing new since you last looked."
        }
      />
      {notifications.length === 0 ? (
        <EmptyState art="bud" title="No notifications yet." />
      ) : (
        <div className="space-y-6">
          {[
            ["Today", today],
            ["Earlier", earlier],
          ].map(([label, list]) =>
            (list as Notification[]).length ? (
              <section key={label as string} aria-labelledby={`n-${label}`}>
                <h2 id={`n-${label}`} className="mb-2 text-[14px] font-semibold text-muted">
                  {label as string}
                </h2>
                <Panel className="overflow-hidden">
                  <ul className="divide-y divide-line">
                    {(list as Notification[]).map((n) => (
                      <Row key={n.id} n={n} wasUnread={unreadIds.includes(n.id)} />
                    ))}
                  </ul>
                </Panel>
              </section>
            ) : null,
          )}
          <MoreOnScroll query={query} />
          <p className="text-[13px] text-muted">
            We send at most one activity email a day. Choose what&apos;s in it in{" "}
            <Link href="/settings#notifications" className="underline">
              Settings
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  );
}
