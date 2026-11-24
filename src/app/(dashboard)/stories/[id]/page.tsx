"use client";

/* One success story and its conversation (PRD §10): "Any member can post and comment in Success
   stories without joining." Comments work as on posts, one level deep, with no downvotes. */

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { CommentComposer, CommentItem } from "@/components/common/Comments";
import { EmptyState } from "@/components/shared";
import { LinkButton } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { Segmented } from "@/components/ui/segmented";
import { commentCount, commentsFor, usePost } from "@/features/posts";
import { useStore } from "@/lib/mock-server";
import type { Post } from "@/types/domain";
import { StoryCard } from "../_components/StoryCard";

export default function StoryPage() {
  const { id } = useParams<{ id: string }>();
  const s = useStore();
  const [sort, setSort] = useState<"top" | "newest">("top");
  // GET /posts/{id}: a story is a post without a group; its thread comes with it.
  const query = usePost(id ?? "", sort);
  const story = s.stories.find((x) => x.id === id);

  if (!story && query.isPending) return null;
  if (!story || s.blocked.includes(story.authorId)) {
    return (
      <EmptyState
        art="lens"
        title="This story isn't available."
        body="It may have been deleted or removed."
        action={
          <LinkButton href="/stories" variant="secondary">
            Back to Success stories
          </LinkButton>
        }
      />
    );
  }

  // The comment pieces take a post; a story is one, with no group and no downvotes.
  const asPost: Post = {
    id: story.id,
    groupId: "",
    authorId: story.authorId,
    type: "Just sharing",
    title: story.title,
    body: story.body,
    source: story.source,
    tags: [],
    allowSharing: false,
    showToVisitors: false,
    minutesAgo: story.minutesAgo,
    up: story.up,
    down: 0,
    myVote: story.myVote,
    saved: story.saved,
    status: "published",
  };
  const threads = commentsFor(s, story.id, sort);
  const total = commentCount(s, story.id) || story.comments;

  return (
    <>
      <Link
        href="/stories"
        className="mb-3 -ml-1 inline-flex min-h-11 items-center gap-1.5 px-1 text-[15px] font-semibold text-muted hover:text-ink"
      >
        <ArrowLeft size={16} /> Success stories
      </Link>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          <StoryCard story={story} detail />

          <Panel className="p-5 sm:p-7" id="comments" aria-labelledby="comments-h">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="comments-h" className="text-[18px] font-semibold">
                Comments <span className="tabular font-normal text-muted">{total}</span>
              </h2>
              <Segmented
                label="Sort comments"
                value={sort}
                onChange={setSort}
                options={[
                  { id: "top", label: "Top" },
                  { id: "newest", label: "Newest" },
                ]}
              />
            </div>

            <div className="mt-5 rounded-[14px] bg-ground p-4">
              <CommentComposer post={asPost} />
            </div>

            {threads.length === 0 ? (
              <p className="mt-6 text-[15px] text-muted">
                No replies yet. Yours could be the first.
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-line">
                {threads.map(({ comment, replies }) => (
                  <li key={comment.id}>
                    <CommentItem c={comment} post={asPost} canTakePart downvotes={false} />
                    {replies.length > 0 && (
                      <ul className="ml-6 border-l-2 border-line pl-4 sm:ml-12">
                        {replies.map((r) => (
                          <li key={r.id}>
                            <CommentItem c={r} post={asPost} canTakePart downvotes={false} reply />
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
        <aside>
          <Panel className="p-5 text-[14px] leading-relaxed text-ink-soft">
            <h2 className="text-[16px] font-semibold text-ink">Success stories</h2>
            <p className="mt-1.5">
              One space for everyone, not a group: any member can comment without joining. There are
              no downvotes here.
            </p>
          </Panel>
        </aside>
      </div>
    </>
  );
}
