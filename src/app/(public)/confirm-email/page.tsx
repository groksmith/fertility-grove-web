"use client";

/* Opening the confirmation link (PRD §4). It works once, within 60 minutes. */

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthFrame } from "@/components/common/AuthFrame";
import { Button } from "@/components/ui/button";
import { authService } from "@/features/auth";
import { useHydrated, useStore } from "@/lib/mock-server";
import { MSG } from "@/lib/rules/validation";

export default function ConfirmEmailPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { me, step, signedIn, pendingEmail } = useStore();
  const [state, setState] = useState<"working" | "done" | "expired">("working");
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    // The link's outcome is decided once, on arrival: POST /auth/verify-email with its token.
    const token = new URLSearchParams(window.location.search).get("token") ?? "";
    let live = true;
    void authService.confirmEmail(token).then((r) => {
      if (live) setState(r.ok ? "done" : "expired");
    });
    return () => {
      live = false;
    };
  }, [hydrated]);

  const next = !signedIn ? "/login" : step < 9 ? `/onboarding/${step}` : "/feed";

  if (state === "expired") {
    return (
      <AuthFrame title="This link has expired" step={3} lede={MSG.linkExpired}>
        {resent ? (
          <p
            role="status"
            className="rounded-[20px] border border-line bg-panel p-5 text-[15px] text-ink"
          >
            We sent a new link to {me.email || "your email"}. It works once and expires in 60
            minutes.
          </p>
        ) : (
          <Button
            onClick={() => {
              void authService.resendLink(pendingEmail || me.email);
              setResent(true);
            }}
          >
            Send a new link
          </Button>
        )}
      </AuthFrame>
    );
  }

  return (
    <AuthFrame
      title={state === "done" ? "Your email is confirmed" : "Confirming…"}
      step={8}
      lede={
        state === "done"
          ? "Posting, commenting, voting and messaging are now open to you."
          : undefined
      }
    >
      {state === "done" && <Button onClick={() => router.push(next)}>Continue</Button>}
    </AuthFrame>
  );
}
