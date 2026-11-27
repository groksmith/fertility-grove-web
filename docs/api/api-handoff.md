# API Handoff

Frontend integration reference for the Fertility Grove public API, one section per feature. Each section covers endpoints, DTOs, enums, validation, edge cases and test scenarios, and lists what is not built yet.

## Contents

- [Option lists and codes](#option-lists-and-codes) — read first
- [Sign-in safety](#sign-in-safety)
- [Account deletion](#account-deletion)
- [Data export](#data-export)
- [Retention](#retention)
- [Notifications](#notifications)
- [Partners](#partners)
- [Matching](#matching)
- [Mentoring](#mentoring)
- [Messaging](#messaging)
- [Dashboard](#dashboard)
- [Guest browsing](#guest-browsing)
- [Google sign-in](#google-sign-in)
- [Group page header](#group-page-header)
- [Email unsubscribe](#email-unsubscribe)
- [Learn library](#learn-library)
- [Crisis check](#crisis-check)

---

## Option lists and codes

Every choice a member picks from a fixed list (avatar, diagnosis, journey stage, pronouns, topic
tags, …) is sent and stored as an option **code**, never as its label and never as a value the
frontend makes up. Admins manage these lists, so codes and labels can change without a frontend
release. **Never hard-code them**: load them from the API.

An unknown, inactive, misspelled or empty-string code is rejected with **422** and
`"That option isn't available. Choose another one."` on the field, for example:

```json
{ "status": 422, "errors": { "avatarCode": ["That option isn't available. Choose another one."] } }
```

Example values elsewhere in this document (`avatar_03`, `endometriosis`, …) are real seeded codes,
but they illustrate the shape only. Take the actual values from the endpoint below.

### GET /api/v1/onboarding/options

- **Auth**: signed-in member. Open during onboarding and before the current Terms are accepted.
  Not available to guests (see Open Questions).
- **Response** (200): every active list, keyed by list name in **camelCase**, items in the admin's
  order, plus the communities.
  ```json
  {
    "lists": {
      "avatar": [
        { "code": "avatar_01", "label": "Avatar 1" },
        { "code": "avatar_02", "label": "Avatar 2" }
      ],
      "pronouns": [
        { "code": "she_her", "label": "she/her" }
      ]
    },
    "communities": [
      { "id": "uuid", "name": "…", "description": "…" }
    ]
  }
  ```
- **Usage**: show `label`, send `code`. Fetch once per session (or per onboarding run) and cache.
  A list key with no active options is **absent** from `lists`, so read it as `lists.x ?? []`.

### Lists and the fields that take them

| `lists` key | Sent by (request field → endpoint) |
|---|---|
| `avatar` | `avatarCode` → `PUT /api/v1/onboarding/profile`, `PUT /api/v1/profile/me`. Single code; send `null` (not `""`) for "no avatar" |
| `journeyStage` | Onboarding journey screen (`PUT /api/v1/onboarding/journey`); mentoring setup `journeyStages` |
| `treatment` | Onboarding journey screen; `PUT /api/v1/profile/me/health` |
| `diagnosis` | `PUT /api/v1/onboarding/diagnosis`; `PUT /api/v1/profile/me/health`; success story publish/edit `diagnoses` (returned as `storyDiagnoses`); mentoring setup `diagnoses` |
| `pathToParenthood` | `PUT /api/v1/onboarding/diagnosis`; `PUT /api/v1/profile/me/health`; mentoring setup `paths` |
| `genderIdentity`, `pronouns`, `ageRange` | About you: `PUT /api/v1/onboarding/about-you`, `PUT /api/v1/profile/me/about-you` |
| `lookingFor`, `connectPreference` | Looking for: `PUT /api/v1/onboarding/looking-for`, `PUT /api/v1/profile/me/looking-for` |
| `topicTag` | Post `topicTags` (create and edit) |
| `crisisResource` | Read-only. Show crisis resources from `GET /api/v1/crisis-resources`, not from this list |

`communities` is not a code list: send the community `id` (uuid).

### Codes vs labels in responses

Most responses return **codes** (`avatarCode`, `topicTags`, `profileDiagnoses`, …); map them to
labels through the cached lists. A few return **labels** already, because guests can't load the
lists:

- Learn library `diagnoses`, `journeyStages`, `topics` are labels, while its `?diagnosis=` and
  `?topic=` filters take **codes**.
- Guest posts `authorPronouns` is a label (or the member's own self-description).

If a code in a response is missing from the cached lists (an admin retired it), show nothing for
it rather than the raw code.

### Open Questions / TODOs

- Guests can't call `GET /api/v1/onboarding/options`, so a guest Learn page has no source for
  filter codes yet. Needs a public options endpoint or labels-with-codes on Learn.

---

## Sign-in safety

**Scope:** Sign-in safety: new sign-in email and Terms re-acceptance (PRD §4, §15, §15a)

### Business Context
Two safety features around sign-in.

**Terms re-acceptance (PRD §4)**: "When the Terms or Privacy Policy change, the member accepts the new version at their next sign-in." The backend holds one **Terms version** string, which covers both the Terms and the Privacy Policy. When it changes, every member whose accepted version differs is shut out of the app until they accept the new one. Every member endpoint answers **403 `TERMS_NOT_ACCEPTED`** until then.

**New sign-in email (PRD §15 "Sign-in from a new device", §15a "New sign-in")**: when an account signs in from a device or browser it has not seen before, the member gets an email: "New sign-in to your account". It names the device type ("Safari on iPhone") and the time, and has a **Reset my password** button. It is email only, sent right away, and cannot be turned off. There is no in-app notification and no "this wasn't me" API.

Domain terms:
- **Terms version**: an opaque string set in backend configuration (currently `"2026-11-01"`). Treat it as opaque: compare and send it back, never parse it.
- **Device token**: a random URL-safe string that identifies a browser or app install. It is **not a credential**. It only decides whether the New sign-in email is sent. Browsers keep it in an HttpOnly `device_id` cookie. Other clients keep it themselves.
- **Known device**: a device token this account has signed in with. It is forgotten after 90 days without a sign-in (§21).

### Endpoints

JSON is camelCase. Errors are RFC 7807 ProblemDetails. Show `detail` to the member. Cookie clients send the CSRF header (`X-CSRF-Token`) on writes, as for every other authenticated POST.

#### POST /api/v1/auth/login (changed: additive)
- **Purpose**: Email sign-in. Now also detects new devices and reports whether the member must accept new Terms.
- **Auth**: anonymous. Rate-limited (`auth` policy).
- **Request**:
  ```json
  {
    "email": "annie@example.com",
    "password": "a long passphrase",
    "keepSignedIn": false,
    "deviceToken": "string | null — NEW, optional. Non-browser clients only: the deviceToken a previous sign-in returned"
  }
  ```
- **Response** (200):
  ```json
  {
    "accountId": "3f2a…",
    "email": "annie@example.com",
    "isEmailConfirmed": true,
    "keepSignedIn": false,
    "sessionExpiresAt": "2026-11-20T10:00:00Z",
    "accessToken": "eyJ…",
    "refreshToken": "…",
    "wasRestored": false,
    "deviceToken": "q3Jx…_-",      // NEW
    "mustAcceptTerms": true,       // NEW
    "termsVersion": "2026-11-01"   // NEW: the current version, to send back when accepting
  }
  ```
- **Cookies set**: along with the existing auth cookies, a **new `device_id` cookie**:
  - HttpOnly;
  - `Path=/api/v1/auth`;
  - 365 days;
  - same `Secure` and `SameSite` (`Lax`) settings as the refresh cookie.

  The cookie is **not** removed on logout. It identifies the browser, not the person signed in.
- **Errors**: unchanged. 400 `"That email or password isn't right."`, 429 locked out, 422 validation.
- **Notes**:
  - If the request carries a `device_id` cookie, the cookie **wins** over the body `deviceToken`.
  - A missing or blank token, or one over 128 characters, is not an error. The server mints a new one, and the sign-in counts as a new device.
  - The response always returns a `deviceToken`, the same one or a new one. Browser apps can ignore it, because the cookie handles everything. Native and other cookie-less clients should store it locally and send it on every later sign-in.
  - The User-Agent header is read for the device type in the email. Native apps should send a meaningful User-Agent (see Business Logic).
  - A **wrong password never records a device** and never sends the email.

#### GET /api/v1/auth/me (changed: additive)
- **Purpose**: The current account. Now also carries the Terms state.
- **Auth**: signed-in member. **Open while Terms are not accepted** (and during onboarding).
- **Response** (200):
  ```json
  {
    "id": "3f2a…",
    "email": "annie@example.com",
    "pendingEmail": null,
    "isEmailConfirmed": true,
    "createdAt": "2026-10-01T08:00:00Z",
    "mustAcceptTerms": true,       // NEW
    "termsVersion": "2026-11-01"   // NEW: current version
  }
  ```
- **Notes**: use this on app start or reload with an existing session. `/auth/refresh-token` does **not** return `mustAcceptTerms`.

#### POST /api/v1/auth/terms (new)
- **Purpose**: The member accepts the current Terms and Privacy Policy.
- **Auth**: signed-in member. Open while Terms are not accepted and during onboarding. Cookie clients send the CSRF header.
- **Request**:
  ```json
  { "version": "2026-11-01" }
  ```
  Send back the `termsVersion` the member was shown, taken from login, `/auth/me` or the 403 body. Do not hard-code it.
- **Response**: **204 No Content**. Saves the version and the acceptance date on the account. Accepting the same version again is harmless (204).
- **Errors**:
  - 400 `detail: "The Terms have changed again. Reload to see the latest version."`: `version` is not the current one, because the Terms changed again while the member was reading. Re-fetch `/auth/me`, show the new version and ask again.
  - 422: `version` empty or over 20 characters, as `errors.Version: ["…"]` (FluentValidation's default message).
  - 401: not signed in.

#### The `TERMS_NOT_ACCEPTED` gate (every member endpoint)
- **Who sees it**: any signed-in **member** whose accepted Terms version differs from the current one. This includes accounts with **no recorded version**: such accounts are asked once.
- **Response** (403):
  ```json
  {
    "title": "TERMS_NOT_ACCEPTED",
    "detail": "Accept the updated Terms and Privacy Policy to continue.",
    "status": 403,
    "termsVersion": "2026-11-01"
  }
  ```
- **Order**: the Terms check runs **before** the onboarding check. A member who is still onboarding and also has outdated Terms gets `TERMS_NOT_ACCEPTED` first, and `ONBOARDING_INCOMPLETE` (with `nextStep`) after accepting.
- **Endpoints that stay open** (they skip both the Terms gate and the onboarding gate):
  - Everything under `/api/v1/auth/*`:
    - `login`, `signup`, `sign-up-status`, `sign-up-waitlist`;
    - `forgot-password`, `reset-password`, `verify-email`, `resend-verification`;
    - `refresh-token`, `me`, `logout`, `sign-out-everywhere`;
    - `PUT account`, `terms`, `POST account/deletion`.
  - Everything in the onboarding controller.
  - `POST /api/v1/profile/me/partner/invites`, `GET /api/v1/partner-invites/{token}` and `POST /api/v1/partner-invites/{token}/accept`.
  - The email unsubscribe endpoint (`POST …/unsubscribe`, anonymous).
- **Not gated at all**: anonymous requests and admin tokens.
- **Everything else** (profile, feed, posts, messages, notifications list, …) returns this 403 until accepted.
- Terms, Privacy and Help **pages** are frontend content. The backend serves no Terms text.

#### "This wasn't me" (new sign-in email)
- **No dedicated endpoint.** The email's button and plain-text link both go to the **frontend route `{FRONTEND_BASE_URL}/forgot-password`**. That route must exist.
- From there the existing flow applies:
  1. `POST /api/v1/auth/forgot-password`;
  2. the emailed reset link;
  3. `POST /api/v1/auth/reset-password`, which **ends every session** on the account.
- The email says: "If it wasn't, reset your password right away. That signs out every other device."

### Data Models / DTOs

```typescript
interface LoginRequest {
  email: string;
  password: string;
  keepSignedIn?: boolean;      // default false
  deviceToken?: string | null; // non-browser clients only
}

interface LoginResponse {
  accountId: string;
  email: string;
  isEmailConfirmed: boolean;
  keepSignedIn: boolean;
  sessionExpiresAt: string;    // ISO 8601 UTC
  accessToken: string;
  refreshToken: string;
  wasRestored: boolean;
  deviceToken: string;         // URL-safe, ≤ 128 chars. Store it if you don't use cookies
  mustAcceptTerms: boolean;
  termsVersion: string;        // current version
}

interface CurrentUserResponse {
  id: string;
  email: string;
  pendingEmail: string | null;
  isEmailConfirmed: boolean;
  createdAt: string;           // ISO 8601 UTC
  mustAcceptTerms: boolean;
  termsVersion: string;
}

interface AcceptTermsRequest {
  version: string;             // 1–20 chars, must equal the current termsVersion
}

interface TermsNotAcceptedProblem {
  title: 'TERMS_NOT_ACCEPTED';
  detail: string;
  status: 403;
  termsVersion: string;
}
```

### Enums & Constants

| Value | Meaning | Display Label |
|---|---|---|
| `TERMS_NOT_ACCEPTED` (403 `title`) | Must accept the current Terms before using the app | "Accept the updated Terms and Privacy Policy to continue." |
| `ONBOARDING_INCOMPLETE` (403 `title`, existing) | Onboarding unfinished. Checked after Terms | "Finish onboarding to continue." |

Device descriptions in the email: `"{Browser} on {System}"`, built from the User-Agent.
- Browsers: Edge, Opera, Firefox, Chrome, Safari.
- Systems: iPhone, iPad, Android, Windows, Mac, Chromebook, Linux.
- Fallbacks:
  - browser only: `"Chrome"`;
  - system only: `"A browser on iPhone"`;
  - neither: `"A web browser"`.

Constants:
- device token up to 128 characters;
- `device_id` cookie lasts 365 days;
- known devices forgotten after 90 days unused;
- `version` up to 20 characters;
- email time format `"November 12, 2026 at 09:03 UTC"` (always UTC).

### Validation Rules
- `POST /auth/terms`:
  - `version` required (not empty) → 422;
  - `version` max 20 characters → 422;
  - `version` must equal the current version → 400 `"The Terms have changed again. Reload to see the latest version."`
- `POST /auth/login`: `deviceToken` is **not validated**. Blank or over 128 characters means a new token is minted.

### Business Logic & Edge Cases
- **When the New sign-in email is sent**: on a successful email sign-in whose device token this account has not seen, **unless the account has no known devices yet**.
  - An account's first device is learned silently. In practice, the first sign-in right after sign-up, and existing members' first sign-in after this release, send nothing.
  - Sign-up itself never sends it.
- **Not sent** for:
  - a known device;
  - a failed password attempt;
  - a locked-out attempt;
  - `refresh-token`.
- **Shared browser**: one `device_id` is kept per browser for all accounts on it. Each account learns it separately, so member B's first sign-in on member A's laptop emails B, unless it is B's first device ever.
- **Sent again** for a device after:
  - 90 days without a sign-in from it;
  - the browser's cookies being cleared;
  - a native app being reinstalled without its stored token.
- **Email contents**:
  - greeting with the first name, if onboarding collected one;
  - device type and UTC time;
  - "If this was you, no action is needed";
  - **Reset my password** → `/forgot-password`.

  It goes to the account's current email and commits atomically with the sign-in, through the outbox.
- **Terms gate applies mid-session**: if the version changes while a member is signed in, their next gated request returns 403 `TERMS_NOT_ACCEPTED`. Nothing pushes this. The client finds out from the 403.
- **Stale acceptance**: accepting an old version is refused (400), so a change made while the member was reading is never accepted on their behalf.
- **Account restored during the deletion window** (`wasRestored: true`) can also have `mustAcceptTerms: true`. Show both.

### Integration Notes
- **Recommended flow**:
  1. `POST /auth/login`. For browsers, call it with `credentials: 'include'` so the `device_id` cookie is stored and sent back. The cookie is HttpOnly and path-scoped to `/api/v1/auth`, so JS never sees it.
  2. If `mustAcceptTerms`, route to a blocking "Updated Terms" screen. Link both documents, and offer a single **Accept** button plus **Sign out**.
  3. On Accept, `POST /auth/terms { version: termsVersion }`. On 204, continue to the normal post-login routing (onboarding or home).
  4. On 400 (changed again), re-fetch `GET /auth/me` and re-show the screen with the new version.
- **On app load with an existing session**: `GET /auth/me` → same check on `mustAcceptTerms`.
- **Global 403 handler**:
  - `title === 'TERMS_NOT_ACCEPTED'` → open the Terms screen, using `termsVersion` from the body;
  - `ONBOARDING_INCOMPLETE` → onboarding at `nextStep`.
- **Native / non-cookie clients**:
  - store `deviceToken` from every login response (it can change) in app storage;
  - send it as `deviceToken` on the next login;
  - it is not secret like a session token, but do not log or share it.
- **Optimistic UI**: not for accepting Terms. Wait for the 204, because a 400 means a newer version.
- **Caching**: don't cache `termsVersion` across sessions. Read it from login, `/me` or the 403.
- **Real-time**: none. The new sign-in alert is email only.

### Test Scenarios
1. **First device is silent**: sign up, then sign in → 200, no "New sign-in" email.
2. **New browser**: sign in from a second browser or incognito → one email naming e.g. "Safari on iPhone". Sign in again from that browser → no second email.
3. **Cookie-less client**: log in without a token (email if not the first device), then log in with the returned `deviceToken` → no new email.
4. **Wrong password** from a new browser → 400, no email, no device recorded.
5. **Reset link**: the email button opens `/forgot-password` on the frontend.
6. **Terms changed**: an account with an old version calls `GET /api/v1/profile/me` → 403 `TERMS_NOT_ACCEPTED` with `termsVersion`.
7. **Terms state**: `GET /auth/me` → `mustAcceptTerms: true`. Login → `mustAcceptTerms: true`.
8. **Stale accept**: `POST /auth/terms { version: "something-else" }` → 400 "The Terms have changed again…".
9. **Accept**: `POST /auth/terms` with the current version → 204. Gated endpoints work again, and the next login has `mustAcceptTerms: false`.
10. **Validation**: `POST /auth/terms {}` or a 21+ character version → 422.
11. **Gate order**: a member who is still onboarding and has an old Terms version → `TERMS_NOT_ACCEPTED` on the feed, while onboarding endpoints still work. After accepting → `ONBOARDING_INCOMPLETE`.
12. **Open endpoints**: logout, `/auth/me` and the onboarding endpoints all succeed while Terms are not accepted.

### Open Questions / TODOs
- **Google sign-in** is not built. Device detection runs only on email login today.
- **Terms and Privacy share one version string.** There is no way to say which document changed. If the UI wants "Our Privacy Policy changed", the backend would need to split them.
- **No API for documents**: there is no endpoint that serves the Terms text or a change summary for a version. The frontend hosts the documents and must match them to the configured version.
- **No "this wasn't me" action**: no session list or "sign out that device" endpoint exists. The recovery path is password reset, as the PRD's §15a row specifies.
- **Native apps** with a generic User-Agent get "A web browser" or a partial description in the email. Agree on a User-Agent format (e.g. include "iPhone" / "Android") if native clients ship.

---

## Account deletion

**Scope:** Account deletion with 14 days to restore (PRD §4, FG-AUTH-04)

### Business Context
A member can delete their account from Settings. Confirming signs them out on every device at once, and the account becomes **deletion pending** for **14 days**. During that time the member is **away**: other members can't see their profile, posts or comments, and they receive no messages or notifications. **Signing in again within the 14 days restores everything** as it was. After 14 days a background job completes the deletion. The member chose earlier whether their posts and comments go with it, or stay as **"Deleted member"**.

Domain terms:
- **Deletion pending**: the 14-day grace period. The member is signed out. Their next successful sign-in cancels the deletion.
- **Away**: how other members experience a pending member. Profile reads "This profile isn't available.", content is hidden, and messages are refused with "This member can't receive messages right now." Suspension will use the same state in M4.
- **Deleted member**: what a member whose deletion has completed looks like in what others keep: conversations, mentorships and posts or comments they chose to keep. `displayName` is `"Deleted member"` and `handle` is `null`.
- **Retired handle**: a deleted member's handle can never be taken again.

### Endpoints

All JSON is camelCase and enums are strings. Errors are RFC 7807 ProblemDetails. Show `detail` to the member, since it holds the PRD wording. Cookie clients send the CSRF header on every `POST`.

#### POST /api/v1/auth/account/deletion
- **Purpose**: "Delete my account" in the confirmation pop-up (Settings).
- **Auth**: signed-in member (bearer or `access_token` cookie).
  - Works **before onboarding is finished** and **without accepting new Terms**, because the auth controller is exempt from both gates.
  - Does **not** need a confirmed email.
  - Does **not** ask for the password again.
- **Request**:
  ```json
  {
    "deletePostsAndComments": true   // "Also delete my posts and comments". Defaults to true if omitted
  }
  ```
  Always send a JSON body, even `{}`. With no body the command never binds and the request fails with a 400, not a default deletion.
- **Response** (200):
  ```json
  {
    "deletesOn": "2026-12-03T10:15:00Z"   // ISO 8601 UTC: request time + 14 days
  }
  ```
- **Side effects, all in one transaction**:
  - Every session on every device ends. The response also clears the auth cookies.
  - From then on, the old access token gets **401** (sessions are checked on every request) and `refresh-token` returns 400 "Your session has ended. Please sign in again."
  - The **Deletion scheduled** email is queued (see Emails).
  - If the member is a mentor, waiting mentor requests to them are **declined** with the kind default message. Active mentoring connections are only paused.
- **Errors**:
  - 401: no or expired session.
  - 400 `"This account is already being deleted."`: the account is already pending. In practice you won't see this, because the request already ended every session, so a repeat call gets 401.
- **Notes**: after the 200, treat the member as signed out. Clear local auth state and go to a "Your account will be deleted on [deletesOn]" screen, or straight to sign-in. Format the date in the member's locale.

#### POST /api/v1/auth/login (changed: `wasRestored`)
- **Purpose**: sign-in. **This is also the restore flow.** No separate "restore" endpoint exists.
- **Auth**: anonymous, `auth` rate-limit policy.
- **Request** (unchanged):
  ```json
  { "email": "annie@example.com", "password": "…", "keepSignedIn": false, "deviceToken": null }
  ```
- **Response** (200), with the new field:
  ```json
  {
    "accountId": "…",
    "email": "annie@example.com",
    "isEmailConfirmed": true,
    "keepSignedIn": false,
    "sessionExpiresAt": "2026-11-20T10:15:00Z",
    "accessToken": "…",
    "refreshToken": "…",
    "wasRestored": true,          // NEW: this sign-in cancelled a pending deletion
    "deviceToken": "…",
    "mustAcceptTerms": false,
    "termsVersion": "2026-10"
  }
  ```
- **Behavior during the 14 days**:
  - The right email and password **restores the account immediately**, as part of signing in. There is no "Restore?" confirmation step on the server.
  - The status goes back to what it was before. An unconfirmed member stays unconfirmed, so `isEmailConfirmed` reflects that.
  - The **Account restored** email is queued. The usual **New sign-in** email may also go out if this browser or device is new to the account.
  - A wrong password gives the usual 400 `"That email or password isn't right."` and counts toward lockout as normal (429 `title: "LOGIN_RATE_LIMITED"`). The account stays pending.
- **After the deletion completes**: login returns 400 `"That email or password isn't right."`, the same as an unknown email. The email address is free, so a new sign-up with it creates a brand-new account.
- **Notes**: if `wasRestored` is true, show a "Your account is back" confirmation (toast or banner), then continue the normal post-login routing (Terms, onboarding, home).

#### Other endpoints touched (response shape changes only)
These fields are now **nullable**, because a member whose deletion completed has no handle:

| Endpoint | Field |
|---|---|
| `GET /api/v1/conversations` | `conversations[].otherMemberHandle` |
| `GET /api/v1/conversations/{id}/messages` | `otherMemberHandle` |
| `GET /api/v1/mentorships` | `mentorships[].otherMemberHandle` (plus the new `otherMemberIsAway`) |
| Post lists, post detail, public post | `authorHandle` on posts and comments |

When the handle is `null`, the matching `…DisplayName` is `"Deleted member"` and the avatar code is `null`. Don't link to a profile.

### Data Models / DTOs

```ts
interface RequestAccountDeletionRequest {
  deletePostsAndComments?: boolean; // default true
}

interface RequestAccountDeletionResponse {
  deletesOn: string; // ISO 8601 UTC
}

interface LoginResponse {
  accountId: string;
  email: string;
  isEmailConfirmed: boolean;
  keepSignedIn: boolean;
  sessionExpiresAt: string;
  accessToken: string;
  refreshToken: string;
  wasRestored: boolean;      // NEW
  deviceToken: string;
  mustAcceptTerms: boolean;
  termsVersion: string;
}

// GET /api/v1/mentorships item, relevant fields
interface MentorshipItem {
  id: string;
  iAmMentor: boolean;
  otherMemberHandle: string | null;   // null => "Deleted member"
  otherMemberDisplayName: string;
  otherMemberAvatarCode: string | null;
  otherMemberTreeLevel: TreeLevel;
  otherMemberIsAway: boolean;         // NEW: the other member is deleting their account
  status: MentorshipStatus;           // "Requested" | "Active" | "Declined" | "Expired" | "Ended" ...
  statusMessage: string | null;       // mentee side: "Your mentor is away for now." while away
  endedBy: "Me" | "Them" | "Nobody" | null;
  // ...unchanged fields
}

// Conversations, posts and comments: only the nullability change
type MemberHandle = string | null; // null => deleted member
```

### Enums & Constants

| Value | Meaning | Display Label |
|---|---|---|
| `"Deleted member"` (display name) | Member whose deletion completed | Deleted member |
| `MentoringEnded` (notification kind, no actor) | Your mentor or mentee's account was deleted | A mentoring connection ended (no name: copy is the frontend's; daily email says "mentoring connection ended") |
| `PartnerLeft` (notification kind, no actor) | Your linked partner's deletion completed | "Your partner has left Fertility Grove" |

Constants:
- Grace period: **14 days** from the request (to the second, not to the calendar day).
- The completion job runs **hourly**, so the deletion lands up to about 1 hour after `deletesOn`.

Account statuses exist server-side (`Unconfirmed`, `Active`, `DeletionPending`, `Deleted`) but are **not exposed** in any response.

### Validation Rules
- `deletePostsAndComments`: optional boolean, default `true`. No other fields, no FluentValidation rules.
- The body must be valid JSON (send `{}` at minimum).

### Business Logic & Edge Cases

**While pending: what the member experiences**
- Signed out everywhere. Any stored token gets 401.
- They can still use **Forgot password**, which works normally. Resetting the password does **not** restore the account. The sign-in afterwards does.
- Signing up again with the same email returns the usual 202. It does not create a second account; the "Sign-up attempt" email goes to the existing address.

**While pending: what other members see** (all as if the member doesn't exist)

| Surface | Behavior |
|---|---|
| Profile `GET /members/{handle}` | 404 `"This profile isn't available."` |
| Follow / unfollow / remove follower / block by handle | 404 `"This profile isn't available."` |
| Start conversation `POST /members/{handle}/messages` | 404 `"This profile isn't available."` |
| Send in an existing conversation | **400** `"This member can't receive messages right now."` |
| Request a mentor | 404 `"This profile isn't available."` |
| Their posts: group feeds, home feed, post matches, public post links | Hidden. Opening one returns 404 `"This post isn't available."` |
| Their comments on others' posts | Hidden from the thread |
| A post they wrote, attached in a message | `post.isAvailable: false` |
| Member search, peer matches, mentor matches | Not listed |
| My Followers / Following lists | Not listed. The **Blocked** list still shows them, so unblock still works |
| Notifications they caused | Hidden from the bell (they come back on restore) |
| Mentorships (mentee side) | `otherMemberIsAway: true`, status unchanged (`Active`), `statusMessage: "Your mentor is away for now."` |
| Mentorships (mentor side, mentee away) | `otherMemberIsAway: true`, no `statusMessage` |
| Conversation list / thread | **Still listed** with their normal name and handle. Only sending is refused |
| Partner invite link from them | Reads as expired / not possible |

- The 400 on sending only applies when the sender is not blocked by the pending member. If they blocked the sender, the existing block rule still applies: the message "looks sent" (201) and is never delivered.
- No notifications are created **for** the pending member (they are skipped, not queued), so nothing piles up for after a restore.

**Restore (sign-in within 14 days)**
- Restores status, visibility, follows, conversations, mentorships, partner link and content, because nothing was removed.
- **Not undone**: mentor requests that were declined at deletion time stay declined.
- Notifications that would have been sent to them while away are not backfilled.

**Completion (after 14 days, hourly job)**
- Sign-in is impossible. The email is freed and the handle is retired: `PUT /profile/me/handle` with that handle → "That handle isn't available."
- Profile, health answers, consents, follows, blocks (either direction), group memberships, matches, Sunlight history, votes, saved posts, data exports, notifications (theirs and ones about them), and their own copy of each conversation are removed.
- **Posts and comments**:
  - **Ticked** (`deletePostsAndComments: true`): their posts and comments are deleted. A deleted post with replies shows as deleted ("This post was deleted"), and others' replies stay.
  - **Unticked**: they stay published, authored by "Deleted member" (`authorHandle: null`).
- **Conversations**: the other member keeps theirs, with `otherMemberDisplayName: "Deleted member"` and `otherMemberHandle: null`. If the other member had already deleted it, it's removed for good.
- **Mentoring**: open requests and active connections end (`status: "Ended"`, `endedBy: "Them"` for the one who stays). The person who stays gets a `MentoringEnded` notification with **no actor**. Their mentor setup is removed. Thank-you notes stay, with no name.
- **Partner link**: ends. The partner gets `PartnerLeft` ("Your partner has left Fertility Grove"), never "deleted". The member's pending partner invites are removed.

**Emails** (transactional, can't be turned off, sent right away)

| When | Subject | Content | Button |
|---|---|---|---|
| Deletion requested | `Your account will be deleted on {Month d, yyyy}` | Account closed for now. Signing in before then restores everything; after that profile, messages and chats are removed | **Restore my account** → `{frontend}/sign-in` |
| Signed in within 14 days | `Your account is back` | Signed in, so the account won't be deleted. Everything restored | **Go to my home** → `{frontend}/home` |
| Deletion completed | `Your account has been deleted` | What was removed. Posts/comments: "were removed too…" or "stay… shown as 'Deleted member'", per the choice. Thanks | none |

The frontend must serve **`/sign-in`** and **`/home`**, since the emails link there.

### Integration Notes
- **Recommended flow (delete)**:
  1. Settings → Delete my account → pop-up with what will be removed, the 14-day note, a checkbox "Also delete my posts and comments" (ticked), and Delete my account / Cancel.
  2. `POST /api/v1/auth/account/deletion` with `{ deletePostsAndComments }`.
  3. On 200: wipe local auth state (tokens, cached user, query caches). Cookies are already cleared server-side.
  4. Show a signed-out confirmation: "Your account will be deleted on {deletesOn}. Sign in before then to restore it."
- **Recommended flow (restore)**: normal sign-in form → if `wasRestored`, show "Your account is back", then continue the usual routing (`mustAcceptTerms` → Terms screen, onboarding, home). Consider a short note on the sign-in screen: "Signing in within 14 days of deleting your account restores it." The server can't tell you in advance whether an email is pending deletion.
- **Rendering "Deleted member"**: anywhere a handle can be `null`, render the display name as plain text, a neutral avatar, and no profile link, follow, message or block actions. In a conversation with a deleted member, the composer is useless. Sending would return 400 "This member can't receive messages right now."
- **Away mentor**: when `otherMemberIsAway` is true, show `statusMessage` and disable "Message"/"End mentoring" affordances as you see fit. Sending returns 400 anyway.
- **Optimistic UI**: none for deletion. Wait for the 200 before signing out locally.
- **Caching**: after a 404 "This profile isn't available." or "This post isn't available.", evict that profile or post from caches. Pending members can reappear (restore), so don't cache the 404 long-term.
- **Real-time**: none. Other members see changes on their next fetch.

### Test Scenarios
1. **Happy path delete**: `POST /auth/account/deletion {deletePostsAndComments:true}` → 200 with `deletesOn` ≈ now + 14 days. Next `GET /auth/me` with the old token → 401. "Your account will be deleted on …" email arrives.
2. **Away to others**: B opens A's profile → 404 "This profile isn't available."; A's post → 404 "This post isn't available."; group feed and search no longer show A; follow A → 404.
3. **Messaging an away member**: B sends in an existing conversation with A → 400 "This member can't receive messages right now." The conversation still lists A normally.
4. **Restore**: A signs in within 14 days → 200 with `wasRestored: true`; "Your account is back" email; B sees A's profile and posts again.
5. **Normal sign-in**: any sign-in for a non-pending account → `wasRestored: false`.
6. **Wrong password while pending**: 400 "That email or password isn't right."; the account stays pending; repeated failures → 429 `LOGIN_RATE_LIMITED`.
7. **Mentor deletes**: mentee with an active connection sees `status: "Active"`, `otherMemberIsAway: true`, `statusMessage: "Your mentor is away for now."`. A mentee with a waiting request sees it `Declined` with the default note.
8. **Completion, ticked**: after 14 days A's post shows as deleted, B's comment on it stays; B's conversation shows "Deleted member", `otherMemberHandle: null`; A's login → 400; final email says posts were removed.
9. **Completion, unticked**: A's post stays published with `authorDisplayName: "Deleted member"`, `authorHandle: null`.
10. **Handle retired**: after completion, B tries to take A's old handle → refused "That handle isn't available."
11. **Email reuse**: after completion, signing up with A's old email creates a new, separate account.
12. **Mid-onboarding**: a member with onboarding unfinished can still delete (no 403 `ONBOARDING_INCOMPLETE`).

### Open Questions / TODOs
- **AI credits warning** ("You have [N] purchased credits. They will be lost." + "I understand"): credits are not built yet, so no balance endpoint exists. Leave this part of the pop-up out for now.
- **Grove Guide chats, family space items**: not built. Their removal and pending-period hiding will come with those features.
- **Suspension screen "Restore my account"** (PRD §19): moderation is M4. Today, restore is only by normal sign-in.
- **Partner during the 14 days**: the linked partner still sees the partner link (`GET` my partner) while the member is pending. PRD §4 says items shared in the family space are hidden then. That will matter once the family space exists.
- **PRD wording vs code**: PRD §4 says "People who message them see 'This member can't receive messages right now.'" The API returns that only inside an **existing** conversation. Starting a new one from a handle returns 404 "This profile isn't available." (consistent with the profile being hidden).
- **Backend edge (flagged)**: if an **unconfirmed** member deletes, then opens the email-confirmation link while pending, the confirmation is consumed but the restore later puts them back to unconfirmed. They would need to request a new link. This is rare. Raise it with backend if you see it.
- Google sign-in is not built. Restore is via email + password only.

---

## Data export

**Scope:** Download my data (PRD §6, FG-PROF-03)

### Business Context
A member can ask for a copy of everything they have put into Fertility Grove ("Download my data" in Settings). The file is **prepared in the background** (usually within a minute or two). When it is ready the member gets an email that says only that it is ready. The email has no data in it and links to `/settings/data`. Because the file holds health data, the member **enters their password again** before it downloads. Each file can be downloaded for **7 days**. After that the file is deleted from the server.

Domain terms:
- **Data export**: one request for a copy. Status goes `Preparing → Ready → Expired` (PRD §23).
- **Data file**: a `.zip` holding `data.json` (machine-readable) and `data.html` (the same data as a readable page). Both come from the same data, so neither has anything the other lacks.
- **Display identity**: inside the file, other members appear only as they appear in the app (`@handle`, or "First L."), or as "Deleted member".

### Endpoints

All three endpoints need a signed-in member (bearer token or `access_token` cookie). Cookie clients send the `X-CSRF-Token` header on the two POSTs. The global gates apply: **403** `title: "ONBOARDING_INCOMPLETE"` until onboarding is finished, and **403** `title: "TERMS_NOT_ACCEPTED"` until the current Terms are accepted. A confirmed email is **not** required. JSON is camelCase; enums are strings. Errors are RFC 7807 ProblemDetails. Show `detail` to the member: it holds the PRD wording.

#### GET /api/v1/profile/me/data-exports/latest
- **Purpose**: Drives the Download my data section of `/settings/data`. Returns the member's most recent export (by request time), without the file.
- **Request**: none.
- **Response** (200), member has an export:
  ```json
  {
    "id": "9b1e…",
    "status": "Ready",
    "requestedAt": "2026-11-12T08:00:03Z",
    "readyAt": "2026-11-12T08:01:00Z",
    "expiresAt": "2026-11-19T08:01:00Z"
  }
  ```
  Member never asked for one: **200** with every field `null` (not 404):
  ```json
  { "id": null, "status": null, "requestedAt": null, "readyAt": null, "expiresAt": null }
  ```
- **Errors**: only the global ones (401, 403 gates).
- **Notes**:
  - `readyAt` and `expiresAt` are `null` while `Preparing`.
  - Once `expiresAt` has passed, `status` reads `Expired` **straight away**, even if the cleanup job has not deleted the file yet. Trust `status`. You don't need to compare dates yourself.
  - Only the **latest** export is returned. If the member asks again after one is Ready, the new `Preparing` one replaces it here (see Edge Cases).

#### POST /api/v1/profile/me/data-exports
- **Purpose**: The "Download my data" / "Prepare my data" button. Queues a new export.
- **Request**: no body.
- **Response** (200, not 201):
  ```json
  { "id": "9b1e…", "status": "Preparing", "requestedAt": "2026-11-12T08:00:03Z" }
  ```
- **Errors**: only the global ones.
- **Notes**:
  - **Idempotent while preparing**: if an export is already `Preparing`, you get **that one** back (same `id`, same `requestedAt`) and no second one is created. Double taps are safe.
  - If the latest export is `Ready` or `Expired`, a **new** export is created. The older Ready file is still downloadable by its own id until it expires, but `/latest` now shows the new one.
  - `status` in this response is always `Preparing`.

#### POST /api/v1/profile/me/data-exports/{exportId}/download
- **Purpose**: Hands over the zip after the member enters their password again (PRD §6 criterion 9, §15a criterion 3).
- **Rate limit**: the `auth` policy, the same as the sign-in form: 60 requests per 60 s per caller IP and route.
- **Request**:
  ```json
  { "password": "string — the member's current password" }
  ```
- **Response** (200): **binary**, not JSON.
  - `Content-Type: application/zip`
  - `Content-Disposition: attachment; filename=fertility-grove-data-2026-11-12.zip` (the date is the export's `readyAt`, UTC, `yyyy-MM-dd`)
  - `Cache-Control: no-store`
- **Errors** (all JSON ProblemDetails, even though the success response is a zip):
  - **404** `detail: "This download is no longer available."`: the id is unknown, belongs to another member, is still `Preparing`, or is past its 7 days. All of these give the same answer.
  - **400** `detail: "That password isn't right."`: wrong password. It counts as a **failed sign-in** on the account.
  - **429** `title: "LOGIN_RATE_LIMITED"`, `detail: "Too many attempts. Try again in 15 minutes, or reset your password."`: the account is locked out (5 failures within 15 minutes give a 15-minute lockout). The minutes count is computed per response.
  - **429** from the IP rate limiter. This body is **not** ProblemDetails: `{ "error": "Too Many Requests", "message": "...", "retryAfter": 60 }`, and it comes with a `Retry-After` header.
  - **422**: `password` empty or longer than 64 chars (`errors.Password`).
- **Notes**:
  - The 404 check runs **before** the password check. An expired or foreign id never asks for or records a password.
  - The lockout is **shared with sign-in**. Three wrong passwords here plus two on the sign-in form lock the account. A locked-out member also can't sign in on other devices until the lockout ends. Say this near the password field if you want to.
  - A correct password **resets** the failed-attempt counter, as a successful sign-in does.
  - The member stays signed in on a wrong password. This is not a session re-auth: no new tokens are issued.
  - A Ready export can be downloaded **any number of times** until it expires. Each download asks for the password again.

### Data Models / DTOs

```ts
type DataExportStatus = "Preparing" | "Ready" | "Expired";

// GET /latest — every field null when the member never requested one
interface MyDataExportResponse {
  id: string | null;               // uuid
  status: DataExportStatus | null;
  requestedAt: string | null;      // ISO 8601 UTC
  readyAt: string | null;          // ISO 8601 UTC; null while Preparing
  expiresAt: string | null;        // ISO 8601 UTC; readyAt + 7 days; null while Preparing
}

// POST /data-exports
interface RequestDataExportResponse {
  id: string;                      // uuid
  status: DataExportStatus;        // always "Preparing"
  requestedAt: string;             // ISO 8601 UTC
}

// POST /{exportId}/download
interface DownloadDataExportRequest {
  password: string;                // 1..64 chars
}
// success: Blob (application/zip)
```

#### File contents (for help text / FAQ)
`data.json` is a camelCase JSON object. Its top-level sections, in order, are listed below. `data.html` shows the same sections as headings ("Health answers", "Partner invites sent", …).

| Section | What's in it |
|---|---|
| `exportedAt` | When the file was built (shown as "Prepared on …" in the HTML) |
| `account` | Email, sign-up date, accepted Terms version and date, email confirmed |
| `profile` | Handle, first/last name, show-real-name, display name, pronouns, gender identity, age range, ZIP, avatar, About me, My story, community, Looking for, connect preference, tree level, onboarding status/date, accepted guidelines version |
| `healthAnswers` | Journey stages, treatments, next treatment date, diagnoses, other diagnosis, paths to parenthood (`null` if never answered) |
| `healthDataConsent` | Each consent given or withdrawn, with policy version and time |
| `settings` | Suggest me, who can message me, I'd like a mentor, success stories in feed, show health on profile, the email toggles, pause all optional emails |
| `groups` | Groups joined, when, and whether muted |
| `posts` | The member's posts that aren't deleted (removed by moderation are included, with their status) |
| `comments` | The member's comments that aren't deleted, with the post title ("This post was deleted" if it's gone) |
| `votes` | Each vote: target kind, target id, direction, time |
| `savedPosts` | Saved post titles and when they were saved |
| `linkedPartner` | The current partner's first name and when they linked (`null` if none) |
| `partnerInvitesSent` | Each partner invite: email, note, status, sent time |
| `following` | People the member follows, by display identity |
| `conversations` | DMs as the member sees them: only their side after "Delete for me", no deleted messages, no undelivered messages from others. Flags mentoring conversations. Conversations with no visible messages are left out |
| `mentorSetup` | Mentor profile (`null` if never set up) |
| `mentoring` | Each mentorship as mentor or mentee: status, request message, help-with, response note, dates |
| `thankYouNotesReceived` | Thank-you notes from mentees |
| `sunlightHistory` | Each Sunlight points entry: reason, points, time, reversed |

Option codes are written as their **labels** (for example "Recently diagnosed", not the code). The HTML is self-contained: no scripts and no outside resources.

### Enums & Constants

| Value | Meaning | Display Label |
|---|---|---|
| `Preparing` | Queued or being built. Ready within about a minute normally (the job runs every minute, 10 exports per run) | "We're preparing your data. We'll email you when it's ready." |
| `Ready` | The file can be downloaded until `expiresAt` | "Your data is ready. Available until {expiresAt}." + Download button |
| `Expired` | Past 7 days; the file is deleted | "This download is no longer available." + offer to prepare a new one |

| Constant | Value |
|---|---|
| File lifetime | 7 days from `readyAt` (PRD §21) |
| Password max length | 64 |
| Lockout | 5 failed attempts in 15 min → locked 15 min (shared with sign-in; config values) |
| Download IP rate limit | 60 / 60 s per IP + route (config value) |
| Email link | `{frontend}/settings/data` (no export id in it) |

### Validation Rules
- `password`: required (not empty), at most 64 characters. Otherwise **422** with `errors.Password`. Validation runs before anything else, so a 422 never counts as a failed sign-in.
- `exportId` in the path must be a GUID. Anything else doesn't match the route (404 with no ProblemDetails `detail`).
- The request endpoint takes no input.

### Business Logic & Edge Cases
- **One preparing at a time**: asking again while one is `Preparing` returns the same export. There is **no other limit**. A member can ask for a new export every time the last one is Ready or Expired.
- **Several Ready exports** can exist at once (ask, wait until Ready, ask again). `/latest` shows only the newest. Older Ready files can still be downloaded by id until they expire. The UI only ever needs the latest one.
- **Expiry is exact**: as soon as `expiresAt` passes, `/latest` says `Expired` and download returns 404, even before the cleanup job runs.
- **Contents are a snapshot** from when the file was built (`exportedAt`). Later changes need a new export.
- **Blocks**: the export does not filter by blocks. People the member blocked can still appear in `following` history (if a follow survives) or in the member's own side of conversations, by display identity only. Nothing about people who blocked the member is disclosed beyond what the member already saw in the app.
- **Deleted members** appear as "Deleted member".
- **Account deletion**: when the account is finally deleted (after the 14-day grace period), all its exports are deleted too.
- **Email** ("Your Fertility Grove data is ready"): sent once per export when it becomes Ready. It greets the member by first name and says the copy is ready and they'll be asked to sign in again. A "Download my data" button goes to `/settings/data`, with the note "The link works for 7 days." It contains no data. It is mandatory (PRD §15: email only, right away, cannot be turned off) and is not affected by "Pause all optional emails".
- **Not yet in the file** (PRD §6 lists them; the features don't exist yet): Grove Guide chats, appointment question lists, family space items, Past family notes, purchases. They'll be added with M8/M10.
- **Suspended members** (PRD §19: the suspension screen offers Download my data): suspension isn't built yet (M4). How these endpoints get past that screen's restrictions is not decided.

### Integration Notes

#### Recommended flow (`/settings/data`)
1. On load, call `GET …/latest`.
   - `id === null` or `status === "Expired"`: show the **Download my data** button.
   - `Preparing`: show the "preparing, we'll email you" state and disable the button. Tapping it is harmless anyway.
   - `Ready`: show "Ready until {expiresAt, local time}" and a **Download** button. Optionally also a "Prepare a new copy" link that calls `POST /data-exports`.
2. Button → `POST …/data-exports` → switch to the Preparing state using the returned `id`.
3. Download → open a password modal ("For your safety, enter your password to download"). Submit `POST …/{id}/download` with `{ password }`.
4. Handle the download with `fetch` and `response.blob()`, then save it via an object URL (`<a download>`). A plain link or form navigation can't send the JSON body or the CSRF header. Take the file name from `Content-Disposition`, or build `fertility-grove-data-{readyAt as yyyy-MM-dd}.zip`.
5. Branch on the response:
   - not OK and `content-type` is JSON: show `detail` inline in the modal (400, 429 lockout).
   - 404: close the modal and refresh `/latest`.
   - 429 without ProblemDetails: show a generic "Too many attempts, try again shortly".
6. The email link lands on `/settings/data`, which is the same flow. A signed-out member goes through normal sign-in first, then returns here.

#### Optimistic UI
- Switching to the Preparing state after `POST /data-exports` is safe. The call is idempotent and only fails on global errors.
- Don't be optimistic about the download.

#### Caching
- Don't cache `/latest`. Refetch on page focus.
- The zip is `no-store`. Don't keep the Blob around after saving it; it holds health data.

#### Real-time
- No push or WebSocket, and no in-app notification. While the page is open and the status is `Preparing`, poll `/latest` (every 10–15 s is plenty, and stop after a few minutes). Otherwise rely on the email.

### Test Scenarios
1. **Happy path**: request → Preparing; poll until Ready (within about a minute); `readyAt`/`expiresAt` set and 7 days apart; download with the right password → zip with `data.json` + `data.html`; email "Your Fertility Grove data is ready" received with no data in it.
2. **Never requested**: `/latest` returns all nulls with 200.
3. **Double tap**: two POSTs while preparing return the same `id`.
4. **Wrong password**: 400 "That password isn't right."; repeat 5 times → 429 `LOGIN_RATE_LIMITED`; the sign-in form is also locked for the same member.
5. **Empty password**: 422 `errors.Password`; this does not count as a failure.
6. **Someone else's id / random uuid**: 404 "This download is no longer available."
7. **Still preparing**: download → 404 with the same message.
8. **Expired** (more than 7 days after ready): `/latest` → `Expired`; download → 404.
9. **New export after Ready**: POST creates a new id; `/latest` shows Preparing; the old id still downloads.
10. **Gates**: member mid-onboarding → 403 `ONBOARDING_INCOMPLETE`; outdated Terms → 403 `TERMS_NOT_ACCEPTED`; unconfirmed email → allowed.
11. **Cookie client**: POST without `X-CSRF-Token` → rejected by CSRF.
12. **Content checks**: a DM received from another member appears with that member's display identity; option codes show as labels; a conversation the member "deleted for me" shows only later messages.

### Open Questions / TODOs
- **No cap on repeat requests** beyond "one Preparing at a time". PRD sets none. Product should decide whether to show "Prepare a new copy" while a Ready one exists.
- **Missing PRD content**: Grove Guide chats, appointment lists, family space items, Past family notes and purchases are not in the file yet (features not built; M8/M10).
- **Suspension screen** (PRD §19) must offer Download my data. Suspension arrives with M4, and the onboarding/Terms gate exemption for suspended members is not designed.
- **Email link**: the PRD calls it "the link" that works for 7 days. In practice it always opens `/settings/data`, which shows the *latest* export, so an email for an older export lands on whichever export is newest.

---

## Retention

**Scope:** Data retention and erasing deleted content (PRD §21, FG-NFR-02)

### Business Context
PRD §21 "How long data is kept". Two parts, both server-side:
- **Deleting erases the words.** Deleting a post or comment now wipes its title, body, source link and tags in the database, as deleting a message already did. A deleted post or comment that is still shown (because others replied) was already a placeholder, so the screen does not change. A one-off migration also erased the text left behind by deletions made before this change.
- **Retention cleanup.** A background job (every 6 hours, in batches) deletes old data: notifications after 90 days, sign-in records unused for 90 days, mentoring feedback and thank-you notes after 2 years, and sent or abandoned emails after 30 days.

### Endpoints
**None.** No endpoint was added, removed or renamed, and no request or response field was added or removed. This document lists only what the frontend can now observe in existing responses.

### Data Models / DTOs
No new types. Fields whose **values** can change:

```ts
// Post (in GET /api/v1/posts/{id}). Only a deleted post that still has live comments is returned.
interface PostSummary {
  status: "Deleted" | ...;
  title: string | null;        // null when deleted (unchanged)
  body: string | null;         // "This post was deleted." when deleted (unchanged)
  sourceLink: string | null;   // null when deleted (unchanged)
  topicTags: string[];         // [] when deleted (unchanged)
  storyDiagnoses: string[];    // NOW [] when deleted (before: the original codes)
  whatHelped: string[];        // NOW [] when deleted (before: the original codes)
  allowSharingOutside: boolean;// false when deleted (unchanged)
}

// Comment (GET /api/v1/posts/{id}, comments tree). Unchanged on the wire.
interface Comment {
  status: "Deleted" | ...;
  body: string;                // "This comment was deleted." when deleted
}

// Message (conversation messages). Unchanged on the wire.
interface Message {
  isDeleted: boolean;
  body: string;                // "Message deleted" when isDeleted
}

// Mentorship (mentoring list).
interface Mentorship {
  thankYouNote: string | null; // NOW becomes null 2 years after the feedback was given
  canLeaveFeedback: boolean;   // stays false after the note is erased
}
```

### Enums & Constants
| Value | Meaning | Display Label |
|---|---|---|
| `"This post was deleted."` | `body` of a deleted post kept for its comments | Show as given |
| `"This comment was deleted."` | `body` of a deleted comment kept because it has replies | Show as given |
| `"Message deleted"` | `body` of a deleted message, and the conversation-list preview when the last message was deleted | Show as given |

| Retention rule | Period | Starts from |
|---|---|---|
| Notifications | 90 days | when the notification was created |
| Sign-in records (sessions) | 90 days | last use of that session |
| Mentoring "helpful" answer + thank-you note | 2 years | when feedback was given |
| Sent / abandoned emails (server-only) | 30 days | sent / created |

The job runs every 6 hours, so data disappears up to ~6 hours after the period ends, later if there is a backlog.

### Validation Rules
N/A. No inputs changed.

### Business Logic & Edge Cases
- **Deleted posts.** Feeds, saved posts, success stories and the public share page never return deleted posts (unchanged). `GET /api/v1/posts/{id}` returns a deleted post only while it has live comments, otherwise 404 (unchanged). Render the placeholder from `status === "Deleted"`. Don't rely on `storyDiagnoses` or `whatHelped` for a deleted success story: they are now empty.
- **Deleted comments** appear only while they have replies, with the placeholder `body` (unchanged). `source` is still returned. Don't show it on a deleted comment.
- **Erasing is permanent.** Restoring deleted text is not possible from the backend. Don't offer "undo" after delete.
- **Notifications** older than 90 days disappear from `GET /api/v1/notifications` and stop counting in `GET /api/v1/notifications/unread-count`. With infinite scroll, older pages just end. Treat a missing item as normal, not an error.
- **Thank-you notes** older than 2 years become `null` for both mentor and mentee. Hide the note section when the value is null. The mentee still cannot leave feedback again (`canLeaveFeedback` stays false).
- **Sessions.** A session unused for 90 days has already expired (sessions last 30 days at most), so no signed-in user is logged out by this job. No endpoint lists sessions. The only effect is internal: a member inactive for over 90 days ranks lower in peer and mentor matches. No field changes.

### Integration Notes
- **Recommended flow:** nothing new to build. Check that placeholders depend on `status` / `isDeleted` and that empty arrays and null values for deleted or aged content render cleanly.
- **Optimistic UI:** after a successful delete, switch the item to its placeholder (or remove it if it has no replies) without a refetch. The server text is gone.
- **Caching:** cached copies of a post's text from before deletion should be dropped on delete. Don't keep or re-show them.
- **Real-time:** none.

### Test Scenarios
1. Delete a success story that has comments, then `GET /api/v1/posts/{id}`: `status: "Deleted"`, `title: null`, `body: "This post was deleted."`, `topicTags`, `storyDiagnoses` and `whatHelped` all `[]`, `sourceLink: null`.
2. Delete a post with no comments, then GET it: 404.
3. Delete a comment that has a reply: it shows `body: "This comment was deleted."` with the reply under it. Delete one with no replies: it is missing from the tree.
4. Notification list with no items older than 90 days (staging: seed an old one, wait for the job): it is gone from the list and the unread count.
5. Mentorship with a thank-you note older than 2 years: `thankYouNote: null`, `canLeaveFeedback: false`.

### Open Questions / TODOs
- The commit says "No API changes", but `storyDiagnoses` / `whatHelped` on a deleted success story change from the original codes to `[]`. The read never blanked them. It is harmless unless the UI showed them under the placeholder.
- Partner invites have their own retention: ended invites (accepted, cancelled, expired) are deleted 30 days after they end (see [Partners](#partners)). §21 rules for features not built yet (moderation, audit log, Grove Guide, Support) will be added to this job when those features land.

---

## Notifications

**Scope:** Notifications, notification settings and the daily update email (PRD §15, §15a)

### Business Context
The bell shows in-app **notifications**: replies, messages, follows, mentoring news, partner news, tree levels and new matches. Email is optional and **bundled**. At most one **daily update** goes out each day, around 8 am in the member's local time. It counts unread notifications in the categories the member left on, so 3 replies and 2 messages make one email, not five. Account and safety emails (confirmation, password reset, new sign-in and so on) always send right away and cannot be turned off.

Domain terms:
- **Notification**: one row behind the bell. It stores ids only. The actor's name and the post title are read when the list loads, so a handle change or a block shows at once.
- **Email category**: a group of notification kinds that one setting controls (see `EmailCategory`). Each category has a one-click unsubscribe link in the email.
- **Pause all optional emails**: a master switch for "a hard week". It turns off every category without changing the individual toggles.
- **Display identity**: `@handle`, or "First L." when the member shows their real name. Partner notifications use the partner's **first name only** (§7).

### Endpoints

JSON is camelCase and enums are **strings** (`JsonStringEnumConverter`). Errors are RFC 7807 ProblemDetails. Show `detail` to the member when it is present.

All member endpoints need a signed-in member (bearer token, or the `access_token` cookie plus the `X-CSRF-Token` header on writes) and finished onboarding. Without them you get **401**, **403** `title: "ONBOARDING_INCOMPLETE"` or **403** `title: "TERMS_NOT_ACCEPTED"`. None of these endpoints need a confirmed email.

#### GET /api/v1/notifications
- **Purpose**: The list behind the bell, newest first.
- **Auth**: Member.
- **Query**: `page` (default 1, values below 1 become 1), `pageSize` (default 20, clamped to 1..50). Out-of-range values are clamped, never rejected.
- **Response** (200):
  ```json
  {
    "notifications": [
      {
        "id": "0b9e…",
        "kind": "Reply",
        "actorDisplayName": "@bea",
        "actorHandle": "bea",
        "level": null,
        "postId": "77aa…",
        "postTitle": "Day 5 transfer tips",
        "commentId": "c3d4…",
        "conversationId": null,
        "isRead": false,
        "createdAt": "2026-11-12T08:01:44Z"
      },
      {
        "id": "5e1f…",
        "kind": "PartnerLinked",
        "actorDisplayName": "Sam",
        "actorHandle": null,
        "level": null,
        "postId": null,
        "postTitle": null,
        "commentId": null,
        "conversationId": null,
        "isRead": true,
        "createdAt": "2026-11-11T19:20:03Z"
      }
    ],
    "totalCount": 37,
    "unreadCount": 4,
    "page": 1,
    "pageSize": 20
  }
  ```
- **Errors**: 401 / 403 as above. No 404 or 422.
- **Notes**:
  - **Loading the list does not mark anything read.** Send the ids you showed to `POST /api/v1/notifications/read`.
  - `unreadCount` covers all pages. It is the bell number.
  - Hidden rows, and they leave both the list and the counts:
    - the actor is blocked either way;
    - the actor's account is pending deletion;
    - the post or comment the notification opens is no longer published.
  - Which fields are set depends on `kind`. See the table under Enums.

#### GET /api/v1/notifications/unread-count
- **Purpose**: The bell badge. Cheap enough to poll.
- **Auth**: Member.
- **Response** (200): `{ "unreadCount": 4 }`
- **Notes**: same visibility rules as the list, so the badge and `unreadCount` always agree.

#### POST /api/v1/notifications/read
- **Purpose**: Mark what the member saw as read (§15: "Opening the list marks what is shown as read").
- **Auth**: Member. Cookie clients send the CSRF header.
- **Request**:
  ```json
  { "notificationIds": ["0b9e…", "5e1f…"] }
  ```
- **Response**: 204.
- **Errors**:
  - 422: more than 50 ids. The key is `NotificationIds` under `errors`.
- **Notes**:
  - Ids that aren't the member's, don't exist or are already read are **ignored silently**. Still 204.
  - Duplicate ids are fine. An empty list is a 204 no-op.
  - Reading twice keeps the first read time.

#### PUT /api/v1/profile/me/settings
- **Purpose**: Save Settings, including the six notification toggles. The same endpoint also holds privacy, messaging and partner settings (§6, §7).
- **Auth**: Member. Cookie clients send the CSRF header.
- **Request**:
  ```json
  {
    "suggestMe": true,
    "whoCanMessage": "MembersIFollow",
    "wantsMentor": false,
    "showSuccessStories": false,
    "showHealthOnProfile": false,
    "notifyCommentsAndReplies": true,
    "notifyDirectMessages": true,
    "includeFollowsInDailyUpdate": false,
    "notifyMentoringUpdates": true,
    "notifyPartnerUpdates": true,
    "pauseOptionalEmails": false,
    "showLinkedPartner": true
  }
  ```
- **Response**: 204.
- **Errors**:
  - 422: `whoCanMessage` is not a valid value.
  - 400: onboarding isn't complete. You normally get the 403 gate first.
- **Notes**:
  - ⚠️ **This is a full replace for the non-nullable fields.**
    - Always send the first eight fields, from `suggestMe` to `includeFollowsInDailyUpdate`.
    - A missing boolean becomes `false`, and a missing `whoCanMessage` becomes `Anyone`.
    - Load `GET /api/v1/profile/me`, change what the member touched, and send everything back.
  - `notifyMentoringUpdates`, `notifyPartnerUpdates`, `pauseOptionalEmails` and `showLinkedPartner` are **optional**. `null` or missing keeps the current value.
  - `pauseOptionalEmails: true` doesn't change the other toggles. Keep showing their values, but disable them visually (for example "Paused"). Turning pause off brings back exactly what was set.

#### GET /api/v1/profile/me (notification fields only)
- **Purpose**: Read the current settings to fill the Notification settings screen.
- **Response** (200), the relevant fields of the existing profile response:
  ```json
  {
    "notifyCommentsAndReplies": true,
    "notifyDirectMessages": true,
    "includeFollowsInDailyUpdate": false,
    "notifyMentoringUpdates": true,
    "notifyPartnerUpdates": true,
    "pauseOptionalEmails": false
  }
  ```
- **Notes**:
  - The other settings in the response (`suggestMe`, `whoCanMessage`, `wantsMentor`, `showSuccessStories`, `showHealthOnProfile`, `showLinkedPartner`) are what you send back on the PUT.
  - Onboarding screen 7 (`PUT /api/v1/onboarding/connections`) already sets `notifyCommentsAndReplies`, `notifyDirectMessages` and `includeFollowsInDailyUpdate`.
  - The other three settings appear only in Settings. New and existing members start with both On and pause Off.

#### POST /api/v1/notifications/unsubscribe
- **Purpose**: One-click unsubscribe from a daily update email. Turns off **one category**.
- **Auth**: **Anonymous.** The token in the email link is the credential. It works even when onboarding is unfinished.
- **Rate limit**: `token-link` policy. 10 requests per 60 s **per caller IP address**, not per token.
- **Request**: take both values from the page's query string.
  ```json
  { "token": "9f2c…(64 hex chars)", "category": "CommentsAndReplies" }
  ```
- **Response** (200): tells the page what was turned off.
  ```json
  { "category": "CommentsAndReplies" }
  ```
- **Errors**:
  - 404 `detail: "This unsubscribe link isn't valid."`: unknown token.
  - 422: `token` empty or over 64 chars, or `category` not one of the five values. A misspelled enum string fails at model binding, also as 422, but the `errors` key is the JSON path (for example `$.category`) instead of `Category`.
  - 429: rate limited. Unlike other errors this body is **not** ProblemDetails: `{ "error": "Too Many Requests", "message": "...", "retryAfter": 60 }`, plus a `Retry-After` header.
- **Notes**:
  - Idempotent. Opening the link twice gives 200 again, and the category stays off.
  - It never turns `pauseOptionalEmails` on or off.
  - ⚠️ **CSRF**: if the browser has an `access_token` cookie (the member is signed in on that device) and the request has no `Authorization` header, the CSRF middleware needs `X-CSRF-Token` to match the `csrf_token` cookie. Otherwise you get **403** `title: "CSRF validation failed."`. Send the header whenever the cookie exists, as with any other write.
  - The member gets a token only once their **first daily update has been sent**. Before that there is no link to follow.

#### Email links the frontend must serve
The daily update email links to these frontend routes, which must exist:

| Link | Route | What the page does |
|---|---|---|
| Button "Open Fertility Grove" | `{frontend}/home` | Normal home |
| Per-category unsubscribe | `{frontend}/email-preferences/unsubscribe?token={token}&category={EmailCategory}` | Public page. POSTs to `/api/v1/notifications/unsubscribe` and confirms, e.g. "You won't get emails about comments and replies." It may offer a "Manage all email settings" link |
| Footer "notification settings" | `{frontend}/settings/notifications` | The Notification settings screen (behind sign-in) |

The email shows one unsubscribe link per category **that appears in that email**. Link labels:
- `CommentsAndReplies`: "Stop emails about comments and replies"
- `DirectMessages`: "Stop emails about direct messages"
- `MentoringUpdates`: "Stop emails about mentoring"
- `PartnerUpdates`: "Stop emails about partner and family space updates"
- `FollowsLevelsAndMatches`: "Stop including follows, levels and matches"

`category` in the URL is the exact enum string (PascalCase). Pass it through unchanged.

### Data Models / DTOs

```typescript
type NotificationKind =
  | 'Reply' | 'NewFollower' | 'FollowedMemberPosted' | 'TreeLevelReached' | 'MentoringAvailable'
  | 'NewMessage' | 'MessageRequest'
  | 'MentorRequestReceived' | 'MentorRequestAccepted' | 'MentorRequestDeclined' | 'MentorRequestExpired'
  | 'MentoringEnded' | 'FoundingMentorBadgeGiven'
  | 'NewMatches'
  | 'PartnerLinked' | 'PartnerUnlinked' | 'PartnerInviteExpired' | 'PartnerInviteNotPossible'
  | 'PartnerBlockedYou' | 'PartnerLeft';

type EmailCategory =
  | 'CommentsAndReplies' | 'DirectMessages' | 'MentoringUpdates' | 'PartnerUpdates' | 'FollowsLevelsAndMatches';

type TreeLevel = 'Seed' | 'Bush' | 'Tree' | 'BlossomTree' | 'OrangeTree';
type MessagePermission = 'Anyone' | 'MembersIFollow' | 'NoOne';

interface NotificationItem {
  id: string;
  kind: NotificationKind;
  actorDisplayName: string | null; // display identity; partner kinds: first name only; null when no actor
  actorHandle: string | null;      // opens the actor's profile; always null for partner kinds
  level: TreeLevel | null;         // TreeLevelReached only
  postId: string | null;
  postTitle: string | null;
  commentId: string | null;
  conversationId: string | null;
  isRead: boolean;
  createdAt: string;               // ISO 8601 UTC
}

interface NotificationListResponse {
  notifications: NotificationItem[];
  totalCount: number;
  unreadCount: number; // across all pages
  page: number;
  pageSize: number;
}

interface UnreadCountResponse { unreadCount: number; }

interface MarkNotificationsReadRequest { notificationIds: string[]; } // max 50

interface UnsubscribeRequest { token: string; category: EmailCategory; }
interface UnsubscribeResponse { category: EmailCategory; }

// PUT /api/v1/profile/me/settings: send the first 8 always (full replace)
interface UpdateSettingsRequest {
  suggestMe: boolean;
  whoCanMessage: MessagePermission;
  wantsMentor: boolean;
  showSuccessStories: boolean;
  showHealthOnProfile: boolean;
  notifyCommentsAndReplies: boolean;
  notifyDirectMessages: boolean;
  includeFollowsInDailyUpdate: boolean;
  notifyMentoringUpdates?: boolean | null; // null/missing = keep
  notifyPartnerUpdates?: boolean | null;   // null/missing = keep
  pauseOptionalEmails?: boolean | null;    // null/missing = keep
  showLinkedPartner?: boolean | null;      // null/missing = keep
}
```

### Enums & Constants

#### NotificationKind
The "Fields" column lists what the item carries. Tapping should open the target named in "Tap opens" (§15 criterion 2). The labels are suggestions. Final copy comes from design.

| Value | Meaning | Fields | Tap opens | Email category | Suggested label |
|---|---|---|---|---|---|
| `Reply` | A comment on my post, a reply under my comment, or a reply addressed to me | actor, `postId`, `postTitle`, `commentId` | Post, scrolled to `commentId` | CommentsAndReplies | "[actor] replied in [postTitle]" |
| `NewFollower` | Someone followed me | actor | Actor profile (`actorHandle`) | FollowsLevelsAndMatches | "[actor] started following you" |
| `FollowedMemberPosted` | New post from someone I follow | actor, `postId`, `postTitle` | Post | FollowsLevelsAndMatches | "[actor] posted [postTitle]" |
| `TreeLevelReached` | I reached a new tree level | `level` (no actor) | Tree / Sunlight screen | FollowsLevelsAndMatches | "Your tree grew to [level]" |
| `MentoringAvailable` | I reached Blossom Tree and can become a mentor | none | Become-a-mentor screen | MentoringUpdates | "You can now become a mentor" |
| `NewMessage` | New direct message. One unread row per conversation | actor, `conversationId` | Conversation | DirectMessages | "New message from [actor]" |
| `MessageRequest` | New message request | actor, `conversationId` | Conversation (Requests) | DirectMessages | "[actor] sent you a message request" |
| `MentorRequestReceived` | Someone asked me to mentor them | actor (mentee) | Mentor requests screen | MentoringUpdates | "[actor] asked you to be their mentor" |
| `MentorRequestAccepted` | My mentor request was accepted | actor (mentor), `conversationId` (may be null) | Conversation if set, else mentoring screen | MentoringUpdates | "[actor] accepted your mentor request" |
| `MentorRequestDeclined` | My mentor request was declined | actor (mentor) | Find a mentor | MentoringUpdates | "Your mentor request wasn't accepted" |
| `MentorRequestExpired` | My mentor request expired unanswered | actor (mentor) | Find a mentor | MentoringUpdates | "Your mentor request expired" |
| `MentoringEnded` | A mentoring connection ended | actor **optional**, `conversationId` optional | Mentoring screen | FollowsLevelsAndMatches | With actor: "Your mentoring connection with [actor] ended". Without: "A mentoring connection ended" |
| `FoundingMentorBadgeGiven` | I got the Founding mentor badge | none | My profile / badge | MentoringUpdates | "You were given the Founding mentor badge" |
| `NewMatches` | The weekly peer refresh found someone new for me | none | Peer matches | FollowsLevelsAndMatches | "New matches this week" |
| `PartnerLinked` | Partner linking completed (both partners get one) | `actorDisplayName` = partner's **first name**, `actorHandle` null | Partner settings | PartnerUpdates | "You're now linked with [first name]" |
| `PartnerUnlinked` | My partner unlinked our accounts | partner first name, `actorHandle` null | Partner settings | PartnerUpdates | "[first name] unlinked your accounts" |
| `PartnerInviteExpired` | My partner invite expired (14 days) | none | Partner settings (invite again) | PartnerUpdates | "Your partner invite expired" |
| `PartnerInviteNotPossible` | My partner invite couldn't be accepted | none | Partner settings | PartnerUpdates | "Your partner invite couldn't be accepted" |
| `PartnerBlockedYou` | My partner blocked me, and we are no longer linked | none | Partner settings | **never emailed** | "Your partner blocked you. Your accounts are no longer linked." |
| `PartnerLeft` | My partner's account deletion completed | none | Partner settings | PartnerUpdates | "Your partner has left Fertility Grove" |

"actor" means `actorDisplayName` and `actorHandle` are both set.

#### EmailCategory
| Value | Meaning | Settings toggle label (PRD §15) | Default |
|---|---|---|---|
| `CommentsAndReplies` | `Reply` | "Comments and replies on my posts" | On |
| `DirectMessages` | `NewMessage`, `MessageRequest` | "New direct messages" | On |
| `MentoringUpdates` | Mentor requests and answers, becoming eligible, Founding badge | "Mentoring updates" | On |
| `PartnerUpdates` | Linking, unlinking, partner left, invite expired or not possible | "Partner and family space updates" | On |
| `FollowsLevelsAndMatches` | The in-app-only events: follows, posts from people I follow, tree levels, mentoring ended, new matches | "Include follows, levels and matches in my daily update" | Off |
| (setting, not a category) `pauseOptionalEmails` | Overrides all five | "Pause all optional emails" | Off |

#### Constants
| Name | Value |
|---|---|
| List `pageSize` | default 20, max 50 |
| Mark-read batch | max 50 ids |
| Unsubscribe token | 64 lowercase hex chars |
| Daily update window | 8:00 to 9:59 member-local time. The job runs every 15 min |
| Daily update frequency | at most once per member-local day |
| Unsubscribe rate limit | 10 per 60 s per IP |

### Validation Rules
- `POST /notifications/read`: `notificationIds` may hold at most 50 ids. There are no other rules. Unknown or foreign ids are ignored.
- `POST /notifications/unsubscribe`:
  - `token` is required, up to 64 chars.
  - `category` must be one of the 5 `EmailCategory` strings.
- `PUT /profile/me/settings`: `whoCanMessage` must be a valid `MessagePermission`. The booleans have no rules, but a missing non-nullable one becomes `false`.
- 422 `errors` keys are **PascalCase** property names (`NotificationIds`, `Token`, `Category`, `WhoCanMessage`). A JSON or enum binding failure uses the JSON path (`$.category`).

### Business Logic & Edge Cases
- **Read state**: only `POST /read` marks notifications read. Neither GET does.
- **Visibility is live.** Several things remove a notification from the list and the counts right away:
  - a block in either direction;
  - the actor scheduling account deletion;
  - the post or comment it points at being removed.

  A cached list can hold rows the server no longer shows. Refetch rather than trust old ids.
- **Blocks are never disclosed.**
  - `PartnerBlockedYou` names no one.
  - A mentorship ended by a block gives both sides a `MentoringEnded` **with no actor**, so the blocker isn't revealed.
  - A mentorship ended by account deletion also has no actor.
- **Partner kinds** never expose a handle (`actorHandle` is null), so linking never reveals which handle is the partner's. Don't link to a profile from them.
  - `actorDisplayName` is the first name. It could be null, so fall back to "Your partner".
  - `PartnerLinked` and `PartnerUnlinked` disappear if the partner is later blocked either way (the actor-block filter).
- **Muted groups and conversations** create no notifications at all. The filter runs when the row would be created.
- **`NewMessage` is one row per conversation.** More messages don't add rows while the existing one is unread (see [Messaging](#messaging)).
- **`MentorRequestAccepted.conversationId`** can be null if the mentorship row wasn't found. Fall back to the mentoring screen.
- **Daily update content**:
  - The email holds counts only, for example "2 new replies" or "1 conversation with new messages". It never includes names, post text or message text.
  - It counts only **unread** notifications created since the last update. On a member's first update it looks back 24 h at most.
  - Notifications read in the app before 8 am are not in the email.
  - The email goes only to members who are **Active, have confirmed their email and finished onboarding**.
  - Time zone comes from the profile ZIP, through the state plus a few three-digit prefix overrides (FL panhandle, East TN, West KY, Indiana corners, El Paso, N. Idaho and so on). With no ZIP it uses America/New_York.
- **Settings PUT**: see the full-replace warning above. That is the most likely integration bug.
- **Unsubscribe**:
  - It only turns a category off, never on. Turning it back on happens in Settings.
  - The same token works for every category, and the token never rotates.

### Integration Notes
- **Recommended flow, bell**:
  1. Poll `GET /notifications/unread-count`, for example every 60 s while the app is focused and on route change.
  2. When the panel opens, `GET /notifications?page=1`.
  3. After it renders, `POST /notifications/read` with the ids of the **unread** items shown.
  4. Set the badge from `unreadCount` minus the ids you sent, or refetch the count.
  5. With infinite scroll, mark each new page as it is shown.
- **Recommended flow, settings**:
  1. `GET /profile/me`.
  2. Bind the six toggles.
  3. On change, `PUT /profile/me/settings` with **all** settings fields from the loaded profile plus the change.
  4. Disable the five category toggles while `pauseOptionalEmails` is true, but show their saved values.
- **Recommended flow, unsubscribe page** (`/email-preferences/unsubscribe`):
  1. Public route, no sign-in redirect.
  2. Read `token` and `category` from the query.
  3. POST on load, or on a "Confirm" button if you want to avoid link-prefetch scanners triggering it. The action is harmless and idempotent either way.
  4. Show success using the returned `category`, with a link to `/settings/notifications`.
  5. 404: "This unsubscribe link isn't valid." plus a sign-in link to Settings.
  6. 429: "Please try again in a minute."
- **Optimistic UI**: mark-read and toggles are safe to apply optimistically. Mark-read never fails for a bad id, and the settings PUT only fails on an invalid `whoCanMessage`.
- **Caching**: don't cache the list for long, because visibility changes with blocks and removals. The count is cheap. Invalidate the list and count after the member blocks someone.
- **Real-time**: none. There is no push, WebSocket or SSE in the MVP, so polling is the only option.

### Test Scenarios
1. **Happy path, bell**: another member replies to my post, so `unread-count` goes up by 1. The list has a `Reply` with `postId`, `commentId` and `postTitle`, and `isRead: false`. `POST /read` with its id gives 204, then the count goes down by 1 and the item has `isRead: true`.
2. **Mark-read ignores foreign ids**: send an id that belongs to another member. The response is 204, and their notification stays unread.
3. **Mark-read limit**: 51 ids give 422, with `errors.NotificationIds`.
4. **Paging clamp**: `pageSize=500` returns `pageSize: 50`. `page=0` returns page 1.
5. **Block hides**: I get a `NewFollower` from X, then I block X. The row leaves the list and the count drops. Unblock and it comes back.
6. **Removed post**: a `Reply` whose post is removed disappears.
7. **Partner kind**: after linking, both partners get `PartnerLinked` with `actorDisplayName` = first name and `actorHandle: null`.
8. **PartnerBlockedYou**: has a null actor, and never shows up in a daily update.
9. **Settings partial**: PUT without `notifyMentoringUpdates`, `notifyPartnerUpdates` or `pauseOptionalEmails` keeps their old values.
10. **Settings full-replace pitfall**: PUT with only `{ "pauseOptionalEmails": true }` also sets `suggestMe`, `notifyCommentsAndReplies` and the other non-nullable fields to false, and `whoCanMessage` to `Anyone`. Make sure the client never does this.
11. **Unsubscribe happy path**: a valid token with `"DirectMessages"` gives 200 `{ "category": "DirectMessages" }`, and `GET /profile/me` then shows `notifyDirectMessages: false`. Repeating it gives 200 again.
12. **Unsubscribe invalid**: an unknown token gives 404 "This unsubscribe link isn't valid.". `category: "Foo"` gives 422. An empty token gives 422.
13. **Unsubscribe while signed in with cookie**: without `X-CSRF-Token` the response is 403 "CSRF validation failed.". With it, 200.
14. **Unsubscribe rate limit**: the 11th call within 60 s from one IP gives 429 with `Retry-After`.
15. **Gates**: as a member with unfinished onboarding, `GET /notifications` gives 403 `ONBOARDING_INCOMPLETE`, while `POST /notifications/unsubscribe` still works.
16. **Daily update (backend, for QA)**: a member in Chicago (ZIP 606xx) with 3 unread replies and 2 unread messages gets one email between 8:00 and 9:59 Central. It has the lines "1 conversation…" or "2 conversations with new messages" and "3 new replies", plus two unsubscribe links. With `pauseOptionalEmails` on, no email is sent.

### Open Questions / TODOs
- **Not built yet**:
  - Moderation notifications (content removed or moved, warning, suspension, appeal decided, mentor badge removed). These are due in M4 and will add new `NotificationKind` values, so handle unknown kinds gracefully with a generic row or by hiding them.
  - "Something was shared with me in the family space": no kind exists yet, although the `PartnerUpdates` label already mentions family space.
  - "AI credits running low".
- **Settings PUT is full-replace** for eight fields while four are patch-like. This is a footgun. Consider asking backend for a dedicated `PUT /profile/me/notification-settings` or making all fields optional.
- **Pause, then resume**: notifications created while emails were paused aren't marked as covered, because no email was sent. If they are still unread, the first daily update after unpausing counts them, back to the last update the member received. PRD §15 says pausing "pauses" emails, so this may be intended. Confirm with product.
- **Daily update counts versus bell**: the email counts unread rows without the bell's visibility filter (blocks, removed posts, actors pending deletion). A count in the email can therefore be slightly higher than what the bell shows. Backend follow-up, not a frontend concern.
- **No "mark all as read"** endpoint exists. The client marks per page. Ask backend if the design has a "Mark all read" button.
- **Unsubscribe link before the first daily update**: no token exists until then. Not an issue today, because only the daily update carries unsubscribe links.

---

## Partners

**Scope:** Partner invites and linking (PRD §7, FG-PART-01)

### Business Context
A member invites their partner by email, from onboarding screen 8 or the Dashboard. The partner gets their **own private account**. Linking shares nothing by itself. An existing member signs in and accepts. A new person signs up from the invite, accepts, and goes through the same 8 onboarding screens with two answers preselected. Either person can unlink at any time. Partners always see each other **by first name only, never by handle**, and linking never reveals a partner's handle or profile.

Domain terms:
- **Partner invite**: email + optional personal note. The link works once and expires after **14 days**. The sender can **resend** it (once a day, up to 3 times, new link each time; the old link stops working) or **cancel** it while it is pending.
- **Partner link**: the active link between two accounts. **One linked partner at a time** per member. It ends by unlink, block, or account deletion.
- **Show my linked partner**: a per-member setting. A **Partner badge** shows on both profiles only when **both** turn it on. It never names or links to the other partner.
- **Family space / sharing** (§7a, FG-PART-02/03): **not built**. See Open Questions.

### Endpoints

JSON is camelCase; enums are strings. Errors are RFC 7807 ProblemDetails. Show `detail` to the member: it holds the PRD wording.

Unless marked otherwise, endpoints need a signed-in member (bearer token or `access_token` cookie, with the CSRF header on writes for cookie clients), finished onboarding (otherwise **403** `title: "ONBOARDING_INCOMPLETE"`) and the current Terms (otherwise **403** `title: "TERMS_NOT_ACCEPTED"`). None of the partner endpoints need a confirmed email.

#### GET /api/v1/profile/me/partner
- **Purpose**: The partner section of Settings and the Dashboard: my linked partner and my invites.
- **Auth**: member, onboarding finished.
- **Response** (200):
  ```json
  {
    "isLinked": true,
    "partnerFirstName": "Ben",          // null when not linked
    "linkedAt": "2026-11-12T10:03:00Z",  // null when not linked
    "showLinkedPartner": false,          // my own setting
    "invites": [
      {
        "id": "7c1e…",
        "email": "ben@example.com",
        "status": "Accepted",
        "lastSentAt": "2026-11-10T08:00:00Z",
        "expiresAt": "2026-11-24T08:00:00Z",
        "resendsLeft": 3
      }
    ]
  }
  ```
- **Notes**:
  - `invites`: invites **I sent**, pending first, then the most recently ended. At most 10.
  - A pending invite past `expiresAt` already reads `Expired` here, even before the hourly job marks it.
  - Ended invites are deleted 30 days after they end, so they drop off this list.
  - Invites someone sent **to me** are not listed. They are reached only through the emailed link.

#### POST /api/v1/profile/me/partner/invites
- **Purpose**: Send a partner invite. Used on onboarding screen 8 **and** the Dashboard.
- **Auth**: member. **Open during onboarding**: no onboarding gate (Terms are not checked either).
- **Request**:
  ```json
  {
    "email": "ben@example.com",   // required, valid email, max 255
    "note": "So glad you're here" // optional, max 300 chars
  }
  ```
- **Response** (200): one invite (`PartnerInviteResponse`, below), `status: "Pending"`, `resendsLeft: 3`.
- **Errors**:
  - 400 `"You can't invite your own email."`: the address is the member's own (compared case-insensitively after normalization).
  - 400 `"You already have a linked partner. Unlink first to invite someone else."`
  - 422: validation (see Validation Rules).
- **Notes**:
  - The email goes out right away. Subject: `"{first name} invited you to Fertility Grove"`. It never contains the note or the member's handle. Its button opens **`{frontend}/partner-invite/{token}`**. The frontend must serve this route.
  - The note is shown **only** on the invite page. HTML tags are stripped and the note is trimmed; a blank note is stored as `null`.
  - Several pending invites at once are allowed (to different addresses or the same one). When one is accepted, the others are cancelled.

#### POST /api/v1/profile/me/partner/invites/{inviteId}/resend
- **Purpose**: "Resend" on a pending invite (Dashboard).
- **Auth**: member, onboarding finished.
- **Request**: no body.
- **Response** (200): the invite with a new `lastSentAt`, a new `expiresAt` (now + 14 days) and `resendsLeft` reduced by 1. A new email with a **new link** is sent. The old link stops working at once.
- **Errors**:
  - 404 `"This invite isn't available."`: unknown id, or another member's invite.
  - 400 `"This invite has expired. Ask your partner to send a new one."`: the invite is no longer pending (accepted, cancelled, expired or not possible).
  - 400 `"You can resend this invite once a day, up to 3 times."`: less than 24 hours since the last send, or 3 resends used.

#### DELETE /api/v1/profile/me/partner/invites/{inviteId}
- **Purpose**: "Cancel" on a pending invite.
- **Auth**: member, onboarding finished.
- **Response**: 204. Cancelling an invite that already ended changes nothing and still returns 204.
- **Errors**: 404 `"This invite isn't available."`: unknown id or not mine.

#### DELETE /api/v1/profile/me/partner
- **Purpose**: "Unlink" in Settings.
- **Auth**: member, onboarding finished.
- **Response**: 204. The other partner gets a `PartnerUnlinked` notification naming me by first name. Nothing else changes in either account.
- **Errors**: 404 `"You don't have a linked partner."`

#### GET /api/v1/partner-invites/{token}
- **Purpose**: The public invite page: the inviter's first name, their note, and "Accept invite".
- **Auth**: **none** (anonymous allowed); signed-in callers work too. Rate limit `token-link`: 10 requests per 60 s per caller IP → 429.
- **Response** (200):
  ```json
  {
    "inviterFirstName": "Annie",          // first name only, never a handle; may be null
    "note": "So glad you're here",         // null when none
    "expiresAt": "2026-11-26T08:00:00Z"
  }
  ```
- **Errors**: 404 `"This invite has expired. Ask your partner to send a new one."`, the same answer for every reason: unknown or superseded token, used, cancelled, expired, or the inviter is away or has left.
- **Notes**: the response carries `X-Robots-Tag: noindex, nofollow`. Also set `<meta name="robots" content="noindex, nofollow">` on the frontend page. The page does **not** check whether the viewer is already linked or blocked; that is refused on accept.

#### POST /api/v1/partner-invites/{token}/accept
- **Purpose**: "Accept invite". Makes the link.
- **Auth**: signed-in member. **Open during onboarding** (no onboarding or Terms gate), so a partner who just signed up accepts before screen 1. Rate limit `token-link` (per IP).
- **Request**: no body.
- **Response** (200):
  ```json
  { "partnerFirstName": "Annie", "linkedAt": "2026-11-12T10:03:00Z" }
  ```
- **Errors**:
  - 404 `"This invite has expired. Ask your partner to send a new one."`: unknown/used/cancelled/expired token; the inviter is away, left, or blocked either way with me; or the inviter got linked to someone else since (the invite is then cancelled).
  - 400 `"You're already linked to a partner. Unlink first to accept this invite."`: **I** am already linked. The invite becomes `NotPossible` and the sender gets `PartnerInviteNotPossible`.
  - 400 `"You can't accept your own invite."`
  - 422: empty token or longer than 128 chars.
- **Notes**:
  - Any signed-in account holding the link can accept. It does not have to be the invited email address.
  - On success both members get `PartnerLinked` (naming the other by first name). Every other pending invite **from either person** is cancelled.

#### Changed endpoints (additive)

| Endpoint | Change |
|---|---|
| `GET /api/v1/auth/sign-up-status?partnerInviteToken=…` | New query param. An open partner invite makes `isInviteValid: true`, so `canSignUp` is true during the invite-only beta (still false while sign-ups are paused). |
| `POST /api/v1/auth/signup` | New optional body field `partnerInviteToken`. During invite-only beta an open partner invite replaces `inviteCode`. Invalid/expired → existing 403 `title: "INVITE_REQUIRED"`. Sign-up does **not** link. Call accept after signing in. |
| `GET /api/v1/onboarding` | New `isLinkedPartner`, `preselectedJourneyStages`, `preselectedLookingFor`. `suggestedCommunityId` takes the preset stage into account. |
| `GET /api/v1/profile/me` | New `showLinkedPartner` (bool). `notifyPartnerUpdates` already existed. |
| `PUT /api/v1/profile/me/settings` | New optional `showLinkedPartner` (bool or omitted = unchanged). |
| `GET /api/v1/members/{handle}`, `GET /api/v1/profile/me/preview` | New `showsPartnerBadge` (bool). |
| `GET /api/v1/notifications` | Six new `kind` values (see Enums). |

### Data Models / DTOs

```ts
type PartnerInviteStatus = "Pending" | "Accepted" | "Expired" | "Cancelled" | "NotPossible";

interface PartnerInviteResponse {
  id: string;
  email: string;
  status: PartnerInviteStatus;
  lastSentAt: string;  // ISO 8601 UTC
  expiresAt: string;   // ISO 8601 UTC, lastSentAt + 14 days
  resendsLeft: number; // 3 → 0
}

interface MyPartnerResponse {
  isLinked: boolean;
  partnerFirstName: string | null;
  linkedAt: string | null;
  showLinkedPartner: boolean;
  invites: PartnerInviteResponse[]; // max 10
}

interface SendPartnerInviteRequest { email: string; note?: string | null; }

interface PartnerInvitePageResponse {
  inviterFirstName: string | null;
  note: string | null;
  expiresAt: string;
}

interface AcceptPartnerInviteResponse { partnerFirstName: string | null; linkedAt: string; }

// Additions to existing models
interface SignUpRequest { /* …existing… */ partnerInviteToken?: string | null; }
interface OnboardingStateResponse {
  /* …existing… */
  isLinkedPartner: boolean;
  preselectedJourneyStages: string[]; // [] or ["partner_or_spouse"]
  preselectedLookingFor: string[];    // [] or ["partner_support"]
}
interface MyProfileResponse { /* …existing… */ showLinkedPartner: boolean; }
interface UpdateSettingsRequest { /* …existing… */ showLinkedPartner?: boolean | null; }
interface MemberProfileResponse { /* …existing… */ showsPartnerBadge: boolean; }
```

### Enums & Constants

**Invite status**

| Value | Meaning | Display Label |
|---|---|---|
| `Pending` | Sent, not yet accepted, not expired | Pending |
| `Accepted` | Accepted; the link was made | Accepted |
| `Expired` | 14 days passed | Expired |
| `Cancelled` | I cancelled it, or another invite of mine was accepted | Cancelled |
| `NotPossible` | The invited person was already linked | Couldn't be accepted |

**Notification kinds** (in `GET /notifications`). The server sends `kind` and, for two kinds, `actorDisplayName` = the partner's **first name** (`actorHandle` is always `null` for these). The frontend writes the text. Suggested copy is from the PRD and the daily-update email.

| Value | Meaning | Display Label |
|---|---|---|
| `PartnerLinked` | My invite was accepted, or I accepted one (both get it) | "You're now linked with {actorDisplayName}" |
| `PartnerUnlinked` | My partner unlinked | "{actorDisplayName} unlinked your accounts" |
| `PartnerInviteExpired` | My invite expired after 14 days | "Your partner invite expired" (offer to resend/send again) |
| `PartnerInviteNotPossible` | The invited person was already linked | "Your invite couldn't be accepted because this person is already linked to a partner." |
| `PartnerBlockedYou` | My partner blocked me; the link ended. **In-app only**, never emailed, names no one | "Your partner blocked you. Your accounts are no longer linked." |
| `PartnerLeft` | My partner's account deletion completed; the link ended. Names no one | "Your partner has left Fertility Grove" |

All but `PartnerBlockedYou` also go into the daily update email under the **Partner and family space updates** setting (`notifyPartnerUpdates`, on by default). Never say the partner's account was "deleted".

**Option codes**: `partner_or_spouse` (journey stage "I am a partner / spouse"), `partner_support` (looking for "Support as a partner, or for my partner").

**Constants**: invite lifetime 14 days; note max 300 chars; resend once per 24 h, max 3 resends; ended invites deleted 30 days after ending; `GET /profile/me/partner` lists up to 10 invites.

### Validation Rules
- `email`: required, valid email, max 255 → 422 with `errors.email` (FluentValidation's default English messages; no custom copy).
- `note`: max 300 characters → 422 `errors.note`. Tags stripped, trimmed; blank → `null`.
- Accept `token` (path): not empty, max 128 → 422.
- Business rules (400, PRD wording in `detail`): own email; already linked (sender); resend too soon / over limit; resend on a non-pending invite; already linked (accepter); own invite.

### Business Logic & Edge Cases
- **One partner at a time**: an already-linked member can't send (400) or accept (400). Accepts are serialized, so two invites accepted at the same instant can't give anyone two partners. The loser gets 404 "This invite has expired…".
- **Accept cascade**: every other pending invite from **both** people is cancelled.
- **Invite page vs accept**: the page (GET) shows the invite to anyone holding the link, already-linked viewers included. Refusals come on accept.
- **Hidden reasons**: away, left, or blocked inviters always look like "This invite has expired…". Never explain further.
- **Resend** issues a new token: links from earlier emails return 404.
- **Expiry**: an hourly job marks invites `Expired` and notifies the sender. `GET /profile/me/partner` shows them as `Expired` immediately anyway.
- **Unlink**: either partner, any time. Only the other one is notified.
- **Block**: blocking your partner ends the link at once (and, as always, the profile becomes 404 for both). The blocked person gets `PartnerBlockedYou`; the blocker gets nothing.
- **Account deletion**: the link ends; the other gets `PartnerLeft`. The deleting member's invites are deleted.
- **Partner badge**: `showsPartnerBadge` is true only while linked **and** both have `showLinkedPartner: true`. It is a bare badge: never show a name, handle or link to the other partner. Turning it on alone shows nothing (criterion 8). Explain this in the setting's helper text.
- **First names only**: partner notifications, invite page, accept response and `GET /profile/me/partner` use first names. All community activity (replies, follows, DMs) between partners still shows the normal display identity (criterion 14). Never cross-reference the two.
- **Sunlight**: an upvote from a linked partner changes the score but earns no Sunlight. Nothing to show in the UI.
- **Onboarding preselection**: `preselectedJourneyStages` / `preselectedLookingFor` are only **suggestions shown as selected**. They are **not saved**: the client must submit them with the screen's normal `PUT /onboarding/journey` / `PUT /onboarding/looking-for`. They are returned only while the member is linked and hasn't saved their own answers for that screen. The member can change them freely.
- **Screen 8**: hide the partner invite card when `isLinkedPartner` is true. A not-linked member can send an invite there (POST is open during onboarding). Resend, cancel and `GET /profile/me/partner` are **not** open during onboarding: keep the response of the POST locally for screen 8.
- **Data export** now includes the linked partner's first name and my sent invites (no frontend change).

### Integration Notes
- **Recommended flow, invite page** (`/partner-invite/{token}`):
  1. `GET /api/v1/partner-invites/{token}`. On 404 show `detail` and stop.
  2. Show "{inviterFirstName} invited you", the note, and "Accept invite".
  3. **Signed in** → `POST …/{token}/accept` → success screen ("You're now linked with {partnerFirstName}"). If onboarding isn't finished, continue to onboarding.
  4. **Signed out, has an account** → sign in, return to the page, accept.
  5. **Signed out, new** → sign-up page with the token kept: `GET /auth/sign-up-status?partnerInviteToken={token}` to decide the screen, then `POST /auth/signup` with `partnerInviteToken`, then sign in, then `POST …/accept`, then onboarding (now `isLinkedPartner: true` with preselected answers).
  - Keep the token through sign-up/sign-in (e.g. in the return URL or sessionStorage), since sign-up does not link on its own.
- **Dashboard / Settings**: `GET /profile/me/partner`. Not linked → invite form + invite list (Resend when `status === "Pending" && resendsLeft > 0`, Cancel when Pending). Linked → "{partnerFirstName}", Unlink (confirm first), and the "Show my linked partner" toggle (`PUT /profile/me/settings` with `showLinkedPartner`; send the full settings body as today).
- **Optimistic UI**: safe for the badge toggle and cancel. Not for accept or unlink (re-fetch). For resend, disable the button until the response; the 24 h limit isn't exposed as a timestamp, so compute from `lastSentAt + 24h`.
- **Caching**: none. Re-fetch `GET /profile/me/partner` after send, resend, cancel, unlink, and on any partner notification. Re-fetch `GET /onboarding` after accept.
- **Real-time**: none. Partner events arrive as notifications (poll the bell as elsewhere).

### Test Scenarios
1. **Happy path, existing member**: A invites B's email → B opens the link, sees A's first name and note, accepts → both linked; both get `PartnerLinked` with the other's first name; no handles anywhere.
2. **New partner**: sign-up-status with token → `canSignUp: true` in invite-only beta → sign up with `partnerInviteToken` → sign in → accept → onboarding shows `isLinkedPartner: true`, `preselectedJourneyStages: ["partner_or_spouse"]`, `preselectedLookingFor: ["partner_support"]`; screen 8 hides the invite card.
3. **Own email** → 400 "You can't invite your own email."
4. **Already linked sender** → 400 "You already have a linked partner. Unlink first to invite someone else."
5. **Already linked accepter** → 400 "You're already linked to a partner. Unlink first to accept this invite."; sender gets `PartnerInviteNotPossible`; invite shows `NotPossible`.
6. **Used / cancelled / resent-old / expired link** → page and accept return 404 "This invite has expired. Ask your partner to send a new one."
7. **Expiry**: 14 days pass → status `Expired`; sender gets `PartnerInviteExpired`.
8. **Resend**: immediately after sending → 400 "You can resend this invite once a day, up to 3 times."; after 3 resends → same 400.
9. **Unlink** → 204; other partner gets `PartnerUnlinked`; second unlink → 404 "You don't have a linked partner."
10. **Badge**: only one turns on "Show my linked partner" → `showsPartnerBadge: false` on both; both on → `true` on both, no partner name in the response.
11. **Block**: A blocks partner B → link ends; B gets `PartnerBlockedYou`; A gets nothing.
12. **Someone else's invite id** on resend/cancel → 404 "This invite isn't available."
13. **Own invite link** accepted by the sender → 400 "You can't accept your own invite."
14. **Rate limit**: 11 invite-page loads in a minute from one IP → 429.

### Open Questions / TODOs
- **Criterion 10 not built**: hiding a partner's posts and comments list when one opens the other's profile. It waits for the Dashboard/profile post tabs, which don't exist yet. Today nothing is hidden.
- **Family space and sharing (§7a, FG-PART-02/03) not built**: waits on decision D4. No sharing endpoints, no "Past family notes".
- **Permanent suspension** ending a link arrives with moderation (M4).
- **Partner group suggestions** on the final onboarding screen (§7 "suggests groups for partners"): no partner-specific logic was added in this change. Suggestions follow the chosen stage as for any member.
- **In-app notification text** is not sent by the API; the frontend writes it per `kind` (suggested copy above).
- **Accept by anyone holding the link**: the API does not check that the accepting account's email matches the invited address. Confirm this is the intended product behaviour.

---

## Matching

**Scope:** Matching (PRD §11)

### Business Context
Matching connects each member with the **groups**, **peers** ("People like you"), **mentors** ("Find a mentor") and **posts** closest to their situation, so a new member stops feeling alone. Every suggestion carries a short **reason** ("Matched on endometriosis and IVF") so members understand why they see it. Members can dismiss any group, peer or mentor suggestion with **"Not for me"**, which hides it for good — the group stays findable in group search and the person in People search. Learn articles (M8) and the linked-partner rule (M10) are **not built yet**.

Domain terms:
- **Answers** — the member's onboarding health answers (diagnosis, journey stage, path to parenthood, next treatment date) plus age range and ZIP. Matching reads them; it never shows age, dates or location to anyone.
- **Placement** — where a group suggestion is shown. Members-only groups may be suggested at the end of onboarding and on the Groups page, **never on the home feed**.
- **What worked before** (signal 8) — following or messaging a suggested peer, joining a matching group, requesting a matched mentor and "Not for me" quietly tune that member's future suggestions. No API; the frontend just calls the existing follow / join / not-for-me endpoints.

### Endpoints

Base: `api/v1/matches`. All endpoints need a signed-in member (bearer token or the `access_token` cookie). Cookie clients send the CSRF header on the `POST`, like every other write. All are behind the onboarding gate: before onboarding is finished they return **403** with `title: "ONBOARDING_INCOMPLETE"`. JSON is camelCase; enums are strings.

#### GET /api/v1/matches/groups
- **Purpose**: Up to 5 suggested groups, each with its reason.
- **Auth**: Signed-in member, onboarding complete.
- **Query**:
  - `placement` — `Onboarding` | `GroupsPage` | `HomeFeed`. Optional, default `HomeFeed`. `HomeFeed` leaves out Members-only groups.
- **Response** (200):
  ```json
  {
    "groups": [
      {
        "groupId": "6b0f9a1e-3c2d-4c55-9a51-2f6f1a0d7c11",
        "name": "Endometriosis support",
        "description": "A place for anyone living with endometriosis.",
        "isMembersOnly": false,
        "memberCount": 214,
        "reason": "Matched on endometriosis and IVF"
      }
    ]
  }
  ```
- **Response** (error): 401 not signed in; 403 `ONBOARDING_INCOMPLETE`; 422 unknown `placement` value.
- **Notes**:
  - Only active groups in the member's community (Women's or Partners & Men's) that they **have not joined** and **have not marked "Not for me"**.
  - Ordered best match first; ties go to the bigger group, then the name.
  - A member with **no diagnosis and no stage answers**, including one who withdrew health-data consent, gets the 5 biggest groups with `reason: "Popular in your community"`.
  - Worked out fresh on every call, so it follows the member's answers right away, including after they edit them in profile settings.
  - Can be empty, e.g. when the member has already joined every matching group.

#### GET /api/v1/matches/peers
- **Purpose**: "People like you" for the home feed: up to 5 members, each with a reason.
- **Auth**: Signed-in member, onboarding complete.
- **Request**: none.
- **Response** (200):
  ```json
  {
    "peers": [
      {
        "memberId": "0d2c6a8e-91f4-4b1e-a7a2-5b9a3c0f4e77",
        "handle": "willowbranch",
        "displayName": "@willowbranch",
        "avatarCode": "avatar_03",
        "treeLevel": "Bush",
        "isFollowing": false,
        "reason": "Similar journey"
      }
    ]
  }
  ```
- **Response** (error): 401; 403 `ONBOARDING_INCOMPLETE`.
- **Notes**:
  - Ordered best match first; ties go to the most recently active member.
  - `displayName` is either `@handle` or "First L." if that member shows their real name. It never contains a full last name.
  - `reason` names shared diagnoses, paths and stages (at most 3 named) **only if that peer shows their health answers on their profile**. Otherwise it is always `"Similar journey"`. It never mentions age, treatment dates or where anyone lives.
  - Members are only suggested if they have **at least 5 match points** (see Business Logic). Returning an **empty list is normal**, especially early in the beta.
  - The list is rebuilt when the member finishes onboarding, when they edit their health or about-you answers, when they withdraw consent, and weekly. Between rebuilds it shrinks immediately if a peer turns off "Suggest me", a block happens in either direction, or the member taps "Not for me". It does **not** grow between rebuilds.
  - `isFollowing` can be `true` because following someone does not remove them from the list.

#### GET /api/v1/matches/posts
- **Purpose**: Up to 3 posts a day from matched groups the member has not joined, for mixing into the home feed.
- **Auth**: Signed-in member, onboarding complete.
- **Request**: none.
- **Response** (200):
  ```json
  {
    "posts": [
      {
        "reason": "Matched on endometriosis",
        "post": {
          "id": "3f7d2b90-1a6c-4e0a-8f55-9c2e7b4d1a03",
          "groupId": "6b0f9a1e-3c2d-4c55-9a51-2f6f1a0d7c11",
          "groupName": "Endometriosis support",
          "isSuccessStory": false,
          "storyType": null,
          "storyDiagnoses": [],
          "whatHelped": [],
          "type": "Question",
          "title": "Excision surgery recovery?",
          "body": "How long before you felt like yourself again?",
          "source": "PersonalExperience",
          "sourceLink": null,
          "topicTags": ["mental_health"],
          "isSaved": false,
          "allowSharingOutside": true,
          "status": "Published",
          "authorDisplayName": "@oakleaf",
          "authorHandle": "oakleaf",
          "authorTreeLevel": "Tree",
          "isMine": false,
          "score": 4,
          "commentCount": 2,
          "myVote": null,
          "allowsDownvotes": true,
          "isCollapsed": false,
          "isEdited": false,
          "createdAt": "2026-11-04T18:22:10Z"
        }
      }
    ]
  }
  ```
- **Response** (error): 401; 403 `ONBOARDING_INCOMPLETE`.
- **Notes**:
  - `post` has **exactly the same shape as a home-feed post** (`GET /api/v1/feed`), so the frontend can reuse the post card. Add the `reason` and a **"Join group"** action. The PRD lists only "Open" and "Join group" for matched posts, so there is **no "Not for me" on a post**.
  - Candidates are published posts from the **7 days before today's midnight (UTC)**, so the set stays the same all day. **A post written today never appears here until tomorrow (UTC).**
  - Never from Members-only groups, groups the member joined, groups they marked "Not for me", the member's own posts, or authors blocked in either direction.
  - Ordered by group match strength (best group first), then newest.
  - Empty when the member has no diagnosis or stage answers.
  - A member's own action can free a slot that the next candidate fills, for example joining the group (its posts move into the normal feed) or blocking the author. That is intended.

#### GET /api/v1/matches/mentors
- **Purpose**: "Find a mentor": up to 3 mentors, each with a reason.
- **Auth**: Signed-in member, onboarding complete.
- **Response** (200):
  ```json
  {
    "wantsMentor": true,
    "mentors": [
      {
        "memberId": "0d2c6a8e-91f4-4b1e-a7a2-5b9a3c0f4e77",
        "handle": "willowbranch",
        "displayName": "@willowbranch",
        "avatarCode": "avatar_03",
        "treeLevel": "BlossomTree",
        "badge": "Mentor",
        "bio": "Two rounds of IVF with endometriosis.",
        "reason": "Matched on endometriosis"
      }
    ]
  }
  ```
- **Notes**:
  - `wantsMentor: false` (the member hasn't turned on "I'd like a mentor" in settings) → `mentors` is empty. Offer the setting instead of the list.
  - `badge` is `"Mentor"` or `"Founding mentor"`.
  - Worked out fresh on every call. Only mentors **taking requests right now**: mentoring on, not paused, active mentees plus waiting requests under their limit. A mentor who fills up disappears at once.
  - Never: someone who turned off "Suggest me", blocked either way, marked "Not for me", or a mentor the member already has or is waiting on.
  - Scored on the mentor's public "I can help with" list plus age range and state, against the member's answers. The reason names only that public list, never the member's location.
  - Actions: View profile (`/members/{handle}`), Request mentoring (`POST /members/{handle}/mentor-requests`, see [Mentoring](#mentoring)), Not for me (`kind: Mentor`).

#### POST /api/v1/matches/{kind}/{targetId}/not-for-me
- **Purpose**: "Not for me" on a suggested group, peer or mentor. Hides it from suggestions for good.
- **Auth**: Signed-in member, onboarding complete. A confirmed email is **not** required.
- **Path params**:
  - `kind` — `Group` | `Peer` | `Mentor`.
  - `targetId` — GUID: the `groupId` from `/groups`, or the `memberId` from `/peers` or `/mentors`.
- **Request body**: none.
- **Response** (success): **204 No Content**.
- **Response** (error): 401; 403 `ONBOARDING_INCOMPLETE`; **422** for an unknown `kind` (e.g. `Post`, `Article`) or an empty GUID, with the field errors in the `errors` extension.
- **Notes**:
  - **Idempotent**: tapping twice returns 204 both times.
  - `targetId` is not checked against what was suggested. An unknown id still returns 204 and changes nothing the member can see, so the response never reveals which ids exist.
  - A peer leaves `/peers` and a mentor leaves `/mentors` immediately. A group leaves `/groups` and `/posts` immediately.
  - It **does not** hide the group from group search (`GET /api/v1/groups?search=`) or the person from People search, the group page or the person's profile.
  - There is no undo endpoint (the PRD says "for good").

### Data Models / DTOs

```typescript
type GroupMatchPlacement = 'Onboarding' | 'GroupsPage' | 'HomeFeed';
type MatchKind = 'Group' | 'Peer';
type TreeLevel = 'Seed' | 'Bush' | 'Tree' | 'BlossomTree' | 'OrangeTree';

interface GroupMatchesResponse {
  groups: GroupMatch[]; // 0–5, best first
}

interface GroupMatch {
  groupId: string;        // GUID
  name: string;
  description: string;
  isMembersOnly: boolean; // never true when placement = HomeFeed
  memberCount: number;
  reason: string;         // "Matched on …" or "Popular in your community"
}

interface PeerMatchesResponse {
  peers: PeerMatch[]; // 0–5, best first
}

interface PeerMatch {
  memberId: string;       // GUID; targetId for not-for-me
  handle: string;         // without "@"; use for /members/{handle}/follow and the profile route
  displayName: string;    // "@handle" or "First L."
  avatarCode: string | null;
  treeLevel: TreeLevel;
  isFollowing: boolean;
  reason: string;         // "Matched on …" or "Similar journey"
}

interface PostMatchesResponse {
  posts: PostMatch[]; // 0–3
}

interface PostMatch {
  post: PostSummary;      // identical to a home-feed post (GET /api/v1/feed)
  reason: string;         // the group's reason, "Matched on …"
}
```

`PostSummary` is the existing feed post type. Its notable fields are `type` (`Question` | `SeekingInput` | `SupportNeeded` | `JustVenting` | `JustSharing`), `source` (`PersonalExperience` | `Opinion` | `FromMyDoctor` | `FromResearch` | `ClinicianInput`), `status` (always `Published` here), `myVote` (`Up` | `Down` | `null`), `isCollapsed` and `allowsDownvotes`.

### Enums & Constants

| Value | Meaning | Display Label |
|-------|---------|---------------|
| `placement=Onboarding` | Onboarding screen 8 ("Groups for you"); may include Members-only groups | — |
| `placement=GroupsPage` | Matched groups at the top of the Groups page; may include Members-only | — |
| `placement=HomeFeed` | Home-feed group suggestions; never Members-only | — |
| `kind=Group` | "Not for me" on a group suggestion | Not for me |
| `kind=Peer` | "Not for me" on a peer suggestion | Not for me |
| `"Similar journey"` | Peer reason when the peer keeps their health answers private | Similar journey |
| `"Popular in your community"` | Group reason for members with no diagnosis or stage answers | Popular in your community |

Limits: up to 5 groups, 5 peers and 3 posts. A reason names at most 3 answers ("Matched on a, b and c").

### Validation Rules
- `placement` must be one of the three values, or omitted.
- `kind` must be `Group` or `Peer`; `targetId` must be a non-empty GUID.
- None of these endpoints take a request body.

### Business Logic & Edge Cases
- **Scoring** (starting values from the PRD, tunable in configuration without a frontend change). A pair of members scores diagnosis 5, journey stage 4, path 3, next treatment dates within 30 days 2, same age range 1, same state (from ZIP) 1. Peers need at least **5 points**. Groups match on diagnosis, stage and path tags only; any shared tag is a match.
- **What worked before**: following a peer from `/peers`, joining a group that matches the member, and "Not for me" each move that member's future scores by up to ±1 per signal. Groups reflect this on the next call. Peers reflect it at the next rebuild (when the member edits answers, or weekly). Nothing visibly changes right after a follow.
- **Privacy**: a reason never contains age, treatment dates, ZIP, state or region, and names a peer's diagnosis, stage or path only if that peer chose to show them. Do not build reason strings on the client; show `reason` exactly as sent.
- **Who never appears as a peer**: members who turned off "Suggest me to members on my path", members blocked in either direction, members the viewer dismissed, members who haven't finished onboarding, and the viewer.
- **"Answers" that never match**: "Other" diagnosis, "Prefer not to share" stage and "Not sure yet" path.
- **Health consent withdrawn**: health answers are deleted, so groups fall back to Popular, peers mostly disappear (age and state alone give 2 points, below the minimum), and posts are empty.
- **Retired options**: if an admin retired an option, its label is left out of the reason. If nothing nameable remains, the reason reads "Similar journey".
- **Blocks**: a block removes both members from each other's peer suggestions and matched posts immediately.

### Integration Notes
- **Recommended flows**:
  - *Onboarding screen 8*: after the final onboarding step succeeds, call `GET /matches/groups?placement=Onboarding`. Show each group with its `reason` and a one-tap **Join** (`POST /api/v1/groups/{groupId}/membership`) plus **Not for me**.
  - *Home feed*:
    - Load `GET /api/v1/feed`, `GET /matches/peers`, `GET /matches/posts` and `GET /matches/groups?placement=HomeFeed` in parallel.
    - Mix the matched posts into the feed (positioning is a frontend choice). Each one gets a "Matched on …" label and a **Join group** button.
    - Show peers as a "People like you" block with **Follow** (`POST /api/v1/members/{handle}/follow`), **Message** (messaging isn't built yet: hide it or show it disabled) and **Not for me**.
  - *Groups page*: `GET /matches/groups?placement=GroupsPage` first, each with its reason, then the full group list (`GET /api/v1/groups`).
- **After Join group** (from a group or post suggestion): refetch `/matches/groups`, `/matches/posts` and `/feed`. The group drops out of the suggestions and its posts move into the normal feed.
- **Optimistic UI**: safe for **Not for me**: remove the card right away. The call is idempotent and returns 204 for any GUID, so it will not fail except on auth or onboarding. Follow and Join are also safe to show optimistically (both are idempotent).
- **Caching**: no cache headers. `/peers` and `/posts` change at most a few times a day; caching for the session is fine as long as you refetch after Join, Follow, block, Not for me and answer edits. Always refetch `/groups` after a profile answer edit, because it reflects changes immediately.
- **Real-time**: none.
- **Empty states** (PRD copy):
  - No peers: "We're still finding people on your path. Check back soon." Show popular groups (`/matches/groups?placement=HomeFeed`).
  - No joined groups: "Your feed fills up as you join groups." Show up to 5 matched groups.

### Test Scenarios
1. **Happy path, groups**: a member with diagnosis endometriosis and path donor eggs sees "Endometriosis support" (`Matched on endometriosis`) above "Donor eggs" (`Matched on donor eggs`).
2. **Popular fallback**: a member who withdrew health consent sees groups whose reason is `Popular in your community`.
3. **Members-only**: a matching Members-only group appears with `placement=GroupsPage` (with `isMembersOnly: true`) but not with `placement=HomeFeed`, and its posts never appear in `/matches/posts`.
4. **Private peer**: a peer who hides health answers shows `Similar journey`; one who shows them shows e.g. `Matched on endometriosis and recently diagnosed`.
5. **Not for me**: after `POST /matches/Group/{id}/not-for-me`, the group is gone from `/matches/groups` and its posts from `/matches/posts`, but `GET /api/v1/groups?search=…` still finds it. Tapping twice → 204 both times.
6. **Validation error**: `POST /matches/Post/{id}/not-for-me` → 422.
7. **Onboarding gate**: any matching endpoint before onboarding is finished → 403 `ONBOARDING_INCOMPLETE`.
8. **Same-day post**: a post written today in a matched group is absent from `/matches/posts` until the next UTC day.
9. **Empty peers**: a brand-new community with few members returns `peers: []`; render the empty state, not an error.

### Open Questions / TODOs
- **"Day" is the UTC day** for matched posts; there is no member time zone yet. For US members the set changes in the evening local time.
- **Message** on a peer card: messaging is not built. When it lands, sending a first message to a suggested peer will also count as "what worked before".
- **Article matches** (Learn, up to 6) and the **linked-partner** exclusion are not built yet (M8, M10).
- **Scoring values** are the PRD's starting values, pending confirmation with Lauren (PRD §27). Changes are configuration-only and need no API change.

---

## Mentoring

**Scope:** Mentoring (PRD §12)

### Business Context
Mentors are experienced members who volunteer to support newer members on the same path. There is no application. A member can **turn mentoring on** once they reach **Blossom Tree**, or at any level if an admin gave them the **Founding mentor** badge. Members send a mentor a **request**. If the mentor accepts, the pair's direct-message conversation is **marked Mentoring**. Either person can **end** the connection at any time, and the mentee can then leave a **thank-you note**. Everything is free in the MVP.

Domain terms:
- **Mentorship**: one request and, once accepted, the connection it became. Statuses: `Requested` → `Active` → `Ended`, or `Requested` → `Declined` / `Expired`.
- **Limit** ("How many people I can mentor at once", 1–5, default 3). **Waiting requests count toward it.** A full mentor is "Not taking requests right now".
- **Mentee limits**: one open request at a time, and two active mentors at a time.
- **Mentoring conversation**: the pair's ordinary conversation, marked Mentoring while a connection is active. It is always allowed, whatever "Who can message me" says. A block overrides this.

### Endpoints

All endpoints need a signed-in member (bearer token or `access_token` cookie, with the CSRF header on writes for cookie clients) and finished onboarding (otherwise 403 `ONBOARDING_INCOMPLETE`). JSON is camelCase; enums are strings. Errors are RFC 7807 ProblemDetails. Show `detail` to the member: it holds the PRD wording.

#### GET /api/v1/profile/me/mentoring
- **Purpose**: The Mentoring section of settings.
- **Response** (200):
  ```json
  {
    "canMentor": false,
    "unavailableReason": "Mentoring opens at Blossom Tree.",
    "isMentoring": false,
    "isFoundingMentor": false,
    "isPaused": false,
    "bio": "",
    "diagnoses": [],
    "journeyStages": [],
    "paths": [],
    "capacity": 3,
    "hasAcceptedGuidelines": false,
    "openConnections": 0,
    "canFillFromProfile": true,
    "profileDiagnoses": ["endometriosis"],
    "profileJourneyStages": ["recently_diagnosed"],
    "profilePaths": []
  }
  ```
- **Notes**:
  - `canMentor: false` → disable the Mentoring toggle and show `unavailableReason`. It is either "Mentoring opens at Blossom Tree." or "Your mentor badge was removed. Only an admin can give it back."
  - "I can help with" (`diagnoses`, `journeyStages`, `paths`) **starts empty**.
  - "Fill from my profile": show it only when `canFillFromProfile` is true (health-data consent is on). It copies `profile*` into the form, with a note that members will see the list. All values are option **codes**; labels come from the usual option lists.
  - `openConnections` counts active mentees plus waiting requests, measured against `capacity`.

#### PUT /api/v1/profile/me/mentoring
- **Purpose**: Turn mentoring on with the setup, or save a changed setup while it is on.
- **Request**:
  ```json
  {
    "bio": "string — required, up to 500",
    "diagnoses": ["code"],
    "journeyStages": ["code"],
    "paths": ["code"],
    "capacity": 3,
    "acceptGuidelines": true
  }
  ```
- **Response**: 204.
- **Errors**:
  - 422, field errors with the PRD messages:
    - `bio`: "Tell members a little about what you went through."
    - `helpsWith`: "Pick at least one thing you can help with." (at least one code across the three lists)
    - `acceptGuidelines`: "Please agree to the mentor guidelines to start mentoring."
    - `capacity`: "You can mentor 1 to 5 people at once."
    - Unknown option codes also return 422.
  - 400 `"Mentoring opens at Blossom Tree."` or `"Your mentor badge was removed. Only an admin can give it back."`

#### DELETE /api/v1/profile/me/mentoring
- **Purpose**: Turn mentoring off.
- **Response**: 204. Idempotent.
- **Notes**:
  - The badge disappears from the profile.
  - **Current connections continue.**
  - Waiting requests are declined with the kind default message. Confirm with the member before calling.

#### PUT /api/v1/profile/me/mentoring/paused
- **Purpose**: Pause or resume new requests. Current connections are not affected.
- **Request**: raw JSON boolean, `true` or `false`.
- **Response**: 204. 400 `"Turn on mentoring first."` if the member never set up mentoring.

#### GET /api/v1/members/{handle}: new `mentor` field
```json
"mentor": {
  "badge": "Founding mentor",
  "bio": "Two rounds of IVF with endometriosis.",
  "helpsWith": ["Endometriosis", "IVF"],
  "isTakingRequests": false,
  "canRequest": false
}
```
- `mentor` is `null` unless mentoring is on.
- `badge` is `"Mentor"` or `"Founding mentor"`.
- `isTakingRequests: false` → show "Not taking requests right now". It is false when paused or full.
- `canRequest` → show the Request mentor button. It is false on your own profile. The mentee's one-request and two-mentor limits are only checked on send.

#### POST /api/v1/members/{handle}/mentor-requests
- **Purpose**: Request mentoring. Needs a confirmed email (403 `EMAIL_NOT_CONFIRMED` otherwise).
- **Request**:
  ```json
  { "message": "string — required, up to 500", "helpWith": ["code from the mentor's list"] }
  ```
- **Response** (201): `{ "id": "mentorship uuid", "showCrisisResources": false }`. If `showCrisisResources` is true, show the crisis resources card; the request has already been sent. It is always false until moderation (M4).
- **Errors**:
  - 422 `"Add a short message so the mentor knows how you'd like help."`
  - 422 `helpWith`: "Pick from what this mentor can help with."
  - 404 `"This profile isn't available."`: unknown handle or blocked either way.
  - 404 `"This member isn't mentoring."`
  - 400, one of:
    - `"You already have an open mentor request. Wait for a reply before asking someone else."`
    - `"You already have two mentors. End one connection before asking someone new."`
    - `"Not taking requests right now."`
    - `"You already have a mentoring connection with this mentor."`
    - `"You can't mentor yourself."`

#### GET /api/v1/mentorships
- **Purpose**: My requests and connections, as mentee and as mentor. Open ones come first, then the most recent. At most 100.
- **Response** (200):
  ```json
  {
    "mentorships": [
      {
        "id": "uuid",
        "iAmMentor": false,
        "otherMemberHandle": "annie",
        "otherMemberDisplayName": "@annie",
        "otherMemberAvatarCode": "avatar_03",
        "otherMemberTreeLevel": "BlossomTree",
        "status": "Expired",
        "message": "I was just diagnosed…",
        "helpWith": ["Endometriosis"],
        "responseNote": null,
        "statusMessage": "Your request to @annie expired without a reply. This usually means they're busy. You can ask another mentor.",
        "offerOtherMentors": true,
        "conversationId": null,
        "endedBy": null,
        "thankYouNote": null,
        "canLeaveFeedback": false,
        "createdAt": "2026-11-06T09:00:00Z",
        "answeredAt": "2026-11-13T09:05:00Z",
        "endedAt": null
      }
    ]
  }
  ```
- **Notes**:
  - Mentor's inbox: rows where `iAmMentor && status == "Requested"`. Show Accept / Decline.
  - `responseNote`: the mentor's note. On a decline without one, it is the kind default: "Thank you for reaching out. I can't take on someone new right now, and I hope you find the right mentor soon."
  - `statusMessage` (mentee only) holds the PRD wording for expiry and for a badge removal ("Your mentoring connection with @annie has ended. Here are other mentors on your path.").
  - `offerOtherMentors: true` → link to "Find a mentor" (`GET /api/v1/matches/mentors`).
  - `endedBy`: `Me` | `Them` | `Nobody`. `Nobody` means a block or a badge removal; never say which.
  - `conversationId` is set once accepted. It opens the conversation, which stays after the connection ends.
  - Connections with someone blocked either way are **left out**.
  - "Was this mentoring helpful" is never returned. Only admins see it.

#### POST /api/v1/mentorships/{id}/answer
- **Purpose**: The mentor accepts or declines a request.
- **Request**: `{ "accept": true, "note": "optional, up to 300" }`
- **Response** (200): `{ "conversationId": "uuid" | null }`. On accept, open that conversation.
- **Errors**:
  - 404 `"This mentoring connection isn't available."`: not mine.
  - 400 `"This request was already answered."` (also returned once it has expired).
  - 400 when the mentee tries to answer.

#### POST /api/v1/mentorships/{id}/end
- **Purpose**: Either person ends an active connection. The other is notified kindly. The conversation stays, unmarked.
- **Response**: 204. 400 `"This mentoring connection has already ended."`

#### PUT /api/v1/mentorships/{id}/feedback
- **Purpose**: The mentee's feedback after the connection ends. Both fields are optional; it can be sent only once.
- **Request**: `{ "helpful": "Yes" | "Somewhat" | "No" | null, "thankYouNote": "up to 300" | null }`
- **Response**: 204.
- **Errors**: 400 `"Feedback can be left once, after a mentoring connection ends."` (also after a connection ended by a block). Show the form only when `canLeaveFeedback`.

#### Messaging changes
- Conversation list rows and the conversation view have `isMentoring`. Show the "Mentoring" label, and "End mentoring" in the conversation menu, which calls `/mentorships/{id}/end` using the mentorship whose `conversationId` matches.
- `GET /api/v1/conversations?filter=Mentoring`.
- A Mentoring conversation appears in the list as soon as it is accepted, before any message: `lastMessagePreview` is `""` and `lastMessageAt` is the moment it opened.

#### Notifications (`GET /api/v1/notifications`)
| `kind` | Recipient | Actor | `conversationId` |
|---|---|---|---|
| `MentorRequestReceived` | mentor | mentee | — |
| `MentorRequestAccepted` | mentee | mentor | the Mentoring conversation |
| `MentorRequestDeclined` | mentee | mentor | — |
| `MentorRequestExpired` | mentee | mentor | — |
| `MentoringEnded` | the other person | who ended it, or **null** after a block / badge removal | set when ended by a person |
| `FoundingMentorBadgeGiven` | the member | null | — |

`MentoringEnded` with no actor: show "A mentoring connection has ended", without a name.

### Data Models / DTOs

```typescript
type MentorshipStatus = 'Requested' | 'Declined' | 'Expired' | 'Active' | 'Ended';
type MentorshipEndedBy = 'Me' | 'Them' | 'Nobody';
type MentoringHelpfulness = 'Yes' | 'Somewhat' | 'No';

interface MyMentoring {
  canMentor: boolean; unavailableReason: string | null;
  isMentoring: boolean; isFoundingMentor: boolean; isPaused: boolean;
  bio: string; diagnoses: string[]; journeyStages: string[]; paths: string[];
  capacity: number; hasAcceptedGuidelines: boolean; openConnections: number;
  canFillFromProfile: boolean;
  profileDiagnoses: string[]; profileJourneyStages: string[]; profilePaths: string[];
}

interface SaveMentorSetupRequest {
  bio: string; diagnoses: string[]; journeyStages: string[]; paths: string[];
  capacity: number; acceptGuidelines: boolean;
}

interface MemberMentor {
  badge: 'Mentor' | 'Founding mentor';
  bio: string; helpsWith: string[]; isTakingRequests: boolean; canRequest: boolean;
}

interface Mentorship {
  id: string; iAmMentor: boolean;
  otherMemberHandle: string; otherMemberDisplayName: string;
  otherMemberAvatarCode: string | null; otherMemberTreeLevel: string;
  status: MentorshipStatus; message: string; helpWith: string[];
  responseNote: string | null; statusMessage: string | null; offerOtherMentors: boolean;
  conversationId: string | null; endedBy: MentorshipEndedBy | null;
  thankYouNote: string | null; canLeaveFeedback: boolean;
  createdAt: string; answeredAt: string | null; endedAt: string | null;
}
```

### Validation Rules
| Field | Rule | Message |
|---|---|---|
| Mentor bio | required, ≤ 500 | Tell members a little about what you went through. |
| I can help with | ≥ 1 code across the three lists | Pick at least one thing you can help with. |
| Limit | 1–5 | You can mentor 1 to 5 people at once. |
| Guidelines | must be true | Please agree to the mentor guidelines to start mentoring. |
| Request message | required, ≤ 500 | Add a short message so the mentor knows how you'd like help. |
| I'd like help with | subset of the mentor's list | Pick from what this mentor can help with. |
| Note / thank-you | optional, ≤ 300 | — |

### Business Logic & Edge Cases
- **Expiry**: requests with no reply for 7 days expire. A job checks hourly, so expiry can be up to an hour late. The mentee is notified and can ask someone else.
- **Turning off**: active connections continue and waiting requests are declined with the default message.
- **Badge removal** (admin or moderator, no API yet): every connection and waiting request of that mentor ends at once. Mentees get `statusMessage` and `offerOtherMentors`. The member can't turn mentoring on until an admin gives a badge back.
- **Block** by either person: the connection and any waiting request between them end at once. The blocked person only sees a `MentoringEnded` notification with no actor. The ended connection no longer counts toward the two-mentor limit.
- **Accepting** reuses the pair's existing conversation if they already have one, and also settles a pending message request between them.
- Two requests at the same moment cannot both get under a limit. The server serializes them.

### Integration Notes
- **Mentor setup**:
  1. `GET /profile/me/mentoring`.
  2. If `!canMentor`, show the reason. Otherwise show the form, with "Fill from my profile" when allowed.
  3. `PUT`.
  4. Re-fetch.
- **Request flow**: profile (`mentor.canRequest`) or `GET /matches/mentors` → `POST /members/{handle}/mentor-requests` → `GET /mentorships`.
- **Mentor inbox**: `GET /mentorships` filtered to `iAmMentor && Requested` → `POST …/answer`. On accept, navigate to `conversationId`.
- No real-time updates: re-fetch `/mentorships` when a mentoring notification arrives.

### Test Scenarios
1. Below Blossom Tree → `canMentor: false`, reason "Mentoring opens at Blossom Tree."; PUT → 400.
2. Blossom Tree with an empty bio, no "help with", or no guidelines → 422 with the PRD message; mentoring stays off.
3. Mentor with limit 3, 2 active and 1 waiting → their profile has `isTakingRequests: false` and `canRequest: false`.
4. Second request while one is open → 400 with the one-request message.
5. Third mentor → 400 with the two-mentors message.
6. Request unanswered for 7 days → `Expired`, `statusMessage` set, `MentorRequestExpired` notification; a new request to someone else works.
7. Accept → both see the conversation under `filter=Mentoring` and can message even with "Who can message me" set to No one.
8. Turn off → profile `mentor` null, active connections continue, waiting requests declined with the default message.
9. Founding mentor below Blossom Tree → can turn on; profile badge "Founding mentor".
10. End, then feedback → the mentor sees `thankYouNote`; `helpful` is never in any response; a second feedback → 400.
11. Mentee blocks mentor → the connection ends and the slot frees up; the mentor's `/mentorships` no longer lists it.

### Open Questions / TODOs
- Giving the Founding mentor badge and removing a mentor badge have **no endpoint** until the admin model is decided (D1).
- "Your mentor is away for now" (suspension or deletion) and the "Mentor badge removed" email: M4 / M9.
- Criterion 10, the linked-partner exclusion: M10.
- Reports about a mentor getting the "Mentor" label in the moderation queue: M4.

---

## Messaging

**Scope:** Direct messages (PRD §14)

### Business Context
Members send private one-to-one messages, for example after reading someone's post. Each member decides **who can message them** ("Who can message me": Anyone, Members I follow (default), No one). A first message from someone the recipient doesn't follow becomes a **message request**: it waits under **Requests** until the recipient accepts or deletes it. Blocks are **never disclosed**: messages to someone who blocked you look sent but are never delivered. Group chats, images and files are not in the MVP.

Domain terms:
- **Conversation**: exactly one per pair of members. Messaging someone again (from a profile, a peer match, a post) continues the same conversation.
- **Message request**: a conversation whose first message waits for the recipient. The sender can't send more until it's accepted. Deleting a request is never shown to the sender.
- **Delete for me**: removes the conversation from *my* list only. The other member keeps their copy. A later message brings it back, showing only messages sent after the deletion.
- **Display identity**: `@handle`, or "First L." when the member shows their real name. Use `otherMemberDisplayName` as given; never build names yourself.

### Endpoints

All endpoints need a signed-in member (bearer token or `access_token` cookie, with the CSRF header on writes for cookie clients) and finished onboarding (otherwise **403** `title: "ONBOARDING_INCOMPLETE"`). JSON is camelCase; enums are strings. Errors are RFC 7807 ProblemDetails. Show `detail` to the member: it holds the PRD wording.

**Sending** (the two `POST .../messages` endpoints) and **editing** need a confirmed email. An unconfirmed member gets **403** `title: "EMAIL_NOT_CONFIRMED"`.

#### POST /api/v1/members/{handle}/messages
- **Purpose**: "Message" on a profile, peer match or post author's menu, and "Send in a message" on a post. Starts the conversation, or continues the existing one with this member.
- **Request**:
  ```json
  {
    "body": "string | null — up to 5,000 chars; required unless postId is set",
    "postId": "uuid | null — attach a post the sender can read"
  }
  ```
- **Response** (201):
  ```json
  {
    "id": "4f6c…",              // message id
    "conversationId": "a1b2…",
    "awaitingAcceptance": true, // sent as a message request
    "showCrisisResources": false
  }
  ```
- **Errors**:
  - 404 `"This profile isn't available."`: unknown handle, unfinished profile, or blocked either way.
  - 403 `"This member isn't accepting messages."`: they chose No one.
  - 400 `"You can send more once @bea accepts your message request."`: an earlier request to them is still pending.
  - 429 `title: "RATE_LIMITED"`, `"You've reached today's limit for new conversations. Try again tomorrow."`: accounts younger than 7 days, 10 new conversations per rolling 24 hours. Continuing an existing conversation doesn't count.
  - 404 `"This post isn't available."` / 403 `"Join this group to read its posts."`: `postId` not readable by the sender.
  - 422: validation (see Validation Rules).
- **Notes**: if `showCrisisResources` is true, show the crisis resources card. The message **has already been sent**. Today this is always `false`: the crisis check comes with moderation (M4).

#### POST /api/v1/conversations/{conversationId}/messages
- **Purpose**: Send inside an open conversation.
- **Request/Response**: same body and 201 response as above.
- **Errors**:
  - 404 `"This conversation isn't available."`: not a participant, or the sender blocked the other member.
  - 403 `"This member isn't accepting messages."`: the other member switched to No one. Old messages stay.
  - 400 `"You can send more once … accepts your message request."`
  - 422: validation.
- **Notes**: if the **recipient** started the request, replying accepts it.

#### GET /api/v1/conversations
- **Purpose**: The Messages list.
- **Query**:
  - `filter` — `All` (default) | `Unread` | `Requests`.
  - `q` — optional search.
  - `page` (default 1), `pageSize` (default 20, max 50).
- **Response** (200):
  ```json
  {
    "conversations": [
      {
        "id": "a1b2…",
        "otherMemberHandle": "bea",
        "otherMemberDisplayName": "@bea",
        "otherMemberAvatarCode": "avatar_03",
        "otherMemberTreeLevel": "Bush",
        "lastMessagePreview": "How was your retrieval?",
        "lastMessageIsMine": false,
        "lastMessageHasPost": false,
        "lastMessageAt": "2026-11-06T09:12:44Z",
        "hasUnread": true,
        "isMuted": false,
        "isRequest": false,
        "awaitingAcceptance": false
      }
    ],
    "totalCount": 1,
    "requestCount": 2,
    "page": 1,
    "pageSize": 20
  }
  ```
- **Notes**:
  - Most recent message first.
  - `All` and `Unread` **exclude** requests waiting for me. They appear only under `Requests`. `requestCount` (for the Requests tab badge) ignores the filter and `q`.
  - My own outgoing request shows in `All` with `awaitingAcceptance: true`.
  - `lastMessagePreview`:
    - up to 100 characters;
    - `"Message deleted"` for a deleted message;
    - empty string when only a post was sent (`lastMessageHasPost: true`).
  - `q` matches, case-insensitively:
    - anywhere in the other member's handle;
    - their first name, only if they show their real name;
    - words in messages I can see.
  - `q` never matches a hidden real name or a last name.
  - Conversations with someone **I blocked** are hidden. They come back if I unblock.
  - Mentoring filter / "Mentoring" label: not built yet (mentoring, M6).

#### GET /api/v1/conversations/{conversationId}/messages
- **Purpose**: Open a conversation: header and messages.
- **Query**: `page` (default 1), `pageSize` (default 50, max 100).
- **Response** (200):
  ```json
  {
    "id": "a1b2…",
    "otherMemberHandle": "bea",
    "otherMemberDisplayName": "@bea",
    "otherMemberAvatarCode": "avatar_03",
    "otherMemberTreeLevel": "Bush",
    "isMuted": false,
    "isRequest": false,
    "awaitingAcceptance": false,
    "canReply": true,
    "messages": [
      {
        "id": "4f6c…",
        "isMine": true,
        "body": "Look at this post",
        "isDeleted": false,
        "post": { "postId": "77aa…", "isAvailable": true, "title": "Day 5 transfer tips", "groupName": "IVF" },
        "createdAt": "2026-11-06T09:12:44Z",
        "editedAt": null,
        "canEdit": true
      }
    ],
    "totalCount": 12,
    "page": 1,
    "pageSize": 50
  }
  ```
- **Errors**: 404 `"This conversation isn't available."`: not mine, removed, or I blocked the other member.
- **Notes**:
  - Messages come **newest first**. Page 2 is older. Reverse them for display.
  - Deleted messages come back with `body: "Message deleted"`, `isDeleted: true`, `post: null`.
  - `canEdit`: show Edit/Delete only when true (my message, not deleted, under 15 minutes old). Re-check on tap; the window can close while the screen is open.
  - `post.isAvailable: false`: the post was removed, is in a Members-only group I haven't joined, or is by someone blocked either way. `title` and `groupName` are then null. Show "This post isn't available".
  - `canReply: false`:
    - the other member allows No one (hide the composer, keep the history);
    - or my own request is pending (`awaitingAcceptance`), in which case show "You can send more once [otherMemberDisplayName] accepts your message request."
  - `isRequest: true`: show Accept / Delete.
  - **Reading does not mark as read.** Call `POST …/read`.

#### POST /api/v1/conversations/{conversationId}/read
- **Purpose**: Clears the unread dot. Also marks this conversation's bell notifications as read.
- **Response**: 204. 404 as above.
- **Notes**: call it when the conversation is shown, and again when new messages arrive while it is open.

#### POST /api/v1/conversations/{conversationId}/accept
- **Purpose**: Accept a message request.
- **Response**: 204. 400 `"There is no message request to accept."` if not a pending request to me. 404 as above.

#### PUT /api/v1/conversations/{conversationId}/muted
- **Purpose**: Mute or unmute. Muted means no notifications, but messages still arrive and still count as unread.
- **Request**: raw JSON boolean, `true` or `false`.
- **Response**: 204.

#### DELETE /api/v1/conversations/{conversationId}
- **Purpose**: "Delete for me", and also how a message request is deleted.
- **Response**: 204.
- **Notes**:
  - Gone from my list until the other member sends again.
  - The other member keeps their copy and is never told.
  - Once both members have deleted it, it is removed for good.

#### PUT /api/v1/messages/{messageId}
- **Purpose**: Edit my message within 15 minutes.
- **Request**: `{ "body": "string — up to 5,000 chars" }` (may be empty only if the message has a post).
- **Response** (200): same shape as the send response (`awaitingAcceptance` always false).
- **Errors**:
  - 404 `"This message isn't available."`: not my message.
  - 400 `"Messages can be edited or deleted only within 15 minutes of sending."`
  - 400 `"This message was deleted."`
  - 400 `"Write a message."`
  - 422: validation.

#### DELETE /api/v1/messages/{messageId}
- **Purpose**: Delete my message within 15 minutes. Both members see "Message deleted".
- **Response**: 204.
- **Errors**: 404 not mine; 400 window passed. Deleting twice is a no-op 204.

#### Related changes elsewhere
- `GET /api/v1/members/{handle}`: new `canMessage: boolean`. Hide the Message button when false (member allows No one, or it is my own profile). With "Members I follow", the button shows and the first message may become a request.
- `GET /api/v1/notifications`: new `conversationId: uuid | null`, and new kinds:
  - `NewMessage`: one unread row per conversation, however many messages arrive. None while the conversation is muted.
  - `MessageRequest`: always notifies.
  - For both kinds, tapping opens `conversationId`. The actor fields name the sender.

### Data Models / DTOs

```typescript
type ConversationFilter = 'All' | 'Unread' | 'Requests';
type TreeLevel = 'Seed' | 'Bush' | 'Tree' | 'BlossomTree' | 'OrangeTree';

interface SendMessageRequest { body?: string | null; postId?: string | null; }
interface EditMessageRequest { body: string; }

interface MessageWriteResponse {
  id: string;
  conversationId: string;
  awaitingAcceptance: boolean;
  showCrisisResources: boolean;
}

interface ConversationListItem {
  id: string;
  otherMemberHandle: string;
  otherMemberDisplayName: string;
  otherMemberAvatarCode: string | null;
  otherMemberTreeLevel: TreeLevel;
  lastMessagePreview: string;
  lastMessageIsMine: boolean;
  lastMessageHasPost: boolean;
  lastMessageAt: string; // ISO 8601 UTC
  hasUnread: boolean;
  isMuted: boolean;
  isRequest: boolean;          // waiting for me to accept
  awaitingAcceptance: boolean; // my request, waiting for them
}

interface ConversationsResponse {
  conversations: ConversationListItem[];
  totalCount: number;
  requestCount: number;
  page: number;
  pageSize: number;
}

interface MessagePostCard { postId: string; isAvailable: boolean; title: string | null; groupName: string | null; }

interface MessageItem {
  id: string;
  isMine: boolean;
  body: string; // "Message deleted" when isDeleted
  isDeleted: boolean;
  post: MessagePostCard | null;
  createdAt: string;
  editedAt: string | null;
  canEdit: boolean;
}

interface ConversationResponse {
  id: string;
  otherMemberHandle: string;
  otherMemberDisplayName: string;
  otherMemberAvatarCode: string | null;
  otherMemberTreeLevel: TreeLevel;
  isMuted: boolean;
  isRequest: boolean;
  awaitingAcceptance: boolean;
  canReply: boolean;
  messages: MessageItem[]; // newest first
  totalCount: number;
  page: number;
  pageSize: number;
}
```

### Enums & Constants

| Value | Meaning | Display Label |
|---|---|---|
| `All` | Every conversation except requests waiting for me | All |
| `Unread` | Has a message from the other member after my last read | Unread |
| `Requests` | Message requests waiting for me | Requests |
| `NewMessage` (notification kind) | New direct message | "@bea sent you a message" |
| `MessageRequest` (notification kind) | New message request | "@bea wants to message you" |

Constants: message length 5,000; edit/delete window 15 minutes; young account under 7 days old, limited to 10 new conversations per 24 hours; preview 100 characters.

### Validation Rules
- `body`: required (not blank) unless `postId` is set → 422 `errors.body: ["Write a message."]`.
- `body`: max 5,000 characters → 422 `"Messages can be up to 5,000 characters."`
- HTML tags are stripped and text is trimmed server-side. Plain text only; links allowed as text.
- Edit: `body` max 5,000; blank only if the message has a post.

### Business Logic & Edge Cases
- **Who can message me** is checked on every send:
  - Anyone: open.
  - Members I follow: open if they follow the sender, otherwise a request.
  - No one: refused, including in existing conversations, whose history stays readable.
- **Request flow**:
  - Sender: one message, then 400 until it is accepted.
  - Recipient: Accept, Delete, or simply reply (which accepts).
  - A deleted request still looks pending to the sender, forever.
- **Blocks**:
  - Blocking someone hides your conversation with them.
  - The blocked member sees no change. Their sends return 201, but the messages are never delivered and never notify.
  - Undelivered messages never appear for the blocker, even after unblocking.
  - Starting a conversation with someone blocked either way → 404 "This profile isn't available."
- **Delete for me** does not delete messages for the other member. A new message from the other side revives the conversation for me without the old history.
- **Edit/Delete** after 15 minutes → 400. Deleted messages lose their text and attached post for both members.
- **Attached post**: the sender must be able to read it at send time. If the recipient can't read it, they see it as unavailable.
- Members' own messages never count as unread.

### Integration Notes
- **Recommended flow**:
  1. Profile: show Message if `canMessage`.
  2. `POST /members/{handle}/messages` with the first message.
  3. If `awaitingAcceptance`, show the pending state.
  4. Navigate to `/conversations/{conversationId}`.
  5. Call `GET …/messages`, then `POST …/read`.
- **Requests tab**: `GET /conversations?filter=Requests`, then accept, or delete via `DELETE /conversations/{id}`.
- **Optimistic UI**: safe for send (append locally, reconcile with the returned `id`), mute and read. Not safe for edit/delete near the 15-minute edge.
- **Caching**: none. Re-fetch the list after send, accept, delete or mute.
- **Real-time**: none yet. Poll the list and the open conversation (e.g. every 15–30 s while visible), or refresh on bell notifications.

### Test Scenarios
1. **Happy path**: A messages B, who allows Anyone → B sees an unread conversation and gets a `NewMessage` notification.
2. **Request**: A messages B (default setting, B doesn't follow A) → B sees it only under Requests; A's second send → 400 with "You can send more once @b accepts…".
3. **Accept**: B accepts → A can send more; the conversation moves to B's All.
4. **No one**: B's profile has `canMessage: false`; a send into an existing conversation → 403; history still loads with `canReply: false`.
5. **Blocked**: B blocks A; A sends → 201, A sees it in the thread, B never does.
6. **Limit**: new account starts its 11th conversation in 24 hours → 429 `RATE_LIMITED`.
7. **Edit/Delete**: within 15 minutes both work; after that, `canEdit: false` and the API returns 400.
8. **Delete for me**: gone from my list, still in theirs; their next message brings it back without the old messages.
9. **Search**: a member showing their handle is not found by their real first name; message words are found.
10. **Not found**: someone else's conversation id → 404 "This conversation isn't available."
11. **Unconfirmed email**: send → 403 `EMAIL_NOT_CONFIRMED`.

### Open Questions / TODOs
- **Report** a conversation, the crisis-resources card firing, moderator access and the Fertility Grove Support account: M4 (moderation).
- Suspended or deleting recipients ("This member can't receive messages right now.") and "Deleted member": M4 / M9.
- Mentoring conversations, the Mentoring label and filter, and "End mentoring": mentoring (M6).
- No push or real-time channel yet. Polling is expected.
- Two members starting a conversation with each other at the same instant: one may get a 500. Retrying is safe and continues the same conversation.

---

## Dashboard

### Business Context

PRD §6 "The Dashboard" (FG-PROF-05, Should). The member's own view of their profile: tab counts,
Recent activity, the Posts, Replies, Groups and Saved tabs, and the Mentoring card. Only the member
can open any of it — every endpoint reads the caller's own data. Held (hidden while reviewing) and
moderator-removed posts and comments are listed here for their author only; deleted ones never are.

### Endpoints

All need a signed-in member who finished onboarding (the usual global gate).

| Endpoint | Returns | Use |
|---|---|---|
| `GET /api/v1/profile/me/dashboard` | `GetDashboardViewModel` | Tab counts, Recent activity (4), Mentoring card (≤4) |
| `GET /api/v1/profile/me/posts?page&pageSize` | `PostListViewModel` | Posts tab: group posts, newest first |
| `GET /api/v1/profile/me/stories?page&pageSize` | `PostListViewModel` | "Your stories" under the posts; hide the block when empty |
| `GET /api/v1/profile/me/replies?page&pageSize` | `MyRepliesViewModel` | Replies tab, newest first |
| `GET /api/v1/profile/me/groups` | `GetMyGroupsViewModel` | Groups tab |
| `GET /api/v1/profile/me/saved` (existing) | `PostListViewModel` | Saved tab (posts and stories; articles arrive with Learn) |

The rest of the page uses existing reads: `profile/me` (header, About me, My story, journey),
`profile/me/preview` ("How others see me"), `profile/me/sunlight` (tree, Sunlight history),
`profile/me/followers` and `/following`, `invites/mine`, `profile/me/partner`.

### Data Models / DTOs

```jsonc
// GetDashboardViewModel
{
  "counts": { "posts": 5, "replies": 12, "groups": 3, "saved": 4 }, // posts includes stories
  "recentActivity": [
    {
      "kind": "Post" | "Reply",
      "postId": "uuid",
      "commentId": "uuid | null",      // set for a reply: link to the post's comments
      "groupId": "uuid | null",        // null on a success story
      "groupName": "string | null",
      "isSuccessStory": false,
      "postTitle": "string | null",    // null when a reply's post was deleted or is no longer readable
      "score": 3,                      // post: "{n} votes"; reply: its own score
      "replyCount": 2,                 // post: "{n} replies"; 0 for a reply
      "replyText": "string | null",    // reply only; cut to 2 lines
      "status": "Published" | "HiddenForReview" | "Removed",
      "createdAt": "2026-11-19T08:00:00Z"
    }
  ],
  "mentoring": [                       // empty: hide the card
    {
      "mentorshipId": "uuid",
      "iAmMentor": false,
      "roleText": "Your mentor" | "You mentor them",
      "otherMemberHandle": "string | null",
      "otherMemberDisplayName": "string",
      "otherMemberAvatarCode": "string | null",
      "otherMemberTreeLevel": "Seed",
      "status": "WaitingForReply" | "Connected" | "NotAvailableRightNow" | "RequestExpired" | "MentoringEnded",
      "statusText": "Waiting for a reply"
    }
  ]
}

// MyRepliesViewModel
{
  "replies": [
    {
      "commentId": "uuid", "postId": "uuid", "groupId": "uuid | null", "groupName": "string | null",
      "isSuccessStory": false, "postTitle": "string | null", "body": "string", "score": 1,
      "status": "Published" | "HiddenForReview" | "Removed", "isEdited": false, "createdAt": "..."
    }
  ],
  "totalCount": 12, "page": 1, "pageSize": 20
}

// GetMyGroupsViewModel
{
  "groups": [
    { "id": "uuid", "name": "IVF", "memberCount": 120, "postsThisWeek": 14, "myPostCount": 2, "isMuted": false, "isArchived": false }
  ]
}
```

### Business Logic & Edge Cases

- Status wording (PRD exact text): `HiddenForReview` adds "· Only you can see this for now";
  `Removed` shows "Removed by a moderator · Only you can see this", with Appeal and Delete. Appeal has
  no endpoint until moderation (M4); Delete uses the existing `DELETE posts/{id}` / `comments/{id}`.
- Mentoring card order: open ones (waiting, connected) first, then finished ones, each newest first;
  at most 4. Mentorships with someone blocked either way are left out.
- Replies on a post by a member blocked either way, an away member, a deleted post, or a
  Members-only group the member left are still listed — with `postTitle: null`.
- Groups tab: archived groups come last; hide the Post button on them. Rows are by name.
- An unknown tab in the address opens Overview — client-side; no endpoint per tab name.

### Test Scenarios

`tests/Web.PublicAPI.IntegrationTests/Features/Profile/DashboardTests.cs` covers §6 criteria 17–23.
Criteria 15 and 16 are client behavior.

### Open Questions / TODOs

- Saved articles and the "Worth saving" suggestions wait for Learn (M8).
- Appeal waits for moderation (M4).

---

## Guest browsing

### Business Context

PRD §10 "Guest browsing" (FG-SOC-07, Should). People without an account read posts that both the
group (admin's **Visible to guests**) and the author (**Show to visitors**) made public. Never
comments, profiles, Members-only groups, held/removed/deleted posts, success stories, or away
authors.

### Endpoints (no auth, rate-limited per caller address)

| Endpoint | Returns |
|---|---|
| `GET /api/v1/public/feed?groupId&page&pageSize` | `{ posts: VisitorPost[], totalCount, page, pageSize }`, newest first |
| `GET /api/v1/public/groups` | `{ groups: VisitorGroup[] }` for the group filter |
| `GET /api/v1/public/groups/{groupId}` | `VisitorGroup` with `rules`; 404 when not visible to guests |
| `GET /api/v1/public/posts/{postId}` (changed: additive) | `PublicPostViewModel` + `shownToVisitors`, `visitor` |

```jsonc
// VisitorPost
{ "id": "uuid", "groupId": "uuid", "groupName": "IVF", "type": "Question", "title": "...", "body": "...",
  "source": "PersonalExperience", "sourceLink": null, "topicTags": [],
  "authorDisplayName": "Annie M." /* or "@handle" */, "authorTreeLevel": "Seed", "authorPronouns": "she/her",
  "authorBadge": "Mentor" | "Founding mentor" | null, "score": 3, "replyCount": 2, "isEdited": false, "createdAt": "..." }
// VisitorGroup
{ "id": "uuid", "name": "IVF", "description": "...", "type": "Topic", "communities": ["Women's Community"],
  "rules": "..." /* group page only */, "memberCount": 120, "postsThisWeek": 14 }
```

### Member-side changes (additive)

- `POST groups/{id}/posts` and `PUT posts/{id}` accept `showToVisitors`. Offer it only when
  `GET groups/{id}` returns `visibleToGuests: true`; elsewhere turning it on is 400. Turning it on also
  turns on `allowSharingOutside`. On Support needed / Just venting show "This will be readable by
  anyone on the internet." (client text).
- Post summaries carry `showToVisitors`.

### SEO

- Public feed and group pages may be indexed.
- `GET public/posts/{id}` sends `X-Robots-Tag: noindex, nofollow` only when `shownToVisitors` is
  false (shared by link only). The page must mirror that with its robots meta.

### Sign-up prompt

`POST /api/v1/auth/sign-up-waitlist` now also keeps the email while sign-ups are invite-only (not just
paused). Show "Fertility Grove is invite-only during the beta. Ask a member for an invite link, or
leave your email and we'll tell you when it opens." Guests get one email when the beta ends.

### Not built

Criterion 25 (crisis words waiting in the Priority queue) arrives with moderation (M4).

---

## Google sign-in

`POST /api/v1/auth/google` (new) — PRD §4, FG-AUTH-02. Body:

```jsonc
{ "idToken": "<credential from Google Identity Services>", "keepSignedIn": false,
  "isAdult": true, "acceptsTerms": true,            // sign-up only
  "inviteCode": "ABC123", "partnerInviteToken": null } // sign-up only, during the beta
```

- Same response and cookies as `POST /auth/login` (`LoginWithEmailViewModel`).
- Existing email (any case): signs into that account; an unconfirmed email sign-up becomes confirmed.
- New email without the toggles: 422 with `errors.IsAdult` / `errors.AcceptsTerms` (PRD wording) — show
  the toggles and call again. During the beta without an invite: 403 `INVITE_REQUIRED`; paused: 403
  `SIGN_UPS_PAUSED`.
- Invalid or unverified Google token: 400 "Google sign-in didn't work. Try again, or use email instead."
- Not configured or Google down: 503 "Google sign-in isn't available right now. Try email instead."
- Backend needs `GoogleAuth:ClientId` (the web OAuth client id) per environment.

---

## Group page header

`GET /api/v1/groups/{id}` (changed: additive) — PRD §8, FG-COM-05:

- `postsThisWeek` (null while the posts can't be read).
- `posterAvatars: [{ avatarCode }]`, up to 5 members who posted there, most recent first. Never the
  viewer, blocked either way, away or deleted members; empty for a Members-only group not joined.
  Decoration only: not links, `aria-hidden`.
- `visibleToGuests` (see Guest browsing).

---

## Email unsubscribe

`POST /api/v1/notifications/unsubscribe/one-click?token=…&category=…&category=…` (new) — the RFC
8058 target of the daily update's `List-Unsubscribe` header. Called by mail providers, not the app;
no UI needed. Needs `PublicApi:BaseUrl` (the public API origin) per environment; until then the
header is left off and the in-email links still work.

---

## Learn library

### Business Context

PRD §16 (FG-LEARN-01/02), the articles on the Saved page (§6, FG-POST-03) and "From the library" on
group pages (§8, FG-COM-04). Only published articles are ever returned. Admins enter articles
outside the app for now (no admin HTTP until D1).

### Endpoints

| Endpoint | Auth | Returns |
|---|---|---|
| `GET /api/v1/learn/articles?diagnosis&topic&search&page&pageSize` | guests too | `ArticleList` |
| `GET /api/v1/learn/recommended` | member | `{ isPersonal, articles: ArticleCard[] }`, up to 6, each with `reason` |
| `GET /api/v1/learn/articles/{id}` | guests too | `Article`; guests get `isPreview: true` with title, summary and `joinMessage` only |
| `PUT /api/v1/learn/articles/{id}/saved` body `true`/`false` | member | 204 |
| `PUT /api/v1/learn/articles/{id}/helpful` body `true`/`false` | member | 204, changeable |
| `GET /api/v1/profile/me/saved/articles?page&pageSize` | member | `ArticleList`, newest saved first |
| `GET /api/v1/profile/me/saved/suggestions` | member | `ArticleList` (Worth saving); empty once 4+ items are saved |

`diagnosis` and `topic` filters take option **codes** (`endometriosis`, `ivf`); the article's
`diagnoses`, `journeyStages` and `topics` come back as **labels**. See
[Option lists and codes](#option-lists-and-codes).

```jsonc
// ArticleCard
{ "id": "uuid", "title": "...", "summary": "...", "diagnoses": ["Endometriosis"], "topics": [],
  "lastReviewedOn": "2026-10-01", "isSaved": false, "reason": "Matched on endometriosis" | "A good place to start" | null }
// Article (member)
{ "id": "uuid", "title": "...", "summary": "...", "isPreview": false, "joinMessage": null,
  "body": "markdown", "sections": [{ "slug": "questions-to-bring-to-your-doctor", "heading": "Questions to bring to your doctor" }],
  "diagnoses": [], "journeyStages": [], "topics": [], "reviewedBy": "Dr. Jane Doe, MD, MPH",
  "lastReviewedOn": "2026-10-01", "sources": ["https://..."], "medicalDisclaimer": "...",
  "relatedGroups": [{ "id": "uuid", "name": "Endometriosis" }], "isSaved": false, "myHelpful": null }
```

- The body is Markdown (headings, lists, bold, italic, links). Render heading anchors with the
  `sections[].slug` values (lower case letters and digits, other runs become `-`).
- The Saved page's All tab is articles first, then posts, then stories: combine
  `saved/articles` with `profile/me/saved`. The Dashboard's `counts.saved` now includes articles.
- `GET /api/v1/groups/{id}` (additive) returns `readingLinks: [{ articleId, articleTitle,
  sectionSlug, label }]`, up to 3 in order, only while the article is published and still has the
  section. Empty: show only "From the library" and "Browse clinician-reviewed articles"; otherwise
  link "All articles".

### Not built

Ask the Grove Guide on an article (M8, waits on D2/D3/D6); article covers (no field in §16); the
admin panel's reminder and overdue list (the query exists, no HTTP until D1).

---

## Crisis check

PRD §19 (FG-MOD-02). Every piece of text other people read is checked when it is saved and edited.

- **Any response** may carry `X-Show-Crisis-Resources: true` (exposed through CORS). When present,
  show the crisis resources card at once, whatever the endpoint and whether it succeeded. This
  covers posts, comments, messages, mentor requests and notes, the mentor bio, About me, My story and
  the partner invite note. A refused handle (422 "That handle isn't available. Try another one.")
  carries it too.
- `GET /api/v1/crisis-resources` (no auth): `{ resources: ["988 Suicide and Crisis Lifeline: call or
  text 988", ...] }`, in order. Show numbers as plain text.
- Posts and comments (create and edit) return `ContentWriteViewModel` with `showCrisisResources`,
  `heldForReview` and, when held, `heldMessage` ("We've held your post for a moment so our team can
  check in. You're not alone. If you're in danger now, call or text 988."). A held item is visible
  to its author only (Dashboard lists it as `HiddenForReview`).
- Messages always send; they are never held.

