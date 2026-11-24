"use client";

/* A Learn article for visitors (PRD §16, criterion 2): the title and summary only, with "Join free
   to read the full article". Members open the whole article at /learn/{id}. */

import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ReadingFrame } from "@/components/common/AuthFrame";
import { JoinBlock } from "@/components/common/Guest";
import { EmptyState } from "@/components/shared";
import { LinkButton } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { articleCover, usePublicArticle } from "@/features/learn";

export default function LibraryArticlePage() {
  const { id } = useParams<{ id: string }>();
  const query = usePublicArticle(id ?? "");

  if (query.isPending) return null;
  const data = query.data;
  if (!data) {
    return (
      <ReadingFrame title="Learn">
        <EmptyState
          art="lens"
          title="We couldn't find that article."
          body="It may have moved while it was being reviewed."
          action={<LinkButton href="/library">Back to Learn</LinkButton>}
        />
      </ReadingFrame>
    );
  }

  const { article: a } = data;
  return (
    <ReadingFrame title={a.title} lede={a.summary}>
      <Link
        href="/library"
        className="mb-4 -ml-1 inline-flex min-h-11 items-center gap-1.5 px-1 text-[15px] font-semibold text-muted hover:text-ink"
      >
        <ArrowLeft size={16} /> Learn
      </Link>
      <Panel className="overflow-hidden">
        <span className="relative block aspect-[16/9]" aria-hidden>
          <Image
            src={articleCover(a.slug)}
            alt=""
            fill
            sizes="(min-width: 760px) 700px, 100vw"
            quality={90}
            className="object-cover"
          />
        </span>
        {a.lastReviewed && (
          <p className="px-6 py-4 text-[14px] text-muted">Clinician-reviewed · {a.lastReviewed}</p>
        )}
      </Panel>
      <JoinBlock title="Join free to read the full article">
        {data.joinMessage && (
          <p className="mt-2 max-w-[52ch] text-[15px] leading-relaxed text-white/85">
            {data.joinMessage}
          </p>
        )}
      </JoinBlock>
    </ReadingFrame>
  );
}
