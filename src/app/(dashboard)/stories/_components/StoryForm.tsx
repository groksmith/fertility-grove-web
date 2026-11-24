"use client";

/* The success story form (PRD §10), for sharing a new story and editing your own. Diagnosis starts
   empty; "Fill from my profile" copies it in with a note that members will see it, and is hidden
   when health-data consent is off. */

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Spot } from "@/components/art/Scenes";
import { useResult } from "@/components/common/Safety";
import { FormField, useUnsavedGuard } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { ChipSelect } from "@/components/ui/chip-select";
import { Choices } from "@/components/ui/choices";
import { Panel } from "@/components/ui/panel";
import { DIAGNOSES, SOURCES, STORY_TYPES, WHAT_HELPED } from "@/config/options";
import { type CreateStoryInput, createStorySchema } from "@/features/stories";
import type { Result } from "@/lib/api/result";
import { useStore } from "@/lib/mock-server";
import type { Source, StoryType } from "@/types/domain";

export type StoryValues = {
  type: StoryType | "";
  title: string;
  body: string;
  diagnoses: string[];
  whatHelped: string[];
  source: Source | "";
};

export function StoryForm({
  initial,
  submitLabel,
  save,
  onSaved,
}: {
  initial?: CreateStoryInput;
  submitLabel: string;
  save: (values: StoryValues) => Promise<Result>;
  onSaved: () => void;
}) {
  const me = useStore((s) => s.me);
  const [done, setDone] = useState(false);
  // One form-level message, set on Publish and replaced (or cleared) by the next Publish.
  const form = useForm({
    resolver: zodResolver(createStorySchema),
    defaultValues: initial ?? {
      type: [],
      title: "",
      body: "",
      diagnoses: [],
      whatHelped: [],
      source: "",
    },
    reValidateMode: "onSubmit",
    shouldFocusError: false,
  });
  const [title, body, diagnoses, whatHelped] = useWatch({
    control: form.control,
    name: ["title", "body", "diagnoses", "whatHelped"],
  });
  const error = form.formState.errors.root?.message;
  const [filled, setFilled] = useState(false);
  const { handle, ui } = useResult();
  const guard = useUnsavedGuard({
    dirty:
      !done &&
      (initial
        ? form.formState.isDirty
        : !!(title.trim() || body.trim() || diagnoses.length || whatHelped.length)),
  });

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit(async (values) => {
        if (values.title.length > 150 || values.body.length > 5000)
          return form.setError("root", {
            message: "Titles can be up to 150 characters and stories up to 5,000.",
          });
        const r = await save({ ...values, type: values.type[0] ?? "" });
        if (!r.ok && r.code !== "unconfirmed") return form.setError("root", { message: r.error });
        if (handle(r)) {
          setDone(true);
          onSaved();
        }
      })}
      className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]"
    >
      <div className="min-w-0 space-y-4">
        {error ? (
          <p
            role="alert"
            className="rounded-[20px] bg-danger-soft px-5 py-4 text-[14px] font-semibold text-danger"
          >
            {error}
          </p>
        ) : null}
        <Panel className="space-y-6 p-5 sm:p-7">
          <Controller
            control={form.control}
            name="type"
            render={({ field }) => (
              <Choices
                legend="Story type"
                options={STORY_TYPES}
                value={field.value}
                onChange={field.onChange}
                columns={3}
              />
            )}
          />
          <FormField form={form} name="title" label="Title" counterMax={150} />
          <FormField
            form={form}
            name="body"
            label="Your story"
            kind="textarea"
            counterMax={5000}
            rows={9}
          />
        </Panel>
        <Panel className="space-y-6 p-5 sm:p-7">
          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[14px] font-semibold">
                Diagnosis <span className="font-normal text-muted">(optional)</span>
              </p>
              {me.healthConsent && me.diagnoses.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    form.setValue(
                      "diagnoses",
                      Array.from(new Set([...diagnoses, ...me.diagnoses])),
                    );
                    setFilled(true);
                  }}
                >
                  Fill from my profile
                </Button>
              )}
            </div>
            {filled && (
              <p className="mb-2 text-[13px] text-muted">
                Members will see the diagnosis on your story.
              </p>
            )}
            <Controller
              control={form.control}
              name="diagnoses"
              render={({ field }) => (
                <ChipSelect
                  label="Diagnosis"
                  options={DIAGNOSES.filter((d) => d !== "Other")}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
          <div>
            <p className="mb-2 text-[14px] font-semibold">
              What helped <span className="font-normal text-muted">(optional)</span>
            </p>
            <Controller
              control={form.control}
              name="whatHelped"
              render={({ field }) => (
                <ChipSelect
                  label="What helped"
                  options={WHAT_HELPED}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
          <FormField
            form={form}
            name="source"
            label="Source"
            kind="select"
            options={[
              { value: "", label: "Choose a source" },
              ...SOURCES.filter((x) => x !== "Clinician input").map((x) => ({
                value: x,
                label: x,
              })),
            ]}
          />
        </Panel>
        <Button type="submit" size="lg">
          {submitLabel}
        </Button>
      </div>
      <aside>
        <Panel className="p-5 text-[14px] leading-relaxed text-ink-soft">
          <Spot kind="blossom" size={120} />
          <h2 className="mt-2 text-[16px] font-semibold text-ink">Your story, your way</h2>
          <p className="mt-1.5">
            Share as much or as little as you like. You don&apos;t have to name a diagnosis, and you
            can post under your handle.
          </p>
        </Panel>
      </aside>
      {ui}
      {guard.ui}
    </form>
  );
}
