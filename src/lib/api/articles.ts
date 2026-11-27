/* Learn articles as the API sends them (a Markdown body plus its section list), mapped to the
   domain `Article` the Learn screens render: sections of plain paragraphs, a cover and a hue. */

import type { Article, Hue } from "@/types/domain";

/** Learn sends diagnoses, stages and topics as labels already, since guests can't load the option
    lists (api-handoff "Option lists and codes"); its filters still take codes. */
const labels = (xs: readonly (string | null)[] | null | undefined) =>
  (xs ?? []).filter((x): x is string => !!x);

export interface ArticleCardDto {
  id: string;
  title: string | null;
  summary: string | null;
  diagnoses: string[];
  topics: string[];
  lastReviewedOn: string | null;
  isSaved: boolean;
  reason: string | null;
}

export interface ArticleDto extends ArticleCardDto {
  isPreview: boolean;
  joinMessage: string | null;
  body: string | null;
  sections: { slug: string | null; heading: string | null }[];
  journeyStages: string[];
  reviewedBy: string | null;
  sources: string[];
  medicalDisclaimer: string | null;
  relatedGroups: { id: string; name: string | null }[];
  myHelpful: boolean | null;
}

/* The painted covers exist for the six launch diagnoses; an article borrows its diagnosis's.
   TODO(api): articles have no cover field (api-handoff, Learn: "Not built"). */
const COVERS: Record<string, string> = {
  Endometriosis: "endometriosis",
  PCOS: "pcos",
  "Diminished ovarian reserve": "diminished-ovarian-reserve",
  "Male factor infertility": "male-factor",
  "Recurrent pregnancy loss": "recurrent-pregnancy-loss",
  Unexplained: "unexplained-infertility",
};
const HUES: Record<string, Hue> = {
  endometriosis: "coral",
  pcos: "purple",
  "diminished-ovarian-reserve": "yellow",
  "male-factor": "blue",
  "recurrent-pregnancy-loss": "pink",
  "unexplained-infertility": "green",
};

const covers = new Map<string, string>();

export function coverKey(diagnoses: string[]): string {
  for (const d of diagnoses) {
    const key = COVERS[d];
    if (key) return key;
  }
  return "unexplained-infertility";
}

/** The cover image for an article id (or a launch article's own slug). */
export function coverFor(slug: string): string {
  return `/assets/brand/learn/${covers.get(slug) ?? (slug in HUES ? slug : "unexplained-infertility")}-topic.webp`;
}

function date(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

/** Inline Markdown as plain text: links keep their words, emphasis marks go. */
function plain(text: string) {
  return text
    .replace(/!\[[^\]]*]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
}

/** "## Heading" blocks become sections; blank-line paragraphs and list items become paragraphs. */
export function sectionsOf(body: string): Article["sections"] {
  const out: Article["sections"] = [];
  let current: Article["sections"][number] | null = null;
  let para: string[] = [];
  const flush = () => {
    if (para.length && current) current.body.push(plain(para.join(" ")));
    para = [];
  };
  for (const raw of body.split(/\r?\n/)) {
    const line = raw.trim();
    const heading = /^#{1,6}\s+(.*)$/.exec(line);
    if (heading) {
      flush();
      current = { heading: plain(heading[1] ?? ""), body: [] };
      out.push(current);
      continue;
    }
    if (!current) {
      current = { heading: "", body: [] };
      out.push(current);
    }
    if (!line) flush();
    else if (/^([-*+]|\d+\.)\s+/.test(line)) {
      flush();
      para = [line.replace(/^([-*+]|\d+\.)\s+/, "")];
      flush();
    } else para.push(line);
  }
  flush();
  return out.filter((s) => s.heading || s.body.length);
}

export function toArticle(a: ArticleCardDto | ArticleDto, had?: Article): Article {
  const diagnoses = labels(a.diagnoses);
  const key = coverKey(diagnoses);
  covers.set(a.id, key);
  const full = "body" in a && !a.isPreview ? a : null;
  const sections = full?.body ? sectionsOf(full.body) : (had?.sections ?? []);
  const words = sections
    .flatMap((s) => s.body)
    .join(" ")
    .split(/\s+/).length;
  return {
    slug: a.id,
    title: a.title ?? "",
    summary: a.summary ?? "",
    diagnosis: diagnoses[0] ?? labels(a.topics)[0] ?? "",
    diagnoses,
    stages: full ? labels(full.journeyStages) : (had?.stages ?? []),
    topics: labels(a.topics),
    reviewedBy: full?.reviewedBy ?? had?.reviewedBy ?? "",
    lastReviewed: date(a.lastReviewedOn),
    nextReview: had?.nextReview ?? "",
    readMinutes: full ? Math.max(1, Math.round(words / 200)) : (had?.readMinutes ?? 5),
    sections,
    sources: full ? full.sources.map((url) => ({ label: url, url })) : (had?.sources ?? []),
    relatedGroups: full ? full.relatedGroups.map((g) => g.id) : (had?.relatedGroups ?? []),
    hue: HUES[key] ?? "green",
  };
}
