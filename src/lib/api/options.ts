/* Answer options travel as codes ("recently_diagnosed") and show as labels ("Recently diagnosed").
   The catalogue comes from GET /api/v1/onboarding/options and is registered here once loaded; until
   then, and for anything it doesn't list, a label's code is its snake_case form, which is how the
   backend writes them. Screens keep using the labels in `config/options.ts`. */

import {
  AGE_RANGES,
  CONNECT_STYLES,
  DIAGNOSES,
  GENDERS,
  JOURNEY_STAGES,
  LOOKING_FOR,
  PATHS,
  PRONOUNS,
  TOPIC_TAGS,
  TREATMENTS,
} from "@/config/options";
import type { CommunityId } from "@/types/domain";

interface OptionDto {
  code?: string | null;
  label?: string | null;
}

const toCode = new Map<string, string>();
const toLabel = new Map<string, string>();

function slug(label: string) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/** Register the backend's catalogue (`lists` from GET /onboarding/options). */
export function registerOptions(lists: Record<string, OptionDto[]> | null | undefined) {
  for (const options of Object.values(lists ?? {})) {
    if (!Array.isArray(options)) continue;
    for (const o of options) {
      if (!o.code || !o.label) continue;
      toCode.set(o.label, o.code);
      toLabel.set(o.code, o.label);
    }
  }
}

/** Seed the fallback reverse map so codes decode before the catalogue loads. */
export function registerLabels(labels: readonly string[]) {
  for (const label of labels) {
    const code = slug(label);
    if (!toLabel.has(code)) toLabel.set(code, label);
  }
}

export function codeOf(label: string): string {
  return toCode.get(label) ?? slug(label);
}

export function labelOf(code: string): string {
  return toLabel.get(code) ?? code;
}

/* ----------------------------------------------------------- Communities */

const communityIds = new Map<CommunityId, string>();
const communityKeys = new Map<string, CommunityId>();

/** The two communities arrive as ids with names; the screens know them as "womens" / "partners". */
export function registerCommunities(
  list: { id: string; name?: string | null }[] | null | undefined,
) {
  for (const c of list ?? []) {
    const key: CommunityId = /women/i.test(c.name ?? "") ? "womens" : "partners";
    communityIds.set(key, c.id);
    communityKeys.set(c.id, key);
  }
}
export const communityKey = (id: string | null | undefined): CommunityId | "" =>
  (id && communityKeys.get(id)) || "";
export const communityIdOf = (key: CommunityId | ""): string | undefined =>
  key ? communityIds.get(key) : undefined;

export const codesOf = (labels: readonly string[]) => labels.map(codeOf);
export const labelsOf = (codes: readonly (string | null)[] | null | undefined) =>
  (codes ?? []).filter((c): c is string => !!c).map(labelOf);

registerLabels([
  ...JOURNEY_STAGES,
  ...TREATMENTS,
  ...DIAGNOSES,
  ...PATHS,
  ...GENDERS,
  ...PRONOUNS,
  ...AGE_RANGES,
  ...LOOKING_FOR,
  ...CONNECT_STYLES,
  ...TOPIC_TAGS,
]);
