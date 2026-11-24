/* The API names people in many shapes (an author on a post, the other side of a conversation, a
   match…). Each becomes the domain `Member` the shared components (`Person`, `Avatar`, `Name`) take,
   filling what the API doesn't send with neutral defaults. */

import type { Badge, Hue, Member } from "@/types/domain";
import { treeLevel } from "./enums";

const HUES: readonly Hue[] = ["green", "coral", "yellow", "blue", "pink", "purple"];

/* -------------------------------------------------------------- Avatars */

/** The avatar code the web app stores: `"<hue>"` (initial on that colour) or `"<hue>:<preset>"`.
    TODO(api): the backend keeps the code opaque and has no avatar catalogue or background colour
    field yet (docs/backend-tasks.md B1); anything else decodes to a steady default. */
export function avatarCode(hue: Hue, preset: number | undefined): string {
  return preset !== undefined && preset >= 0 ? `${hue}:${preset}` : hue;
}

export function decodeAvatar(code: string | null | undefined): { hue: Hue; preset?: number } {
  if (!code) return { hue: "green" };
  const [hue, preset] = code.split(":");
  if (hue && (HUES as readonly string[]).includes(hue)) {
    const n = preset === undefined ? Number.NaN : Number(preset);
    return { hue: hue as Hue, preset: Number.isInteger(n) && n >= 0 ? n : undefined };
  }
  return { hue: "green" };
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
    avatarHue: avatar.hue,
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
