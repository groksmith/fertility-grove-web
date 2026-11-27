"use client";

/* Learn home. The screen's question: what should I read for where I am?
   Recommended articles lead (matched on the member's diagnosis), then the six
   diagnoses, topics, and search across the library. Every article wears its
   own painted cover: an open book with its topic beside it. */

import { zodResolver } from "@hookform/resolvers/zod";
import { Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Spot } from "@/components/art/Scenes";
import { EmptyState, MoreOnScroll, PageHeader, SampleTag } from "@/components/shared";
import { Panel } from "@/components/ui/panel";
import { articleCover, useArticles, useRecommendedArticles } from "@/features/learn";
import { searchSchema } from "@/features/search";
import { labelsOf, listCodes } from "@/lib/api/options";
import { useStore } from "@/lib/mock-server";
import type { Article } from "@/types/domain";

function ArticleTile({ a, why }: { a: Article; why?: string }) {
  return (
    <Link
      href={`/learn/${a.slug}`}
      className="press group flex w-full flex-col overflow-hidden rounded-[20px] border border-line bg-panel hover:border-line-strong"
    >
      <span className="relative block aspect-[16/9] overflow-hidden" aria-hidden>
        <Image
          src={articleCover(a.slug)}
          alt=""
          fill
          sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
          quality={90}
          className="object-cover transition-transform duration-300 ease-[var(--e-out)] group-hover:scale-[1.03]"
        />
      </span>
      <span className="flex flex-1 flex-col p-5">
        {a.sample && <SampleTag className="mb-2 self-start" />}
        {why && <span className="text-[13px] font-semibold text-green-ink">{why}</span>}
        <span
          className={`${why ? "mt-1" : ""} text-[17px] leading-snug font-semibold text-ink group-hover:underline`}
        >
          {a.title}
        </span>
        <span className="mt-1.5 line-clamp-3 text-[14px] leading-relaxed text-ink-soft">
          {a.summary}
        </span>
        <span className="mt-auto pt-4 text-[13px] text-muted">
          {a.readMinutes} min read · Reviewed {a.lastReviewed}
        </span>
      </span>
    </Link>
  );
}

export default function LearnPage() {
  const me = useStore((s) => s.me);
  const saved = useStore((s) => s.savedArticles);
  const ARTICLES = useStore((s) => s.articles);
  const picks = useStore((s) => s.recommendedArticles);
  // Search as you type: the form only holds the query; Enter does nothing more.
  const form = useForm({ resolver: zodResolver(searchSchema), defaultValues: { q: "" } });
  const q = useWatch({ control: form.control, name: "q" });
  const [topic, setTopic] = useState<string | null>(null);
  // GET /learn/articles: the library, the search as you type and a topic, filtered on the server
  // and loaded page by page; and GET /learn/recommended.
  const library = useArticles();
  const term = q.trim();
  const filtered = useArticles(term ? { search: term } : { topic: topic ?? undefined });
  useRecommendedArticles();
  const idsOf = (data: typeof filtered.data) =>
    (data?.pages ?? []).flatMap((p) => p.articles.map((a) => a.id));

  // While the library is empty the prototype's sample articles stand in, and the screen matches,
  // searches and filters them itself, as the prototype did.
  const demo = useStore((s) => s.demo === true);
  const samples = demo || ARTICLES.some((a) => a.sample);

  // Matched to the member's journey by the API, with its reason; health answers decide.
  const recommended = !me.healthConsent
    ? []
    : samples
      ? ARTICLES.filter(
          (a) =>
            a.diagnoses.some((d) => me.diagnoses.includes(d)) ||
            a.stages.some((st) => me.stages.includes(st)),
        )
          .sort(
            (a, b) =>
              Number(b.diagnoses.some((d) => me.diagnoses.includes(d))) -
              Number(a.diagnoses.some((d) => me.diagnoses.includes(d))),
          )
          .slice(0, 3)
      : (picks ?? []).flatMap((p) => ARTICLES.filter((a) => a.slug === p.slug)).slice(0, 3);

  const whyFor = (a: Article) => {
    const picked = picks?.find((p) => p.slug === a.slug)?.why;
    if (picked) return picked;
    const dx = a.diagnoses.find((d) => me.diagnoses.includes(d));
    const st = a.stages.find((x) => me.stages.includes(x));
    const on = dx ?? st ?? a.diagnosis;
    return `Matched on ${/^[A-Z]{2,}/.test(on) ? on : on.toLowerCase()}`;
  };

  // Every topic the library can filter by (the `topicTag` option list), else those of what loaded.
  const catalogue = samples ? [] : labelsOf(listCodes("topicTag"));
  const topics = catalogue.length
    ? catalogue
    : Array.from(new Set(ARTICLES.flatMap((a) => a.topics))).sort();

  const needle = term.toLowerCase();
  const results = !(term || topic)
    ? null
    : samples
      ? ARTICLES.filter((a) =>
          needle
            ? [a.title, a.summary, ...a.sections.flatMap((s) => [s.heading, ...s.body])]
                .join(" ")
                .toLowerCase()
                .includes(needle)
            : topic !== null && a.topics.includes(topic),
        )
      : idsOf(filtered.data).flatMap((id) => ARTICLES.filter((a) => a.slug === id));

  const finding = recommended.length
    ? `${recommended.length} reviewed ${recommended.length === 1 ? "article matches" : "articles match"} your journey. ${saved.length} saved for your next appointment.`
    : "Six clinician-reviewed overviews, one for each diagnosis.";

  return (
    <>
      <PageHeader
        title="Learn"
        lede={finding}
        art={<Spot kind="plate" size={88} className="hidden sm:block" />}
      />

      {/* biome-ignore lint/a11y/useSemanticElements: role="search" makes this form the search landmark; the suggested <input type="search"> is a control, not a landmark (the field inside is the control) */}
      <form role="search" onSubmit={form.handleSubmit(() => {})} className="mb-8">
        <label className="search-field flex h-12 items-center gap-3 rounded-full border border-line-strong bg-panel px-5 text-muted focus-within:ring-2 focus-within:ring-accent">
          <Search size={18} aria-hidden />
          <span className="sr-only">Search the library</span>
          <input
            {...form.register("q", { onChange: () => setTopic(null) })}
            placeholder="Search the library, e.g. AMH or excision"
            enterKeyHint="search"
            className="w-full bg-transparent text-[15px] text-ink placeholder:text-muted focus:outline-none"
          />
        </label>
      </form>

      {results ? (
        <section aria-labelledby="results-h">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 id="results-h" className="text-[20px] font-semibold">
              {term ? `Results for “${term}”` : `Topic: ${topic}`}
            </h2>
            <button
              type="button"
              className="text-[14px] font-semibold text-accent"
              onClick={() => {
                form.setValue("q", "");
                setTopic(null);
              }}
            >
              Clear
            </button>
          </div>
          {!samples && filtered.isPending ? null : results.length ? (
            <>
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {results.map((a) => (
                  <li key={a.slug} className="flex">
                    <ArticleTile a={a} />
                  </li>
                ))}
              </ul>
              <MoreOnScroll query={filtered} />
            </>
          ) : (
            <EmptyState
              art="lens"
              title="No articles match that yet."
              body="Try different words, or ask in a group."
            />
          )}
        </section>
      ) : (
        <div className="space-y-10">
          {recommended.length > 0 && (
            <section aria-labelledby="rec-h">
              <h2 id="rec-h" className="mb-4 text-[20px] font-semibold">
                Recommended for you
              </h2>
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recommended.map((a) => (
                  <li key={a.slug} className="flex">
                    <ArticleTile a={a} why={whyFor(a)} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="dx-h">
            <h2 id="dx-h" className="mb-4 text-[20px] font-semibold">
              Browse by diagnosis
            </h2>
            <Panel className="p-2">
              <ul className="grid grid-cols-1 sm:grid-cols-2">
                {ARTICLES.map((a) => (
                  <li key={a.slug}>
                    <Link
                      href={`/learn/${a.slug}`}
                      className="press flex items-center gap-4 rounded-[14px] p-3 hover:bg-raised"
                    >
                      <span
                        aria-hidden
                        className="relative h-12 w-16 shrink-0 overflow-hidden rounded-[10px] ring-1 ring-line ring-inset"
                      >
                        <Image
                          src={articleCover(a.slug)}
                          alt=""
                          fill
                          sizes="128px"
                          quality={90}
                          className="object-cover"
                        />
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-2 text-[15px] font-semibold text-ink">
                          {a.diagnosis === "Unexplained" ? "Unexplained infertility" : a.diagnosis}
                          {a.sample && <SampleTag />}
                        </span>
                        <span className="block truncate text-[13px] text-muted">
                          {a.title} · {a.readMinutes} min
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
            <MoreOnScroll query={library} />
          </section>

          <section aria-labelledby="topic-h">
            <h2 id="topic-h" className="mb-4 text-[20px] font-semibold">
              Browse by topic
            </h2>
            <div className="flex flex-wrap gap-2">
              {topics.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTopic(t)}
                  className="press h-10 rounded-full border border-line-strong bg-panel px-4 text-[14px] font-semibold text-ink-soft hover:text-ink"
                >
                  {t}
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
