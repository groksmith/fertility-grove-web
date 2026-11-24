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
  const query = useQuery({
    queryKey: ["auth", "sign-up-status", invite?.code ?? "", invite?.partnerToken ?? ""],
    queryFn: () =>
      authApi.signUpStatus({ inviteCode: invite?.code, partnerInviteToken: invite?.partnerToken }),
    staleTime: 60_000,
  });
  const status = query.data;
  return {
    loading: query.isPending,
    isPaused: !!status?.isPaused,
    isInviteOnly: status ? status.isInviteOnly : true,
    /** Allowed to create an account from this browser right now. */
    hasInvite: status ? status.canSignUp || (!status.isPaused && status.isInviteValid) : false,
  };
}
