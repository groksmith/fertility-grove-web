"use client";

/* The per-category unsubscribe link in the daily update email (api-handoff, Notifications):
   /email-preferences/unsubscribe?token=…&category=…. It turns that one kind of email off at once. */

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthFrame } from "@/components/common/AuthFrame";
import { httpClient } from "@/lib/http";

const WHAT: Record<string, string> = {
  CommentsAndReplies: "You won't get emails about comments and replies.",
  DirectMessages: "You won't get emails about direct messages.",
  MentoringUpdates: "You won't get emails about mentoring.",
  PartnerUpdates: "You won't get emails about partner and family space updates.",
  FollowsLevelsAndMatches: "Your daily update won't include follows, levels and matches.",
};

export default function UnsubscribePage() {
  const [state, setState] = useState<{ done: boolean; text: string } | null>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const token = q.get("token") ?? "";
    const category = q.get("category") ?? "";
    let live = true;
    httpClient
      .post<{ category: string }>(
        "/notifications/unsubscribe",
        { token, category },
        { anonymous: true },
      )
      .then((r) => {
        if (live) setState({ done: true, text: WHAT[r.category] ?? WHAT[category] ?? "" });
      })
      .catch(() => {
        if (live) setState({ done: false, text: "This link has expired or was already used." });
      });
    return () => {
      live = false;
    };
  }, []);

  return (
    <AuthFrame
      title={
        !state ? "Updating your emails…" : state.done ? "You're unsubscribed" : "Link not valid"
      }
      step={8}
      lede={state?.text}
    >
      {state && (
        <Link
          href="/settings#notifications"
          className="press inline-flex h-11 items-center rounded-full bg-accent px-5 text-[15px] font-semibold text-white"
        >
          Manage all email settings
        </Link>
      )}
    </AuthFrame>
  );
}
