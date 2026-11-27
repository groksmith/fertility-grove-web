# Fertility Grove MVP — Backend Implementation Plan

**Status:** living document. Update it when a milestone finishes or a decision lands.
**Last updated:** 2026-11-12
**Sources:** `docs/prd.md` (v1.1), `docs/event-storming/fertility-grove-mvp-2026-11-03.md`, the code on `dev`.

This plan covers the backend API only. Screens, copy and design come from the PRD and the frontend.
Priorities (Must / Should / Could) are the PRD's, section 27a. Sizes are rough relative effort
(S ≈ a few days, M ≈ one to two weeks, L ≈ more), not commitments.

---

## 1. Where we are

Built on `dev` (7 commits after the docs):

| Area | PRD IDs | State |
|---|---|---|
| Domain events, dispatched before commit | — | Done |
| Email sign-up, confirmation (60 min links), sign-in | FG-AUTH-01 | Done |
| Password rules (8–64, leaked-password check), reset, lockout (5 in 15 min) | FG-AUTH-03 | Done |
| Per-device sessions, Keep me signed in, sign out of all devices | FG-AUTH-01, 03 | Done |
| Per-address email limits | FG-AUTH-03 | Done |
| Beta invite links, pause sign-ups, waitlist | FG-AUTH-05 | Done, except admin endpoints (blocked by D1) |
| Email outbox, scheduled jobs, advisory locks | — | Existed before |

Still open inside the Auth area:

| Gap | PRD | Lands in |
|---|---|---|
| Admin endpoints for invites, pause, reopen, invite-only | §20 | M1 |
| "New sign-in" email on a new device | §15, §15a | M9 |
| Re-accept changed Terms at next sign-in | §4 | M9 |
| Google sign-in | FG-AUTH-02 (Should) | M9 |
| Account deletion with 14 days to restore | FG-AUTH-04 | M9 |
| Unconfirmed members blocked from post, comment, vote, message, mentor request, buy credits | §4 | M3 (the gate is built with the first gated action) |

---

## 2. Decisions needed before or during the build

These are product or vendor calls, not engineering ones. Each names the milestone it blocks.

| # | Decision | Owner | Blocks | Recommendation |
|---|---|---|---|---|
| D1 | **Admin model.** PRD: moderator and admin are roles on a member account, same sign-in (§2, §20). Code: separate `AdminUser` aggregate and admin JWT scheme. Also whether the admin panel needs a second sign-in step (§25 accepted risk, open question in §27) | Lauren + backend lead | M1, and so every admin and moderation feature | Roles on `Account` as the PRD says, plus an authenticator code for staff roles only. Retire `AdminUser` |
| D2 | **Vendors.** AI model provider (with written no-retention, no-training), automatic self-harm detector, text message service, privacy-safe analytics, virus scanner, photo storage | Lauren + tech | M4 (detector, SMS), M2 (virus scan, storage), M8 (AI) | Choose detector and SMS first; they gate the safety milestone |
| D3 | **AI credit values.** Free allowance, cost per question and per appointment list, pack sizes and prices (§18) | Lauren | M8 | Proposal in the PRD review notes: 20 free, 1 per question, 3 per list, packs 25/60/150 |
| D4 | **Partner sharing scope.** Family space goes beyond the approved scope sheet (§27) | Lauren | M10 | Confirm before M10 starts |
| D5 | **Backup moderator** for the Priority queue when Lauren is away more than 12 hours (§19, §25) | Lauren | Launch gate 2 | Name one, or accept the risk explicitly |
| D6 | **Grove Guide pre-launch test** against advisor-approved examples (§17, §25) | Lauren + clinical advisor | Launch | Do it; it is the only way "never diagnoses" is testable |
| D7 | **Matching points** proposed in §11 | Lauren | M5 | Keep as proposed; tune in beta |
| D8 | **Clinical advisor** who owns the crisis phrase list and approves the detector cutoff (§19) | Lauren | M4, launch gate 5 | — |
| D9 | **Launch content:** groups, the 6 Learn articles, guidelines, disclaimer, first clinicians, founding mentors (§27) | Lauren | Beta start, not code | Seeded through admin tools from M1–M3 |

---

## 3. Cross-cutting foundations

Built once, early, and reused by every later milestone. Each is listed in the milestone that first
needs it.

| Foundation | Why | First needed |
|---|---|---|
| **Admin auth, roles and audit log** (FG-ADM-02) | Every staff action is audited, admins act as "Fertility Grove" | M1 |
| **Admin-managed lists** (§20 Lists): onboarding options, topic tags, report reasons, crisis resources, phrase list, guidelines, disclaimer, reserved handles, Help content | The PRD keeps all of these editable without a release | M1 (store), M2 onwards (each list as its feature arrives) |
| **Configurable limits** (§20 Limits): spam limits, report auto-hide threshold, email limits | Lauren must react to spam without a deploy. Email limits already exist as config | M1 |
| **Confirmed-email gate** | One policy for "unconfirmed members cannot do X" (§4) | M3 |
| **Account availability events** (event storm H3): `AccountBecameUnavailable` / `Available` for suspension and deletion-pending | Messaging, mentoring, profile, search and family space all react the same way | M4 |
| **Block service** (H5): one "blocked either way" read and a `MemberBlocked` event | Six consumers | M3 |
| **Crisis screening pipeline** (H4): one service, a `ScreenedText` contract per text kind with its moderator-visibility rule, phrase list + detector behind an interface | 16 kinds of text across six contexts; a launch guardrail | M4, but its interface is designed in M3 so posts call it from day one |
| **Display identity read model** (H8): handle vs first name + last initial, viewer-dependent for linked partners | Posts, messages, notifications and emails all render names | M2 |
| **Notifications** (in-app rows + immediate emails + daily update bucket) | Most features emit notifications | M3 (in-app), M7 (daily update) |
| **Durable reactions outbox** (H2 follow-up): domain events that must survive a crash after commit (deletion purge, chargeback, badge removal) | In-process events only cover same-transaction reactions | M4 |
| **Per-action rate limits** (§21): 10 posts, 50 comments, 20 reports an hour; 10 new conversations a day for young accounts | Spam | M3 |
| **Photo upload** (§21): JPG/PNG/HEIC ≤10 MB, virus scan, strip location data | Profile photos | M2 |

---

## 4. Milestones

Ordered by dependency and by launch risk. Each milestone ends with every PRD acceptance criterion
for its IDs passing as an integration test.

### M1 — Admin foundation (size M) — blocked by D1

| PRD IDs | Scope |
|---|---|
| FG-ADM-01 (part), FG-ADM-02, finish FG-AUTH-05 | Staff roles on `Account` (or the D1 alternative), admin sign-in, `api/admin/v1` base controller, audit log (who, what, when, previous value; immutable; 2-year retention), Roles and badges (assign moderator/admin), Invites endpoints over the existing commands (create link, list with join counts, pause, reopen, invite-only switch), Lists store, Limits store |

Done when: an admin can pause sign-ups and create a clinic link over HTTP; every admin write is in
the audit log; §20 criteria 6, 7, 12, 13 pass.

### M2 — Member profile and onboarding (size L)

| PRD IDs | Scope |
|---|---|
| FG-ONB-01, FG-ONB-02, FG-ONB-03 (Must), FG-ONB-04 (Could) | 8-screen onboarding with saved progress and enforcement (only Sign out, Help, Terms and Privacy reachable until complete), health-data consent and withdrawal (deletes health answers), community suggestion, personal start screen (needs M5 matching; ships with popular groups until then) |
| FG-PROF-01 (Must), FG-PROF-02, FG-PROF-04 (Should), FG-PROF-03 (Must, see M9) | `MemberProfile` (names, handle, display choice, pronouns, about, story, photo/avatar, settings), handle rules (reserved, retired, 30-day change, 14-day hold), "How others see me", privacy settings master list (§6) |

Builds: display identity read model, photo upload, admin lists for onboarding options. Fires
`OnboardingCompleted` (Seed level later, Welcome email now, referral Sunlight later).

Done when: §5 criteria 1–15 and §6 criteria 1–14 pass.

**Status (2026-11-19):** FG-COM-05 (member avatars in the group header) and FG-SOC-07 (guest
browsing: `Visible to guests` on groups, `Show to visitors` on posts, `api/v1/public/feed`,
`/public/groups`, `/public/groups/{id}`, and the public post page for visitor posts) are built. During
the invite-only beta a guest can leave an email, told once when the beta ends.

**Status (2026-11-19):** FG-PROF-05, the Dashboard (PRD v1.2), is built: `GET api/v1/profile/me/dashboard`
(tab counts, Recent activity, Mentoring card) and the Posts, Stories, Replies and Groups tab lists
under `profile/me`. Held and removed items are listed for their author only. §6 criteria 17–23
pass; 15–16 are client behaviour. Saved articles and "Worth saving" wait for M8, Appeal for M4.

### M3 — Community core (size L)

| PRD IDs | Scope |
|---|---|
| FG-COM-01 (Must), FG-COM-02, FG-COM-03 (Should) | Two fixed communities, admin groups (draft/active/archived, members-only, matching tags), join/leave/mute, home feed with sort and filters |
| FG-POST-01, FG-POST-02 (Must), FG-POST-03 (Should), FG-POST-04 (Could) | Posts with type and source, comments (one level), votes and score, collapse at −5, edit/delete, guidelines acceptance, saved posts, topic tags |
| FG-SOC-01, FG-SOC-03, FG-SOC-06 (Must), FG-SOC-02, FG-SOC-04 (Should), FG-SOC-05 (Could) | Success stories space, follows and Following tab, people search by handle, share link and post-in-message card, public share links |

Builds: confirmed-email gate, block service, per-action rate limits, in-app notifications, the
screening interface (posts call it; the full pipeline lands in M4). **Content goes to real members
only after M4.**

Done when: §8, §9, §10 criteria pass.

### M4 — Safety and moderation (size L) — needs D2 (detector, SMS), D8

| PRD IDs | Scope |
|---|---|
| FG-MOD-02 (Must) | Crisis screening for all 16 text kinds (§19), phrase list + detector, crisis resources at once, high-confidence hold, handle refusal, advisor example set and cutoff check |
| FG-MOD-01, FG-MOD-03 (Must) | Reports (posts, comments, profiles, conversations), Priority / Mentors / Standard queues, moderator actions (dismiss, hide, remove, move, warn, suspend, remove badge, Reach out), auto-hide at 5 reports, appeals with reversal |
| FG-OPS-01 (Must) | Alerts: Priority item waiting 12 hours, detector down, AI down, payments failing, app down (text to Lauren); email failures, backup failures, error rate (email to tech) |
| — | Suspension and the shared "away" state, Fertility Grove Support account and Support inbox, moderator read access rules with audit, durable reactions outbox |

Done when: §19 criteria 1–22 and §22a criteria pass; safety guardrails measurable.

**Status (2026-11-19):** the crisis-check pipeline is built ahead of D2 and D8: `CrisisScreening`
behind `IContentScreening` (phrase list from the admin-managed `CrisisPhrase` list, detector behind
`ISelfHarmDetector` with advisor-set flag and hold thresholds), `CrisisFlag` Priority-queue records
with a copy of the text (H11), holding posts and comments on a high-confidence score (on edits too),
About me and My story checked, handles with crisis words refused, the `X-Show-Crisis-Resources`
header for every text kind, and `GET api/v1/crisis-resources` (988 seeded). §19 criteria 2, 11, 12,
16 and 21 pass with a test phrase and a fake detector. Still waiting: the phrase list itself and
the cutoffs (D8), the detector vendor (D2) and criterion 15's example set, and the moderator side
(queues, actions, reports, appeals, audit), which needs D1.

### M5 — Recognition and matching (size M) — needs D7

| PRD IDs | Scope |
|---|---|
| FG-GAME-01 (Must), FG-GAME-02, FG-GAME-03 (Could) | Sunlight ledger, five tree levels (never shrink), caps, no Sunlight from new accounts or partners, reversal on removal, referral points from `InvitedByLinkId`, admin-tunable values |
| FG-MATCH-01, FG-MATCH-02 (Must), FG-MATCH-03 (Should) | Group, article, peer and mentor matching with reasons (scoring in §11), "Not for me", weekly refresh job, daily matched posts settled by a job (keeps the feed query read-only) |

Done when: §11 and §13 criteria pass.

### M6 — Mentoring and messaging (size L)

| PRD IDs | Scope |
|---|---|
| FG-DM-01 (Must), FG-DM-02, FG-DM-03 (Should) | Conversations, message requests, Who can message me, block/report/mute/delete for me, edit/delete within 15 minutes, search, new-conversation limit, crisis check on messages |
| FG-MENT-01, FG-MENT-02 (Must), FG-MENT-03 (Could) | Mentor setup at Blossom Tree or Founding badge, requests (7-day expiry), capacity (serialized with `ITransactionalLock` on `mentor:{id}`, H6), Mentoring conversations, badge removal fallout, feedback and thank-you notes |

Done when: §12 and §14 criteria pass.

### M7 — Notifications and emails (size M)

| PRD IDs | Scope |
|---|---|
| FG-NOTE-01, FG-NOTE-02 (Must), FG-NOTE-03 (Should) | Every event in the §15 table, per-member preferences and pause, daily update around 8 am local (time zone from ZIP), unsubscribe links, all 20 templates of §15a, admin-editable template text |

Done when: §15 and §15a criteria pass.

**Status (2026-11-12):** daily update built — `DailyUpdateJob` (every 15 min, sends 8:00–9:59 local,
time zone from the ZIP's state with cross-zone prefixes), counts of unread notifications per
category the member left on, one-click unsubscribe per category (`POST api/v1/notifications/unsubscribe`
with a per-member token), the mentoring, partner and "Pause all optional emails" settings, and the
"New matches this week" notification from the weekly peer refresh. §15 criteria 1, 3–7 pass.
**Status (2026-11-19):** every email now has a plain-text version built from the same parts as the
HTML (`EmailContent`), greets by first name where the account has one, and links to notification
settings in the footer (not for guests or partners without an account). The daily update carries
an RFC 8058 `List-Unsubscribe` header pointing at `POST api/v1/notifications/unsubscribe/one-click`,
sent only once `PublicApi:BaseUrl` is configured. Still open: FG-NOTE-03 admin-edited text (blocked
by D1). Criteria 8–9 and the moderation,
partner, deletion, export, new sign-in and receipt emails land with M4, M8, M9 and M10.

### M8 — Learn, Grove Guide and credits (size L) — needs D2 (AI), D3, D6

| PRD IDs | Scope |
|---|---|
| FG-LEARN-01 (Must), FG-LEARN-02 (Should) | Articles with reviewer, sources and review dates, publish rules, guest preview, review reminders |
| FG-GUIDE-01, 02, 03 (Must), FG-GUIDE-04 (Should) | Ask the Guide from published articles only, crisis response (free, never queued), appointment questions, behaviour table, anonymous unanswered list, AI provider behind an anti-corruption interface |
| FG-CRED-01, 02 (Must), FG-CRED-03 (Should) | Credit wallet (free first, monthly refill), reserve-and-settle charging (H7), Stripe Checkout and webhooks, 5 packs a day, receipts, chargebacks |

Done when: §16, §17, §18 criteria pass and the D6 example set passes.

**Status (2026-11-19):** the Learn library is built, the part of M8 that needs no vendor or price:
`Article` (Draft → In review → Published ↔ Unpublished; publishing needs a reviewer, a source and a
last reviewed date), admin commands with no HTTP until D1 (create, update, change status, group
reading links, the review list 30 days ahead and overdue with "Was this helpful" totals), and member
and guest reads under `api/v1/learn` (browse by diagnosis and topic, search, Recommended for you
scored as §11 article matching, article page with the medical disclaimer, guest preview), save,
"Was this helpful", the Saved page's Articles tab and Worth saving, and "From the library" on group
pages (FG-COM-04). §16 criteria 1–8 and §8 criteria 16, 17, 22 pass. The disclaimer text is a
placeholder in `Learn:MedicalDisclaimer` until the PRD's open question is answered; admin reminders
are the review list until the admin panel exists. The Grove Guide and credits still wait on D2, D3
and D6.

### M9 — Account lifecycle, privacy and remaining Auth (size M)

| PRD IDs | Scope |
|---|---|
| FG-AUTH-04 (Must) | Deletion with 14 days to restore, "Also delete my posts", away state, purge across every context, retired handles |
| FG-PROF-03 (Must) | Download my data (JSON + HTML, 7-day link, re-sign-in) |
| FG-NFR-02 (Must) | Retention table in §21 as scheduled jobs |
| FG-AUTH-02 (Should) | Google sign-in, with invite rules |
| — | New sign-in email, Terms re-acceptance |

Late on purpose: deletion and export touch every context, so they come after those exist.

**Status (2026-11-12):** slice 1, account deletion, is built. `POST api/v1/auth/account/deletion`
signs out everywhere and starts the 14 days. While deletion is pending the member is away
(`AccountSql.NotAway` next to every `BlockSql` read; `AccountReachability` for follows, messages,
mentor requests and notifications), waiting mentor requests to them are declined, and mentees see
"Your mentor is away for now." Signing in restores the account (`WasRestored` on login).
`AccountDeletionJob` (hourly) completes it: the account and profile become a tombstone (email
freed, profile cleared, handle retired as text only), and each context cleans up through
`AccountDeleted` handlers in the same save. Posts and comments are deleted or stay as "Deleted
member", as the member chose. All three §15a deletion emails are sent. §4 criteria 9–11 pass; criterion 8
(purchased credits) and the partner and family space parts wait for M8 and M10.
Slice 2, download my data (FG-PROF-03), is built: `POST api/v1/profile/me/data-exports` queues it,
`DataExportJob` builds a zip of `data.json` and `data.html` (the HTML is rendered from the JSON, so
neither can leave anything out) and sends the Data file ready email, and
`POST .../{id}/download` hands it over only after the password is entered again (with the sign-in
lockout). The file lives in Postgres, never behind a URL, and is deleted after 7 days.
Slice 3, retention (FG-NFR-02), is built: `RetentionCleanupJob` deletes notifications after 90
days, sign-in records unused for 90 days, mentoring feedback and thank-you notes after 2 years, and
delivered or abandoned outbox emails after 30 days (not in §21; they hold names and addresses).
Deleting a post or comment now erases its words, as deleting a message already did; a migration
cleared what earlier deletions had left. Rules for features not built yet join the job with them.
Slice 4 is built: the New sign-in email (a URL-safe device token in an HttpOnly `device_id`
cookie, hashed per account in `known_devices`; an account's first device is learned silently;
records follow the 90-day rule) and Terms re-acceptance (login and `GET me` return
`mustAcceptTerms`; `POST api/v1/auth/terms`; the global gate answers 403 `TERMS_NOT_ACCEPTED`
until then). Slice 5, Google sign-in (FG-AUTH-02), is built: `POST api/v1/auth/google` takes the Google button's ID
token, validated locally against Google's keys; an existing email signs in, a new one signs up with
the email confirmed (age, terms and invite rules as for email). It answers 503 "Google sign-in isn't
available right now. Try email instead." until `GoogleAuth:ClientId` is configured.

### M10 — Partner accounts and family space (size L) — needs D4

**Status (2026-11-12):** FG-PART-01 is built: `PartnerInvite` (14 days, resend once a day up to 3
times, note screened and shown only on the invite page) and `PartnerLink` (one per member,
serialized with `partner:{id}` locks), the public invite page, accept during onboarding with
partner answers preselected, sign-up from a partner invite during the invite-only beta, unlink,
block and account deletion ending the link, first-name-only partner notifications, no Sunlight
between partners, the Partner badge, and invite expiry and 30-day deletion. §7 criterion 10 holds:
another member's profile lists no posts or comments at all; the member's own lists live on the
Dashboard (FG-PROF-05), which only they can open.
FG-PART-02/03 (family space) still wait on D4.

| PRD IDs | Scope |
|---|---|
| FG-PART-01 (Must) | Partner invites (14 days, resend limits, note crisis-checked), linking, unlinking, blocking, display rules |
| FG-PART-02 (Must, pending D4), FG-PART-03 (Should) | Family space, View/Edit sharing, family notes with history, activity list, Past family notes after unlinking |

### M11 — Hardening and launch (size M)

| PRD IDs | Scope |
|---|---|
| FG-NFR-01 (Must), FG-NFR-03 (Should) | Core Web Vitals and Guide speed measurement, uptime monitor, browser matrix (frontend), automated accessibility checks, load test at 1,500 concurrent |
| FG-ADM-03 (Should) | Overview dashboard |
| — | Security review, backup restore test, launch gate checklist (section 6) |

---

## 5. Suggested order and parallel tracks

```text
Now ─► D1 decided ─► M1 Admin ─────────────► M4 Safety ─────────► M6 Mentoring + Messaging
  │                                      ▲                            │
  └─► M2 Profile + Onboarding ─► M3 Community ─► M5 Recognition + Matching
                                                                       │
              M7 Notifications (in-app from M3, daily update here) ◄───┘
                                         M8 Learn + Guide + Credits (when D2, D3, D6 land)
                                         M9 Lifecycle + Privacy ─► M10 Partners ─► M11 Launch
```

- M2 can start immediately; it does not depend on D1.
- M1 starts the moment D1 is decided.
- M4 must finish before any real member can post (beta start).
- M8 can run in parallel with M5–M7 once its vendors and prices are known.

**Beta-ready line:** M1–M7, FG-LEARN-01, the Must parts of M8 and M9, and FG-PART-01. Everything
marked Should or Could can follow within weeks of launch (§27a).

---

## 6. Launch gates (PRD §24) and where they are met

| Gate | Met by |
|---|---|
| 1. Growth metrics at 80% of target, safety guardrails at 100% | Analytics events from M2–M8; metrics need the privacy-safe analytics vendor (D2) |
| 2. No open safety issues; weekly 95% of Priority items reviewed in 24 h | M4 alerts and queue timing; D5 |
| 3. Counsel's legal and privacy review | External; M9 retention and export make it reviewable |
| 4. Advisors approved what the Guide may say | M8, D6 |
| 5. Clinical advisor approved detector examples and cutoff | M4, D8 |

---

## 7. Definition of done for every slice

- Every PRD acceptance criterion for the slice's IDs is an integration test, named after it.
- Messages shown to members are the PRD's exact wording.
- Unit tests for domain rules and handlers; arch tests pass; `make test` and `make lint` are green.
- Migrations reviewed by `migration-reviewer` before they are applied; data back-fills tested on
  throwaway rows.
- Commands use EF, queries use Dapper; no query writes (settle state in a job instead).
- Cross-context reactions go through domain events, never direct calls into another context.
- `CLAUDE.md` updated when a convention, exception mapping or feature list changes.
- Breaking API changes listed in the commit message for the frontend.

---

## 8. Event storm hot spots — status

| # | Hot spot | Status |
|---|---|---|
| H1 | Admin model conflict | Open — D1 |
| H2 | Domain-event mechanism | Done in-process; durable outbox for post-commit reactions in M4 |
| H3 | Shared away state | M4 |
| H4 | Crisis check across contexts | Interface in M3, pipeline in M4 |
| H5 | Block consumers | M3 |
| H6 | Mentor capacity race | M6, `ITransactionalLock` |
| H7 | Credit charging race | M8, reserve and settle |
| H8 | Viewer-dependent display identity | M2 |
| H9 | "Per day" boundary | Decide in M3 with the first daily cap (recommend member-local time) |
| H10 | Matched posts are state | M5, scheduled job |
| H11 | Moderation content snapshot | M4 |
| H12 | Credits after deletion | M8/M9 |
| H13 | Vote Sunlight needs account age and partner link | M5 |
| H14 | Vendors to be chosen | D2 |
