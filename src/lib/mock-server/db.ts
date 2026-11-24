/* The mock server's database: the whole prototype's state, its four demo personas, and the tiny
   external store that persists it to localStorage. There is no backend: every feature service
   (src/features/<name>/service.ts) edits this object where it will later call the API. */

import { useSyncExternalStore } from "react";
import { CREDITS } from "@/config/options";
import { levelFor } from "@/lib/rules/sunlight";
import type {
  AccountStatus,
  AppointmentList,
  Article,
  Comment,
  CommunityId,
  Conversation,
  FamilyActivity,
  FamilyItem,
  FamilyNote,
  Group,
  GuideChat,
  Hue,
  Member,
  MentorRequest,
  MessagePolicy,
  Notification,
  PartnerInvite,
  Post,
  Purchase,
  Report,
  Story,
  SunlightEvent,
  TreeLevel,
} from "@/types/domain";
import { ARTICLES } from "./seed/articles";
import { GROUPS } from "./seed/groups";
import { MEMBERS } from "./seed/members";
import { COMMENTS, POSTS, STORIES } from "./seed/posts";
import {
  CONVERSATIONS,
  DEMO_SUNLIGHT,
  MENTOR_REQUESTS,
  NOTIFICATIONS,
  SUNLIGHT_HISTORY,
} from "./seed/social";

export interface Me {
  email: string;
  status: AccountStatus;
  signupDay: number;
  joinedDaysAgo: number;
  firstName: string;
  lastName: string;
  handle: string;
  previousHandle?: string;
  handleChangedDaysAgo?: number;
  showRealName: boolean;
  gender: string;
  genderSelf: string;
  pronouns: string;
  pronounsSelf: string;
  ageRange: string;
  zip: string;
  aboutMe: string;
  myStory: string;
  avatarHue: Hue;
  avatarPreset: number;
  hasPhoto: boolean;
  community: CommunityId | "";
  stages: string[];
  treatments: string[];
  nextDate: string;
  diagnoses: string[];
  otherDiagnosis: string;
  paths: string[];
  lookingFor: string[];
  connectStyle: string[];
  healthConsent: boolean;
  suggestMe: boolean;
  messagePolicy: MessagePolicy;
  wantMentor: boolean;
  showStories: boolean;
  shareJourney: boolean;
  showPartner: boolean;
  notify: {
    comments: boolean;
    messages: boolean;
    mentoring: boolean;
    partner: boolean;
    includeFollows: boolean;
    pauseAll: boolean;
  };
  sunlight: number;
  level: TreeLevel;
  history: SunlightEvent[];
  founding: boolean;
  mentoring: {
    on: boolean;
    paused: boolean;
    bio: string;
    helpsWith: string[];
    capacity: number;
  };
  skipped: string[];
  /** The member's fixed invite code (PRD §10). It never changes with the handle. */
  inviteCode: string;
  /** Kept server-side: "Hide for 30 days" on the Complete your profile card (PRD §5). */
  profileCardHiddenUntil?: number;
  guidelinesAccepted: boolean;
}

export interface State {
  persona: "new" | "member" | "partner" | "mentor";
  /** The API session: "none" signed out, "loading" while `me` is fetched, "ready" once filled. */
  session: "none" | "loading" | "ready";
  /** Filled from the API: the member must accept this Terms version before anything else. */
  terms?: { mustAccept: boolean; version: string };
  /** An invite code or partner-invite token picked up from a link, sent with sign-up. */
  pendingInvite?: { code?: string; partnerToken?: string; inviterFirstName?: string };
  /** A new email waiting for confirmation (PUT /auth/account). */
  pendingEmail?: string;
  /** GET /matches/posts: up to 3 a day from matched groups, with the reason shown. */
  matchedPosts?: { postId: string; reason: string }[];
  /** GET /matches/groups: matched groups, best first, with the reason shown. */
  matchedGroups?: { groupId: string; why: string }[];
  /** GET /matches/peers and /matches/mentors: matched people (by handle), with the reason. */
  matchedPeers?: { id: string; why: string }[];
  matchedMentors?: { id: string; why: string }[];
  /** GET /conversations `requestCount`: message requests waiting (any filter). */
  conversationRequests?: number;
  /** GET /notifications/unread-count: the bell number (polled). */
  unreadNotificationCount?: number;
  /** GET /matches/mentors: false when the member hasn't asked for a mentor. */
  wantsMentorMatches?: boolean;
  signedIn: boolean;
  /** 1–8 while onboarding, 9 when complete. */
  step: number;
  keepSignedIn: boolean;
  /** Prototype only: the password chosen at sign-up, so sign-in can be tried. */
  password?: string;
  failedAttempts: number;
  lockedOut: boolean;
  hasInvite: boolean;
  signupsPaused: boolean;
  linkExpired: boolean;
  /** Set when arriving through a partner invite: onboarding presets apply. */
  invitedBy?: string;
  me: Me;
  members: Member[];
  following: string[];
  followers: string[];
  blocked: string[];
  notForMe: string[];
  groups: Group[];
  joined: string[];
  muted: string[];
  posts: Post[];
  comments: Comment[];
  stories: Story[];
  /** Learn articles the API returned (GET /learn/articles, /learn/articles/{id}). */
  articles: Article[];
  /** GET /learn/recommended: up to 6, each with its reason. */
  recommendedArticles?: { slug: string; why: string }[];
  /** GET /profile/me/saved/suggestions: "Worth saving". */
  suggestedArticles?: string[];
  savedArticles: string[];
  articleHelpful: Record<string, "yes" | "no">;
  conversations: Conversation[];
  mentorRequests: MentorRequest[];
  notifications: Notification[];
  guideChats: GuideChat[];
  useProfileAnswers: boolean;
  appointmentLists: AppointmentList[];
  credits: { free: number; purchased: number; packsToday: number; purchases: Purchase[] };
  partner: {
    linked: boolean;
    firstName: string;
    showsBadge: boolean;
    invite?: PartnerInvite;
    notice?: string;
  };
  family: { items: FamilyItem[]; notes: FamilyNote[]; activity: FamilyActivity[] };
  reports: Report[];
  counters: { posts: number; comments: number; reports: number; newConversations: number };
  pendingLevelUp?: TreeLevel;
  dataExport: "none" | "preparing" | "ready";
  deletion?: { daysLeft: number; deletePosts: boolean };
  suspension?: { reason: string; until: string; appealed?: boolean };
}

export const EMPTY_ME: Me = {
  email: "",
  status: "unconfirmed",
  signupDay: new Date().getDate(),
  joinedDaysAgo: 0,
  firstName: "",
  lastName: "",
  handle: "",
  showRealName: false,
  gender: "",
  genderSelf: "",
  pronouns: "",
  pronounsSelf: "",
  ageRange: "",
  zip: "",
  aboutMe: "",
  myStory: "",
  avatarHue: "green",
  avatarPreset: -1,
  hasPhoto: false,
  community: "",
  stages: [],
  treatments: [],
  nextDate: "",
  diagnoses: [],
  otherDiagnosis: "",
  paths: [],
  lookingFor: [],
  connectStyle: [],
  healthConsent: false,
  suggestMe: true,
  messagePolicy: "following",
  wantMentor: false,
  showStories: false,
  shareJourney: false,
  showPartner: false,
  notify: {
    comments: true,
    messages: true,
    mentoring: true,
    partner: true,
    includeFollows: false,
    pauseAll: false,
  },
  sunlight: 0,
  level: "Seed",
  history: [],
  founding: false,
  mentoring: { on: false, paused: false, bio: "", helpsWith: [], capacity: 3 },
  skipped: [],
  inviteCode: "",
  guidelinesAccepted: false,
};

const ANNIE: Me = {
  ...EMPTY_ME,
  email: "annie.m@grove.test",
  status: "active",
  joinedDaysAgo: 46,
  firstName: "Annie",
  lastName: "Marsh",
  handle: "annie_grows",
  showRealName: false,
  gender: "Female",
  pronouns: "she/her",
  ageRange: "30 to 34",
  zip: "94549",
  aboutMe:
    "33, stage III endo, starting IVF this winter. Here for people who get it and for the questions I'm scared to ask out loud.",
  avatarHue: "coral",
  community: "womens",
  stages: ["Pursuing treatment"],
  treatments: ["IVF"],
  nextDate: "",
  diagnoses: ["Endometriosis"],
  paths: ["Own eggs and sperm"],
  lookingFor: [
    "People in my exact situation",
    "A mentor who has been through it",
    "Help preparing for doctor visits",
  ],
  connectStyle: ["Reading and learning first", "One-to-one conversations"],
  healthConsent: true,
  wantMentor: true,
  sunlight: DEMO_SUNLIGHT,
  level: levelFor(DEMO_SUNLIGHT),
  history: SUNLIGHT_HISTORY,
  skipped: ["photo", "story"],
  inviteCode: "GRV7K2QX",
  guidelinesAccepted: true,
};

const MENTOR_ME: Me = {
  ...ANNIE,
  sunlight: 812,
  level: "Blossom Tree",
  history: [
    {
      id: "sh-m1",
      label: "Upvotes on “What I wish I'd known before my first retrieval”",
      amount: 541,
      daysAgo: 1,
    },
    ...SUNLIGHT_HISTORY,
  ],
  mentoring: {
    on: true,
    paused: false,
    bio: "Stage III endo and two IVF rounds. I can help with deciding about surgery, retrieval day nerves and keeping work going.",
    helpsWith: ["Endometriosis", "IVF"],
    capacity: 3,
  },
};

function base(): Omit<State, "persona" | "me"> {
  return {
    session: "none",
    signedIn: false,
    step: 1,
    keepSignedIn: false,
    failedAttempts: 0,
    lockedOut: false,
    hasInvite: true,
    signupsPaused: false,
    linkExpired: false,
    members: MEMBERS,
    following: [],
    followers: [],
    blocked: [],
    notForMe: [],
    groups: GROUPS,
    joined: [],
    muted: [],
    posts: POSTS.filter((p) => p.authorId !== "me"),
    comments: COMMENTS.filter((c) => c.authorId !== "me"),
    stories: STORIES,
    articles: [],
    savedArticles: [],
    articleHelpful: {},
    conversations: CONVERSATIONS.filter((c) => c.kind === "support"),
    mentorRequests: [],
    notifications: [],
    guideChats: [],
    useProfileAnswers: true,
    appointmentLists: [],
    credits: { free: CREDITS.freePerMonth, purchased: 0, packsToday: 0, purchases: [] },
    partner: { linked: false, firstName: "", showsBadge: false },
    family: { items: [], notes: [], activity: [] },
    reports: [],
    counters: { posts: 0, comments: 0, reports: 0, newConversations: 0 },
    dataExport: "none",
  };
}

export function persona(kind: State["persona"]): State {
  if (kind === "new") return { ...base(), persona: "new", me: EMPTY_ME };
  if (kind === "partner") {
    return {
      ...base(),
      persona: "partner",
      me: EMPTY_ME,
      invitedBy: "Annie",
    };
  }
  const established: State = {
    ...base(),
    persona: kind,
    signedIn: true,
    step: 9,
    me: kind === "mentor" ? MENTOR_ME : ANNIE,
    following: ["m-maya", "m-lena", "m-chloe", "m-dana"],
    followers: ["m-jules", "m-chloe", "m-hannah", "m-ivy", "m-tess", "m-bea"],
    joined: ["g-endo", "g-ivf", "g-work"],
    posts: POSTS,
    comments: COMMENTS,
    savedArticles: ["endometriosis"],
    conversations: CONVERSATIONS,
    mentorRequests:
      kind === "mentor"
        ? [
            ...MENTOR_REQUESTS,
            {
              id: "mr-in-1",
              mentorId: "me",
              menteeId: "m-ivy",
              message:
                "Hi Annie, I was just diagnosed with endo and I'm terrified about surgery. Could you tell me how you decided?",
              helpWith: ["Endometriosis"],
              status: "waiting",
              daysAgo: 1,
            },
          ]
        : MENTOR_REQUESTS,
    notifications: NOTIFICATIONS,
    credits: {
      free: 14,
      purchased: 0,
      packsToday: 0,
      purchases: [],
    },
    guideChats: [
      {
        id: "gc-1",
        title: "Surgery before IVF?",
        daysAgo: 2,
        turns: [],
      },
    ],
    appointmentLists: [],
  };
  return established;
}

/* Saved first-chat turns are filled lazily (see actions) to keep this file
   free of the guide engine. */
export const ARTICLE_SLUGS = ARTICLES.map((a) => a.slug);

/* ----------------------------------------------------------------- Store */

/* v4: the backend fills the signed-in member's slices; saved prototype personas start over. */
const KEY = "fertility-grove-state-v4";

/** Signed out, before the API session (if any) loads. The features the backend doesn't serve yet
    (Grove Guide, credits, family space…) keep their sample data. TODO(api). */
export function signedOut(): State {
  const sample = persona("member");
  return {
    ...sample,
    persona: "new",
    session: "none",
    signedIn: false,
    step: 1,
    me: EMPTY_ME,
    // The API fills these as screens ask for them.
    // The team account behind the support conversation (mock, TODO(api)) stays.
    members: sample.members.filter((m) => m.badges.includes("team")),
    groups: [],
    posts: [],
    comments: [],
    stories: [],
    mentorRequests: [],
    notifications: [],
    conversations: sample.conversations.filter((c) => c.kind === "support"),
    matchedPosts: undefined,
    matchedGroups: undefined,
    savedArticles: [],
    articleHelpful: {},
    following: [],
    followers: [],
    blocked: [],
    joined: [],
    muted: [],
    notForMe: [],
    partner: { linked: false, firstName: "", showsBadge: false },
    pendingLevelUp: undefined,
    deletion: undefined,
    suspension: undefined,
    dataExport: "none",
  };
}
const initial = signedOut();
let current: State = initial;
let loaded = false;
const listeners = new Set<() => void>();

function ensureLoaded() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) current = { ...current, ...(JSON.parse(raw) as Partial<State>) };
  } catch {
    /* blocked storage just means default data */
  }
}

export function get(): State {
  ensureLoaded();
  return current;
}

export function set(fn: (s: State) => State) {
  ensureLoaded();
  current = fn(current);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    /* prototype: ignore */
  }
  for (const l of listeners) l();
}

export function replace(next: State) {
  set(() => next);
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

/** Read the store. Pass a selector to re-render only when that slice changes. */
export function useStore(): State;
export function useStore<T>(select: (s: State) => T): T;
export function useStore<T>(select?: (s: State) => T) {
  return useSyncExternalStore(
    subscribe,
    () => (select ? select(get()) : get()),
    () => (select ? select(initial) : initial),
  );
}

const noop = () => () => {};

/** True after hydration. Anything that redirects must wait for it. */
export function useHydrated() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
