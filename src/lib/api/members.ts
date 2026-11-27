/* The API names people in many shapes (an author on a post, the other side of a conversation, a
   match…). Each becomes the domain `Member` the shared components (`Person`, `Avatar`, `Name`) take,
   filling what the API doesn't send with neutral defaults. */

import type { Badge, Hue, Member } from "@/types/domain";
import { treeLevel } from "./enums";
import { listCodes } from "./options";

const HUES: readonly Hue[] = ["green", "coral", "yellow", "blue", "pink", "purple"];

/* -------------------------------------------------------------- Avatars */

/* `avatarCode` is a code from the `avatar` option list (`avatar_01`…), or `null` for none
   (api-handoff "Option lists and codes"). The preset index the screens use is the code's place in
   that list, so the twelve painted avatars line up with the catalogue's order. */

/** The code for preset `preset` (0-based), or `null` for no avatar. */
export function avatarCode(preset: number | undefined): string | null {
  if (preset === undefined || preset < 0) return null;
  return listCodes("avatar")[preset] ?? `avatar_${String(preset + 1).padStart(2, "0")}`;
}

/** The preset index for a code; `undefined` for none or one we can't place. A pre-catalogue
    `"<hue>:<preset>"` code still reads, colour included. */
export function decodeAvatar(code: string | null | undefined): { hue?: Hue; preset?: number } {
  if (!code) return {};
  const at = listCodes("avatar").indexOf(code);
  if (at >= 0) return { preset: at };
  const seeded = /^avatar_(\d+)$/.exec(code);
  if (seeded) return { preset: Number(seeded[1]) - 1 };
  const [hue, preset] = code.split(":");
  if (hue && (HUES as readonly string[]).includes(hue)) {
    const n = preset === undefined ? Number.NaN : Number(preset);
    return { hue: hue as Hue, preset: Number.isInteger(n) && n >= 0 ? n : undefined };
  }
  return {};
}

/* TODO(api): the API has no avatar background colour yet (docs/backend-tasks.md B1). Until it
   does, the member's own choice is kept on this device, and everyone else shows the PRD's default,
   Green. */
const HUE_KEY = "fg.avatarHue";

export function rememberHue(hue: Hue) {
  try {
    localStorage.setItem(HUE_KEY, hue);
  } catch {
    // Storage blocked: the colour lasts for this visit only.
  }
}

export function rememberedHue(): Hue | undefined {
  try {
    const h = localStorage.getItem(HUE_KEY);
    return h && (HUES as readonly string[]).includes(h) ? (h as Hue) : undefined;
  } catch {
    return undefined;
  }
}

/* ---------------------------------------------------------- Display name */

/** "Annie M." → real name shown; "@annie_grows" (or no name) → the handle. */
export function splitDisplayName(displayName: string | null | undefined, handle: string) {
  const name = (displayName ?? "").trim();
  if (!name || name.startsWith("@")) {
    return { showRealName: false, firstName: "", lastInitial: "", handle: handle || name.slice(1) };
  }
  const m = /^(.*\S)\s+(\S)\.$/.exec(name);
  return {
    showRealName: true,
    firstName: m?.[1] ?? name,
    lastInitial: m?.[2] ?? "",
    handle,
  };
}

export function badgesOf(...labels: (string | null | undefined | false)[]): Badge[] {
  const out: Badge[] = [];
  for (const label of labels) {
    const l = (label || "").toLowerCase();
    if (l === "founding mentor") out.push("founding-mentor");
    else if (l === "mentor") out.push("mentor");
    else if (l === "clinician") out.push("clinician");
    else if (l === "team") out.push("team");
    else if (l === "partner") out.push("partner");
  }
  return out;
}

export interface MemberRef {
  memberId?: string | null;
  handle?: string | null;
  displayName?: string | null;
  avatarCode?: string | null;
  treeLevel?: string | null;
  pronouns?: string | null;
  badge?: string | null;
  isMe?: boolean;
}

/** Someone the API names, as a `Member`. A deleted member (`handle: null`) gets no profile link. */
/** The fields a reference really carries, to merge over a richer cached copy. */
export function memberPatch(ref: MemberRef): Partial<Member> & { id: string } {
  const m = memberFromRef(ref);
  return {
    id: m.id,
    ...(m.apiId ? { apiId: m.apiId } : {}),
    handle: m.handle,
    firstName: m.firstName,
    lastInitial: m.lastInitial,
    showRealName: m.showRealName,
    level: m.level,
    ...(ref.avatarCode !== undefined ? { avatarHue: m.avatarHue, avatar: m.avatar } : {}),
    ...(ref.pronouns !== undefined ? { pronouns: m.pronouns } : {}),
    ...(ref.badge !== undefined ? { badges: m.badges } : {}),
    unavailable: m.unavailable,
  };
}

export function memberFromRef(ref: MemberRef): Member {
  const handle = ref.handle ?? "";
  const name = splitDisplayName(
    ref.displayName ?? (handle ? `@${handle}` : "Deleted member"),
    handle,
  );
  const avatar = decodeAvatar(ref.avatarCode);
  return {
    id: ref.isMe ? "me" : handle || `gone:${ref.memberId ?? ref.displayName ?? ""}`,
    apiId: ref.memberId ?? undefined,
    handle: name.handle,
    firstName: name.showRealName ? name.firstName : ref.displayName || name.handle,
    lastInitial: name.lastInitial,
    showRealName: name.showRealName || !handle,
    pronouns: ref.pronouns || undefined,
    avatarHue: (ref.isMe ? rememberedHue() : undefined) ?? avatar.hue ?? "green",
    avatar: avatar.preset,
    sunlight: 0,
    level: treeLevel(ref.treeLevel),
    badges: badgesOf(ref.badge),
    community: "womens",
    shareJourney: false,
    diagnoses: [],
    stages: [],
    paths: [],
    followers: 0,
    messagePolicy: "following",
    suggestMe: true,
    follows: [],
    joinedDaysAgo: 0,
    unavailable: handle ? undefined : "deleting",
  };
}

/** Merge references into a member cache: new people are added whole, known ones refreshed. */
export function mergeMembers(cache: Member[], refs: MemberRef[]): Member[] {
  const byId = new Map(cache.map((m) => [m.id, m]));
  for (const ref of refs) {
    if (ref.isMe) continue;
    const patch = memberPatch(ref);
    const had = byId.get(patch.id);
    byId.set(patch.id, had ? { ...had, ...patch } : memberFromRef(ref));
  }
  return [...byId.values()];
}
