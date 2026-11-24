"use client";

/* One success story (PRD §10): author, type, diagnoses, the story, what helped, upvote (no
   downvotes), comments, save, and the options menu — edit or delete your own, report or block
   someone else's. In the list the title opens the story's own page. */

import { ArrowBigUp, Bookmark, MessageSquare, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Name } from "@/components/common/Person";
import { ReportDialog, useResult } from "@/components/common/Safety";
import { SourceLabel, TagChip, TypeChip } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Menu } from "@/components/ui/dropdown-menu";
import { Panel } from "@/components/ui/panel";
import { toast } from "@/components/ui/toast";
import { displayName, person } from "@/features/auth";
import { socialService } from "@/features/social";
import { storyService } from "@/features/stories";
import { useCopy } from "@/hooks/useCopy";
import { timeAgo } from "@/lib/format";
import { useStore } from "@/lib/mock-server";
import type { Story } from "@/types/domain";

export function StoryCard({ story, detail = false }: { story: Story; detail?: boolean }) {
  const s = useStore();
  const router = useRouter();
  const author = person(s, story.authorId);
  const { handle, ui } = useResult();
  const [report, setReport] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [, copy] = useCopy();
  if (!author) return null;
  const mine = story.authorId === "me";
  const href = `/stories/${story.id}`;
  return (
    <Panel as="article" className="p-5 sm:p-6">
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px]">
          <Name member={author} pronouns={false} />
          <span className="text-muted">· {timeAgo(story.minutesAgo)}</span>
        </div>
        <Menu
          label="Story options"
          trigger={(p) => (
            <button
              {...p}
              type="button"
              aria-label="Story options"
              className="press -mt-1 -mr-2 grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-raised hover:text-ink"
            >
              <MoreHorizontal size={20} />
            </button>
          )}
          items={[
            {
              label: "Copy link",
              onSelect: () => {
                copy(`${location.origin}${href}`);
                toast("Link copied");
              },
            },
            {
              label: story.saved ? "Remove from saved" : "Save",
              onSelect: () => storyService.toggleSave(story.id),
            },
            ...(mine
              ? [
                  { label: "Edit story", onSelect: () => router.push(`${href}/edit`) },
                  { label: "Delete story", danger: true, onSelect: () => setConfirmDelete(true) },
                ]
              : [
                  "divider" as const,
                  { label: "Report story", onSelect: () => setReport(true) },
                  {
                    label: `Block ${displayName(author)}`,
                    danger: true,
                    onSelect: () => {
                      void socialService.block(author.id);
                      toast("Blocked. You won't see their posts.");
                    },
                  },
                ]),
          ]}
        />
      </header>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <TypeChip type={story.type} />
        {story.diagnoses.map((d) => (
          <TagChip key={d}>{d}</TagChip>
        ))}
      </div>
      {detail ? (
        <h1 className="serif mt-3 text-[28px] leading-tight lg:text-[32px]">{story.title}</h1>
      ) : (
        <h2 className="mt-3 text-[20px] leading-snug font-semibold">
          <Link href={href} className="hover:underline">
            {story.title}
          </Link>
        </h2>
      )}
      <p className="mt-2 text-[15px] leading-relaxed whitespace-pre-line text-ink">{story.body}</p>
      {story.whatHelped.length > 0 && (
        <p className="mt-3 text-[14px] text-muted">
          <span className="font-semibold text-ink-soft">What helped:</span>{" "}
          {story.whatHelped.join(", ")}
        </p>
      )}
      <footer className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={mine}
          aria-pressed={story.myVote === 1}
          onClick={() => handle(storyService.upvote(story.id))}
          className={`press inline-flex h-9 items-center gap-1.5 rounded-full bg-raised px-3 text-[14px] font-semibold ${story.myVote === 1 ? "text-accent" : "text-ink-soft hover:text-ink"} disabled:opacity-50`}
        >
          <ArrowBigUp size={18} fill={story.myVote === 1 ? "currentColor" : "none"} />
          <span className="tabular">{story.up}</span>
          <span className="sr-only">upvotes</span>
        </button>
        <Link
          href={`${href}#comments`}
          className="press inline-flex h-9 items-center gap-1.5 rounded-full bg-raised px-3 text-[14px] font-semibold text-ink-soft hover:text-ink"
        >
          <MessageSquare size={16} /> <span className="tabular">{story.comments}</span>
          <span className="sr-only">comments</span>
        </Link>
        <button
          type="button"
          onClick={() => storyService.toggleSave(story.id)}
          aria-pressed={story.saved}
          aria-label={story.saved ? "Saved" : "Save"}
          className={`press grid h-9 w-9 place-items-center rounded-full bg-raised ${story.saved ? "text-accent" : "text-muted hover:text-ink"}`}
        >
          <Bookmark size={16} fill={story.saved ? "currentColor" : "none"} />
        </button>
        <span className="flex-1" />
        <SourceLabel source={story.source} />
      </footer>
      <ReportDialog
        open={report}
        onClose={() => setReport(false)}
        target={story.id}
        what="post"
        authorId={author.id}
      />
      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this story?"
        description="It's removed from Success stories. Replies from others stay under “This post was deleted”."
      >
        <div className="flex flex-col gap-2 sm:flex-row-reverse sm:justify-start">
          <Button
            variant="danger"
            onClick={async () => {
              setConfirmDelete(false);
              const r = await storyService.remove(story.id);
              if (r.ok) {
                toast("Story deleted");
                if (detail) router.push("/stories");
              }
            }}
          >
            Delete story
          </Button>
          <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
            Cancel
          </Button>
        </div>
      </Dialog>
      {ui}
    </Panel>
  );
}
