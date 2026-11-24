"use client";

/* The partner invite page (PRD §7): the member's first name, their note, and
   Accept invite. The note shows only here, never in the email. */

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Spot } from "@/components/art/Scenes";
import { AuthFrame } from "@/components/common/AuthFrame";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { authService } from "@/features/auth";
import { partnerService } from "@/features/partner";
import { useStore } from "@/lib/mock-server";
import { MSG } from "@/lib/rules/validation";

export default function PartnerInvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const signedIn = useStore((s) => s.signedIn);
  const step = useStore((s) => s.step);
  // GET /partner-invites/{token}: the inviter's first name and note. Null reads as expired.
  const query = useQuery({
    queryKey: ["partner-invite", token],
    queryFn: () => partnerService.publicInvite(token ?? ""),
    enabled: !!token,
  });
  const invite = query.data;
  const name = invite?.inviterFirstName || "Your partner";

  if (query.isPending) return <div className="min-h-dvh bg-ground" aria-busy="true" />;

  if (!invite) {
    return (
      <AuthFrame title="This invite has expired" step={5} lede={MSG.inviteExpired}>
        <Link
          href="/help"
          className="press inline-flex h-11 items-center rounded-full px-5 text-[15px] font-semibold text-ink hover:bg-raised"
        >
          How partner invites work
        </Link>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame
      title={`${name} invited you`}
      step={8}
      lede={`${name} would like you to join Fertility Grove as their partner. You'll have your own private account and a community for partners.`}
      footer={
        <p>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-accent underline">
            Sign in to accept
          </Link>
        </p>
      }
    >
      {invite.note && (
        <figure className="rounded-[20px] border border-line bg-panel p-5">
          <Spot kind="seeds" size={120} />
          <blockquote className="mt-3 text-[16px] leading-relaxed text-ink">
            “{invite.note}”
          </blockquote>
          <figcaption className="mt-2 text-[14px] text-muted">A note from {name}</figcaption>
        </figure>
      )}
      <ul className="mt-6 space-y-2 text-[15px] leading-relaxed text-ink-soft">
        <li>{name} never sees your posts, messages or handle.</li>
        <li>You choose what to share in your family space, item by item.</li>
      </ul>
      <Button
        className="mt-7"
        onClick={async () => {
          if (signedIn) {
            const r = await partnerService.accept(token ?? "");
            if (!r.ok) return toast(r.error);
            toast(`You're now linked with ${name}`);
            return router.push(step < 9 ? `/onboarding/${step}` : "/family");
          }
          // Signed out: sign-up (or sign-in) keeps the token and accepts right after.
          authService.arriveWithInvite("partner", token ?? "", invite.inviterFirstName ?? "");
          router.push("/signup");
        }}
      >
        Accept invite
      </Button>
    </AuthFrame>
  );
}
