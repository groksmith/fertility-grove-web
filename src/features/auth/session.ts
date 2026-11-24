/* The signed-in member's own snapshot. Screens read `me`, the onboarding step, follows, joined groups
   and the partner link from the store (dozens of them, unchanged since the prototype); this loader
   fills those slices from the API after sign-in and on every reload, and services re-run it (or one
   part of it) after a write. */

import { daysSince, messagePolicy, treeLevel } from "@/lib/api/enums";
import { decodeAvatar, mergeMembers } from "@/lib/api/members";
import {
  communityKey,
  labelOf,
  labelsOf,
  registerCommunities,
  registerOptions,
} from "@/lib/api/options";
import { queryClient } from "@/lib/api/query-client";
import { getTokens, hasSession, httpClient, setTokens } from "@/lib/http";
import { get, type Me, type State, set, signedOut } from "@/lib/mock-server";
import type { Member, SunlightEvent } from "@/types/domain";
import {
  authApi,
  type CurrentUser,
  type MemberListItem,
  type MyGroup,
  type MyMentoring,
  type MyPartner,
  type MyProfile,
  type MySunlight,
  type OnboardingState,
} from "./api";

const SUNLIGHT_LABEL: Record<MySunlight["history"][number]["reason"], string> = {
  Upvote: "An upvote on your post",
  Downvote: "A downvote on your post",
  NewFollower: "A new follower",
  Referral: "A friend joined with your invite",
};

export function sunlightHistory(s: MySunlight): SunlightEvent[] {
  return s.history.map((h, i) => ({
    id: `sh-${h.createdAt}-${h.reason}-${i}`,
    label: h.isReversed ? `${SUNLIGHT_LABEL[h.reason]} (undone)` : SUNLIGHT_LABEL[h.reason],
    amount: h.points,
    daysAgo: daysSince(h.createdAt),
  }));
}

/** A self-described answer travels as the "Prefer to self-describe" option plus its text. */
function profileToMe(p: MyProfile, prev: Me): Partial<Me> {
  const avatar = decodeAvatar(p.avatarCode);
  const handleChange = p.nextHandleChangeAt ? Date.parse(p.nextHandleChangeAt) : Number.NaN;
  return {
    firstName: p.firstName ?? "",
    lastName: p.lastName ?? "",
    handle: p.handle ?? "",
    // The API tells when the next change opens; the screens count days since the last one.
    handleChangedDaysAgo: Number.isNaN(handleChange)
      ? undefined
      : Math.max(0, 30 - Math.ceil((handleChange - Date.now()) / 86_400_000)),
    showRealName: p.showRealName,
    gender: p.genderIdentity ? labelOf(p.genderIdentity) : "",
    genderSelf: p.genderSelfDescription ?? "",
    pronouns: p.pronouns ? labelOf(p.pronouns) : "",
    pronounsSelf: p.pronounsSelfDescription ?? "",
    ageRange: p.ageRange ? labelOf(p.ageRange) : "",
    zip: p.zipCode ?? "",
    aboutMe: p.aboutMe ?? "",
    myStory: p.myStory ?? "",
    avatarHue: avatar.hue,
    avatarPreset: avatar.preset ?? -1,
    community: communityKey(p.communityId) || prev.community,
    stages: labelsOf(p.journeyStages),
    treatments: labelsOf(p.treatments),
    nextDate: p.nextTreatmentDate ?? "",
    diagnoses: labelsOf(p.diagnoses),
    otherDiagnosis: p.otherDiagnosis ?? "",
    paths: labelsOf(p.paths),
    lookingFor: labelsOf(p.lookingFor),
    connectStyle: p.connectPreference ? [labelOf(p.connectPreference)] : [],
    healthConsent: p.hasHealthConsent,
    suggestMe: p.suggestMe,
    messagePolicy: messagePolicy(p.whoCanMessage),
    wantMentor: p.wantsMentor,
    showStories: p.showSuccessStories,
    shareJourney: p.showHealthOnProfile,
    showPartner: p.showLinkedPartner,
    notify: {
      comments: p.notifyCommentsAndReplies,
      messages: p.notifyDirectMessages,
      mentoring: p.notifyMentoringUpdates,
      partner: p.notifyPartnerUpdates,
      includeFollows: p.includeFollowsInDailyUpdate,
      pauseAll: p.pauseOptionalEmails,
    },
    // The card's "Hide for 30 days" is kept server-side; hidden reads as hidden for now.
    profileCardHiddenUntil: p.showProfileCompletionCard ? undefined : Date.now() + 86_400_000,
    skipped: p.missingProfileItems,
  };
}

/** The onboarding answers so far, with a linked partner's suggested answers shown as chosen. */
function onboardingToMe(o: OnboardingState, prev: Me): Partial<Me> {
  const stages = o.journeyStages?.length ? o.journeyStages : o.preselectedJourneyStages;
  const looking = o.lookingFor?.length ? o.lookingFor : o.preselectedLookingFor;
  const filled: MyProfile = {
    handle: null,
    nextHandleChangeAt: null,
    firstName: null,
    lastName: null,
    showRealName: false,
    displayName: null,
    avatarCode: null,
    aboutMe: null,
    myStory: null,
    genderIdentity: null,
    genderSelfDescription: null,
    pronouns: null,
    pronounsSelfDescription: null,
    ageRange: null,
    zipCode: null,
    hasHealthConsent: false,
    treatments: [],
    nextTreatmentDate: null,
    diagnoses: [],
    otherDiagnosis: null,
    paths: [],
    connectPreference: null,
    suggestMe: true,
    whoCanMessage: "MembersIFollow",
    wantsMentor: false,
    showSuccessStories: false,
    showHealthOnProfile: false,
    notifyCommentsAndReplies: true,
    notifyDirectMessages: true,
    includeFollowsInDailyUpdate: false,
    notifyMentoringUpdates: true,
    notifyPartnerUpdates: true,
    pauseOptionalEmails: false,
    showLinkedPartner: false,
    missingProfileItems: [],
    ...o,
    journeyStages: stages ?? [],
    lookingFor: looking ?? [],
    communityId: o.communityId ?? o.suggestedCommunityId,
    showProfileCompletionCard: true,
  };
  return profileToMe(filled, prev);
}

function mentoringToMe(m: MyMentoring): Partial<Me> {
  return {
    founding: m.isFoundingMentor,
    mentoring: {
      on: m.isMentoring,
      paused: m.isPaused,
      bio: m.bio ?? "",
      helpsWith: labelsOf([...m.diagnoses, ...m.journeyStages, ...m.paths]),
      capacity: m.capacity || 3,
    },
  };
}

function partnerToState(p: MyPartner): State["partner"] {
  const pending = p.invites.find((i) => i.status === "Pending");
  const latest = pending ?? p.invites[0];
  return {
    linked: p.isLinked,
    firstName: p.partnerFirstName ?? "",
    showsBadge: p.isLinked && p.showLinkedPartner,
    invite: latest
      ? {
          id: latest.id,
          email: latest.email ?? "",
          status:
            latest.status === "NotPossible"
              ? "expired"
              : (latest.status.toLowerCase() as "pending"),
          resends: Math.max(0, 3 - latest.resendsLeft),
          daysAgo: daysSince(latest.lastSentAt),
        }
      : undefined,
  };
}

/** Merge people into the store's member cache, so lookups by handle (follow lists, blocks) resolve. */
function withMembers(members: Member[], incoming: MemberListItem[]): Member[] {
  return mergeMembers(
    members,
    incoming.map((ref) => ref),
  );
}

const handleOf = (m: MemberListItem) => m.handle || `gone:${m.memberId}`;

function stepOf(o: OnboardingState | undefined) {
  if (!o) return 9;
  return o.status === "Complete" ? 9 : Math.min(Math.max(o.nextStep || 1, 1), 8);
}

function value<T>(r: PromiseSettledResult<T>): T | undefined {
  return r.status === "fulfilled" ? r.value : undefined;
}

/* One load at a time per session: callers that ask while one runs (React's development double
   effect, a write's refresh) share it. */
let inFlight: { token: string; run: Promise<void> } | null = null;

/** Fill the store from the API. Signed out (no tokens) resets the member's slices. */
export function loadSession(): Promise<void> {
  const token = getTokens()?.accessToken ?? "";
  if (inFlight && inFlight.token === token) return inFlight.run;
  const run = load().finally(() => {
    if (inFlight?.run === run) inFlight = null;
  });
  inFlight = { token, run };
  return run;
}

async function load(): Promise<void> {
  if (!hasSession()) {
    if (get().session !== "none") {
      set(() => signedOut());
      queryClient.clear();
    }
    return;
  }
  if (get().session === "none") set((s) => ({ ...s, session: "loading" }));

  let user: CurrentUser;
  try {
    user = await authApi.me();
  } catch {
    // The client already refreshed or ended the session on a 401; anything else keeps it loading
    // only if tokens survived.
    if (!getTokens()) set(() => signedOut());
    else set((s) => ({ ...s, session: "ready", signedIn: true }));
    return;
  }

  const [options, onboarding] = await Promise.allSettled([authApi.options(), authApi.onboarding()]);
  const opts = value(options);
  if (opts) {
    registerOptions(opts.lists);
    registerCommunities(opts.communities);
  }
  const onb = value(onboarding);
  const step = stepOf(onb);
  const complete = step === 9;
  const mustAccept = user.mustAcceptTerms;

  // Everything else is gated behind Terms and onboarding; skip what would only 403.
  const open = complete && !mustAccept;
  const [profile, sunlight, followers, following, blocked, groups, mentoring, partner, invite] =
    await Promise.allSettled([
      open ? authApi.profile() : Promise.reject(),
      open ? authApi.sunlight() : Promise.reject(),
      open ? authApi.followers() : Promise.reject(),
      open ? authApi.following() : Promise.reject(),
      open ? authApi.blocked() : Promise.reject(),
      open ? authApi.myGroups() : Promise.reject(),
      open ? authApi.mentoring() : Promise.reject(),
      open ? authApi.partner() : Promise.reject(),
      open ? authApi.invite() : Promise.reject(),
    ]);

  set((s) => {
    const p = value(profile);
    const sun = value(sunlight);
    const mentor = value(mentoring);
    const link = value(partner);
    const mine = value(groups)?.groups ?? [];
    const lists = {
      followers: value(followers)?.members ?? [],
      following: value(following)?.members ?? [],
      blocked: value(blocked)?.members ?? [],
    };
    const fresh = s.session !== "ready" || s.me.email !== (user.email ?? "");
    const prev = fresh ? signedOut().me : s.me;
    const me: Me = {
      ...prev,
      // Mid-onboarding, GET /onboarding holds the answers so far; after it, GET /profile/me.
      ...(p ? profileToMe(p, prev) : onb ? onboardingToMe(onb, prev) : {}),
      ...(mentor ? mentoringToMe(mentor) : {}),
      email: user.email ?? "",
      status: user.isEmailConfirmed ? "active" : "unconfirmed",
      joinedDaysAgo: daysSince(user.createdAt),
      signupDay: new Date(user.createdAt).getDate(),
      sunlight: sun?.sunlight ?? prev.sunlight,
      level: sun ? treeLevel(sun.level) : prev.level,
      history: sun ? sunlightHistory(sun) : prev.history,
      inviteCode: value(invite)?.code ?? prev.inviteCode,
    };
    const level = me.level;
    return {
      ...s,
      session: "ready",
      signedIn: true,
      // Signing in within 14 days of deleting restored the account.
      deletion: undefined,
      step,
      terms: { mustAccept, version: user.termsVersion ?? "" },
      pendingEmail: user.pendingEmail ?? undefined,
      invitedBy: onb?.isLinkedPartner ? s.invitedBy || "your partner" : undefined,
      me,
      // A level reached since the last visit is celebrated once.
      pendingLevelUp: !fresh && s.me.level !== level && sun ? level : s.pendingLevelUp,
      members: withMembers(s.members, [...lists.followers, ...lists.following, ...lists.blocked]),
      followers: lists.followers.map(handleOf),
      following: lists.following.map(handleOf),
      blocked: lists.blocked.map(handleOf),
      joined: open ? mine.map((g: MyGroup) => g.id) : s.joined,
      muted: open ? mine.filter((g) => g.isMuted).map((g) => g.id) : s.muted,
      partner: link ? partnerToState(link) : s.partner,
    };
  });
}

/** After a sign-in: keep the tokens, then load. */
export async function startSession(tokens: {
  accessToken: string | null;
  refreshToken: string | null;
  keepSignedIn: boolean;
}) {
  if (!tokens.accessToken) return;
  setTokens({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken ?? "",
    keepSignedIn: tokens.keepSignedIn,
  });
  set((s) => ({ ...s, session: "loading" }));
  // A partner invite kept through sign-up / sign-in links now (sign-up never links on its own).
  const token = get().pendingInvite?.partnerToken;
  if (token) {
    try {
      await httpClient.post(`/partner-invites/${encodeURIComponent(token)}/accept`);
    } catch {
      /* expired or already linked: the invite page said so; onboarding continues */
    }
    set((s) => ({ ...s, pendingInvite: undefined }));
  }
  await loadSession();
}

/** Forget the session locally (after logout, deletion, or a dead refresh). */
export function endSession() {
  setTokens(null);
  set(() => signedOut());
  queryClient.clear();
}

/** Where a member belongs right after signing in. */
export function homeFor(s: State) {
  if (s.terms?.mustAccept) return `/accept-terms?v=${encodeURIComponent(s.terms.version)}`;
  if (s.step < 9) return `/onboarding/${s.step}`;
  return "/feed";
}
