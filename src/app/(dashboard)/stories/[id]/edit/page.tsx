"use client";

/* Edit your success story (PRD §9: authors can edit what they post at any time; PRD §19: the edit
   is checked for crisis words again). The same form as sharing one. */

import { useParams, useRouter } from "next/navigation";
import { EmptyState, PageHeader } from "@/components/shared";
import { LinkButton } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { usePost } from "@/features/posts";
import { storyService } from "@/features/stories";
import { useStore } from "@/lib/mock-server";
import { StoryForm } from "../../_components/StoryForm";

export default function EditStoryPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const query = usePost(id ?? "");
  const story = useStore((s) => s.stories.find((x) => x.id === id));

  if (!story && query.isPending) return null;
  if (story?.authorId !== "me") {
    return (
      <EmptyState
        art="lens"
        title="This story isn't available."
        body="Only its author can edit a story."
        action={
          <LinkButton href="/stories" variant="secondary">
            Back to Success stories
          </LinkButton>
        }
      />
    );
  }

  return (
    <>
      <PageHeader title="Edit your story" lede="Changes show as soon as you save." />
      <StoryForm
        initial={{
          type: [story.type],
          title: story.title,
          body: story.body,
          diagnoses: story.diagnoses,
          whatHelped: story.whatHelped,
          source: story.source,
        }}
        submitLabel="Save story"
        save={(values) => storyService.edit(story.id, values)}
        onSaved={() => {
          toast("Story saved");
          router.push(`/stories/${story.id}`);
        }}
      />
    </>
  );
}
