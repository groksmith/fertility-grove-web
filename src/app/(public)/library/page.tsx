"use client";

/* Learn home for visitors (PRD §16): every clinician-reviewed article's title and summary, and a
   search. Reading the full article needs an account. */

import { Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ReadingFrame } from "@/components/common/AuthFrame";
import { JoinBlock } from "@/components/common/Guest";
import { EmptyState, MoreOnScroll } from "@/components/shared";
import { articleCover, usePublicArticles } from "@/features/learn";

export default function LibraryPage() {
  const [q, setQ] = useState("");
  const query = usePublicArticles(q);
  const articles = query.data?.articles ?? [];

  return (
    <ReadingFrame
      title="Learn"
      lede="Clinician-reviewed overviews of each diagnosis and the treatment paths people talk through with their doctor."
    >
      {/* biome-ignore lint/a11y/useSemanticElements: role="search" makes this form the search landmark; the field inside is the control */}
      <form role="search" onSubmit={(e) => e.preventDefault()}>
        <label className="search-field flex h-12 items-center gap-3 rounded-full border border-line-strong bg-panel px-5 text-muted focus-within:ring-2 focus-within:ring-accent">
          <Search size={18} aria-hidden />
          <span className="sr-only">Search the library</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search the library, e.g. AMH or excision"
            enterKeyHint="search"
            className="h-full min-w-0 flex-1 bg-transparent text-[16px] text-ink outline-none placeholder:text-muted"
          />
        </label>
      </form>

      {query.isPending ? null : articles.length === 0 ? (
        <div className="mt-6">
          <EmptyState art="lens" title="No articles match that." body="Try a shorter word." />
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {articles.map((a) => (
            <li key={a.slug}>
              <Link
                href={`/library/${a.slug}`}
                className="press group flex h-full flex-col overflow-hidden rounded-[20px] border border-line bg-panel hover:border-line-strong"
              >
                <span className="relative block aspect-[16/9] overflow-hidden" aria-hidden>
                  <Image
                    src={articleCover(a.slug)}
                    alt=""
                    fill
                    sizes="(min-width: 640px) 360px, 100vw"
                    quality={90}
                    className="object-cover transition-transform duration-300 ease-[var(--e-out)] group-hover:scale-[1.03]"
                  />
                </span>
                <span className="flex flex-1 flex-col p-5">
                  <span className="text-[17px] leading-snug font-semibold text-ink group-hover:underline">
                    {a.title}
                  </span>
                  <span className="mt-1.5 line-clamp-3 text-[14px] leading-relaxed text-ink-soft">
                    {a.summary}
                  </span>
                  {a.lastReviewed && (
                    <span className="mt-auto pt-4 text-[13px] text-muted">
                      Reviewed {a.lastReviewed}
                    </span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <MoreOnScroll query={query} />

      <JoinBlock title="Join free to read the full articles" />
    </ReadingFrame>
  );
}
