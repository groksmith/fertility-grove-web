"use client";

/* Every signed-in screen. The gate waits for the API session, then sends people where their
   account state says they belong: suspended → /suspended, deleting → /restore, signed out →
   /login (or a group's or post's public page, when guests may read it), outdated Terms →
   /accept-terms, and anyone mid-onboarding back to the next unfinished screen. */

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/common/AppShell";
import { LevelUp } from "@/components/common/LevelUp";
import { usePublicGroup, usePublicPost } from "@/features/posts";
import { useHydrated, useStore } from "@/lib/mock-server";

/** Signed out on a group or post that guests may read: show its public page instead of asking
    them to sign in (PRD v1.2 §10). Asks the public endpoints; anything else goes to sign-in. */
function useGuestPage(path: string, ask: boolean) {
  const [, kind, raw] = path.split("/");
  const id = ask && raw && raw !== "new" ? raw : "";
  const group = usePublicGroup(kind === "groups" ? id : "");
  const post = usePublicPost(kind === "posts" ? id : "");
  if (kind === "groups" && id)
    return group.isPending ? null : group.data ? `/community/${id}` : "/login";
  if (kind === "posts" && id) return post.isPending ? null : post.data ? `/p/${id}` : "/login";
  // Learn is open to visitors as titles and summaries (PRD §16).
  if (kind === "learn") return id ? `/library/${id}` : "/library";
  return "/login";
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const router = useRouter();
  const path = usePathname();
  const s = useStore();
  // Signing out here always opens sign-in; only arriving signed out finds a public page.
  const [wasSignedIn, setWasSignedIn] = useState(false);
  if (hydrated && s.signedIn && !wasSignedIn) setWasSignedIn(true);
  const ready = hydrated && s.session !== "loading";
  const guest = useGuestPage(path, ready && !s.signedIn && !wasSignedIn);

  const target = s.suspension
    ? "/suspended"
    : s.deletion
      ? "/restore"
      : !s.signedIn
        ? wasSignedIn
          ? "/login"
          : guest
        : s.terms?.mustAccept
          ? `/accept-terms?v=${encodeURIComponent(s.terms.version)}`
          : s.step < 9
            ? `/onboarding/${s.step}`
            : null;

  useEffect(() => {
    if (ready && target) router.replace(target);
  }, [ready, target, router]);

  if (!ready || target || (!s.signedIn && !target)) {
    return <div className="min-h-dvh bg-ground" aria-busy="true" />;
  }

  return (
    <AppShell>
      {children}
      <LevelUp />
    </AppShell>
  );
}
