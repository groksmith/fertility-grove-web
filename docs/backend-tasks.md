# Backend tasks — asks from the web app

**For:** the backend team (`B<n>`) and ops (`O<n>`). Every ask the web app is waiting on.

**How to hand back:** merge to `dev` and **regenerate `docs/api-handoff.md`** (the running API
serves `swagger.json`). We pull both with `yarn sync:docs`; anything not in them reads as not done.

The next new ask is **B21** / **O2**.

Rules for this file: `.claude/skills/handoff-docs/SKILL.md`.

---

## O1 — Staging database is missing a migration

`GET /api/v1/public/groups` on staging (api.fertilitygrove.click) answers 500
`Npgsql.PostgresException: 42703: column g.visible_to_guests does not exist` (seen 2026-11-23). The
guest pages (`/community`, `/community/{id}`) and the signed-out redirect to a public group read it.

**Ask:** apply the pending migrations on staging (the Guest browsing release added
`groups.visible_to_guests`). Also: unhandled 500s return the exception text and stack in
`exceptionDetails`; production should not.

**Today:** the web app shows its own "Something went wrong" sentence instead of the exception text.

**FE follow-up when shipped:** none.

## B1 — Avatar background colour

PRD §5/§6 (v1.2): a member picks an avatar background colour (Green, Coral, Yellow, Blue, Pink,
Purple; Green by default) and optionally one of 12 preset avatars.

**Done on the backend:** the preset avatars are the `avatar` option list (`avatar_01`…, from
`GET /onboarding/options`), and `avatarCode` takes one of those codes or `null`.

**Still needed:** a place for the background colour. Add `avatarBackground` (the six colours, Green
by default) to `PUT /onboarding/profile` and `PUT /profile/me`, and return it wherever `avatarCode`
is returned (profiles, post and comment authors, matches, conversations, mentorships, group poster
avatars), so other members see the colour (PRD §5 acceptance criterion 19). The avatar list also
needs 12 entries, in the order the web app paints them: orange, olive branch, fern, swallow,
mountains, wave, pine cone, moon and stars, oak leaf, owl, fox, sunflower.

**Today:** the web app sends the catalogue code by position and keeps the member's colour on their
own device only; everyone else sees Green.

**FE follow-up when shipped:** read and send `avatarBackground` in `src/lib/api/members.ts` and
`src/features/auth/commands.ts`, and drop `rememberHue` / `rememberedHue`.

## B2 — Change password while signed in

PRD §15 (Settings → Account): "Change password" with current password, new password and confirm,
signing out other devices. There is no endpoint; only forgot / reset by email exists.

**Ask:** `PUT /api/v1/auth/password` `{ currentPassword, newPassword, confirmNewPassword }` → 204;
400 "That password isn't right." (counts toward lockout like sign-in); 422 for the PRD password rule;
ends every other session.

**Today:** the Settings form validates and shows its confirmation, but changes nothing (prototype).

**FE follow-up when shipped:** call it from `src/app/(dashboard)/settings/page.tsx` (`pwSaved`).

## B3 — Author avatar and badges on posts, comments and conversations

PRD §6: wherever a member appears (post, comment, message), they show with their avatar on its
background colour and their badges. `PostSummaryViewModel`, `CommentViewModel` and
`VisitorPostViewModel` carry the author's display name, handle and tree level but no `avatarCode`
(posts/comments) and no badge (posts/comments).

**Ask:** add `authorAvatarCode` and `authorBadge` ("Mentor" | "Founding mentor" | null) to post and
comment summaries (member and visitor variants).

**Today:** authors on posts and comments show their initial on Green and no badge, unless the same
member was already loaded elsewhere (a profile, a match, a conversation).

**FE follow-up when shipped:** read the two fields in `src/lib/api/content.ts` (`authorOf`).

## B4 — A member's posts on their profile

PRD §6: a member's public profile shows their posts (those in groups the viewer can read).
`GET /api/v1/members/{handle}` has no posts and there is no list endpoint for them.

**Ask:** `GET /api/v1/members/{handle}/posts?page&pageSize` → `PostListViewModel`, with the same
visibility rules as the feed (no Members-only groups the viewer hasn't joined, nothing held/removed).

**Today:** the profile shows only that member's posts the app already loaded (feed, groups).

**FE follow-up when shipped:** a `useMemberPosts` hook on `src/app/(dashboard)/u/[handle]/page.tsx`.

## B5 — Who an invite link belongs to

PRD §10/§24: the invite page says "{Name} invited you to the Fertility Grove beta". `GET
/auth/sign-up-status?inviteCode=` says whether the code is valid, but not whose it is.

**Ask:** add `inviterDisplayName` (the member's display identity, never the real name unless they
show it) to `GetSignUpStatusViewModel` when `inviteCode` is valid.

**Today:** the invite page says "A member invited you…".

**FE follow-up when shipped:** read it in `src/app/(public)/invite/[code]/page.tsx`.

## B6 — The links in the confirm-email and reset-password emails

The handoff documents the frontend routes the notification and deletion emails link to, but not the
confirmation and reset links.

**Ask:** document (and keep) these formats: `{frontend}/confirm-email?token={token}` and
`{frontend}/reset-password?email={email}&token={token}` (the token URL-encoded).

**Today:** the web app reads exactly those query parameters (`token`, and `email` for reset).

**FE follow-up when shipped:** adjust the two pages if the formats differ.

## B7 — "Sign out of all devices" keeps this device

PRD §4 criterion 7 and §15: "every **other** session is signed out". The handoff doesn't say whether
`POST /auth/sign-out-everywhere` also ends the session that called it.

**Ask:** end every session except the caller's (or return fresh tokens), and document it.

**Today:** the web app assumes the caller's session ends too, and sends the member to sign-in.

**FE follow-up when shipped:** stay signed in and show "Signed out of every other device".

## B8 — "Message" vs "message request" before sending

PRD §14: a first message to someone who doesn't follow you (and whose setting is "Members I follow")
arrives as a request, and the composer says so before sending ("Write your message request").
`GET /members/{handle}` has `canMessage` but not whether it would be a request.

**Ask:** add `messageMode: "Open" | "Request" | "None"` to `GetMemberProfileViewModel`.

**Today:** any member with `canMessage: true` gets the ordinary composer; the API's
`awaitingAcceptance` then marks the conversation as a sent request.

**FE follow-up when shipped:** `messageService.canStart` in `src/features/messages/service.ts`.

## B9 — Features the web app still runs on local sample data

These screens exist and keep working on browser-only data until their endpoints exist (the handoff
lists them as not built). Listed so nothing is lost; each needs its own contract when it starts.

- **Moderation (M4):** report a post, comment, message or profile; appeal a removal; suspension
  status and appeal (`/suspended`).
- **Grove Guide (M8):** chats, answers with citations, ratings, appointment question lists.
- **Credits (M10):** balance, monthly refill, packs, checkout and purchase history.
- **Family space (M10):** shared items, family notes with versions, activity.
- **Support inbox:** the conversation with the Fertility Grove team.

**Today:** all of the above are local (marked `TODO(api)` in the code).

**FE follow-up when shipped:** one service each, replacing the local store in that feature.

## B10 — "No source" on posts and comments

PRD §9 (v1.2): Source is optional, "No source" is the default, and a post without one shows no source
label anywhere (card, post page, public link). `CreatePostCommand`, `EditPostCommand`,
`AddCommentCommand` and `EditCommentCommand` require `source` (`ContentSource` has no "none"), and
summaries always return one.

**Ask:** make `source` nullable on those four commands and on `PostSummaryViewModel`,
`CommentViewModel`, `VisitorPostViewModel` and `PublicPostViewModel`; `null` means no source.

**Today:** a post or comment written without a source is sent as `PersonalExperience`, so it shows a
"Personal experience" label it shouldn't.

**FE follow-up when shipped:** send and read `null` in `src/lib/api/enums.ts` (`apiSource`, `source`).

## B11 — "Who it's for" on groups

PRD §8: "Each group page shows who the group is for in one line, so members know if it fits them",
and the public group page shows it too (§10, Guest browsing). The group endpoints have `description`
but no such line.

**Ask:** add `whoFor` (up to 120 characters, set by admins) to `GetGroupViewModel`,
`GroupListItemViewModel` and `VisitorGroupViewModel`.

**Today:** the "Who it's for" panel is hidden on group pages (member and public) while the line is
empty.

**FE follow-up when shipped:** map it in `src/lib/api/content.ts` (`toGroup`); the panel shows again
by itself.

## B12 — Profile photo upload

PRD §5 (screen 6) and §6: "Profile photo · Upload from my computer. Location data is removed from
photos", shown on the profile, posts, comments and messages. There is no upload endpoint and no
photo URL on any member view model.

**Ask:** `POST /api/v1/profile/me/photo` (multipart, image; strip EXIF/location; size and type limits
documented), `DELETE /api/v1/profile/me/photo`, and `photoUrl` wherever `avatarCode` is returned.

**Today:** "Upload from my computer" says photo upload isn't available yet.

**FE follow-up when shipped:** the upload control on onboarding screen 6 and Edit profile, and
`photoUrl` in `src/lib/api/members.ts` and `Avatar`.

## B13 — Sunlight on other members

PRD §6 and §13: a member's profile shows their tree level and Sunlight, and member search rows show
"@handle · level · Sunlight". `GetMemberProfileViewModel` and the `GET /members?q` items carry
`treeLevel` but no `sunlight`.

**Ask:** add `sunlight` (int) to `GetMemberProfileViewModel` and the member search item.

**Today:** the Sunlight number is hidden on `/u/{handle}` and in People results; the level shows.

**FE follow-up when shipped:** map it in `src/lib/api/members.ts` (`memberFromRef`) and
`src/features/social/hooks.ts`.

## B14 — What a matched mentor helps with, and their open places

PRD §11 (mentors): each suggested mentor shows what they can help with and how many places are left
("Room for 2 more"). `GET /matches/mentors` items have `bio` and `reason` only; the member profile's
`mentor` block has `helpsWith` and `isTakingRequests` but no count.

**Ask:** add `helpsWith` (option codes) and `openPlaces` (int) to the `GET /matches/mentors` items,
and `openPlaces` to the profile's `mentor` block.

**Today:** the "Helps with" chips show only once the mentor's profile has been opened, and "Room for
N more" is hidden.

**FE follow-up when shipped:** `src/features/mentors/hooks.ts` and `src/features/social/hooks.ts`
(drop `placesUnknown`).

## B15 — An article's next review date

PRD §16: an article shows "Last reviewed … · Next review due …". The `Article` view model has
`lastReviewedOn` only.

**Ask:** add `nextReviewOn` (date) to the article view model (`GET /learn/articles/{id}`).

**Today:** "Next review due" is hidden.

**FE follow-up when shipped:** map it in `src/lib/api/articles.ts` (`toArticle`).

## B16 — Votes and sharing on a visitor's post

PRD §10 (guest browsing): a public post shows its votes and, when the author allowed it, the share
link. `VisitorPostViewModel` has `score` only and no `allowSharingOutside`.

**Ask:** add `allowSharingOutside` to `VisitorPostViewModel` (and `upvotes` / `downvotes` if the
public page should show them apart).

**Today:** the score shows; sharing is always offered on public posts.

**FE follow-up when shipped:** `src/features/posts/public.ts` (`toPublicPost`).

## B17 — Posts this week on the groups list

PRD §8: each group in the list shows "N members · N posts this week". `GroupListItemViewModel` has
`memberCount` but no weekly count (`GetGroupViewModel` has it).

**Ask:** add `postsThisWeek` to `GroupListItemViewModel` and `VisitorGroupViewModel`.

**Today:** the weekly count is hidden wherever the answer doesn't carry it.

**FE follow-up when shipped:** none beyond the mapping in `src/lib/api/content.ts`; the count shows
again by itself.

## B18 — Who a notification is from

PRD §15: notifications show the avatar of the member who acted. `NotificationViewModel` names the
actor by handle but sends no avatar.

**Ask:** add `actorAvatarCode` (and the avatar colour from B1) to `NotificationViewModel`.

**Today:** the row shows the notification's kind icon unless that member is already cached.

**FE follow-up when shipped:** `src/features/notifications/hooks.ts` (`toNotification`).

## B19 — Option lists for visitors

Learn is open to visitors (PRD §16), and its `?diagnosis=` / `?topic=` filters take option codes, but
`GET /onboarding/options` needs a signed-in member (api-handoff "Option lists and codes", Open
Questions).

**Ask:** a public `GET /api/v1/public/options` (the same `lists`, no communities), or labels with
codes on the Learn answers.

**Today:** signed-out Learn sends a code worked out from the label (`snake_case`), which matches the
seeded codes but isn't guaranteed.

**FE follow-up when shipped:** load it in `src/features/learn/hooks.ts` for visitors.

## B20 — Launch content on staging

The Learn library (`GET /learn/articles`) answers with no articles on staging, so the library, its
article pages and the "Read first" block on onboarding have nothing to show; groups and success
stories may be empty too.

**Ask:** seed the launch content on staging: the six reviewed diagnosis articles (PRD §16) and the
launch groups (PRD §8).

**Today:** while a list answers empty, the web app shows the prototype's sample articles, groups and
stories, marked "Sample" and read-only (`src/lib/api/samples.ts`). They disappear as soon as the API
returns real items.

**FE follow-up when shipped:** none; once launch content is live everywhere, delete the samples.

