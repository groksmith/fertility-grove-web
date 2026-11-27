import type { Page, Route } from "@playwright/test";

/**
 * A stand-in for the Fertility Grove API (docs/api/swagger.json) in the browser: every request to
 * `/api/v1/*` is answered here, so E2E runs offline and the same every time. `signIn` also stores a
 * session the way a real sign-in does, so the member app loads as a signed-in member.
 *
 * The data is deliberately small: one member, two groups, one post, one conversation. A spec that
 * needs more passes `overrides` keyed by "METHOD /path" (path without `/api/v1`).
 */

const NOW = "2026-11-23T12:00:00Z";

const GROUP = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Endometriosis",
  description: "For anyone living with endometriosis.",
  type: "Diagnosis",
  isMembersOnly: false,
  isArchived: false,
  memberCount: 120,
  isJoined: true,
  isMuted: false,
  visibleToGuests: true,
  canReadPosts: true,
  membersOnlyNotice: null,
  rules: "Be kind.",
  postsThisWeek: 4,
  posterAvatars: [],
  readingLinks: [],
  communities: ["Women's Community"],
};

const POST = {
  id: "22222222-2222-4222-8222-222222222222",
  groupId: GROUP.id,
  groupName: GROUP.name,
  isSuccessStory: false,
  storyType: null,
  storyDiagnoses: [],
  whatHelped: [],
  type: "Question",
  title: "Excision surgery recovery?",
  body: "How long did recovery take for you?",
  source: "PersonalExperience",
  sourceLink: null,
  topicTags: ["Surgery"],
  isSaved: false,
  allowSharingOutside: true,
  showToVisitors: true,
  status: "Published",
  authorDisplayName: "@maya_m",
  authorHandle: "maya_m",
  authorTreeLevel: "Tree",
  isMine: false,
  score: 3,
  commentCount: 1,
  myVote: null,
  allowsDownvotes: true,
  isCollapsed: false,
  isEdited: false,
  createdAt: NOW,
};

const VISITOR_POST = {
  id: POST.id,
  groupId: GROUP.id,
  groupName: GROUP.name,
  type: "Question",
  title: POST.title,
  body: POST.body,
  source: "PersonalExperience",
  sourceLink: null,
  topicTags: [],
  authorDisplayName: "@maya_m",
  authorTreeLevel: "Tree",
  authorPronouns: "she/her",
  authorBadge: null,
  score: 3,
  replyCount: 1,
  isEdited: false,
  createdAt: NOW,
};

const PROFILE = {
  handle: "annie_grows",
  nextHandleChangeAt: null,
  firstName: "Annie",
  lastName: "Marsh",
  showRealName: false,
  displayName: "@annie_grows",
  avatarCode: "avatar_03",
  aboutMe: "Starting IVF this winter.",
  myStory: null,
  genderIdentity: "female",
  genderSelfDescription: null,
  pronouns: "she_her",
  pronounsSelfDescription: null,
  ageRange: "30_to_34",
  zipCode: "94549",
  hasHealthConsent: true,
  journeyStages: ["pursuing_treatment"],
  treatments: ["ivf"],
  nextTreatmentDate: null,
  diagnoses: ["endometriosis"],
  otherDiagnosis: null,
  paths: ["own_eggs_and_sperm"],
  lookingFor: ["people_in_my_exact_situation"],
  connectPreference: "one_to_one_conversations",
  communityId: "33333333-3333-4333-8333-333333333333",
  suggestMe: true,
  whoCanMessage: "MembersIFollow",
  wantsMentor: true,
  showSuccessStories: true,
  showHealthOnProfile: false,
  notifyCommentsAndReplies: true,
  notifyDirectMessages: true,
  includeFollowsInDailyUpdate: false,
  notifyMentoringUpdates: true,
  notifyPartnerUpdates: true,
  pauseOptionalEmails: false,
  showLinkedPartner: false,
  showProfileCompletionCard: true,
  missingProfileItems: ["story"],
};

const ARTICLE_CARD = {
  id: "44444444-4444-4444-8444-444444444444",
  title: "Endometriosis and fertility",
  summary: "What endometriosis is and how it can affect getting pregnant.",
  // Learn answers in labels, not codes (api-handoff "Option lists and codes").
  diagnoses: ["Endometriosis"],
  topics: ["Surgery"],
  lastReviewedOn: "2026-10-01",
  isSaved: false,
  reason: "Matched on endometriosis",
};

const empty = (key: string) => ({ [key]: [], totalCount: 0, page: 1, pageSize: 20 });

/** Answers by "METHOD /path" (the path after /api/v1). Regex keys match path patterns. */
const GETS: [RegExp, unknown][] = [
  [
    /^\/auth\/me$/,
    {
      id: "55555555-5555-4555-8555-555555555555",
      email: "annie.m@grove.test",
      pendingEmail: null,
      isEmailConfirmed: true,
      createdAt: "2026-10-08T09:00:00Z",
      mustAcceptTerms: false,
      termsVersion: "2026-11-01",
    },
  ],
  [
    /^\/auth\/sign-up-status$/,
    { isPaused: false, isInviteOnly: true, isInviteValid: false, canSignUp: false },
  ],
  [
    /^\/onboarding\/options$/,
    {
      lists: {
        avatar: Array.from({ length: 12 }, (_, i) => ({
          code: `avatar_${String(i + 1).padStart(2, "0")}`,
          label: `Avatar ${i + 1}`,
        })),
        pronouns: [{ code: "she_her", label: "she/her" }],
      },
      communities: [
        { id: PROFILE.communityId, name: "Women's Community", description: "" },
        {
          id: "66666666-6666-4666-8666-666666666666",
          name: "Partners & Men's Community",
          description: "",
        },
      ],
    },
  ],
  [
    /^\/onboarding$/,
    {
      ...PROFILE,
      status: "Complete",
      nextStep: 9,
      isLinkedPartner: false,
      preselectedJourneyStages: [],
      preselectedLookingFor: [],
      suggestedCommunityId: null,
    },
  ],
  [/^\/profile\/me$/, PROFILE],
  [
    /^\/profile\/me\/preview$/,
    {
      handle: PROFILE.handle,
      displayName: PROFILE.displayName,
      pronouns: "she/her",
      avatarCode: "avatar_03",
      aboutMe: PROFILE.aboutMe,
      myStory: null,
      journeyStages: [],
      diagnoses: [],
      paths: [],
      followerCount: 2,
      followingCount: 1,
      isFollowing: false,
      treeLevel: "Bush",
      isMe: true,
      canMessage: false,
      mentor: null,
      showsPartnerBadge: false,
    },
  ],
  [
    /^\/profile\/me\/sunlight$/,
    {
      level: "Bush",
      sunlight: 140,
      nextLevel: "Tree",
      sunlightForNextLevel: 250,
      progressToNextLevel: 0.4,
      history: [{ reason: "Upvote", points: 10, isReversed: false, createdAt: NOW }],
      totalCount: 1,
      page: 1,
      pageSize: 50,
    },
  ],
  [/^\/profile\/me\/(followers|following|blocked)$/, { members: [] }],
  [
    /^\/profile\/me\/groups$/,
    {
      groups: [
        {
          id: GROUP.id,
          name: GROUP.name,
          memberCount: 120,
          postsThisWeek: 4,
          myPostCount: 0,
          isMuted: false,
          isArchived: false,
        },
      ],
    },
  ],
  [
    /^\/profile\/me\/mentoring$/,
    {
      canMentor: false,
      unavailableReason: "Mentoring opens at Blossom Tree.",
      isMentoring: false,
      isFoundingMentor: false,
      isPaused: false,
      bio: "",
      diagnoses: [],
      journeyStages: [],
      paths: [],
      capacity: 3,
      hasAcceptedGuidelines: false,
      openConnections: 0,
      canFillFromProfile: true,
      profileDiagnoses: [],
      profileJourneyStages: [],
      profilePaths: [],
    },
  ],
  [
    /^\/profile\/me\/partner$/,
    {
      isLinked: false,
      partnerFirstName: null,
      linkedAt: null,
      showLinkedPartner: false,
      invites: [],
    },
  ],
  [/^\/invites\/mine$/, { code: "GRV7K2QX", url: "https://fertilitygrove.com/join/GRV7K2QX" }],
  [
    /^\/profile\/me\/dashboard$/,
    { counts: { posts: 0, replies: 0, groups: 1, saved: 0 }, recentActivity: [], mentoring: [] },
  ],
  [/^\/profile\/me\/(posts|stories|saved)$/, empty("posts")],
  [/^\/profile\/me\/replies$/, empty("replies")],
  [/^\/profile\/me\/saved\/(articles|suggestions)$/, empty("articles")],
  [
    /^\/profile\/me\/data-exports\/latest$/,
    { id: null, status: null, requestedAt: null, readyAt: null, expiresAt: null },
  ],
  [
    /^\/(feed|feed\/following|success-stories)$/,
    { posts: [POST], totalCount: 1, page: 1, pageSize: 50 },
  ],
  [/^\/groups$/, { groups: [GROUP] }],
  [/^\/groups\/[^/]+$/, GROUP],
  [/^\/groups\/[^/]+\/posts$/, { posts: [POST], totalCount: 1, page: 1, pageSize: 50 }],
  [/^\/posts\/[^/]+$/, { post: POST, commentSort: "Top", comments: [] }],
  [/^\/matches\/groups$/, { groups: [] }],
  [/^\/matches\/peers$/, { peers: [] }],
  [/^\/matches\/posts$/, { posts: [] }],
  [/^\/matches\/mentors$/, { wantsMentor: true, mentors: [] }],
  [/^\/members$/, { members: [] }],
  [/^\/mentorships$/, { mentorships: [] }],
  [
    /^\/conversations$/,
    { conversations: [], totalCount: 0, requestCount: 0, page: 1, pageSize: 100 },
  ],
  [
    /^\/notifications$/,
    { notifications: [], totalCount: 0, unreadCount: 0, page: 1, pageSize: 50 },
  ],
  [/^\/notifications\/unread-count$/, { unreadCount: 0 }],
  [/^\/learn\/articles$/, { articles: [ARTICLE_CARD], totalCount: 1, page: 1, pageSize: 50 }],
  [/^\/learn\/recommended$/, { isPersonal: true, articles: [ARTICLE_CARD] }],
  [
    /^\/learn\/articles\/[^/]+$/,
    {
      ...ARTICLE_CARD,
      isPreview: false,
      joinMessage: null,
      body: "## What it is\n\nA common condition.",
      sections: [{ slug: "what-it-is", heading: "What it is" }],
      journeyStages: [],
      reviewedBy: "Dr. Sample, MD",
      sources: [],
      medicalDisclaimer: "",
      relatedGroups: [],
      myHelpful: null,
    },
  ],
  [/^\/crisis-resources$/, { resources: ["988 Suicide and Crisis Lifeline: call or text 988"] }],
  [/^\/public\/feed$/, { posts: [VISITOR_POST], totalCount: 1, page: 1, pageSize: 50 }],
  [/^\/public\/groups$/, { groups: [GROUP] }],
  [/^\/public\/groups\/[^/]+$/, GROUP],
  [
    /^\/public\/posts\/[^/]+$/,
    {
      id: POST.id,
      groupName: GROUP.name,
      isSuccessStory: false,
      type: "Question",
      storyType: null,
      title: POST.title,
      body: POST.body,
      authorDisplayName: "@maya_m",
      score: 3,
      isEdited: false,
      createdAt: NOW,
      shownToVisitors: true,
      visitor: VISITOR_POST,
    },
  ],
];

export const fixtures = { GROUP, POST, PROFILE, ARTICLE_CARD };

/** Answer every API request from the fixtures. Unknown reads get 404; writes succeed with 204. */
export async function mockApi(page: Page, overrides: Record<string, unknown> = {}) {
  await page.route(/\/api\/v1\//, async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^.*\/api\/v1/, "");
    const key = `${request.method()} ${path}`;
    const json = (body: unknown, status = 200) =>
      route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    if (key in overrides) return json(overrides[key]);
    if (request.method() === "GET") {
      const hit = GETS.find(([pattern]) => pattern.test(path));
      return hit ? json(hit[1]) : json({ title: "Not Found", status: 404 }, 404);
    }
    if (path === "/auth/login" || path === "/auth/refresh-token") {
      return json({
        accountId: "55555555-5555-4555-8555-555555555555",
        email: "annie.m@grove.test",
        isEmailConfirmed: true,
        keepSignedIn: false,
        sessionExpiresAt: NOW,
        accessToken: "e2e-access",
        refreshToken: "e2e-refresh",
        wasRestored: false,
        deviceToken: "e2e",
        mustAcceptTerms: false,
        termsVersion: "2026-11-01",
      });
    }
    return route.fulfill({ status: 204 });
  });
}

/** Mock the API and start the page signed in (a stored session, as after a real sign-in). */
export async function signIn(page: Page, overrides: Record<string, unknown> = {}) {
  await mockApi(page, overrides);
  await page.addInitScript(() => {
    window.sessionStorage.setItem(
      "fg-session",
      JSON.stringify({
        accessToken: "e2e-access",
        refreshToken: "e2e-refresh",
        keepSignedIn: false,
      }),
    );
  });
}
