/* The API's enum values ↔ the words the screens use (the PRD's own). One place, both directions. */

import type {
  ContentStatus,
  MessagePolicy,
  PostType,
  Source,
  StoryType,
  TreeLevel,
} from "@/types/domain";

function invert<K extends string, V extends string>(map: Record<K, V>): Record<V, K> {
  return Object.fromEntries(Object.entries(map).map(([k, v]) => [v, k])) as Record<V, K>;
}

export type ApiTreeLevel = "Seed" | "Bush" | "Tree" | "BlossomTree" | "OrangeTree";
const TREE: Record<ApiTreeLevel, TreeLevel> = {
  Seed: "Seed",
  Bush: "Bush",
  Tree: "Tree",
  BlossomTree: "Blossom Tree",
  OrangeTree: "Orange Tree",
};
export const treeLevel = (v: string | null | undefined): TreeLevel =>
  TREE[v as ApiTreeLevel] ?? "Seed";

export type ApiPostType =
  | "Question"
  | "SeekingInput"
  | "SupportNeeded"
  | "JustVenting"
  | "JustSharing";
const POST_TYPE: Record<ApiPostType, PostType> = {
  Question: "Question",
  SeekingInput: "Seeking input",
  SupportNeeded: "Support needed",
  JustVenting: "Just venting",
  JustSharing: "Just sharing",
};
const POST_TYPE_API = invert(POST_TYPE);
export const postType = (v: string | null | undefined): PostType =>
  POST_TYPE[v as ApiPostType] ?? "Just sharing";
export const apiPostType = (v: string): ApiPostType =>
  POST_TYPE_API[v as PostType] ?? "JustSharing";

export type ApiSource =
  | "PersonalExperience"
  | "Opinion"
  | "FromMyDoctor"
  | "FromResearch"
  | "ClinicianInput";
const SOURCE: Record<ApiSource, Source> = {
  PersonalExperience: "Personal experience",
  Opinion: "Opinion",
  FromMyDoctor: "From my doctor",
  FromResearch: "From research or guidelines",
  ClinicianInput: "Clinician input",
};
const SOURCE_API = invert(SOURCE);
export const source = (v: string | null | undefined): Source | undefined => SOURCE[v as ApiSource];
/** The API requires a source; "no source given" is sent as personal experience. */
export const apiSource = (v: string | null | undefined): ApiSource =>
  SOURCE_API[v as Source] ?? "PersonalExperience";

export type ApiStoryType = "SuccessStory" | "PregnancyUpdate" | "AdviceFromTheOtherSide";
const STORY_TYPE: Record<ApiStoryType, StoryType> = {
  SuccessStory: "Success story",
  PregnancyUpdate: "Pregnancy update",
  AdviceFromTheOtherSide: "Advice from the other side",
};
const STORY_TYPE_API = invert(STORY_TYPE);
export const storyType = (v: string | null | undefined): StoryType =>
  STORY_TYPE[v as ApiStoryType] ?? "Success story";
export const apiStoryType = (v: string): ApiStoryType =>
  STORY_TYPE_API[v as StoryType] ?? "SuccessStory";

export type ApiContentStatus = "Published" | "HiddenForReview" | "Removed" | "Deleted";
const STATUS: Record<ApiContentStatus, ContentStatus> = {
  Published: "published",
  HiddenForReview: "held",
  Removed: "removed",
  Deleted: "deleted",
};
export const contentStatus = (v: string | null | undefined): ContentStatus =>
  STATUS[v as ApiContentStatus] ?? "published";

export type ApiMessagePermission = "Anyone" | "MembersIFollow" | "NoOne";
const POLICY: Record<ApiMessagePermission, MessagePolicy> = {
  Anyone: "anyone",
  MembersIFollow: "following",
  NoOne: "no-one",
};
const POLICY_API = invert(POLICY);
export const messagePolicy = (v: string | null | undefined): MessagePolicy =>
  POLICY[v as ApiMessagePermission] ?? "following";
export const apiMessagePolicy = (v: MessagePolicy): ApiMessagePermission =>
  POLICY_API[v] ?? "MembersIFollow";

export type ApiVote = "Up" | "Down" | null;
export const vote = (v: string | null | undefined): 1 | -1 | 0 =>
  v === "Up" ? 1 : v === "Down" ? -1 : 0;

/* ------------------------------------------------------------------ Time */

/** Whole minutes since an ISO timestamp (never negative), for `timeAgo` and friends. */
export function minutesSince(iso: string | null | undefined, now = Date.now()): number {
  if (!iso) return 0;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.floor((now - t) / 60_000));
}

export function daysSince(iso: string | null | undefined, now = Date.now()): number {
  return Math.floor(minutesSince(iso, now) / (60 * 24));
}

/** Whole days until an ISO timestamp (0 when past). */
export function daysUntil(iso: string | null | undefined, now = Date.now()): number {
  if (!iso) return 0;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.ceil((t - now) / 86_400_000));
}
