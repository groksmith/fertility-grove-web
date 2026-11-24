"use client";

/* Share your story (PRD §10). Diagnosis starts empty; "Fill from my profile"
   copies it in with a note that members will see it, and is hidden when
   health-data consent is off. */

import { useState } from "react";
import { Spot } from "@/components/art/Scenes";
import { PageHeader } from "@/components/shared";
import { LinkButton } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { storyService } from "@/features/stories";
import { useStore } from "@/lib/mock-server";
import { canMentor } from "@/lib/rules/sunlight";
import { StoryForm } from "../_components/StoryForm";

export default function NewStoryPage() {
  const me = useStore((s) => s.me);
  const [done, setDone] = useState(false);

  if (done) {
    const mentorReady = canMentor(me.level, me.founding) && !me.mentoring.on;
    return (
      <Panel className="mx-auto flex max-w-xl flex-col items-center px-6 py-12 text-center">
        <Spot kind="blossom" size={200} />
        <h1 className="serif mt-4 text-[36px] leading-tight">Thank you for sharing</h1>
        <p className="mt-2 max-w-[46ch] text-[15px] leading-relaxed text-ink-soft">
          Your story is in Success stories. It may be exactly what someone needs to read today.
        </p>
        {mentorReady ? (
          <p className="mt-4 rounded-[14px] bg-purple-tint px-4 py-3 text-[14px] text-purple-ink">
            You&apos;ve reached {me.level}, so you can mentor members who are where you were.
          </p>
        ) : (
          !me.mentoring.on && (
            <p className="mt-4 text-[14px] text-muted">
              When your tree reaches Blossom Tree, you can mentor members who are where you were.
            </p>
          )
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <LinkButton href="/stories">See Success stories</LinkButton>
          {mentorReady && (
            <LinkButton href="/mentors/setup" variant="secondary">
              Set up mentoring
            </LinkButton>
          )}
        </div>
      </Panel>
    );
  }

  return (
    <>
      <PageHeader
        title="Share your story"
        lede="A success story, a pregnancy update, or advice from the other side."
      />
      <StoryForm
        submitLabel="Publish story"
        save={(values) => storyService.create(values)}
        onSaved={() => setDone(true)}
      />
    </>
  );
}
