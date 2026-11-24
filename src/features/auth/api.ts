/* The auth and "my account" endpoints (docs/api/swagger.json), as typed calls. */

import { httpClient } from "@/lib/http";

/* ------------------------------------------------------------------ DTOs */

export interface LoginResponse {
  accountId: string;
  email: string | null;
  isEmailConfirmed: boolean;
  keepSignedIn: boolean;
  sessionExpiresAt: string;
  accessToken: string | null;
  refreshToken: string | null;
  wasRestored: boolean;
  deviceToken: string | null;
  mustAcceptTerms: boolean;
  termsVersion: string | null;
}

export interface CurrentUser {
  id: string;
  email: string | null;
  pendingEmail: string | null;
  isEmailConfirmed: boolean;
  createdAt: string;
  mustAcceptTerms: boolean;
  termsVersion: string | null;
}

export interface SignUpStatus {
  isPaused: boolean;
  isInviteOnly: boolean;
  isInviteValid: boolean;
  canSignUp: boolean;
}

export interface MyProfile {
  handle: string | null;
  nextHandleChangeAt: string | null;
  firstName: string | null;
  lastName: string | null;
  showRealName: boolean;
  displayName: string | null;
  avatarCode: string | null;
  aboutMe: string | null;
  myStory: string | null;
  genderIdentity: string | null;
  genderSelfDescription: string | null;
  pronouns: string | null;
  pronounsSelfDescription: string | null;
  ageRange: string | null;
  zipCode: string | null;
  hasHealthConsent: boolean;
  journeyStages: string[];
  treatments: string[];
  nextTreatmentDate: string | null;
  diagnoses: string[];
  otherDiagnosis: string | null;
  paths: string[];
  lookingFor: string[];
  connectPreference: string | null;
  communityId: string | null;
  suggestMe: boolean;
  whoCanMessage: string;
  wantsMentor: boolean;
  showSuccessStories: boolean;
  showHealthOnProfile: boolean;
  notifyCommentsAndReplies: boolean;
  notifyDirectMessages: boolean;
  includeFollowsInDailyUpdate: boolean;
  notifyMentoringUpdates: boolean;
  notifyPartnerUpdates: boolean;
  pauseOptionalEmails: boolean;
  showLinkedPartner: boolean;
  showProfileCompletionCard: boolean;
  missingProfileItems: string[];
}

/** GET /onboarding: progress plus every answer saved so far (the same names as GET /profile/me). */
export interface OnboardingState
  extends Partial<
    Omit<MyProfile, "nextHandleChangeAt" | "displayName" | "showProfileCompletionCard">
  > {
  status: "NotStarted" | "InProgress" | "Complete";
  nextStep: number;
  isLinkedPartner: boolean;
  preselectedJourneyStages: string[];
  preselectedLookingFor: string[];
  suggestedCommunityId: string | null;
  communityId: string | null;
}

export interface OnboardingOptions {
  lists: Record<string, { code: string | null; label: string | null }[]> | null;
  communities: { id: string; name: string | null; description: string | null }[];
}

export interface MySunlight {
  level: string;
  sunlight: number;
  nextLevel: string;
  sunlightForNextLevel: number | null;
  progressToNextLevel: number;
  history: {
    reason: "Upvote" | "Downvote" | "NewFollower" | "Referral";
    points: number;
    isReversed: boolean;
    createdAt: string;
  }[];
  totalCount: number;
}

export interface MemberListItem {
  memberId: string;
  handle: string | null;
  displayName: string | null;
  avatarCode: string | null;
  treeLevel: string;
}

export interface MyGroup {
  id: string;
  name: string | null;
  memberCount: number;
  postsThisWeek: number;
  myPostCount: number;
  isMuted: boolean;
  isArchived: boolean;
}

export interface MyMentoring {
  canMentor: boolean;
  unavailableReason: string | null;
  isMentoring: boolean;
  isFoundingMentor: boolean;
  isPaused: boolean;
  bio: string | null;
  diagnoses: string[];
  journeyStages: string[];
  paths: string[];
  capacity: number;
  hasAcceptedGuidelines: boolean;
  openConnections: number;
  canFillFromProfile: boolean;
  profileDiagnoses: string[];
  profileJourneyStages: string[];
  profilePaths: string[];
}

export interface MyPartner {
  isLinked: boolean;
  partnerFirstName: string | null;
  linkedAt: string | null;
  showLinkedPartner: boolean;
  invites: PartnerInviteDto[];
}

export interface PartnerInviteDto {
  id: string;
  email: string | null;
  status: "Pending" | "Accepted" | "Expired" | "Cancelled" | "NotPossible";
  lastSentAt: string;
  expiresAt: string;
  resendsLeft: number;
}

/* ----------------------------------------------------------------- Calls */

const anon = { anonymous: true } as const;

export const authApi = {
  login: (body: { email: string; password: string; keepSignedIn: boolean }) =>
    httpClient.post<LoginResponse>("/auth/login", body, anon),
  google: (body: {
    idToken: string;
    keepSignedIn: boolean;
    isAdult: boolean;
    acceptsTerms: boolean;
    inviteCode?: string | null;
    partnerInviteToken?: string | null;
  }) => httpClient.post<LoginResponse>("/auth/google", body, anon),
  signUp: (body: {
    email: string;
    password: string;
    isAdult: boolean;
    acceptsTerms: boolean;
    inviteCode?: string | null;
    partnerInviteToken?: string | null;
  }) =>
    httpClient.post<{ email: string | null; message: string | null }>("/auth/signup", body, anon),
  signUpStatus: (query: { inviteCode?: string; partnerInviteToken?: string }) =>
    httpClient.get<SignUpStatus>("/auth/sign-up-status", { ...anon, query }),
  waitlist: (email: string) => httpClient.post("/auth/sign-up-waitlist", { email }, anon),
  verifyEmail: (token: string) => httpClient.post("/auth/verify-email", { token }, anon),
  resendVerification: (email: string) =>
    httpClient.post("/auth/resend-verification", { email }, anon),
  forgotPassword: (email: string) => httpClient.post("/auth/forgot-password", { email }, anon),
  resetPassword: (body: {
    email: string;
    token: string;
    newPassword: string;
    confirmNewPassword: string;
  }) => httpClient.post("/auth/reset-password", body, anon),
  me: () => httpClient.get<CurrentUser>("/auth/me"),
  logout: () => httpClient.post("/auth/logout"),
  signOutEverywhere: () => httpClient.post("/auth/sign-out-everywhere"),
  acceptTerms: (version: string) =>
    httpClient.post("/auth/terms", { version }, { noGateRedirect: true }),
  changeEmail: (email: string, currentPassword: string) =>
    httpClient.put<{ email: string | null; pendingEmail: string | null }>("/auth/account", {
      email,
      currentPassword,
    }),
  requestDeletion: (deletePostsAndComments: boolean) =>
    httpClient.post<{ deletesOn: string }>("/auth/account/deletion", { deletePostsAndComments }),

  /* The member's own snapshot, read by the session loader. */
  onboarding: () => httpClient.get<OnboardingState>("/onboarding", { noGateRedirect: true }),
  options: () => httpClient.get<OnboardingOptions>("/onboarding/options", { noGateRedirect: true }),
  profile: () => httpClient.get<MyProfile>("/profile/me", { noGateRedirect: true }),
  sunlight: () =>
    httpClient.get<MySunlight>("/profile/me/sunlight", {
      noGateRedirect: true,
      query: { pageSize: 50 },
    }),
  followers: () =>
    httpClient.get<{ members: MemberListItem[] }>("/profile/me/followers", {
      noGateRedirect: true,
    }),
  following: () =>
    httpClient.get<{ members: MemberListItem[] }>("/profile/me/following", {
      noGateRedirect: true,
    }),
  blocked: () =>
    httpClient.get<{ members: MemberListItem[] }>("/profile/me/blocked", { noGateRedirect: true }),
  myGroups: () =>
    httpClient.get<{ groups: MyGroup[] }>("/profile/me/groups", { noGateRedirect: true }),
  mentoring: () => httpClient.get<MyMentoring>("/profile/me/mentoring", { noGateRedirect: true }),
  partner: () => httpClient.get<MyPartner>("/profile/me/partner", { noGateRedirect: true }),
  invite: () =>
    httpClient.get<{ code: string | null; url: string | null }>("/invites/mine", {
      noGateRedirect: true,
    }),
};
