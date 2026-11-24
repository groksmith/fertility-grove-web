"use client";

/* Success stories (PRD §10): one space for the whole community, not a group.
   Anyone can post without joining, there are no downvotes, and stories stay
   out of the feed unless the member turns them on. */

import { PenLine } from "lucide-react";
import { useState } from "react";
import { Spot } from "@/components/art/Scenes";
import { EmptyState, MoreOnScroll } from "@/components/shared";
import { LinkButton } from "@/components/ui/button";
import { ChipSelect } from "@/components/ui/chip-select";
import { Panel } from "@/components/ui/panel";
import { WHAT_HELPED } from "@/config/options";
import { useStories } from "@/features/stories";
import { useStore } from "@/lib/mock-server";
import { StoryCard } from "./_components/StoryCard";

export default function StoriesPage() {
  const s = useStore();
  const [diag, setDiag] = useState<string[]>([]);
  const [helped, setHelped] = useState<string[]>([]);
  // GET /success-stories, filtered on the server, into the cache this page reads.
  useStories();
  const pages = useStories({ diagnoses: diag, whatHelped: helped });
  const diagnoses = Array.from(new Set(s.stories.flatMap((x) => x.diagnoses)));
  const helpedOptions = WHAT_HELPED.filter((h) => s.stories.some((x) => x.whatHelped.includes(h)));
  const stories = s.stories
    .filter((x) => !s.blocked.includes(x.authorId))
    .filter((x) => !diag.length || x.diagnoses.some((d) => diag.includes(d)))
    .filter((x) => !helped.length || x.whatHelped.some((h) => helped.includes(h)))
    .sort((a, b) => a.minutesAgo - b.minutesAgo);

  return (
    <>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4 lg:mb-8">
        <div className="flex min-w-0 items-center gap-4">
          <Spot kind="stories" size={104} className="hidden sm:block" />
          <div>
            <h1 className="serif text-[28px] leading-[1.1] lg:text-[32px]">Success stories</h1>
            <p className="mt-2 max-w-[60ch] text-[15px] leading-relaxed text-ink-soft">
              Hope from the other side, kept in its own space so you can visit when you&apos;re
              ready.
            </p>
          </div>
        </div>
        <LinkButton href="/stories/new">
          <PenLine size={17} /> Share your story
        </LinkButton>
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          {stories.length === 0 ? (
            <EmptyState
              art="blossom"
              title={
                s.stories.length
                  ? "No stories match those filters."
                  : "No stories here yet. When you're ready, yours could be the first."
              }
              action={
                s.stories.length ? undefined : (
                  <LinkButton href="/stories/new">Share your story</LinkButton>
                )
              }
            />
          ) : (
            <ul className="space-y-4">
              {stories.map((x) => (
                <li key={x.id}>
                  <StoryCard story={x} />
                </li>
              ))}
            </ul>
          )}
          {stories.length > 0 && <MoreOnScroll query={pages} />}
        </div>
        <aside className="space-y-4">
          <Panel className="space-y-5 p-5">
            <h2 className="text-[16px] font-semibold">Filter stories</h2>
            <div>
              <p className="mb-2 text-[14px] text-muted">Diagnosis</p>
              <ChipSelect label="Diagnosis" options={diagnoses} value={diag} onChange={setDiag} />
            </div>
            <div>
              <p className="mb-2 text-[14px] text-muted">What helped</p>
              <ChipSelect
                label="What helped"
                options={helpedOptions}
                value={helped}
                onChange={setHelped}
              />
            </div>
          </Panel>
          <Panel className="p-5 text-[14px] leading-relaxed text-ink-soft">
            <h2 className="text-[16px] font-semibold text-ink">In your feed?</h2>
            <p className="mt-1.5">
              Stories only appear in your feed if you turn on &quot;Show success stories in my
              feed&quot; in Settings. It&apos;s {s.me.showStories ? "on" : "off"} for you right now.
            </p>
          </Panel>
        </aside>
      </div>
    </>
  );
}
