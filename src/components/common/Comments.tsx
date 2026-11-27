"use client";

/* A conversation under a post or a success story (PRD §9, §10): the comment composer and one
   comment with its votes, reply, edit, delete, report and block. Replies go one level deep. */

import { zodResolver } from "@hookform/resolvers/zod";
import { MoreHorizontal, Reply } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Name } from "@/components/common/Person";
import { ReportDialog, useResult } from "@/components/common/Safety";
import { Avatar, FormField, SourceLabel, VoteControl } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Menu } from "@/components/ui/dropdown-menu";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { SOURCES } from "@/config/options";
import { displayName, person } from "@/features/auth";
import { allowsDownvote, collapsed, commentSchema, postService } from "@/features/posts";
import { socialService } from "@/features/social";
import { timeAgo } from "@/lib/format";
import { useStore } from "@/lib/mock-server";
import type { Comment, Post } from "@/types/domain";

export function CommentComposer({
  post,
  parent,
  mention,
  onDone,
  autoFocus,
}: {
  post: Post;
  parent?: string;
  mention?: string;
  onDone?: () => void;
  autoFocus?: boolean;
}) {
  // The error shows on a refused submit and stays until a reply is posted (a later submit the
  // service turns down keeps it); nothing takes focus.
  const [error, setError] = useState<string>();
  const form = useForm({
    resolver: zodResolver(commentSchema),
    defaultValues: { body: "", source: "" as const },
    reValidateMode: "onSubmit",
    shouldFocusError: false,
  });
  const { handle, ui } = useResult();
  return (
    <form
      onSubmit={form.handleSubmit(
        async ({ body, source }) => {
          const r = await postService.comment(post.id, body, {
            parentId: parent,
            mention,
            source: source || undefined,
          });
          if (handle(r, "Reply posted")) {
            form.reset();
            setError(undefined);
            onDone?.();
          }
        },
        (errs) => setError(errs.body?.message),
      )}
      className="space-y-3"
    >
      <FormField
        form={form}
        name="body"
        label={mention ? `Reply to @${mention}` : "Add a comment"}
        kind="textarea"
        counterMax={2000}
        hint={
          post.type === "Support needed"
            ? "They asked for support, not advice. A kind word goes a long way."
            : post.type === "Just venting"
              ? "They're not asking for advice. Let them know they're heard."
              : undefined
        }
        rows={3}
        autoFocus={autoFocus}
        controlClassName="min-h-20"
        error={error}
      />
      <div className="flex flex-wrap items-end gap-3">
        {/* biome-ignore lint/a11y/noLabelWithoutControl: the label wraps the shared <Select>, which renders a native <select>, so it is implicitly associated; Biome cannot see through the component */}
        <label className="min-w-0 flex-1 sm:max-w-64">
          <span className="mb-1.5 block text-[13px] text-muted">Source (optional)</span>
          <Controller
            control={form.control}
            name="source"
            render={({ field }) => (
              <Select
                ref={field.ref}
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                className="h-10 text-[14px]"
              >
                <option value="">No source</option>
                {SOURCES.filter((x) => x !== "Clinician input").map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </Select>
            )}
          />
        </label>
        <Button type="submit">{parent ? "Reply" : "Comment"}</Button>
        {onDone && (
          <Button variant="ghost" onClick={onDone}>
            Cancel
          </Button>
        )}
      </div>
      {ui}
    </form>
  );
}

export function CommentItem({
  c,
  post,
  canTakePart,
  reply,
  downvotes = allowsDownvote(post),
}: {
  c: Comment;
  post: Post;
  canTakePart: boolean;
  reply?: boolean;
  /** Success stories take no downvotes at all (PRD §10). */
  downvotes?: boolean;
}) {
  const s = useStore();
  const author = person(s, c.authorId);
  const [replying, setReplying] = useState(false);
  const [reveal, setReveal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(c.body);
  const [report, setReport] = useState(false);
  const { handle, ui } = useResult();
  if (!author) return null;
  const mine = c.authorId === "me";

  if (c.status === "deleted") {
    return <p className="py-3 text-[14px] text-muted">This comment was deleted.</p>;
  }

  return (
    <div className={`flex gap-3 py-4 ${c.minutesAgo === 0 ? "rise" : ""}`}>
      <Avatar member={author} size={reply ? 30 : 36} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px]">
          <Name member={author} pronouns={false} />
          <span className="text-muted">· {timeAgo(c.minutesAgo)}</span>
          {c.edited && <span className="text-muted">· Edited</span>}
        </div>
        {collapsed(c) && !reveal ? (
          <p className="mt-2 text-[14px] text-muted">
            Hidden because members voted it down.{" "}
            <button
              type="button"
              onClick={() => setReveal(true)}
              className="font-semibold text-ink underline"
            >
              Show hidden content
            </button>
          </p>
        ) : editing ? (
          <div className="mt-2 space-y-2">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              max={2000}
              hardStop
              aria-label="Edit comment"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={async () => {
                  // The editor stays open until the API answers, so a refused edit can be fixed.
                  if (await handle(postService.editComment(c.id, draft.trim()))) setEditing(false);
                }}
                disabled={!draft.trim()}
              >
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-1.5 text-[15px] leading-relaxed whitespace-pre-line text-ink">
            {c.mention && <span className="font-semibold text-accent">@{c.mention} </span>}
            {c.body}
          </p>
        )}
        {c.status === "held" && (
          <p className="mt-2 text-[13px] text-[var(--yellow-700)]">
            Held for a moment while our team checks in. Only you can see it.
          </p>
        )}
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <VoteControl
            compact
            up={c.up}
            down={c.down}
            my={c.myVote}
            allowDown={downvotes}
            disabled={mine}
            onVote={(v) => handle(postService.voteComment(c.id, v))}
          />
          {canTakePart && (
            <Button size="sm" variant="ghost" onClick={() => setReplying((v) => !v)}>
              <Reply size={15} /> Reply
            </Button>
          )}
          {c.source && <SourceLabel source={c.source} />}
          <span className="flex-1" />
          <Menu
            label="Comment options"
            trigger={(p) => (
              <button
                {...p}
                type="button"
                aria-label="Comment options"
                className="press grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-raised hover:text-ink"
              >
                <MoreHorizontal size={18} />
              </button>
            )}
            items={
              mine
                ? [
                    { label: "Edit", onSelect: () => setEditing(true) },
                    {
                      label: "Delete",
                      danger: true,
                      onSelect: () => handle(postService.removeComment(c.id)),
                    },
                  ]
                : [
                    { label: "Report comment", onSelect: () => setReport(true) },
                    {
                      label: `Block ${displayName(author)}`,
                      danger: true,
                      onSelect: () => {
                        socialService.block(author.id);
                        toast("Blocked");
                      },
                    },
                  ]
            }
          />
        </div>
        {replying && (
          <div className="mt-3">
            <CommentComposer
              post={post}
              parent={c.parentId ?? c.id}
              mention={author.id === "me" ? undefined : author.handle}
              onDone={() => setReplying(false)}
              autoFocus
            />
          </div>
        )}
      </div>
      <ReportDialog
        open={report}
        onClose={() => setReport(false)}
        target={c.id}
        what="comment"
        authorId={author.id}
      />
      {ui}
    </div>
  );
}
