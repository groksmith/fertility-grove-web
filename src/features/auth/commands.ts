/* The member's own answers, from the store's `Me` to the request bodies the API takes. Onboarding
   (PUT /onboarding/*) and Settings (PUT /profile/me/*) send the same shapes. */

import { apiMessagePolicy } from "@/lib/api/enums";
import { avatarCode } from "@/lib/api/members";
import { codeOf, codesOf, communityIdOf } from "@/lib/api/options";
import type { Me } from "@/lib/mock-server";

const orNull = (v: string | undefined | null) => (v?.trim() ? v.trim() : null);
const codeOrNull = (v: string | undefined | null) => (v ? codeOf(v) : null);

export const commands = {
  journey: (m: Me) => ({
    journeyStages: codesOf(m.stages),
    treatments: codesOf(m.treatments),
    nextTreatmentDate: orNull(m.nextDate),
    consentToHealthAnswers: m.healthConsent,
  }),
  diagnosis: (m: Me) => ({
    diagnoses: codesOf(m.diagnoses),
    otherDiagnosis: orNull(m.otherDiagnosis),
    paths: codesOf(m.paths),
  }),
  health: (m: Me) => ({
    journeyStages: codesOf(m.stages),
    treatments: codesOf(m.treatments),
    nextTreatmentDate: orNull(m.nextDate),
    diagnoses: codesOf(m.diagnoses),
    otherDiagnosis: orNull(m.otherDiagnosis),
    paths: codesOf(m.paths),
  }),
  aboutYou: (m: Me) => ({
    genderIdentity: codeOf(m.gender),
    genderSelfDescription: orNull(m.genderSelf),
    pronouns: codeOrNull(m.pronouns),
    pronounsSelfDescription: orNull(m.pronounsSelf),
    ageRange: codeOrNull(m.ageRange),
    zipCode: m.zip.trim(),
  }),
  lookingFor: (m: Me) => ({
    lookingFor: codesOf(m.lookingFor),
    // The API keeps one preference; the first chosen is it.
    connectPreference: codeOrNull(m.connectStyle[0]),
  }),
  community: (m: Me) => ({ communityId: communityIdOf(m.community) ?? "" }),
  onboardingProfile: (m: Me) => ({
    firstName: m.firstName.trim(),
    lastName: m.lastName.trim(),
    handle: m.handle.trim(),
    showRealName: m.showRealName,
    avatarCode: avatarCode(m.avatarHue, m.avatarPreset),
    aboutMe: orNull(m.aboutMe),
  }),
  publicProfile: (m: Me) => ({
    firstName: m.firstName.trim(),
    lastName: m.lastName.trim(),
    showRealName: m.showRealName,
    avatarCode: avatarCode(m.avatarHue, m.avatarPreset),
    aboutMe: orNull(m.aboutMe),
    myStory: orNull(m.myStory),
  }),
  connections: (m: Me) => ({
    suggestMe: m.suggestMe,
    whoCanMessage: apiMessagePolicy(m.messagePolicy),
    wantsMentor: m.wantMentor,
    showSuccessStories: m.showStories,
    showHealthOnProfile: m.shareJourney,
    notifyCommentsAndReplies: m.notify.comments,
    notifyDirectMessages: m.notify.messages,
    includeFollowsInDailyUpdate: m.notify.includeFollows,
  }),
  settings: (m: Me) => ({
    ...commands.connections(m),
    notifyMentoringUpdates: m.notify.mentoring,
    notifyPartnerUpdates: m.notify.partner,
    pauseOptionalEmails: m.notify.pauseAll,
    showLinkedPartner: m.showPartner,
  }),
};
