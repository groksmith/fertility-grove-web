"use client";

/* Updated Terms (PRD §4): when the Terms or Privacy Policy change, the member accepts the new
   version at their next sign-in. The API refuses everything else (403 TERMS_NOT_ACCEPTED) until
   then, so this screen blocks: Accept, or Sign out. */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthFrame } from "@/components/common/AuthFrame";
import { Button } from "@/components/ui/button";
import { authService, homeFor } from "@/features/auth";
import { get, useStore } from "@/lib/mock-server";

export default function AcceptTermsPage() {
  const router = useRouter();
  const known = useStore((s) => s.terms?.version);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const accept = async () => {
    // The version shown: from the 403 that sent us here, else from the session.
    const fromLink = new URLSearchParams(window.location.search).get("v");
    const version = fromLink || known || "";
    setBusy(true);
    const r = await authService.acceptTerms(version);
    setBusy(false);
    if (!r.ok) {
      // 400: the Terms changed again while reading. The reloaded session has the new version.
      setError(r.error);
      router.replace(`/accept-terms?v=${encodeURIComponent(get().terms?.version ?? "")}`);
      return;
    }
    router.replace(homeFor(get()));
  };

  return (
    <AuthFrame
      title="We've updated our Terms"
      step={7}
      lede="Accept the updated Terms and Privacy Policy to continue."
    >
      <p className="text-[15px] leading-relaxed text-ink-soft">
        Read the{" "}
        <Link href="/terms" className="font-semibold text-accent underline">
          Terms
        </Link>{" "}
        and the{" "}
        <Link href="/privacy" className="font-semibold text-accent underline">
          Privacy Policy
        </Link>
        .
      </p>
      {error && (
        <p
          role="alert"
          className="mt-5 rounded-[14px] bg-danger-soft px-4 py-3 text-[14px] font-semibold text-danger"
        >
          {error}
        </p>
      )}
      <div className="mt-7 flex flex-wrap gap-2">
        <Button onClick={accept} disabled={busy}>
          Accept
        </Button>
        <Button
          variant="ghost"
          onClick={async () => {
            await authService.signOut();
            router.replace("/login");
          }}
        >
          Sign out
        </Button>
      </div>
    </AuthFrame>
  );
}
