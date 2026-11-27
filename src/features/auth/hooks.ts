/* React hooks over the auth endpoints. */

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { hasSession, onTokensChange } from "@/lib/http";
import { useStore } from "@/lib/mock-server";
import { authApi } from "./api";
import { loadSession } from "./session";

/** Load the session once on start, and again whenever the tokens change in another tab. */
export function useSessionSync() {
  useEffect(() => {
    void loadSession();
    // A sign-in loads the session itself; here only a session ended elsewhere (401, sign-out).
    const off = onTokensChange(() => {
      if (!hasSession()) void loadSession();
    });
    const onStorage = (e: StorageEvent) => {
      if (e.key === "fg-session") window.location.reload();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      off();
      window.removeEventListener("storage", onStorage);
    };
  }, []);
}

/** GET /auth/sign-up-status for the invite this browser arrived with (PRD §24 beta). */
export function useSignUpStatus() {
  const invite = useStore((s) => s.pendingInvite);
  // The offline demo answers from its Prototype tools (Sign-ups paused, Has a beta invite).
  const demo = useStore((s) => s.demo === true);
  const demoPaused = useStore((s) => s.signupsPaused);
  const demoInvite = useStore((s) => s.hasInvite);
  const query = useQuery({
    queryKey: ["auth", "sign-up-status", invite?.code ?? "", invite?.partnerToken ?? ""],
    queryFn: () =>
      authApi.signUpStatus({ inviteCode: invite?.code, partnerInviteToken: invite?.partnerToken }),
    staleTime: 60_000,
    enabled: !demo,
  });
  if (demo) {
    return {
      loading: false,
      isPaused: demoPaused,
      isInviteOnly: true,
      hasInvite: !demoPaused && demoInvite,
    };
  }
  const status = query.data;
  return {
    loading: query.isPending,
    isPaused: !!status?.isPaused,
    isInviteOnly: status ? status.isInviteOnly : true,
    /** Allowed to create an account from this browser right now. */
    hasInvite: status ? status.canSignUp || (!status.isPaused && status.isInviteValid) : false,
  };
}
