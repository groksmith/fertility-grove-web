# Fertility Grove MVP. Product Requirements

Oct 21, 2026 · @Ben Frunjyan

| Field | Value |
|---|---|
| Type | Full PRD |
| Version | 1.2 |
| Status | Draft, for review with Lauren |
| Owner | Ben Frunjyan |
| Approver | Lauren, Fertility Grove |
| Last updated | Nov 11, 2026 |

> **What changed in v1.2.** v1.2 adds behaviour the frontend already ships, the decisions on the questions it raised, and guest browsing. Every change is tagged `[Added v1.2]` or `[Updated v1.2]` in prd.md, and highlighted in prd.docx.

**Revision history**

| Version | Date | Change |
|---|---|---|
| 1.0 | Oct 21, 2026 | First full draft |
| 1.1 | Nov 3, 2026 | Review fixes: matching points, guardrail reviews, new-conversation limits, accessibility and load-test wording |
| 1.2 | Nov 11, 2026 | Frontend additions. Source is optional on posts (section 9). The Dashboard replaces the member's own profile (sections 3, 6, 7, 10 and 13, FG-PROF-05). Home is renamed Feed (section 26). Sort and filters on a group page (section 8). "From the library" on group pages (sections 8 and 16, FG-COM-04). Member avatars on group pages (section 8, FG-COM-05). Refer a friend on onboarding screen 8 (sections 5, 10 and 24). Avatar background colour (sections 5 and 6). Avatar picker in the "Complete your profile" card (section 5, FG-ONB-04). Sign-out confirmation (section 4). Unsaved-changes warning on forms (section 21, FG-NFR-04). Floating Grove Guide button (section 17). The Saved page, and saving success stories (sections 3, 6, 9, 10 and 16, FG-POST-03). The 7 questions these raised are decided (sections 27 and 27b). Guest browsing of posts made public by both the group and the author (sections 2, 4, 8, 10, 15a, 20, 21, 24, 25, 26, FG-SOC-07) |

## 1. Overview

This PRD describes what the Fertility Grove MVP does, for whom, and under which rules. It turns the scope Lauren approved into user stories, flows, fields and rules that design and development can build from.

### The problem

**Patients navigate a high-stakes medical journey without guidance they trust for their own case.**

In their words:

> "I want to give my patients somewhere to turn. I just have nothing I can recommend." (Courtney M., IVF nurse coordinator)

> "My husband never had anyone to talk to. Nobody asked about him." (Laura D., patient)

> "If it's all in one place, great. But if it's one more thing, it's overwhelming." (Kate H., patient)

> "You don't know what you don't know." (Chesleigh C., patient)

About 1 in 6 people worldwide experience infertility (WHO, 2023). Psychological burden is the No. 1 reason insured patients give for stopping IVF (Domar et al., Fertility and Sterility, 2018), and it is cited consistently across studies and countries. Cost and prognosis are not the only reasons people stop. Many stop because the journey is too heavy to carry alone.

**Why now**

More people go through treatment every year, and support has not kept up. In 2024, more than 100,000 babies were born through IVF in the US for the first time, from 449,772 treatment cycles, up from about 390,000 cycles in 2022 (SART, 2026). Clinics see the gap first. Nurses and doctors want somewhere trusted to send patients and partners, and today they have nothing to recommend.

**What the MVP must achieve**

- A person going through infertility signs up, describes their situation once, and lands in the right groups with people on the same path.
- They get trusted answers from a clinician-reviewed library and from the Grove Guide AI.
- They connect one to one with peers and mentors, and their partner can join too.
- Helpful members grow their tree through gamification, and the most experienced become mentors without an application.
- Moderators keep the space safe, with a priority path for members in crisis.

**How we measure success**

**North Star.** Members who gave or received help in a week. Help means a reply to their post or comment, a reply to their direct message, a mentoring message, or a Grove Guide answer they rated Helpful. Its starting target is set after the first 4 weeks of the beta, once real numbers exist.

| Goal | Metric | Starting target |
|---|---|---|
| Finishes onboarding | Sign-ups who finish onboarding (reach screen 8) | 75% or more |
| Lands in the right groups | New members who post, comment or vote in a group suggested to them, within 14 days | 50% or more |
| Finds people on the same path | New members who get a reply from another member within 14 days. A reply to their post or comment, a reply to their direct message, or a mentor accepting their request | 40% or more |
| Keeps coming back | New members who post, comment, vote, message or ask the Grove Guide in their 4th week | 25% or more |
| Gets trusted answers | Grove Guide answers rated Helpful, out of all rated answers | 75% or more |
| Stays safe | Detected crisis signals that show crisis resources at once | 100% |
| Stays safe | Priority queue items reviewed within 24 hours, measured every week | 95% or more |

These are starting targets. They are checked every week during the beta and reset after its first 4 weeks, once real numbers exist. The two Stays safe metrics are safety guardrails. A week that misses a guardrail is reviewed by Ben and Lauren within 3 days, and both must meet their full target at the launch check in section 24. The others are growth metrics.

**How to read this document**

- Each feature section has user stories, a flow, the fields a user fills, and the rules.
- Field tables use these types. Text, long text, single choice, multiple choice, date, number, email, password, toggle, image and link.
- Required means the user cannot continue without it. Optional means they can skip it and add it later.
- This PRD makes no technology decisions. Those come later in the technical architecture, during discovery.
- Wording on screens is indicative. Final copy is agreed in design.
- Each feature section ends with acceptance criteria. These are pass/fail checks written as Given, when, then. Each block is tagged with its feature IDs from section 27a.
- Each feature has an ID and a priority, Must, Should or Could. See section 27a.

**Scope baseline.** The approved scope sheet is the baseline. Details may be refined as we go. Anything that adds significant work is agreed with Fertility Grove first.

**Launch market.** Fertility Grove launches in the United States only. ZIP codes are US ZIP codes, crisis resources are US services, and prices are in US dollars.

**Alternatives members use today**

| Alternative | What people get there | What is missing | How Fertility Grove differs |
|---|---|---|---|
| Reddit (r/infertility, r/IVF) and Facebook groups | Large, active, free peer support | No medical review. Facebook ties posts to real names. Pregnancy news shows up everywhere. Nobody matches you to people like you | Groups and peers matched to diagnosis and stage. Clinician-reviewed Learn articles. Handles by default. Success stories kept in their own space |
| Fertility and cycle apps (Peanut, Flo, Ovia, Inito) | Cycle tracking, testing and broad trying-to-conceive communities | Built around tracking or general trying to conceive, not infertility diagnoses and treatment. Little for partners. No mentors | Built for infertility diagnoses and treatment. Partner accounts and a partners community. Mentors who have been through it |
| Employer fertility benefits (Progyny, Carrot, Maven) | Treatment coverage, care navigators, some virtual care | Only for people whose employer offers it. Limited peer community | Free for everyone in the US. Peer, partner and mentor support that works alongside any benefit |

## 1a. What we're betting on

The MVP rests on a few bets. Each one has a check, so we learn early if a bet is wrong. If a check fails, Ben and Lauren review that bet before the launch check in section 24.

**Our bets and how we check them**

| We believe | We will know it is true when | When we check |
|---|---|---|
| Members will describe their situation once to get matched | 75% or more of sign-ups finish onboarding | Every week |
| 100 to 300 beta members are enough to make groups feel alive | 40% or more of new members get a reply from another member within 14 days | Every week |
| Answers from 6 reviewed articles are enough to be useful | 75% or more of rated Grove Guide answers are rated Helpful | Every week |
| New members keep coming back | 25% or more of new members are active in their 4th week | Every week |
| Partners will join when invited | Half of partner invites are accepted | End of the beta |
| Founding mentors can meet early demand for mentors | 80% or more of mentor requests get a reply within 7 days | Every week |
| Members will pay for credits when their free ones run out | 5% or more of members who run out of free credits buy a pack | End of the beta |

Bets 5 to 7 add new starting targets. Like the others, they are reset after the first 4 weeks of the beta.

**Hard limits**

- US only, in English, on the web (section 1).
- One person, Lauren, runs moderation, admin and appeals at launch.
- 6 Learn articles at launch, one for each of six diagnoses (section 16).
- US health-data law sets the privacy bar, including the FTC Health Breach Notification Rule and Washington's My Health My Data Act (section 21).
- The approved scope sheet is the baseline (section 1).
- This PRD makes no technology decisions.

**Things we assume but have not checked yet**

- Most members will post under a handle rather than their real name.
- Clinicians will review Learn articles and agree to be verified.
- An AI provider will agree in writing to keep no copies and never train on member data (section 21).
- A clinical advisor will own the crisis phrase list (section 19).
- Most members will use Fertility Grove on a phone.

## 2. User types and roles

The MVP has seven user types. Five use the member app. Moderators and admins use the admin panel. Mentor and verified clinician are not separate accounts. They are badges on a member account. Moderator and admin are roles on a member account too.

| User type | Who they are | How they get this role | Main goals |
|---|---|---|---|
| Guest | A visitor who is not signed in | Default for anyone not signed in | Understand what Fertility Grove is, read the posts members made public (section 10) [Updated v1.2], and create an account |
| Member | A person experiencing infertility, or exploring fertility preservation | Signs up and completes onboarding | Find people on the same path, get trusted answers, prepare for doctor visits |
| Partner | The partner or spouse of a member | Accepts an invite from a member, or signs up and links later | Understand what is happening, support their partner, talk to other partners |
| Mentor | An experienced member who helps others on the same path | Reaches the Blossom Tree level and turns on mentoring. No application. At launch, admins can also give a Founding mentor badge (section 12) | Share experience, answer questions, support newer members one to one |
| Verified clinician | A doctor, nurse or licensed practitioner who posts in the community | Admin verifies their credentials and adds the badge | Share credible input. Their posts and comments carry a clinician badge |
| Moderator | Fertility Grove staff or trusted volunteers | Admin assigns the role | Review reports, remove harmful content, respond to crisis signals first |
| Admin | Fertility Grove team | Set up by Fertility Grove | Manage communities, groups, Learn articles, roles, point values and AI credit settings |

**What each user type can do**

| Action | Guest | Member | Partner | Mentor | Clinician | Moderator | Admin |
|---|---|---|---|---|---|---|---|
| View landing and public pages | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| View public posts shared by link | Yes, read only | Yes | Yes | Yes | Yes | Yes | Yes |
| Browse posts shown to visitors, in groups visible to guests [Added v1.2] | Yes, read only, no comments | Yes | Yes | Yes | Yes | Yes | Yes |
| Join communities and groups | No | Yes | Yes | Yes | Yes | No | No |
| Post, comment and vote | No | Yes | Yes | Yes | Yes | No | No |
| Post in Success stories | No | Yes | Yes | Yes | Yes | No | No |
| Send direct messages | No | Yes | Yes | Yes | Yes | No | No |
| Receive mentor requests | No | No | Yes, if also a mentor | Yes | Yes, if also a mentor | No | No |
| Read Learn articles | Preview only | Yes | Yes | Yes | Yes | Yes | Yes |
| Use the Grove Guide AI | No | Yes | Yes | Yes | Yes | No | No |
| Buy AI credit packs | No | Yes | Yes | Yes | Yes | No | No |
| Report and block | No | Yes | Yes | Yes | Yes | Not needed | Not needed |
| Hide or remove content, suspend members | No | No | No | No | No | Yes | Yes |
| See the Priority queue | No | No | No | No | No | Yes | Yes |
| Manage communities, groups, Learn and settings | No | No | No | No | No | No | Yes |
| Assign roles and badges | No | No | No | No | No | No | Yes |

The Moderator and Admin columns show what those roles add in the admin panel. The same person also has every Member permission on their member side.

**Role rules**

- One person has one account. Mentor and clinician are badges on that account, so a mentor keeps everything a member can do.
- A partner account works like a member account. The only differences are a preselected community and stage in onboarding, and the link to the member who invited them.
- A partner can also become a mentor by reaching Blossom Tree.
- Moderators and admins act in the admin panel, never under their member identity. Every action they take is written to the audit log.
- Moderator and admin are roles on a member account, not separate accounts. The role opens the admin panel with the same email and password. To members, actions taken there show as Fertility Grove, never under the person's name.
- Admins, and moderators acting on a report, can remove the mentor badge from a member who breaks the rules. Only admins give it back. The member keeps their tree level.
- At launch, Lauren is the only admin and moderator.

## 3. User journeys

A member moves through eight stages, from first visit to mentoring others. A partner enters through an invite and joins the same journey once they reach their groups.

![image1.png](prd-images/image1.png)

member and partner journey · 8 stages

Stages 5 to 7 repeat for as long as the member stays. Moderators and admins work in the admin panel, covered in sections 19 and 20.

1. Discovers Fertility Grove from a clinic, a friend or search.
2. Signs up with email or Google and confirms the email. During the beta, this needs an invite link.
3. Onboards. Diagnosis, stage and path first, then handle and privacy.
4. Joins up to 5 matched groups, each in one tap.
5. Learns and asks. Learn articles, the Grove Guide and AI credits.
6. Connects. Posts, votes, follows and direct messages.
7. Grows a tree by earning Sunlight, from Seed to Orange Tree.
8. Mentors others once they reach Blossom Tree, or with a Founding mentor badge.

A partner gets an invite from the member's onboarding or Dashboard [Updated v1.2], signs up with their own private account through the same onboarding with some answers preset, and joins at step 4.

**What empty screens show**

When a screen has nothing to show yet, it says so kindly and offers one next step.

| Screen | What it shows |
|---|---|
| Home feed, no groups joined | "Your feed fills up as you join groups." Up to 5 matched groups to join |
| Home feed, nothing new | "You're all caught up." A button to write a post |
| Following tab, following no one | "Follow people to see their new posts here." People on your path |
| A group with no posts yet | "No posts yet. Start the conversation." A button to write a post |
| People on your path, no matches | "We're still finding people on your path. Check back soon." Popular groups |
| Find a mentor, no mentor available | "No mentors on your path are free right now. Check back soon, or ask in a group." |
| Success stories, none yet | "No stories here yet. When you're ready, yours could be the first." |
| Learn search, no results | "No articles match that yet. Try different words, or ask in a group." |
| People search, no results | "No members match that handle." |
| Messages, none | "No messages yet. You can message people from their profile." |
| Message requests, none | "No message requests." |
| Grove Guide, no chats yet | The 3 starter questions for the member's situation |
| Saved, nothing saved | "Nothing saved yet." "Tap the bookmark on any post, story or article and it waits for you here." A button to Browse Learn (section 6) [Updated v1.2] |
| Family space, nothing shared | "Nothing shared yet. Share an appointment question list or start a family note." |
| Notifications, none | "No notifications yet." |
| Dashboard, each tab with nothing yet | Its own title, text and next step, listed in section 6 [Added v1.2] |
| Onboarding screen 8, a block with nothing to show | The block is hidden |

## 4. Registration and sign-in

A guest creates an account with email and password or with Google, confirms their email, and moves straight into onboarding. A returning member signs in the same two ways.

Landing page

- One line on what Fertility Grove is and who it is for. A private community for people going through infertility, and their partners.
- A plain-language privacy summary. Handles by default, no ad trackers, health data never sold, and members can download or delete everything. Links to the Privacy Policy and the Consumer Health Data Privacy Policy.
- Clinician-reviewed Learn, with article titles and summaries to preview.
- During the beta, "Invite-only during the beta" and how to get an invite.
- Sign in and Create account. The footer links to Terms, Privacy, Help and crisis resources, including 988.

Help page

- Crisis resources, including 988, at the top.
- Short answers to common questions. Getting an invite, handles and privacy, partners, AI credits and deleting an account. Admins edit them in Lists (section 20).
- Contact support. Messages go to the Support inbox (section 20).
- Help works without signing in, and during onboarding.

**User stories**

- As a guest, I want to sign up with my email or Google account so that I can join in under a minute.
- As a guest, I want to know my data is private before I sign up so that I feel safe sharing my story.
- As a member, I want to reset a forgotten password by email so that I never lose access.
- As a member, I want to sign out of all devices so that I stay safe if I used a shared computer.
- As a member, I want to delete my account and data so that I stay in control of my information.

![image2.png](prd-images/image2.png)

sign-up and email confirmation · 2 paths

Google sign-ups skip confirmation. Email sign-ups onboard right away and can post, comment and message once the link is opened.

1. The guest taps Create account. During the beta, this needs an invite link (section 24).
2. If sign-ups are paused, they see the paused message and can leave an email to hear when sign-ups reopen.
3. They choose email or Google.
4. With Google, they confirm the age and terms toggles and go straight to onboarding.
5. With email, they enter email, password, age and terms. The confirmation email is sent and onboarding starts at once.
6. If the link is opened within 60 minutes, the email is confirmed and everything an unconfirmed member cannot do unlocks (see Rules).
7. If not, the member asks for a new link and the confirmation email is sent again.

**Sign-up fields**

| Field | Type | Required | Rules |
|---|---|---|---|
| Email | Email | Required | Must be a valid email address. One account per email. Capital letters are ignored, so Ben@groksmith.co and ben@groksmith.co are the same email |
| Password | Password | Required | 8 to 64 characters. Rejected if it appears in a list of known leaked passwords. Shown as dots with a show and hide toggle |
| I am 18 or older | Toggle | Required | Fertility Grove is for adults only |
| I agree to the Terms and Privacy Policy | Toggle | Required | Links open both documents. The accepted version and date are saved |

With Google, the member only confirms the age and terms toggles. The email comes from Google and counts as confirmed.

**Sign-in fields**

| Field | Type | Required | Rules |
|---|---|---|---|
| Email | Email | Required |  |
| Password | Password | Required |  |
| Keep me signed in | Toggle | Optional | Off by default. On keeps the member signed in on this device for 30 days. Off signs them out after 1 day, or when the browser closes |

**Password reset fields**

| Field | Type | Required | Rules |
|---|---|---|---|
| Email | Email | Required | The same message shows whether the email exists or not |
| New password | Password | Required | Same rules as sign-up |
| Confirm new password | Password | Required | Must match the new password |

**Error messages**

| Form | When | Message |
|---|---|---|
| Sign-up | Email is not valid | Enter a valid email address. |
| Sign-up | Password is shorter than 8 characters | Use at least 8 characters. |
| Sign-up | Password is longer than 64 characters | Use 64 characters or fewer. |
| Sign-up | Password appears in a known leak | This password has appeared in a data leak elsewhere. Choose a different one. |
| Sign-up | "I am 18 or older" is off | You need to be 18 or older to join Fertility Grove. |
| Sign-up | Terms toggle is off | Please agree to the Terms and Privacy Policy to continue. |
| Sign-up | No invite link during the beta | Fertility Grove is invite-only during the beta. Ask a member for an invite link. |
| Sign-up | Sign-ups are paused | We've paused new sign-ups for a short time so our team can welcome everyone properly. Leave your email and we'll let you know when we reopen. |
| Sign-in | Wrong email or password | That email or password isn't right. |
| Sign-in | 5 failed attempts in 15 minutes | Too many attempts. Try again in 15 minutes, or reset your password. |
| Password reset | Reset requested | If there is an account for that email, we have sent a reset link. |
| Password reset | Passwords do not match | Passwords don't match. |
| Any link | Link already used, or older than 60 minutes | This link has expired. Request a new one. |
| Any action | Unconfirmed member tries to post, comment, message, vote, request a mentor or buy credits | Confirm your email to do this. We sent a link to [email]. Resend link |

**Rules**

- An email sign-up stays unconfirmed until the member clicks the link in the confirmation email. An unconfirmed member can finish onboarding, browse, join groups, follow people, read Learn and use their free Grove Guide credits. They cannot post, comment, message, vote, request a mentor or buy credits until they confirm.
- During the beta, sign-up needs an invite link from a member or from Fertility Grove. See section 24.
- When an admin pauses sign-ups (section 20), Create account shows the paused message with an optional email field. Invite links stay valid. When sign-ups reopen, each saved email gets one Sign-ups reopened email and is then deleted. It is never used for anything else.
- During the beta, a guest's sign-up prompt on public posts offers the same email field (section 10, Guest browsing). When sign-up opens to everyone (section 24), each saved email gets one Sign-ups reopened email and is then deleted. [Added v1.2]
- The confirmation link and the reset link work once and expire after 60 minutes. The member can ask for a new one.
- Wrong email or password always shows the same message. "That email or password isn't right." It never says which one is wrong.
- After 5 failed attempts in 15 minutes, sign-in pauses for 15 minutes. The message offers a password reset.
- Emails that someone can trigger by typing an address are limited per address, as set in section 21. Past the limit, the screen shows the usual message and no email is sent, so it never reveals whether an account exists. Admins change these in Limits (section 20).
- Keep me signed in keeps the member signed in on that device for 30 days. Without it, they are signed out after 1 day or when the browser closes. The other security rules are in section 21.
- An email that already has an account, in any mix of capital letters, can never create a second account. The screen never reveals that the email exists. It shows the same "Check your email" message as a new sign-up, and the real owner gets the Sign-up attempt email in section 15a. Sign-in, password reset and invites also ignore capital letters in emails.
- A Google sign-in with an email that already has an account signs into that account.
- Changing the password or the email signs the member out everywhere else.
- Sign out asks first [Added v1.2]. It is in the account menu at the foot of the desktop sidebar and in the phone menu. A dialog titled "Sign out of Fertility Grove?" says "You can sign back in any time with your email or Google.", with "Sign out", shown in red, and "Cancel". Confirming signs out this device only and opens the sign-in screen. If a form on the page has unsaved changes, the unsaved-changes dialog (section 21) comes first, and the sign-out question follows only if the member chooses to leave.
- During onboarding, the Sign out link in the header asks the same question and also opens the sign-in screen. Onboarding progress is saved after every screen (section 5), so signing out loses nothing. [Added v1.2]
- When the Terms or Privacy Policy change, the member accepts the new version at their next sign-in.
- Deleting an account starts from Settings. A confirmation pop-up explains what will be removed and that the member has 14 days to change their mind, with Delete my account and Cancel buttons. After confirming, the member is signed out at once and gets the deletion email in section 15a.
- When the member has purchased AI credits, the pop-up also shows "You have [N] purchased credits. They will be lost." Delete my account stays disabled until the member ticks "I understand".
- The pop-up also has a checkbox, "Also delete my posts and comments", ticked by default. Ticked, the member's posts and comments are removed when the 14 days end, and replies from others stay under "This post was deleted". Unticked, they stay in their threads as "Deleted member". Fertility Grove's counsel confirms this before launch (section 21).
- During the 14 days, the profile, posts and comments are hidden from other members and the account receives no messages or notifications. Items they shared in the family space are hidden too.
- During the 14 days the member is away, as in a suspension (section 19). Mentoring is paused and their mentees see "Your mentor is away for now." Waiting mentor requests to them are declined with the kind default message. People who message them see "This member can't receive messages right now."
- Signing in within 14 days restores the account exactly as it was, including a suspension that has not ended yet, and sends a confirmation email. A suspended member restores it with Restore my account on the suspension screen (section 19).
- After 14 days, the profile, messages, Grove Guide chats, family space items and unused AI credits are removed for good. Posts and comments are removed, or stay in their threads as the member chose, shown as "Deleted member". A final email confirms the deletion. The handle is retired and never given to anyone else. The other person in a direct message conversation keeps their copy (section 14).
- If the member has a linked partner, the link ends the same way as an unlink. The partner is told "Your partner has left Fertility Grove", never that the account was deleted. The partner keeps a copy of the family notes, and items the member shared one way disappear.

**Acceptance criteria (FG-AUTH-01 to FG-AUTH-06)**

1. Given the beta is running, when a guest opens sign-up without an invite link, then they cannot create an account and are shown how to get an invite.
2. Given a guest with an invite link, when they sign up with a valid email, a password of at least 8 characters, and the age and terms toggles on, then the account is created, the confirmation email is sent and onboarding starts at once.
3. Given an email that already has an account in any mix of capital letters, when someone signs up with it, then they see the same "Check your email" message as a new sign-up, no second account is created and the owner gets the Sign-up attempt email.
4. Given a member enters a wrong email or password, when they press Sign in, then they see "That email or password isn't right." and nothing says which one is wrong.
5. Given 5 failed sign-in attempts within 15 minutes, when the member tries again, then sign-in is paused for 15 minutes and the message offers a password reset.
6. Given a confirmation or reset link, when it is opened a second time or more than 60 minutes after it was sent, then it does not work and the member can ask for a new one.
7. Given a member is signed in on several devices, when they press Sign out of all devices in Settings, then every other session is signed out.
8. Given a member with purchased credits confirms Delete my account, when the pop-up opens, then it shows the purchased credit balance as lost and Delete my account stays disabled until the member ticks the box.
9. Given a member confirmed deletion, when they sign in again within 14 days, then the account, purchased credits and partner link are restored exactly as they were and a confirmation email is sent.
10. Given 14 days have passed since deletion was confirmed, when the deletion completes, then the profile, messages, Grove Guide chats and credits are removed, posts and comments are removed or show "Deleted member" as the member chose, and the final email is sent.
11. Given a member confirmed deletion with "Also delete my posts and comments" ticked, when the 14 days end, then their posts and comments are removed and replies from others stay under "This post was deleted".
12. Given a guest enters a password that appears in a known leak, when they press Create account, then no account is created and they see "This password has appeared in a data leak elsewhere. Choose a different one."
13. Given a member signed in without Keep me signed in, when 1 day passes or the browser closes, then they are signed out. With it, they stay signed in on that device for 30 days.
14. Given a guest with an invite link signs up with Google, when they turn on the age and terms toggles, then the account is created with the email confirmed and onboarding starts at once.
15. Given an email that already has an account, when someone signs in with Google using it, then they are signed in to that account and no second account is created.
16. Given 3 password reset emails were sent to an address in the last hour, when a 4th is requested, then the screen shows the usual message and no email is sent.
17. Given a guest opens the landing page, when it loads, then it shows the privacy summary, links to both privacy policies, and Sign in and Create account, and no ad tracker loads.
18. Given anyone, signed in or not, opens Help, when it loads, then crisis resources including 988 show at the top and Contact support is available.
19. Given an admin paused sign-ups, when a guest opens a valid invite link, then they see the paused message and can leave an email, and when sign-ups reopen that email gets one Sign-ups reopened email and is then deleted.
20. Given a signed-in member, when they tap Sign out and then Cancel, then they stay signed in on the same page. [Added v1.2]
21. Given a member signed in on two devices, when they confirm Sign out on one, then that device opens the sign-in screen and the other stays signed in. [Added v1.2]
22. Given a member on onboarding screen 4, when they tap Sign out in the header and confirm, then they land on the sign-in screen, and signing in again opens screen 4. [Added v1.2]

## 5. Onboarding

Onboarding is personal. It asks about the member's situation and what they are looking for first, then uses those answers to suggest their community, groups, people, mentors and articles. Name and handle come after, once the member has seen the questions are about them. It has 8 screens. Screens 1, 3, 4, 5 and 6 are required. Screens 2 and 7 can be skipped. It ends on a personal start screen built from the answers.

**User stories**

- As a new member, I want to be asked about my situation before anything else so that I feel the platform is built for me.
- As a new member, I want to say what I am looking for so that I am shown the right kind of help first.
- As a new member, I want my community suggested from my answers so that I do not have to guess where I belong.
- As a new member, I want to choose a handle instead of my real name so that I can be honest without being identified.
- As a new member, I want to skip questions I am not ready to answer so that onboarding never feels like a medical form.
- As a new member, I want to leave and come back later so that I do not lose what I already filled in.
- As a new member, I want to finish with groups, people and articles picked for me so that I meet people like me in my first session.

![image3.png](prd-images/image3.png)

onboarding · 8 screens, questions first

Dashed screens show a Skip button. Partners go through the same screens. When they come from an invite, their community and stage are preselected.

**Screen 1. Where are you in your fertility journey?**

A short intro line opens the screen. "A few questions so we can match you with the right people, groups and information. Only you see your answers unless you choose to share them."

| Field | Type | Required | Options and rules |
|---|---|---|---|
| Journey stage | Multiple choice | Required, at least 1 | Actively trying to conceive. Waiting on tests or a diagnosis. Recently diagnosed. Pursuing treatment. Pregnant after infertility. Taking a break. Moving forward without treatment. I am a partner / spouse. Just looking for information and support. Prefer not to share |
| Which treatment | Multiple choice | Optional, shown when Pursuing treatment is picked | IUI. IVF. Egg freezing. Embryo freezing or transfer. Medication only. Other |
| Next treatment or cycle date | Date | Optional, shown when Pursuing treatment is picked | Seen only by the member. Helps match people at the same point |
| Consent to use my health answers | Toggle | Required | "I agree that Fertility Grove uses my answers about my health to match me with people, groups and information." Links to the Consumer Health Data Privacy Policy. Can be withdrawn in Settings. Withdrawing deletes the stored health answers |

**Screen 2. Has a doctor named anything specific?**

| Field | Type | Required | Options and rules |
|---|---|---|---|
| Diagnosis | Multiple choice | Optional | PCOS. Endometriosis. Premature ovarian insufficiency. Thyroid disorder. Male factor infertility. Uterine fibroids or polyps. Diminished ovarian reserve. Recurrent pregnancy loss. Autoimmune disorder. Hormonal imbalance. Tubal factor. Unexplained. Not diagnosed yet. Other |
| Other diagnosis | Text | Required when Other is picked | Up to 100 characters. Reviewed by admins to grow the list |
| Path to parenthood | Multiple choice | Optional | Own eggs and sperm. Donor eggs. Donor sperm. Donor embryos. Surrogacy or gestational carrier. Not sure yet |

**Screen 3. A little about you**

| Field | Type | Required | Options and rules |
|---|---|---|---|
| Gender identity | Single choice | Required | Female. Male. Non-binary. Transgender female. Transgender male. Genderqueer or gender fluid. Agender. Two-spirit. Intersex. Prefer to self-describe. Prefer not to say. Private by default |
| Describe your gender identity | Text | Required when Prefer to self-describe is picked | Up to 50 characters |
| Pronouns | Single choice | Optional | she/her. he/him. they/them. she/they. he/they. Prefer to self-describe. Prefer not to say. Shown next to the name on the profile, posts and comments when given |
| Your pronouns | Text | Required when Prefer to self-describe is picked | Up to 30 characters |
| Age range | Single choice | Optional | Under 30. 30 to 34. 35 to 37. 38 to 40. 41 to 44. 45 and over |
| ZIP code | Text | Required | 5 digits, or ZIP+4. Used to suggest nearby peers. Never shown |

**Screen 4. What are you looking for?**

| Field | Type | Required | Options and rules |
|---|---|---|---|
| I'm looking for | Multiple choice | Required, at least 1 | People in my exact situation. A mentor who has been through it. Trusted information about my diagnosis. Help preparing for doctor visits. Support as a partner, or for my partner. Hope from success stories. A safe place to vent. Just exploring for now |
| How I like to connect | Single choice | Optional | Reading and learning first. Talking in groups. One-to-one conversations. A mix of everything |

**Screen 5. Your community**

The screen suggests one community based on the answers so far, with one line explaining why. The member confirms it or switches.

How the suggestion works. Female or Transgender female suggests the Women's Community. Male, Transgender male or "I am a partner / spouse" suggests the Partners & Men's Community. Any other answer, or answers that point to both, such as a woman who is a partner, shows both communities equally with neither preselected.

| Field | Type | Required | Options and rules |
|---|---|---|---|
| Your community | Single choice | Required | Women's Community, "A space for women navigating diagnosis, treatment, and everything around it." Partners & Men's Community, "For partners, spouses, and men on the fertility journey. A room where somebody finally asks about you." The suggested one is preselected. When there is no clear suggestion, neither is |

An info note explains that content and tools are the same in both communities, and only the space differs. Members can switch community later in settings.

**Screen 6. Your profile**

One screen sets up how the member appears. A live preview card shows how others will see them as they fill it in.

| Field | Type | Required | Options and rules |
|---|---|---|---|
| First name | Text | Required | Up to 50 characters. Private unless the member chooses to show their real name |
| Last name | Text | Required | Up to 50 characters. Never shown publicly, only the initial when real name is on |
| Pick a handle | Text | Required | 3 to 30 characters. Lowercase letters, numbers and underscores, starting with a letter. Must be unique. Shown with @ in front. Placeholder "hopeful\_annie". Handles on the reserved list, such as fertilitygrove, support or moderator, and retired handles cannot be used (section 21). Nor can handles with crisis words (section 19) |
| Show my real name, or show my handle instead | Single choice | Required | Two cards. "Show my real name" shows first name and last initial, for example "Annie M.", on posts, comments and messages. "Show my handle instead" lets the member take part fully without anyone seeing their real name. Handle is the default |
| Profile photo | Image | Optional | "Upload from my computer". Location data is removed from photos |
| Or select an avatar | Single choice | Optional | One of the preset avatars. Members using a handle are nudged toward an avatar |
| Avatar background [Added v1.2] | Single choice | Required, with a default | Green, Coral, Yellow, Blue, Pink or Purple, pale tints of the brand colours. Green is the default. The avatar picker shows every preset avatar on the chosen colour. The swatches are one radio group named "Avatar background", and each is labelled, for example "Coral background" |
| About me | Long text | Optional | Up to 1,000 characters, with a live counter. Placeholder "What brought you here, where you are, what you're hoping to find". Shown on the member's profile |

**Screen 7. Connections and notifications**

Defaults on this screen come from the answers on screen 4.

| Field | Type | Required | Default | Options and rules |
|---|---|---|---|---|
| Suggest me to members on my path | Toggle | Optional | On | Off removes the member from peer and mentor suggestions |
| Who can message me | Single choice | Optional | Members I follow | Anyone. Members I follow. No one. Anyone else can send a message request (section 14) |
| I'd like a mentor | Toggle | Optional | On if "A mentor who has been through it" was picked, otherwise off | On adds mentor suggestions |
| Show success stories in my feed | Toggle | Optional | On if "Hope from success stories" was picked, otherwise off | See section 10 |
| Show my diagnosis, stage and path on my profile | Toggle | Optional | Off | Matching still uses them when off |
| Comments and replies on my posts | Toggle | Optional | On | Email, in the daily update |
| New direct messages | Toggle | Optional | On | Email, in the daily update |
| Include follows, levels and matches in my daily update | Toggle | Optional | Off | See section 15 |

The screen says "You can change any of this later. We will never send more than one activity email a day."

Every setting on this screen also lives in Settings. Section 6 is the master list for privacy and connection settings, and section 15 for notifications.

**Screen 8. Your personal start**

The title reads "You're all set, [first name]!" with a short welcome. Below it, everything is picked from the member's answers, and every item shows why it was suggested.

| Block | What it shows | Action |
|---|---|---|
| Groups for you | Up to 5 groups. For example "Matched on endometriosis and IVF" | Join |
| People on your path | Up to 3 members who allow suggestions | Follow |
| Mentors | Up to 3, only when "I'd like a mentor" is on | View profile |
| Read first | Up to 3 Learn articles for the diagnosis and stage | Read or save |
| Ask the Grove Guide | 3 starter questions for the member's situation | Ask |
| Invite your partner | The invite fields from section 7. Hidden for partners who are already linked, and for members who joined through a partner's invite [Updated v1.2] | Send invite or skip |
| Refer a friend [Added v1.2] | Inside the welcome card, under "You've planted your Seed in Fertility Grove." An envelope picture, the title "Refer a friend to start growing your tree", the text "Know someone going through this too? Send them some seeds. When they join with your link, your tree gets 10 Sunlight." and the member's personal invite link (section 10), shown shortened. Shown to every member, partners included | Copy link |

- Refer a friend [Added v1.2]. "Copy link" changes to "Copied" with a check. The hint below changes from "Copy the link, then paste it to a friend." to "Copied. Paste it to a friend to send your seeds.", and screen readers announce it. Referral points and limits are as in section 13: +10 Sunlight once the friend finishes onboarding, up to 10 referrals a month, once per new account.

Finish takes the member to their home, where the same suggestions continue.

**How answers shape the experience**

| Answer | What it changes |
|---|---|
| Journey stage and treatment | Stage groups, the order of Learn articles, peers at the same point |
| Next treatment date | Peers with a date close to the member's |
| Diagnosis | Diagnosis groups, Learn articles shown first, Grove Guide starter questions |
| Path to parenthood | Groups and peers for donor conception or surrogacy |
| Gender and "I am a partner / spouse" | Which community is suggested on screen 5. A suggestion only, the member always chooses |
| Age range and ZIP code | Peer suggestions by age and region |
| I'm looking for | Which blocks come first on screen 8 and on the home screen, and the defaults on screen 7 |
| How I like to connect | Groups first, articles first or people first in suggestions |

**Error messages**

| Screen | When | Message |
|---|---|---|
| 1 | No stage picked | Select at least one option. |
| 1 | Health-data consent is off | To continue, agree to how we use your health answers. |
| 2 | Other is picked and the text is empty | Tell us the diagnosis, or pick another option. |
| 3 | No gender identity picked | Choose a gender identity. |
| 3 | Self-describe picked, text empty | Tell us how you'd like to describe your gender identity. |
| 3 | Self-describe picked for pronouns, text empty | Tell us your pronouns. |
| 3 | ZIP code is not valid | Enter a valid ZIP code. |
| 4 | Nothing picked | Pick at least one thing you're looking for. |
| 5 | No community picked | Choose one community to continue. |
| 6 | First or last name is empty | First and last name are required. |
| 6 | Handle breaks the rules | Handles are 3 to 30 characters. Lowercase letters, numbers and underscores, starting with a letter. |
| 6 | Handle is taken | That handle is taken. Try another one. |
| 6 | Handle is reserved or retired | That handle isn't available. Try another one. |

**Rules**

- Progress is saved after every screen. A member who leaves returns to the next unfinished screen.
- An 8-step progress bar shows where the member is. Back is available on screens 2 to 7.
- Each screen has an illustration and a short line explaining why it is asked and who can see the answer.
- Diagnosis, stage, path, gender, age range, ZIP code and what the member is looking for are private by default. They are used only for matching and personalization unless the member turns on "Show my diagnosis, stage and path on my profile".
- Withdrawing health-data consent in Settings stops matching on health answers and deletes the stored answers from screens 1 and 2: stage, treatment, dates, diagnosis and path. The Grove Guide stops using profile answers. The member can give consent again later and add new answers. The member then gets popular groups and starter articles, as in section 11.
- While consent is off, the health fields on the profile show "Not shared" and are not required. A link lets the member give consent again.
- Every answer can be changed later in profile settings. Changing them refreshes the member's suggestions.
- The option lists are managed by admins, so they can change without a new release.
- Finishing onboarding awards the Seed level and shows a short welcome to how trees grow.
- Partners use the same onboarding. See section 7.

**How onboarding is enforced**

| Screen | Mandatory | Skip button | Optional fields inside it | If skipped or left empty |
|---|---|---|---|---|
| 1. Journey stage | Yes | No | Which treatment, next cycle date | Stage groups still match. No date-based peers |
| 2. Diagnosis and path | No | Yes | All | Diagnosis and path groups are not suggested. Popular groups fill the gap |
| 3. About you | Yes | No | Age range, pronouns | No age-based peer matching. No pronouns shown |
| 4. Looking for | Yes | No | How I like to connect | Suggestions use a balanced mix |
| 5. Community | Yes | No | None |  |
| 6. Your profile | Yes | No | Profile photo or avatar, About me | The member's initial shows on their avatar background [Updated v1.2]. About me stays empty |
| 7. Connections and notifications | No | Yes | All | The defaults in the table, adjusted by screen 4, are saved |
| 8. Personal start | Reached, nothing to fill | No | Joining groups, following people, the partner invite | Onboarding still counts as complete |

**Enforcement rules**

- Onboarding is complete when the member reaches screen 8. Before that, the member cannot open any other part of the app.
- Every sign-in, and every link into the app, opens onboarding at the next unfinished mandatory screen until it is complete. Only Sign out, Help, Terms and Privacy stay reachable.
- Next stays available on every screen. Pressing it with a mandatory field missing shows the error message for that field and keeps the member on the screen.
- Skip appears next to Next only on screens 2 and 7. Skipping moves straight to the next screen without saving the member's answers from it. Skipping screen 7 saves its defaults.
- Members who finished onboarding never see it again. They change their answers in profile settings.
- After onboarding, the home screen shows a "Complete your profile" card listing what was skipped, such as diagnosis, path, photo and About me. It disappears once each item is filled in, or for 30 days when dismissed.
- The "Complete your profile" card, in detail [Added v1.2]:
  - While the member has neither a photo nor a preset avatar, the card shows "Pick a grove avatar" with the first 6 preset avatars, and a "See all 12" link that opens Edit profile on the Dashboard. The number follows the size of the avatar list.
  - One tap saves that avatar at once and shows "Avatar saved. Change it any time on your profile." The avatar choice then leaves the card.
  - The other gaps show as links: "Add a diagnosis", "Add your path to parenthood", "Write a line about you" and "Share your story". Each leaves the card once filled in, and the card disappears when nothing is left.
  - The close button reads "Hide for 30 days". The card comes back after 30 days if anything is still missing, on any device the member signs in on.
- An unconfirmed email does not block onboarding. It only blocks the actions listed in section 4.
- The same rules apply to partners and to members who sign up with Google.

**What changes in the prototype**

| Prototype today | This PRD |
|---|---|
| Starts with name, ZIP, gender and pronouns | Starts with the journey questions. Name and handle move to screen 6 |
| Community chosen with no suggestion | Community suggested from the answers, then confirmed |
| 6 stage options | 10 options, plus which treatment and next cycle date |
| Diagnosis only, says it is never shown on the profile | Adds Tubal factor, Not diagnosed yet, Other and the path question. Copy changes to "not shown unless you choose" |
| 7 gender options, no age question | 11 gender options and an optional age range |
| No question about what the member wants | New screen 4, What are you looking for |
| Real name preselected | Handle preselected, because we expect most members to post under a handle (section 1a) |
| Notifications only, includes donations | Adds connection settings with defaults from screen 4. Donations removed, since fundraising is Phase 3 |
| Welcome message only, 9 screens | Personal start screen with groups, people, mentors, articles and Guide questions. Name, handle, photo and About me on one profile screen. 8 screens |

**Acceptance criteria (FG-ONB-01 to FG-ONB-04)**

1. Given a new member on Screen 1, when they press Next without a stage picked, then they see "Select at least one option." and stay on the screen.
2. Given a new member on Screen 1, when they press Next with the health-data consent toggle off, then they cannot continue to Screen 2.
3. Given a new member on Screen 3, when they leave pronouns empty and press Next, then they move to Screen 4 with no error.
4. Given a new member on Screen 3, when they enter a ZIP code that is not 5 digits or ZIP+4, then they see "Enter a valid ZIP code." and stay on the screen.
5. Given a new member on Screen 6, when they leave first or last name empty, then they see "First and last name are required." and stay on the screen.
6. Given a new member on Screen 6, when they enter a handle that is already taken, then they see "That handle is taken. Try another one."
7. Given a new member on Screen 6, when the screen opens, then "Show my handle instead" is preselected.
8. Given a member who has not reached Screen 8, when they sign in or open any link into the app, then onboarding opens at the next unfinished mandatory screen and only Sign out, Help, Terms and Privacy are reachable.
9. Given a member on Screen 2 or Screen 7, when they press Skip, then they move to the next screen and none of the member's answers from the skipped screen are saved.
10. Given a member reaches Screen 8, when the screen loads, then onboarding counts as complete, the Seed level is awarded, and every suggested item shows why it was suggested.
11. Given a new member who picked Non-binary, when Screen 5 opens, then both communities show equally and neither is preselected.
12. Given a new member who picked Female and not "I am a partner / spouse", when Screen 5 opens, then the Women's Community is preselected with a line explaining why.
13. Given a member who skipped diagnosis and About me, when they reach the home screen, then a "Complete your profile" card lists both, and each item disappears once it is filled in.
14. Given a member who dismissed the "Complete your profile" card, when they return within 30 days, then the card does not show.
15. Given a new member on Screen 6, when they enter a handle on the reserved list, then they see "That handle isn't available. Try another one."
16. Given a partner who is already linked reaches Screen 8, when it loads, then Invite your partner is hidden and Refer a friend shows with their own personal invite link. [Added v1.2]
17. Given a member on Screen 8, when they tap "Copy link", then the link is copied, the button shows "Copied", and the hint "Copied. Paste it to a friend to send your seeds." is announced to screen readers. [Added v1.2]
18. Given a new member on Screen 6 who has not touched the colour swatches, when they finish onboarding, then their avatar background is Green. [Added v1.2]
19. Given a member who picked Coral and no photo or preset avatar, when another member sees them in a post, comment or message, then they see the member's initial in a darker coral on a pale coral background. [Added v1.2]
20. Given a member with no photo and no preset avatar, when they tap one of the avatars in the "Complete your profile" card, then it is saved at once, "Avatar saved. Change it any time on your profile." shows, and the avatar choice leaves the card. [Added v1.2]
21. Given a member who tapped "Hide for 30 days" with My story still empty, when they return after 30 days, then the card shows again with "Share your story". [Added v1.2]

## 6. Profile and privacy settings

Every member has a public profile that shows only what they choose, and a private settings area that holds everything else. By default, other members see the handle, avatar, tree level, badges, bio and public posts. Nothing medical is shown unless the member turns it on.

**User stories**

- As a member, I want to control exactly what others see on my profile so that I share only what I am comfortable with.
- As a member, I want to tell my story in my own words so that people on the same path can relate to me.
- As a member, I want to see my tree level and points so that I know how I am growing in the community.
- As a member, I want to switch between my real name and my handle so that I can change my mind as I get comfortable.
- As a member, I want to visit another member's profile so that I can decide whether to follow or message them.

**What others see on a profile**

| Element | Shown to others | Notes |
|---|---|---|
| Handle or real name | Always | Follows the member's display choice. Real name means first name and last initial |
| Pronouns | When given | Shown next to the name, for example "Annie M. · she/her" |
| Avatar or photo | Always | A preset avatar shows on the member's avatar background colour. With no photo and no preset avatar, their initial shows in a darker shade of that colour [Updated v1.2] |
| Avatar background [Added v1.2] | Always, with the avatar | Shown wherever the avatar shows. It has no visibility setting of its own |
| Tree level and points | Always | For example "Blossom Tree · 812 Sunlight" |
| Badges | Always | Mentor or Founding mentor, and Verified clinician. Partner only when both partners turn it on. The Fertility Grove team badge belongs only to the Support account |
| About me | When filled in |  |
| My story | When filled in |  |
| Diagnosis, stage and path | Only when the member turns it on | Off by default |
| Followers and following counts | Always | The lists themselves are visible only to the member |
| Public posts and comments | Always | Posts in groups the viewer cannot read are not shown, not even their title. Never listed for the member's linked partner (section 7) |
| Linked partner | Only when both turn it on | Off by default. Shows a Partner badge only, never the partner's name, handle or a link to them |
| Follow, Message and Request mentor buttons | Depending on settings | Message follows the member's "Who can message me" choice |

**Profile fields the member can edit**

| Field | Type | Required | Rules |
|---|---|---|---|
| Handle | Text | Required | Same rules as onboarding. Can be changed once every 30 days. The old handle is held for the member for 14 days so they can switch back. Switching back to it within those 14 days is allowed even inside the 30 days, and does not restart them. After that, anyone can take it |
| First name and last name | Text | Required | Only the first name and last initial are shown, and only when real name is on |
| Show real name or handle | Single choice | Required |  |
| Profile picture | Image or preset avatar | Optional | Location data removed from uploaded photos |
| Avatar background [Added v1.2] | Single choice | Required, with a default | As on onboarding screen 6. Edited under the avatar picker in Edit profile |
| About me | Long text | Optional | Up to 1,000 characters. First filled in on onboarding screen 6 |
| My story | Long text | Optional | Up to 2,000 characters |
| Journey stage, diagnosis, path | As in onboarding | As in onboarding | Changing them refreshes matches. They show "Not shared" and are not required while health-data consent is off |
| Gender, age range, ZIP, pronouns | As in onboarding | Gender and ZIP required. Age range and pronouns optional | Gender, age range and ZIP are never shown. Pronouns show next to the name when given |
| Show my diagnosis, stage and path on my profile | Toggle | Optional | Off by default |

**Privacy and account settings**

| Setting | Type | Default | Rules |
|---|---|---|---|
| Who can message me | Single choice | Members I follow | Anyone. Members I follow. No one. Anyone else can send a message request (section 14) |
| Suggest me to members on my path | Toggle | On | Off removes the member from peer and mentor suggestions |
| Show my linked partner | Toggle | Off | Shown only when both partners turn it on. Even then, posts and comments are not listed for the partner. The profile shows only a Partner badge, never the partner's name, handle or a link to them |
| I'd like a mentor | Toggle | From onboarding | On adds mentor suggestions. See section 11 |
| Show success stories in my feed | Toggle | From onboarding | See section 10 |
| Health-data consent | Toggle | On, given in onboarding | Off stops matching on health answers. See section 5 |
| Mentoring | Toggle | Off | Available from Blossom Tree. See section 12 |
| Notification preferences | Toggles per event | See section 15 |  |
| Blocked members | List | Empty | Unblock from here |
| Email and password | Email, password |  | Changing the email requires confirming the new address |
| Sign out of all devices | Button |  | Signs out every other device and browser at once |
| Download my data | Button |  | Prepares a file with the member's data in JSON and readable HTML. It includes the profile, onboarding answers, settings, posts, comments, votes, saved items, direct messages, mentoring conversations, Grove Guide chats, appointment question lists, family space items they created, Past family notes, the people they follow, thank-you notes they received, their consent records, Sunlight history and purchases. An email says it is ready, with no data in it. The member signs in again to download it. The link works for 7 days |
| Delete my account | Button |  | See section 4 |

**The Dashboard, the member's own view** [Added v1.2]

The member's own profile is called the Dashboard. It holds everything this section and section 13 put on the member's own profile. It adds views of the member's posts, replies, groups, saved items and mentoring. Only the member sees it. Other members see the profile as set out in "What others see on a profile", and the member checks that view with "How others see me".

*Where members find it*

- The second item in the desktop sidebar, right under Feed.
- "Dashboard" in the account menu at the foot of the sidebar.
- "Dashboard", the fourth tab of the phone tab bar.
- Tapping their own name or avatar anywhere, for example on post cards or mentions. Tapping another member's name opens that member's profile.
- Notifications about levels and Sunlight. Sunlight notifications open the Sunlight history.
- Old links to the member's profile open the Dashboard and keep what they asked for, so a link to edit the profile opens the editor.

*Header, on every tab*

- The avatar, the title "Dashboard", the display name, then either "@handle" when the member shows their real name, or "First L. (only you see your name)" when they show their handle. Pronouns follow when set.
- "How others see me", which changes to "Back to my view" while on, and "Edit profile".

*Tabs*

| Tab | Label | Shows |
|---|---|---|
| Overview | "Overview" | The default tab |
| Posts | "Posts N" | N is the member's own posts plus their own success stories |
| Replies | "Replies N" | N is the member's own comments and replies |
| Groups | "Groups N" | N is the groups they joined |
| Saved | "Saved N" | N is saved posts, stories and articles |

- The open tab is part of the page address, so links and Back return to it. An address naming an unknown tab opens Overview.
- "Edit profile" always opens on Overview. Turning on "How others see me" from another tab switches to Overview.

*Overview tab, in this order*

1. The edit form while editing, or the "How others see me" preview while it is on. Both as set out in this section.
2. The tree. Level, Sunlight, progress to the next level and the five levels (section 13).
3. Recent activity. The member's 4 most recent items across their own posts and replies, newest first.
   - A post shows "You posted in {group} · {time} ago", the post title linking to the post, and "{n} votes · {n} replies". The vote count is the score.
   - A reply shows "You replied in {group} · {time} ago", the post title linking to the post's comments, and the reply text cut to 2 lines.
   - Below the list, "All your posts" and "All your replies" switch to those tabs.
4. About me, My story, and the journey answers with their visibility note. Hidden while editing or previewing.
5. Invite a friend, with the personal invite link (sections 10 and 13). Hidden while editing or previewing.
6. Sunlight history, with "How Sunlight works" (section 13).

*Posts tab*

- All of the member's own posts as standard post cards, newest first. Posts hidden while reviewing are included, and only the author sees them (section 19). Deleted posts are not shown.
- Posts a moderator removed stay listed for the author only, marked "Removed by a moderator · Only you can see this", with Appeal (section 19) and Delete (section 9). [Added v1.2]
- Below them, "Your stories". The member's own success stories, each with its type, its title linking to Success stories, and its time. Hidden when there are none.

*Replies tab*

- Every comment and reply the member wrote, newest first, including those hidden while reviewing. Deleted comments are not shown. Comments a moderator removed stay listed for the author only, marked "Removed by a moderator · Only you can see this", with Appeal and Delete, as on the Posts tab. [Updated v1.2]
- Each one shows "In {group} · {time} ago", adding "· Only you can see this for now" while it is hidden while reviewing. Then "On "{post title}"" linking to the post's comments, the full reply text and "{n} votes", which is the score.

*Groups tab*

- One row per joined group. Its cover and name link to the group. Then "{members} members · {n} posts this week", adding "· {n} posts from you" when the member has posted there and "· Muted" when they muted it.
- A Post button on each row opens Write a post with that group already picked. On phones it shows as an icon only.
- Below the rows, "Find more groups" opens Groups.

*Saved tab*

- A short list of saved posts, stories and articles. Each row shows its kind, "Post", "Story" or "Article", its title as a link, and a detail line. The group name for a post, the story type for a story, "Learn library" for an article.
- Below the list, "Manage saved" opens the Saved page, where items are removed.

*Side column, on every tab*

- Followers and Following, with Remove and Unfollow (section 10). The lists stay visible only to the member.
- Mentoring. Up to 4 of the member's mentoring requests and connections, as mentee and as mentor. Each shows the other member's name and avatar, "Your mentor" or "You mentor them", and its status. "Open mentors" opens Find a mentor. Hidden when the member has no request either way. With more than 4, open ones come first (Waiting for a reply, Connected), then finished ones (Not available right now, Request expired, Mentoring ended). Each group is newest first. [Updated v1.2]

  | Status shown | Mentor request or connection (section 23) |
  |---|---|
  | Waiting for a reply | Request Waiting |
  | Connected | Request Accepted, connection Active |
  | Not available right now | Request Declined |
  | Request expired | Request Expired |
  | Mentoring ended | Request Ended, or connection Ended |

- Your partner. Invite a partner, the pending invite with resend and cancel, or the linked partner with "Open family space" (section 7).

*Empty states*

| Where | Title | Text | Button |
|---|---|---|---|
| Recent activity | Nothing yet. | Your posts and replies will collect here. | Write a post |
| Posts tab, no posts or stories | You haven't posted yet. | Ask a question or share where you are. Your posts collect here. | Write a post |
| Replies tab | No replies yet. | Replies you leave on other members' posts collect here. | Go to your feed |
| Groups tab | You haven't joined a group yet. | Groups are where posts live. Join one that matches where you are. | Browse groups |
| Saved tab | Nothing saved yet. | Save posts, stories and articles to find them again before your next appointment. |  |

**The Saved page** [Added v1.2]

One private page for everything the member saved. Posts (section 9), success stories (section 10) and Learn articles (section 16). It opens from "Saved" in the "Yours" part of the desktop sidebar, from the phone menu, and from "Manage saved" on the Dashboard's Saved tab.

- The title is "Saved". The subtitle reads "{n} saved items to bring to your next appointment.", or "Keep posts, stories and articles here to find again before your next appointment." when nothing is saved.
- Tabs: All, Posts, Stories, Articles. Each type tab shows its count when it is above zero. All lists articles first, then posts, then stories.
- An article row shows "Article · N min read", the title, a one-line summary on wider screens, and a bookmark to remove it.
- A post row is the standard post card, with its own bookmark.
- A story row shows its type, the author, the title linking to Success stories, a 2-line excerpt and a bookmark to remove it.
- Removing an item folds it away, with the message "Removed from saved". Items already on the page stay where they are, and newly saved ones slide in.
- "Only you can see what you save." shows on the page.
- Worth saving. While fewer than 4 items are saved, up to 3 published Learn articles the member has not saved are suggested, under "Clinician-reviewed, and matched to your journey where we can." Articles for the member's diagnosis come first, only while health-data consent is on (section 5). Each has a one-tap bookmark, with the message "Saved".
- Before your appointment. "Make a question list" opens appointment questions (section 17). Once the member has lists, it reads "Your question lists · N lists ready to print or share". "Share with your partner" opens the family space (section 7a), and reads "Share with {partner}" once a partner is linked.

| When | Title | Text | Button |
|---|---|---|---|
| Nothing saved | Nothing saved yet. | Tap the bookmark on any post, story or article and it waits for you here. | Browse Learn |
| A type tab with nothing saved | No saved {posts, stories or articles} yet. | Tap the bookmark on one and it shows up here. |  |

**Rules**

- Display identity is the same everywhere. A member using a handle never shows a real name in any post, comment, message, notification or email to other members. The one exception is their linked partner, who sees their first name in partner and family space messages only (section 7).
- "Real name" always means first name and last initial, for example "Annie M.". The full last name is never shown to other members.
- The member's own view of their profile is the Dashboard, and it shows a "How others see me" preview. [Updated v1.2]
- No one but the member can open their Dashboard. Counts, held posts and replies, saved items and mentoring statuses on it are never shown to anyone else. [Added v1.2]
- A blocked member cannot open the blocker's profile. They see "This profile isn't available."
- Profiles of suspended or deleted members show "This profile isn't available."
- Every profile has Report and Block in its menu (section 19).

**Error messages**

| Form | When | Message |
|---|---|---|
| Profile | Handle changed less than 30 days ago | You can change your handle again on [date]. |
| Profile | Handle is taken | That handle is taken. Try another one. |
| Profile | Handle is reserved or retired | That handle isn't available. Try another one. |

**Acceptance criteria (FG-PROF-01 to FG-PROF-04)**

1. Given a member who chose "Show my real name", when another member views their post, comment, message or profile, then they see the first name and last initial, for example "Annie M.", and never the full last name.
2. Given a member who chose "Show my handle instead", when another member sees any post, comment, message, notification or email about them, then no part of their real name appears, except to their linked partner in partner and family space messages.
3. Given a member with pronouns set, when another member views their profile, posts or comments, then the pronouns show next to the name, for example "Annie M. · she/her".
4. Given any member, when another member views their profile, then age range, ZIP code and gender are never shown.
5. Given a member with "Show my diagnosis, stage and path on my profile" off, when another member views their profile, then no diagnosis, stage or path is shown.
6. Given a viewer who cannot read a group, when they view a member's profile, then posts from that group are not listed, titles included.
7. Given a member changed their handle less than 30 days ago, when they try to change it again, then the change is blocked.
8. Given a member opens Settings, when they look at privacy settings, then "I'd like a mentor" and "Show success stories in my feed" are there and can be changed.
9. Given a member presses Download my data, when the file is ready, then they get an email with no medical detail, must sign in again to download, and the link stops working after 7 days.
10. Given a member blocked another member, when the blocked member opens the blocker's profile, then they see "This profile isn't available."
11. Given a member who withdrew health-data consent, when they open their profile settings, then stage, diagnosis and path show "Not shared", are not required, and a link lets them give consent again.
12. Given a member opens their own profile, when they tap "How others see me", then they see the profile exactly as another member would, with private fields hidden.
13. Given a member writing My story, when they reach 2,000 characters, then typing stops, and once saved the story shows on their profile to other members.
14. Given a member who changed their handle 5 days ago, when they switch back to their previous handle, then the change is allowed and the 30 days are not restarted.
15. Given a member opens an old link to edit their profile, when it loads, then the Dashboard opens on Overview with the edit form open. [Added v1.2]
16. Given a member on the Replies tab of their Dashboard, when they turn on "How others see me", then the Dashboard switches to Overview and shows the preview. [Added v1.2]
17. Given a member with 3 posts and 3 replies, when they open Overview, then Recent activity shows the 4 newest of the six, newest first. [Added v1.2]
18. Given a member whose post is hidden while reviewing, when they open the Posts tab, then the post is listed for them, and no other member sees it anywhere. [Added v1.2]
19. Given a member who deleted a comment, when they open the Replies tab, then that comment is not listed. [Added v1.2]
20. Given a member with no mentor requests sent or received, when they open their Dashboard, then the Mentoring card is not shown. [Added v1.2]
21. Given a member whose mentor request expired, when they view the Mentoring card, then that request shows "Request expired". [Added v1.2]
22. Given a member whose post or comment a moderator removed, when they open the Posts or Replies tab, then it is listed for them marked "Removed by a moderator · Only you can see this", with Appeal and Delete, and no other member sees it. [Added v1.2]
23. Given a member with 2 connected mentors, 1 waiting request and 3 expired requests, when they view the Mentoring card, then it shows the 2 connected and the waiting one, plus the newest expired one. [Added v1.2]

## 7. Partner accounts

A partner has their own account, linked to the member who invited them. Linking alone shares nothing. Partners choose what to share in the family space, section 7a. Each person's messages, AI chats, settings and private profile answers stay their own. In the MVP, partners use the community, groups, Learn, messages and the Grove Guide. A dedicated partner space follows in Phase 2.

**User stories**

- As a member, I want to invite my partner by email so that we can go through this together.
- As a partner, I want my own private account so that I can ask questions I might not ask in front of my partner.
- As a partner, I want to find other partners so that I have someone who understands my side of it.
- As a member or partner, I want to unlink our accounts at any time so that I stay in control.

![image9.png](prd-images/image9.png)

partner invite and linking · 2 decisions

An existing member accepts by signing in. A new partner signs up first. Either way, the link is made only when the partner accepts.

1. The member sends an invite from onboarding screen 8 or from their Dashboard. [Updated v1.2]
2. The invited person opens the invite page and sees the member's first name and personal note.
3. If it is not accepted within 14 days, it expires and the member is told. They can resend it.
4. If they are already linked to someone else, they cannot accept, and the member is told.
5. If the invited person already has an account, they sign in and accept.
6. If not, they sign up and go through the same 8 onboarding screens, with some answers preset.
7. The accounts are linked and both people are notified.

**Invite fields**

| Field | Type | Required | Rules |
|---|---|---|---|
| Partner's email | Email | Required | Cannot be the member's own email |
| Personal note | Long text | Optional | Up to 300 characters. Shown on the invite page once the link is opened, never in the email. Checked for crisis words (section 19) |

**Partner onboarding**

Partners go through the same 8 onboarding screens as members, described in section 5. When a partner comes from an invite, two answers are preselected and can be changed.

| Screen | Preselected for invited partners | Rules |
|---|---|---|
| 1. Journey stage | I am a partner / spouse | The partner can add other stages. Nothing is copied from the member's own answers |
| 2. Diagnosis | Nothing | A partner with their own diagnosis, such as male factor, adds it here |
| 4. Looking for | Support as a partner, or for my partner | The partner can change it |
| 5. Community | Partners & Men's Community suggested | The partner can choose the Women's Community instead |

The final screen suggests groups for partners and groups that match the stage they chose. The partner invite card is hidden, since they are already linked.

**Rules**

- A member can have one linked partner at a time in the MVP.
- If the invited person is already linked to someone else, they cannot accept. They see "You're already linked to a partner. Unlink first to accept this invite." The member who sent it is told "Your invite couldn't be accepted because this person is already linked to a partner."
- An invite link works once and expires after 14 days. The member can resend or cancel it from their Dashboard while it is pending. [Updated v1.2] Resends are limited as set in section 21.
- The invite link opens an invite page with the member's first name, their personal note and Accept invite. Search engines are told not to list it. When one invite is accepted, the member's other pending invites are cancelled.
- If the invited email already has an account, that person signs in and accepts the link instead of signing up.
- Someone who picked "I am a partner / spouse" in onboarding without an invite can link later. They send an invite to their partner, or accept one.
- Either person can unlink at any time from settings. The other person is notified. Nothing else changes in either account.
- Either person can block the other. Blocking unlinks the accounts at once and ends sharing, as an unlink does. The blocked person is told "Your partner blocked you. Your accounts are no longer linked." This is an accepted risk (section 25).
- Linking never shows either person's handle or profile to the other. In the family space, partners see each other by first name. If one finds the other's profile some other way, its list of posts and comments is hidden from them. Posts in groups both have joined still show in the group like any post. A "Partner" badge shows on profiles only when both turn on "Show my linked partner". It never names or links to the other partner.
- Partner and family space messages, including the invite, linking, unlinking and shares, name the other person by first name only, never by handle. Everything else, such as replies, follows and direct messages in the community, shows the display identity as for any member, so linking never reveals which handle is a partner's.
- A partner earns Sunlight and grows a tree like any member, and can become a mentor.

**Error messages**

| Form | When | Message |
|---|---|---|
| Invite | Partner's email is the member's own | You can't invite your own email. |
| Invite | The member already has a linked partner | You already have a linked partner. Unlink first to invite someone else. |
| Invite | The link is older than 14 days, used or cancelled | This invite has expired. Ask your partner to send a new one. |
| Invite | The invited person is already linked | You're already linked to a partner. Unlink first to accept this invite. |
| Invite | Resend limit reached | You can resend this invite once a day, up to 3 times. |

**Acceptance criteria (FG-PART-01)**

1. Given a member, when they send a partner invite to their own email, then the invite is not sent.
2. Given a member already has a linked partner, when they try to send another partner invite, then the invite is not sent.
3. Given a partner invite, when it is opened more than 14 days after sending or after it was used, then it does not work and the member is told the invite expired.
4. Given an invited person who already has an account, when they open the invite, then they sign in and accept, and no new account is created.
5. Given an invited person without an account, when they sign up from the invite, then onboarding has "I am a partner / spouse" and Partners & Men's Community preselected and both can be changed.
6. Given a partner accepts an invite, when the link is made, then both accounts are linked, both are notified, and the partner invite card is hidden on the partner's Screen 8.
7. Given two linked partners, when either one unlinks from settings, then the other is notified and nothing else changes in either account.
8. Given two linked partners, when only one turns on "Show my linked partner", then no Partner badge shows on either profile.
9. Given two linked partners, when one upvotes the other's post, then the score changes but no Sunlight is earned.
10. Given two linked partners, when one opens the other's profile, then no posts or comments are listed and the link never showed them the other's handle.
11. Given an invited person who is already linked to someone else, when they open the invite, then they cannot accept it, and the member who sent it is told it couldn't be accepted.
12. Given two linked partners, when one blocks the other, then the accounts are unlinked at once, sharing ends and the blocked person is told they were blocked.
13. Given a member who uses a handle sends a partner invite, when the invite email arrives, then it names the member by first name only and never shows the handle.
14. Given a member's linked partner who uses a handle replies to the member's post in a group, when the member gets the notification, then it shows the partner's handle like any member's, never their first name.
15. Given a partner invite that was resent 3 times, when the member tries to resend it again, then it is not sent.
16. Given a member who adds a personal note to a partner invite, when the invite email is sent, then the email does not contain the note, and the note shows on the invite page once the link is opened.
17. Given two linked partners who both turn on "Show my linked partner", when any member views either profile, then a Partner badge shows with no name, handle or link to the other partner.

## 7a. Family space and sharing

The family space is a shared area for two linked partners. Each person keeps their own private account, and every item stays private until its owner shares it. Shared items are either View only or Edit. Partner sharing is in the MVP. Inviting the family's doctor, nurse or therapist (care providers) comes in Phase 2, after legal review.

Partner sharing goes beyond the approved scope sheet. It is built only once Fertility Grove confirms it is in the MVP (section 27). Until then, linking partners still works (section 7) and nothing is shared.

**User stories**

- As a member, I want to share my appointment questions with my partner so that we prepare for visits together.
- As a partner, I want to add my own questions to our list so that my concerns are covered too.
- As a member, I want to choose View or Edit for each thing I share so that I stay in control.
- As a member, I want to see who viewed or changed what so that I always know who has access.
- As a member, I want to remove anyone's access at any time so that sharing never feels permanent.

![image10.png](prd-images/image10.png)

family space · 2 accounts, shared items

Each person shares items into the family space with View or Edit access.

**What can be shared**

| Item | Created by | Share with partner | Share with care provider (Phase 2) |
|---|---|---|---|
| Appointment question lists | Either person | View or Edit | View or Edit |
| Journey summary. Stage, diagnosis, path and treatment dates | Each person, for themselves | View | View |
| Saved Learn articles | Either person | View | View |
| Single Grove Guide answers the member picks | Either person | View | View |
| Family notes | Either person, inside the family space | Edit, always | View or Edit |

Never shareable are direct messages, mentoring conversations, full Grove Guide chat history, account settings and AI credits.

**Share an item fields**

| Field | Type | Required | Options and rules |
|---|---|---|---|
| Share with | Multiple choice | Required | My partner. Care providers come in Phase 2 |
| Access | Single choice | Required | View. Edit. Edit is offered only for items in the table that allow it |
| Note | Text | Optional | Up to 200 characters. Shown with the shared item |

**Family note fields**

| Field | Type | Required | Options and rules |
|---|---|---|---|
| Title | Text | Required | Up to 120 characters |
| Note | Long text | Required | Up to 5,000 characters. Bold, italic, lists and links |

**Phase 2, not in the MVP. Invite a care provider fields**

| Field | Type | Required | Options and rules |
|---|---|---|---|
| Full name | Text | Required | Up to 100 characters |
| Email | Email | Required | The invite goes here |
| Role | Single choice | Required | Doctor. Nurse or coordinator. Therapist or counselor. Other practitioner |
| Clinic or practice | Text | Optional | Up to 100 characters |
| What they can see | Multiple choice | Required, at least 1 | Items already shared in the family space |
| Access | Single choice | Required | View or Edit, per item where Edit is allowed |
| Access ends | Date | Optional | Default 6 months from today. Can be extended |

**Phase 2, not in the MVP. What a care provider sees**

- An invite email with no medical details, only who invited them and a link.
- A short sign-up. Full name, role, email, password and agreement to the terms for care providers.
- A simple page with only the items shared with them, for each family that invited them.
- No access to the community, groups, messages, mentors or the Grove Guide.

**Rules**

- A family space is created when two partners link.
- A family space holds up to 2 members. Up to 5 care providers come in Phase 2.
- Only the person who created an item can change its sharing or stop sharing it. Family notes belong to both partners.
- Every change by someone other than the owner shows who made it and when. The owner can restore an earlier version.
- If both partners edit the same item at the same time, the last save wins. The earlier version can be restored from the item's history.
- Saving a family note without a title shows "Add a title to your note." Without any text, it shows "Write something in your note."
- Phase 2. Either partner can remove a care provider. Access ends immediately.
- Phase 2. Care provider access ends on its end date. Both partners are notified 7 days before.
- Unlinking partners ends partner sharing immediately. Each keeps their own items, and both keep a copy of the family notes. The copies move to a private, read-only Past family notes area that only that person sees. They can read, copy or delete them. Past family notes never join a new family space.
- Account deletion ends the link the same way, once the 14 days are over. See section 4.
- Both partners see an activity list with every view, edit, share and access change, newest first.
- Phase 2. Invited care providers are not verified clinicians. They get no badge and no community account.
- Phase 2. Sharing with care providers needs legal review before launch, as part of the privacy and HIPAA questions Fertility Grove's counsel covers.

**Acceptance criteria (FG-PART-02 and FG-PART-03)**

1. Given two members link as partners, when the link is made, then a family space is created for the two of them.
2. Given a member creates an appointment question list, when they have not shared it, then their partner cannot see it.
3. Given a member shares an appointment question list with View access, when the partner opens it, then the partner can read it but cannot change it.
4. Given an item shared with Edit access, when the partner changes it, then the owner sees who changed it and when, and can restore an earlier version.
5. Given a partner who did not create an item, when they open its sharing settings, then they cannot change or stop the sharing.
6. Given a member opens the family space, when they look for something to share, then direct messages, mentoring conversations, full Grove Guide chat history, account settings and AI credits cannot be shared.
7. Given any view, edit, share or access change in the family space, when either partner opens the activity list, then the change is shown with the newest first.
8. Given two linked partners, when they unlink, then partner sharing ends at once, each keeps their own items and both keep a copy of the family notes in Past family notes.
9. Given a member's account deletion completes, when the partner opens the family space, then they keep their own copy of the family notes, items the deleted member shared one way are gone, and the notice says the partner left without saying "deleted".
10. Given both partners edit the same family note at the same time, when both save, then the later save is kept and the earlier version can be restored from history.
11. Given two partners who unlinked, when either one links with a new partner, then their past family notes stay in their private Past family notes area and the new partner cannot see them.

## 8. Communities and groups

Fertility Grove has two communities, the Women's Community and the Partners & Men's Community. Each member belongs to one, chosen in onboarding, and can switch in settings. Content and tools are the same in both. Inside them, the community is organized into groups that admins create, and a group is suggested in one community or both. Any member can join any group instantly, whatever their community, without approval. A member's home feed shows posts from the groups they joined, plus up to 3 posts a day (section 11) from matched groups they have not joined yet. Members-only groups are never included.

**Group types in the MVP**

| Type | Examples | Matched on |
|---|---|---|
| Diagnosis group | Endometriosis. PCOS. Diminished ovarian reserve. Male factor. Recurrent loss | Diagnosis |
| Stage group | Waiting on a diagnosis. In IUI. In IVF. Egg freezing. Pregnant after infertility | Journey stage |
| Topic group | Partners. Donor conception. Taking a break. Work and treatment | Admin-chosen tags |
| Success stories | One space for the whole community | Not matched. See section 10 |

Cycle groups for a specific egg freezing or embryo transfer month come in Phase 2.

**User stories**

- As a member, I want to browse and search all groups so that I can find spaces beyond my matches.
- As a member, I want to read a group before joining so that I know it is right for me.
- As a member, I want to join or leave a group in one tap so that my feed stays relevant.
- As a member, I want to mute a group without leaving it so that I can step back during a hard week.
- As a member, I want to sort my feed by newest or top posts so that I can catch up quickly.

**Flow. Joining a group**

1. The member opens Groups from the main menu, or taps a matched group on their home feed.
2. The group list shows matched groups first, each with the reason it matched, then all other groups. A search box filters by name and description.
3. The member opens a group page. It shows the name, description, rules, member count, posts this week and the group's posts, which the member can sort and filter (Group page, below). [Updated v1.2]
4. The member taps Join. The button turns into Joined, and the group's posts now appear in their home feed.
5. From the Joined menu, the member can mute the group or leave it.

**Home feed**

| Control | Type | Options and rules |
|---|---|---|
| Sort | Single choice | Newest. Top this week. Most discussed. Newest is the default. Top this week shows the highest-scoring posts from the last 7 days. Most discussed shows the posts with the most comments in the last 7 days |
| Filter by group | Multiple choice | Groups the member joined |
| Filter by post type | Multiple choice | The post types in section 9 |

**Group page** [Added v1.2]

Shown above the group's posts when the member can read the group.

| Control | Type | Options and rules |
|---|---|---|
| Sort | Single choice | Newest. Top this week. Most discussed. Newest is the default. Same definitions as the home feed |
| Filter by post type | Multiple choice | The five post types in section 9. Shown whenever the group has at least one post the member can see |
| Filter by tag | Multiple choice | Only the topic tags used on this group's posts, most used first, then alphabetical. Shown only when the group's posts use at least 2 different tags |

- Choices within one filter combine with OR, so a post matches any picked type or any picked tag. The two filters combine with AND, so a post shows only if it matches both.
- The count next to the sort, "N posts", follows the current sort and filters.
- While any filter is on, "Clear filters" shows next to the count and resets both filters. It leaves the sort as it is.
- Sort and filters are not saved and are not part of the page address. Leaving or reloading the page resets them.
- A picked tag that no longer appears on the group's posts is ignored.

| When | What it shows |
|---|---|
| No posts match, sorted by Newest | "No posts match those filters." Button "Clear filters" |
| No posts match, sorted by Top this week or Most discussed | "No posts match those filters this week." Button "Clear filters" |
| The group has no posts at all | "No posts yet. Start the conversation." The filters are hidden |

**From the library, on a group page** [Added v1.2]

At the end of the group page's side column, when the member can read the group.

- The heading "From the library", with a link to Learn home. The link reads "All articles" when the group has reading links, and "Browse clinician-reviewed articles" when it has none.
- Up to 3 reading links per group. Each opens one section of a Learn article (section 16) and shows the article's cover, a short label for the section and the article title. For example "How endometriosis can affect fertility", "Common treatment paths" or "Questions to bring to your doctor".
- A link shows only while its article is published and still has that section, so a link never leads to a missing page or section.
- Admins pick each group's links in the group's Reading links field (Group fields, below). They show in the order the admin set. [Updated v1.2]

**Members shown on a group page** [Added v1.2]

In the group page header, beside "{type} group · N members · N posts this week".

- Up to 5 small overlapping member avatars. They are decoration only. They are not links, and screen readers skip them.
- The viewer is never shown. [Updated v1.2]
- Never shown: a member whose profile isn't available (suspended, or deleting their account), and the Fertility Grove Support account.
- Only members who have posted in the group are shown, most recent poster first. Joining a diagnosis or stage group says something about a member's health, so membership alone never puts anyone here. Their posts in the group are already visible to the viewer. [Updated v1.2]
- Blocks count both ways. A member the viewer blocked, or who blocked the viewer, is never shown. [Added v1.2]
- In a Members-only group the viewer has not joined, no avatars are shown. [Added v1.2]
- With fewer than 5 such members, fewer avatars show. With none, none show. [Added v1.2]

**Admin user stories**

- As an admin, I want to edit a community's name and description and decide who it is suggested to so that new members land in the right space.
- As an admin, I want to preview a community as members see it in onboarding so that the name and description read well before it goes live.
- As an admin, I want to create groups inside a community and tag what they match on so that matching sends the right people to them.
- As an admin, I want to archive a group safely so that its posts stay readable.

**Flow. Admin edits a community**

1. The admin opens Communities in the admin panel and opens one of the two communities.
2. They edit the community fields below and preview the card as it appears on onboarding screen 5.
3. Saved changes appear right away on onboarding screen 5 for new members, and in settings for existing members who want to switch.
4. The admin adds groups to it from Groups.

**Flow. Admin creates a group**

1. The admin opens Groups and taps New group.
2. They fill in the group fields below, including which community it belongs to and the matching tags.
3. They save it as Draft or Active. An active group appears in the group list, in search and in matching right away.

**Community fields, set by admins**

| Field | Type | Required | Rules |
|---|---|---|---|
| Name | Text | Required | Up to 60 characters. Unique |
| Description | Long text | Required | Up to 200 characters. Shown on onboarding screen 5 and in settings |
| Suggested for | Multiple choice | Required, at least 1 | Gender identities and journey stages that make onboarding suggest this community. At launch, Female and Transgender female for the Women's Community, and Male, Transgender male and "I am a partner / spouse" for the Partners & Men's Community. Other or mixed answers suggest neither (section 5) |
| Extra guidelines | Long text | Optional | Up to 1,000 characters. Shown with the main community guidelines inside this community |
| Cover image | Image | Optional |  |
| Order | Number | Required | Position on onboarding screen 5 |

**Group fields, set by admins**

| Field | Type | Required | Rules |
|---|---|---|---|
| Name | Text | Required | Up to 60 characters. Unique |
| Description | Long text | Required | Up to 300 characters |
| Group type | Single choice | Required | Diagnosis. Stage. Topic |
| Matching tags | Multiple choice | Required | Diagnoses, stages or paths this group is matched on |
| Who can read | Single choice | Required | Any member, or Members-only. Any member is the default. A Members-only group says on its page and when posting: "Any member can join this group and read posts." |
| Visible to guests [Added v1.2] | Toggle | Optional | Off by default. On lets guests browse this group's page and the posts whose authors turned on Show to visitors (section 10, Guest browsing). Cannot be on while Who can read is Members-only. Turning it off hides those posts from guests at once |
| Group rules | Long text | Optional | Up to 1,000 characters. Shown on the group page and when posting. The community guidelines always apply too |
| Cover image | Image | Optional |  |
| Status | Single choice | Required | Draft, active or archived. A draft is visible only to admins. An archived group is read only |
| Community | Single choice | Required | Women's Community. Partners & Men's Community. Both. Where the group is suggested. Any member can join it either way |
| Reading links [Added v1.2] | List | Optional | Up to 3, in order. Each is a published Learn article, one section of it, and a short label up to 60 characters, for example "Questions to bring to your doctor". Shown as "From the library" on the group page |

**Rules**

- The MVP has exactly two communities. Admins can edit their name, description, who they are suggested to and cover image, but cannot add or archive a community. Only admins create, edit and archive groups. Members cannot create either.
- Joining is instant. A member can be in any number of groups.
- Any member can join any group in either community. A member's community only sets their default feed and suggestions.
- Posting, commenting and voting in a group require joining it.
- A Members-only group shows only its name and description until the member joins. Its page and post form say "Any member can join this group and read posts."
- Leaving a group removes its posts from the member's feed. The member's own posts stay in the group.
- Muting a group keeps its posts in the feed but stops its notifications.
- Each group page shows who the group is for in one line, so members know if it fits them.
- When a new member's answers don't point clearly to one community, onboarding shows both equally and preselects neither (section 5).

**Acceptance criteria (FG-COM-01 to FG-COM-03)**

1. Given a member in the Women's Community, when they open a group that belongs only to the Partners & Men's Community, then they can join it.
2. Given a member taps Join on a group, when the tap completes, then the button shows Joined and the group's posts appear in their home feed.
3. Given a Members-only group, when a member who has not joined opens it, then they see only its name and description.
4. Given a member has not joined a group, when they try to post, comment or vote in it, then they cannot.
5. Given a member mutes a group, when new activity happens there, then its posts still show in the feed and no notifications are sent.
6. Given a member leaves a group, when they open their home feed, then that group's posts are gone and their own posts stay in the group.
7. Given an admin in the admin panel, when they open Communities, then they can edit the two communities but cannot create or archive one.
8. Given an admin saves a group as Draft, when a member searches groups, then the draft group does not appear.
9. Given a group is archived, when a member opens it, then it is read only.
10. Given a member picks the Top this week sort, when the feed loads, then it shows only posts from the last 7 days, highest score first.
11. Given a member filters the feed by one group, when the feed loads, then only posts from that group show.
12. Given a group page with Question and Just venting picked under post type, and IVF picked under tag, when the posts load, then only Question or Just venting posts tagged IVF show, and the count says how many. [Added v1.2]
13. Given a group whose posts use only one topic tag, when a member opens it, then the tag filter is not shown. [Added v1.2]
14. Given a member who filtered a group page, when they leave the page and come back, then the default sort and no filters are applied. [Added v1.2]
15. Given filters that match nothing while Top this week is on, when the posts load, then "No posts match those filters this week." shows with a "Clear filters" button. [Added v1.2]
16. Given a group reading link to a section that is no longer in the article, or to an article that is not published, when a member opens the group page, then that link is not shown. [Added v1.2]
17. Given a group with no reading links, when a member opens it, then "From the library" shows only its heading and "Browse clinician-reviewed articles". [Added v1.2]
18. Given a group the viewer has posted in, when they open it, then their own avatar is not among the members shown, and neither is any suspended member or the Support account. [Added v1.2]
19. Given a member who joined a group but never posted there, when anyone opens the group page, then their avatar is not shown in its header. [Added v1.2]
20. Given a viewer who has not joined a Members-only group, when they open its page, then no member avatars are shown. [Added v1.2]
21. Given a viewer who blocked a member who posted in the group, when they open the group page, then that member's avatar is not shown, and the same holds the other way round. [Added v1.2]
22. Given an admin adding a reading link, when they pick an article, then they can choose only one of its sections and must give a label. [Added v1.2]

## 9. Posts, comments, votes and source tags

Members post in groups they joined. Every post has a type that says what response the author wants, and can carry a source tag that says where its information comes from. [Updated v1.2] Members upvote and downvote posts and comments, which ranks content and feeds gamification.

**User stories**

- As a member, I want to say whether I need answers, input or just support so that people respond the way I need.
- As a member, I want to see whether information comes from a doctor, research or personal experience, when the author says, so that I know how much to trust it. [Updated v1.2]
- As a member, I want to upvote helpful posts and comments so that the best answers rise to the top.
- As a member, I want to save posts privately so that I can come back to them before my next appointment.
- As a member who is venting, I want to be safe from downvotes so that sharing a hard moment never feels judged.
- As a verified clinician, I want my input clearly marked so that members can tell it apart from opinion.

**Post fields**

| Field | Type | Required | Options and rules |
|---|---|---|---|
| Post in | Single choice | Required | Groups the member joined. Prefilled when posting from a group page |
| Post type | Single choice | Required | Question. Seeking input. Support needed. Just venting. Just sharing |
| Title | Text | Required | Up to 150 characters |
| Body | Long text | Required | Up to 5,000 characters. Bold, italic, lists and links only. No images in the MVP |
| Source | Single choice | Optional [Updated v1.2] | Labelled "Source (optional)". No source, the default and first option. Personal experience. Opinion. From my doctor. From research or guidelines. Clinician input, shown only to verified clinicians [Updated v1.2] |
| Source link | Link | Required for "From research or guidelines", optional otherwise | Must be a valid web address. Up to 2,000 characters |
| Topic tags | Multiple choice | Optional | Labelled "Topic tags (optional)", with a "0 / 5" counter [Updated v1.2]. Up to 5, from an admin-managed list. For example IVF, AMH, Insurance, Two-week wait |

**Comment fields**

| Field | Type | Required | Options and rules |
|---|---|---|---|
| Comment | Long text | Required | Up to 2,000 characters. Same formatting as posts |
| Source | Single choice | Optional | Same list as posts. Shown as a small label when set |

**How post types behave**

| Post type | What the author wants | Downvotes allowed | Shown to members |
|---|---|---|---|
| Question | A clear answer | Yes | Answers sorted by votes, a "Clinician answered" label when one did |
| Seeking input | Experiences and opinions | Yes | Comments sorted by votes |
| Support needed | Comfort and encouragement | No | A gentle prompt to reply with support, not advice |
| Just venting | To be heard | No | A prompt reminding readers the author is not asking for advice |
| Just sharing | An update or news | Yes | Comments sorted by newest |

**Rules**

- The community guidelines show on the first post. The member accepts them once, and the accepted version is saved.
- To publish, a post needs a group, a post type, a title and a body, and the guidelines accepted on a first post. Source and topic tags are optional. [Added v1.2]
- A post without a source shows no source label anywhere: on post cards, on the post page and on the public link to a shared post (section 10). No label means the author gave no source. "No source" has no label or filter of its own. [Added v1.2]
- The tip beside the post form reads "Adding a source, if you have one, helps readers know how much weight to give it." [Added v1.2]
- Each member has one vote per post or comment. Tapping again removes it. Tapping the other arrow switches it.
- Members cannot vote on their own posts and comments.
- Downvotes are turned off on Support needed and Just venting posts and on all their comments.
- A post shows its score, which is upvotes minus downvotes. A post or comment with a score of minus 5 or below collapses behind "Show hidden content".
- Replies go one level deep. A reply to a reply attaches to the same comment and mentions the person replied to.
- Comments are sorted by top score by default, except on Just sharing posts, which start sorted by newest. Members can switch the order on any post.
- Authors can edit posts and comments at any time. Edited items show "Edited". Votes stay.
- Authors can delete their posts and comments. A deleted post with comments shows "This post was deleted" and keeps its comments. Authors can also delete posts and comments that are hidden while reviewing or removed. The moderation record keeps its own copy (section 21).
- Saved posts are private and listed on the Saved page and on the Dashboard's Saved tab (section 6). [Updated v1.2]
- Only verified clinicians can choose "Clinician input". Their name shows the clinician badge everywhere.
- Pregnancy announcements and success stories belong in Success stories. Moderators can move a post there, and the author is told why. A moved post keeps its title, body, source and comments. Its story type becomes Success story, and Diagnosis and What helped start empty. From then on it is a success story like any other.
- Every post, comment and profile has Report. Every author has Block, from their posts or their profile. See section 19.

**Error messages**

| Form | When | Message |
|---|---|---|
| Post | Source is "From research or guidelines" and the link is empty | Add a link to the research or guideline. |
| Post | The link is not a valid web address | Enter a full web address, starting with https:// |
| Post | 10 posts already this hour | You've reached the limit of 10 posts an hour. Try again a little later. |
| Comment | 50 comments already this hour | You've reached the limit of 50 comments an hour. Try again a little later. |
| Post | Title is empty | Add a title. |
| Post | Body is empty | Write something before posting. |
| Post | No post type picked [Updated v1.2] | Pick a post type. [Updated v1.2] |
| Comment | Comment is empty | Write something before replying. |

**Acceptance criteria (FG-POST-01 to FG-POST-04)**

1. Given a member whose email is not confirmed, when they try to post, comment or vote, then they cannot and are asked to confirm their email.
2. Given a member posts for the first time, when the post form opens, then the community guidelines show and must be accepted once.
3. Given a member picks source "From research or guidelines", when they leave Source link empty, then the post cannot be published.
4. Given a member who is not a verified clinician, when they open the Source list, then "Clinician input" is not offered.
5. Given a Support needed or Just venting post, when any member views it or its comments, then no downvote button is shown.
6. Given a member already upvoted a post, when they tap upvote again, then the vote is removed, and when they tap downvote instead, then it switches.
7. Given a member views their own post or comment, when they try to vote on it, then they cannot.
8. Given a post or comment reaches a score of minus 5 or below, when members view the thread, then it is collapsed behind "Show hidden content".
9. Given a deleted post that has comments, when members open it, then it shows "This post was deleted" and the comments stay.
10. Given an account less than 24 hours old upvotes a post, when the vote is counted, then the post's score goes up but the author earns no Sunlight.
11. Given a member saves a post, when they open the Saved page [Updated v1.2], then the post is listed there and no one else can see it.
12. Given a member adding topic tags to a post, when they pick a sixth tag, then it is not added.
13. Given a Just sharing post, when a member opens it, then comments are sorted newest first, and on any other post type they are sorted by top score.
14. Given a member leaves Source on "No source", when they publish a post with a group, type, title and body, then it is published and shows no source label on the post card, the post page or its public shared link. [Added v1.2]
15. Given a member has not picked a post type, when they try to publish, then the post is not published and they see "Pick a post type." [Added v1.2]

## 10. Success stories, follows and shares

Success stories live in their own space so members choose when to read them. Follows keep connections going after a first conversation. Shares let members pass a post to someone, and outside Fertility Grove only when the author allows it.

### Success stories

**User stories**

- As a member in a hard stretch, I want pregnancy news kept out of my groups so that my feed stays a safe place.
- As a member who wants hope, I want one place to read stories from people with my diagnosis so that I can see what worked.
- As a member who succeeded, I want to share my story so that others on my path have hope and practical tips.
- As a member, I want to save a success story so that I can come back to it when I need hope. [Added v1.2]

**Success story fields**

| Field | Type | Required | Options and rules |
|---|---|---|---|
| Story type | Single choice | Required | Success story. Pregnancy update. Advice from the other side |
| Title | Text | Required | Up to 150 characters |
| Story | Long text | Required | Up to 5,000 characters |
| Diagnosis | Multiple choice | Optional | Starts empty. "Fill from my profile" copies the member's diagnosis, with a note that members will see it. The button is hidden while health-data consent is off. Lets readers filter stories |
| What helped | Multiple choice | Optional | Same lists as journey stage and path |
| Source | Single choice | Required | Same list as posts |

**Rules**

- Success stories never appear in the home feed or in groups unless the member turns on "Show success stories in my feed". It is off by default.
- The space has a filter by diagnosis and by what helped.
- Downvotes are off in Success stories.
- Any member can post and comment in Success stories without joining. It is one space for everyone, not a group.
- Members who post a success story are invited to turn on mentoring once their tree reaches Blossom Tree.
- Every success story has a bookmark. Saved stories are private, and are listed on the Saved page and on the Dashboard's Saved tab (section 6). [Added v1.2]
- Publishing a story without a story type, title, story or source shows "Add a story type, title, story and source before publishing."

### Follows

**User stories**

- As a member, I want to follow people I connect with so that I see their new posts.
- As a member, I want to remove a follower so that I control who keeps up with me.

**Rules**

- Following is instant and needs no approval. The followed member gets a notification.
- The home feed has a Following tab with new posts from people the member follows, in groups the member can read.
- A member can unfollow at any time, and can remove any follower from their followers list.
- Blocking someone removes the follow in both directions.
- Follower counts are public. The lists of followers and following are visible only to the member.

People search

- People search finds members by handle only. It never matches real names, diagnosis, stage, location or anything else.
- Results show from 3 characters, matching the start of a handle, with the avatar and tree level.
- Blocked members never appear, in either direction. Suspended members and members whose account is being deleted do not appear.

### Shares

**Post sharing field**

| Field | Type | Required | Options and rules |
|---|---|---|---|
| Allow sharing outside Fertility Grove | Toggle | Optional | Off by default. Not available in Members-only groups |
| Show to visitors [Added v1.2] | Toggle | Optional | Off by default. Offered only in groups with Visible to guests on (section 8). Lets anyone, including people without an account, find and read the post, and lets search engines list it. Turning it on also turns on Allow sharing outside, which stays on while this is on. On Support needed and Just venting posts, turning it on also shows "This will be readable by anyone on the internet." |

**Share options on a post**

| Option | Who can use it | What happens |
|---|---|---|
| Copy link | Any member who can read the post | The link opens the post for signed-in members who can read that group |
| Send in a message | Any member who can read the post | Opens a direct message with the post attached |
| Share outside | Only on posts where the author allowed it | Creates a public link. Guests see the title, body, author and score, then "Join to read the conversation" |

**Rules**

- Comments are never visible on a public link.
- The author can turn sharing off later. Existing public links then show "This post isn't available."
- A public link also shows "This post isn't available." when the post is deleted, removed by a moderator or hidden while reviewing.
- Public post pages of posts shared by link only tell search engines not to list them. Anyone with the link can still open them. Posts shown to visitors can be listed (Guest browsing, below). [Updated v1.2]
- Every member has a personal invite link on their Dashboard and on onboarding screen 8. [Updated v1.2] Referral points are in section 13.
- The personal invite link is built from a fixed random code given at sign-up, never from the handle. It never changes, so links already sent keep working and keep crediting the same member after a handle change. [Added v1.2]

### Guest browsing [Added v1.2]

Guests can read the posts that both the group and the author chose to make public. Nothing else in the community opens to them.

**User stories**

- As a guest, I want to read real posts from people on my path so that I can decide whether to join.
- As a member, I want to choose which of my posts people outside Fertility Grove can read so that I make public only what I'm comfortable with.
- As an admin, I want to choose which groups guests can browse so that sensitive spaces stay inside the community.

**What guests can read**

A post shows to guests only while all of these hold:

1. Its group has Visible to guests on (section 8). Members-only groups never can.
2. Its author turned on Show to visitors.
3. It is published. Never while hidden while reviewing, removed, deleted or moved to Success stories.
4. It has no crisis words waiting for review in the Priority queue (section 19).
5. Its author is not suspended and is not deleting their account.

| Screen | What guests see |
|---|---|
| Public feed | Posts guests can read, from every group visible to guests, newest first, with a filter by group. Linked from the landing page |
| Public group page | For a group visible to guests. Its name, description, who it is for, rules, member count, posts this week, and the posts guests can read, newest first. No member avatars |
| Public post page | The group, post type, title, body, source label when set, time and score. The author's display identity with tree icon, pronouns and badges. "{n} replies" and "Join to read the conversation". Never the comments |

**What guests cannot do**

- Guests cannot vote, comment, reply, save, share, follow, join a group, message, request a mentor, open a profile or read comments. Tapping any of these opens the sign-up prompt, and nothing is saved.
- During the beta, the prompt says "Fertility Grove is invite-only during the beta. Ask a member for an invite link, or leave your email and we'll tell you when it opens." with an email field. The email is kept and used exactly as on the paused sign-up screen (section 4). After the beta, the prompt opens Create account.
- Guests cannot report. Help's Contact support is open to everyone (section 4).

**Rules**

- Display identity applies to guests as to members (section 6). A member using a handle never shows any part of their real name.
- Turning off Show to visitors removes the post from the public feed and group page at once, and its page tells search engines to drop it. Search engines may keep a copy for a while, which the toggle's help text says. While Allow sharing outside is still on, the post's link keeps working, unlisted.
- Turning off Visible to guests on a group hides all its posts from guests at once. Authors' choices are kept, so turning it back on shows those posts again.
- The public feed, public group pages and pages of posts shown to visitors can be listed by search engines. Pages of posts shared by link only cannot.
- Guest pages load no advertising or tracking pixels (section 21).

### Acceptance criteria (FG-SOC-01 to FG-SOC-07) [Updated v1.2]

1. Given a member with "Show success stories in my feed" off, when they view their home feed, then no success stories appear.
2. Given a member opens Success stories, when they filter by diagnosis or what helped, then only matching stories show.
3. Given any success story, when a member views it, then no downvote button is shown.
4. Given a member follows another member, when the follow is made, then it needs no approval and the followed member gets a notification.
5. Given a member blocks someone, when the block is made, then any follow between them is removed in both directions.
6. Given a member views another member's profile, when they look at followers, then they see only the counts and not the lists.
7. Given a post where the author left "Allow sharing outside Fertility Grove" off, when a member opens Share, then Share outside is not offered.
8. Given a public link to a shared post, when a guest opens it, then they see the title, body, author and score and "Join to read the conversation", and no comments.
9. Given an author turns off sharing on a post, when someone opens an existing public link, then they see "This post isn't available."
10. Given a Members-only group, when a member writes a post there, then the "Allow sharing outside Fertility Grove" toggle is not available.
11. Given a public link to a post that was later deleted, removed or hidden while reviewing, when anyone opens it, then they see "This post isn't available."
12. Given a public post page for a post shared by link only, when a search engine visits it, then the page tells it not to list the page. [Updated v1.2]
13. Given a member writing a success story, when they open the Diagnosis field, then it is empty and "Fill from my profile" is offered, unless health-data consent is off.
14. Given a member using a handle, when someone searches People for their real first name, then they are not found by it.
15. Given two members where one blocked the other, when either searches People for the other's handle, then the other does not appear.
16. Given a member who bookmarks a success story, when they open the Saved page's Stories tab, then the story is listed with its type, author, title and excerpt, and no one else can see that they saved it. [Added v1.2]
17. Given a member who changed their handle, when a friend opens the invite link the member sent before the change, then it still works and the referral counts for that member. Once the old handle is released, it never credits whoever takes it. [Added v1.2]
18. Given a post with Show to visitors on, in a group with Visible to guests on, when a guest opens the public feed, then the post is listed, and opening it shows the post, "{n} replies" and "Join to read the conversation", and no comments. [Added v1.2]
19. Given a group with Visible to guests off, when a member writes a post there, then Show to visitors is not offered, and no post from that group reaches guests. [Added v1.2]
20. Given a Members-only group, when an admin edits it, then Visible to guests cannot be turned on. [Added v1.2]
21. Given a guest on a public post, when they tap upvote, Reply, Save, Follow or the author's name, then the sign-up prompt opens and nothing is saved. [Added v1.2]
22. Given the beta is running, when the sign-up prompt opens for a guest, then it says sign-up is invite-only and offers to email them when it opens. [Added v1.2]
23. Given a member writing a Just venting post in a group visible to guests, when they turn on Show to visitors, then they see "This will be readable by anyone on the internet." and Allow sharing outside turns on with it. [Added v1.2]
24. Given a post shown to visitors, when its author turns off Show to visitors, then it leaves the public feed and group page at once and its page tells search engines to drop it. [Added v1.2]
25. Given a post shown to visitors that has crisis words waiting in the Priority queue, when a guest browses, then the post is not shown until a moderator reviews it. [Added v1.2]
26. Given a member who uses a handle, when a guest reads their post, then no part of their real name appears. [Added v1.2]
27. Given a post shown to visitors, when a search engine visits its page, then the page lets it be listed. [Added v1.2]

## 11. Matching

Matching connects each member with the groups, peers, mentors, articles and posts closest to their situation. It runs at the end of onboarding, whenever the member changes their answers, and again every week. Every match shows a short reason, so members understand why they see it.

**User stories**

- As a new member, I want to be shown people in my exact situation so that I stop feeling alone.
- As a member, I want to know why someone was suggested so that I can decide whether to reach out.
- As a member, I want to dismiss a suggestion so that I see better ones over time.
- As a member who wants privacy, I want to stop appearing in suggestions so that nobody finds me unless I post.

**What gets matched, and where it shows**

| Match | Where it shows | How many | Actions |
|---|---|---|---|
| Groups | End of onboarding. Groups page. Home feed. Members-only groups are suggested only at the end of onboarding and on the Groups page | Up to 5 | Join. Not for me |
| Peers | People like you, on the home feed | Up to 5 at a time, refreshed weekly | Follow. Message. Not for me |
| Mentors | Find a mentor, for members who turned on "I'd like a mentor" | Up to 3 at a time | View profile. Request mentoring. Not for me |
| Learn articles | Learn home. Grove Guide answers | Up to 6 | Read. Save |
| Posts | Home feed, from matched groups the member has not joined. Never from Members-only groups | Up to 3 per day | Open. Join group |

**Signals, in order of importance**

1. Diagnosis.
2. Journey stage.
3. Path to parenthood.
4. Treatment timing, when both members gave a date.
5. Age range, when both members gave one.
6. Region from ZIP code, when both members gave one. Used only in the background. It never appears in a match reason.
7. What the member is looking for and their comfort settings. Their answers on onboarding screen 4, message settings and whether they want a mentor.
8. What worked before. Matches that led to a follow, a message or a group join count more. Matches marked "Not for me" count less.

**How a match is scored**

- These are starting values, to confirm with Lauren (section 27).
- Points when both members share a signal. Diagnosis, at least one in common, 5. Journey stage, at least one in common, 4. Path to parenthood, at least one in common, 3. Next treatment dates within 30 days of each other, 2. Same age range, 1. Same state, from the ZIP code, 1.
- Peers and mentors need at least 5 points to be suggested. Ties go to the member who was active most recently.
- What the member is looking for and their comfort settings (signal 7) change which blocks show first, not the score.
- What worked before (signal 8). A kind of match that led to a follow, a message or a group join gets 1 more point for that member. A kind of match marked "Not for me" gets 1 point less. This changes future matches only.
- A group matches when at least one of its matching tags is among the member's answers. Groups are ranked by points from the same list.
- Region is never finer than the state. Matching never uses the full ZIP code or distance.

**Rules**

- Members who turned off "Suggest me to members on my path" never appear as peer or mentor matches.
- A match reason uses only information the other member made visible. If their diagnosis is private, the reason reads "Similar journey" instead of naming it.
- "Not for me" hides that suggestion for good. The group can still be found in group search, and the person in People search (section 10).
- Blocked members never appear as matches, in either direction.
- Peer matches never suggest the member's own linked partner.
- Mentor matches only include members with mentoring turned on who have not paused new requests or reached their mentoring limit, counting active mentees and waiting requests (section 12).
- Members with no diagnosis or stage answers get popular groups and starter articles until they add answers.
- Admins can see how matches perform overall, never the individual reasons for a specific member.

**Acceptance criteria (FG-MATCH-01 to FG-MATCH-03)**

1. Given a member who just finished onboarding, when screen 8 loads, then it shows up to 5 groups, and every group shows a reason, such as "Matched on endometriosis and IVF".
2. Given a member who turned off "Suggest me to members on my path", when any other member's peer or mentor matches are built, then that member never appears in them.
3. Given a peer whose diagnosis is private, when that peer is suggested to a member, then the reason reads "Similar journey" and does not name the diagnosis.
4. Given a member who taps "Not for me" on a suggestion, when matches refresh, then that suggestion never comes back, and the group can still be found in group search and the person in People search.
5. Given two members where one has blocked the other, when matches are built for either of them, then neither appears in the other's matches.
6. Given a member with a linked partner, when peer matches are built, then the linked partner is never suggested.
7. Given a mentor whose active mentees plus waiting requests equal their mentoring limit, when mentor matches are built, then that mentor is not included.
8. Given two members matched partly on region, when the match reason is shown, then it never mentions where either member lives.
9. Given a member with no diagnosis and no stage answers, when matches are built, then they see popular groups and starter articles.
10. Given a member who changes their diagnosis in profile settings, when they save, then their group, peer, mentor and article suggestions refresh.
11. Given a matched Members-only group the member has not joined, when their home feed loads, then neither the group nor any of its posts appear there.
12. Given a mentor who paused new requests, when mentor matches are built, then that mentor is not included.
13. Given a member with matched groups they have not joined, when their home feed loads, then it shows at most 3 posts a day from those groups, each with the reason it was matched.
14. Given two members who share only an age range and a state, when peer matches are built, then they are not suggested to each other.
15. Given two members whose next treatment dates are 45 days apart, when matches are scored, then they get no treatment-timing points.

## 12. Mentors

Mentors are experienced members who support newer members on the same path. There is no application. A member earns the right to mentor by reaching the Blossom Tree level, then turns mentoring on. At launch, admins can also give a Founding mentor badge to experienced members Lauren knows, so there are mentors from day one. Mentoring in the MVP is free and volunteer. Paid mentor sessions come in Phase 2.

**User stories**

- As a member who has been through it, I want to mentor someone on my path so that my experience helps another person.
- As a member, I want to find a mentor who had my diagnosis and treatment so that I can ask what it was really like.
- As a mentor, I want to limit how many people I mentor at once so that I do not burn out.
- As a mentor, I want to accept or decline requests so that I only take on what I can handle.
- As a member or mentor, I want to end a mentoring connection at any time so that it never feels like an obligation.

![image6.png](prd-images/image6.png)

becoming a mentor and the request flow

A decline and a request with no reply in 7 days end the same way. The member is told kindly and can ask another mentor.

1. A member reaches Blossom Tree, or gets the Founding mentor badge, and turns on mentoring, with a bio and a limit.
2. Another member sends a request. The mentor gets a notification.
3. If the mentor declines, or does not reply in 7 days, the member is told kindly and can ask someone else.
4. If the mentor accepts, a mentoring chat opens.
5. Either person can end it, and a block by either one ends it at once. Unless it ended with a block, the member can then leave a thank-you note.

**Mentor setup fields**

Shown when a member at Blossom Tree or above turns on Mentoring.

| Field | Type | Required | Options and rules |
|---|---|---|---|
| Mentor bio | Long text | Required | Up to 500 characters. What I went through and how I can help |
| I can help with | Multiple choice | Required, at least 1 | Diagnoses, stages and paths. Starts empty. "Fill from my profile" copies the member's own answers, with a note that members will see this list. The button is hidden while health-data consent is off |
| How many people I can mentor at once | Number | Required | 1 to 5. Default 3. Waiting requests count toward this limit |
| I agree to the mentor guidelines | Toggle | Required | No medical advice. No selling products or services. Share crisis resources and report when someone may be in danger. Respect privacy |

**Mentor request fields**

| Field | Type | Required | Options and rules |
|---|---|---|---|
| Message to the mentor | Long text | Required | Up to 500 characters. What you are going through and what you hope to talk about |
| I'd like help with | Multiple choice | Optional | From the mentor's "I can help with" list |

**Mentor response fields**

| Field | Type | Required | Options and rules |
|---|---|---|---|
| Accept or decline | Single choice | Required |  |
| Note to the member | Long text | Optional | Up to 300 characters. Declines show a kind default message when empty |

**After a mentoring connection ends**

| Field | Type | Required | Options and rules |
|---|---|---|---|
| Was this mentoring helpful | Single choice | Optional | Yes. Somewhat. No. Seen only by admins |
| Thank-you note | Long text | Optional | Up to 300 characters. Shown to the mentor |

**Rules**

- Mentoring can be turned on from Blossom Tree, at 750 Sunlight. The member is notified when they become eligible.
- Founding mentors can turn on mentoring at any level. Admins give or remove the Founding mentor badge in Roles and badges (section 20). It shows as "Founding mentor" instead of "Mentor". Founding mentors follow the same setup, guidelines and limits as other mentors.
- A mentor badge shows on the profile while mentoring is on. Turning it off removes the badge. Admins, or a moderator acting on a report, can also remove it. Only admins give it back.
- When a mentor turns mentoring off, current mentoring conversations continue until either person ends them. Waiting requests are declined with the kind default message.
- When an admin or moderator removes the mentor badge, all of that mentor's connections and waiting requests end at once. Each mentee is told kindly and offered help finding another mentor. The reason is never shared with mentees. The member whose badge was removed gets the Mentor badge removed email (section 15a).
- A member whose mentor badge was removed cannot turn mentoring on again unless an admin gives it back.
- A member can have one open request and two active mentors at a time.
- A mentor receives requests only while active mentees plus waiting requests are below their mentoring limit. When full, their profile shows "Not taking requests right now".
- A mentor can pause new requests at any time without ending current ones.
- Requests expire after 7 days without a reply. The member is told and can request someone else.
- Accepting opens a direct message conversation marked Mentoring. It works like any message thread. It is always allowed, whatever either person's "Who can message me" setting is. A block overrides this.
- Either person can end the connection from the conversation. The other person is notified kindly.
- If either person blocks the other, the connection ends at once and any waiting request between them is declined. The blocked person sees the usual message that the connection has ended, never that they were blocked.
- Mentors cannot mentor their own linked partner.
- Reports about a mentor go to the moderation queue with a Mentor label, so they are reviewed first.

**Messages members see**

| When | Message |
|---|---|
| A member with an open request asks another mentor | You already have an open mentor request. Wait for a reply before asking someone else. |
| A member with two mentors asks for a third | You already have two mentors. End one connection before asking someone new. |
| A mentor declines without a note, the kind default message | Thank you for reaching out. I can't take on someone new right now, and I hope you find the right mentor soon. |
| A request expires after 7 days | Your request to [name] expired without a reply. This usually means they're busy. You can ask another mentor. |
| An admin removes the mentor badge, to each mentee | Your mentoring connection with [name] has ended. Here are other mentors on your path. |
| The mentor is suspended or deleting their account | Your mentor is away for now. |
| Mentor setup saved without a mentor bio | Tell members a little about what you went through. |
| Mentor setup saved with nothing under "I can help with" | Pick at least one thing you can help with. |
| Mentor setup saved without agreeing to the mentor guidelines | Please agree to the mentor guidelines to start mentoring. |
| A mentor request sent without a message | Add a short message so the mentor knows how you'd like help. |

**Acceptance criteria (FG-MENT-01 to FG-MENT-03)**

1. Given a member below Blossom Tree without the Founding mentor badge, when they open settings, then the Mentoring toggle is unavailable and says it opens at Blossom Tree.
2. Given a member at Blossom Tree who turns on Mentoring, when they leave the mentor bio empty, or pick nothing under "I can help with", or don't accept the mentor guidelines, then mentoring is not turned on.
3. Given a mentor with a mentoring limit of 3, 2 active mentees and 1 waiting request, when another member views their profile, then it shows "Not taking requests right now" and no Request mentor button.
4. Given a member who already has one open request, when they try to send a second request, then it is not sent.
5. Given a member who already has two active mentors, when they try to request a third, then the request is not sent.
6. Given a request with no reply for 7 days, when the 7th day passes, then the request expires, the member is told kindly, and they can request someone else.
7. Given a mentor who accepts a request, when they accept, then a direct message conversation marked Mentoring opens for both people.
8. Given a mentor who turns mentoring off themselves, when they confirm, then their badge is hidden, current mentoring conversations continue, and waiting requests are declined with the kind default message.
9. Given an admin who removes a mentor's badge, when they confirm, then all of that mentor's connections and waiting requests end at once, and each mentee is told kindly and offered help finding another mentor.
10. Given a member linked to a partner who is a mentor, when they look for mentors, then their own partner is never shown, and a request to them cannot be sent.
11. Given a member below Blossom Tree with the Founding mentor badge, when they open settings, then they can turn on mentoring, and their profile then shows "Founding mentor".
12. Given a mentoring connection that ended, when the member leaves a thank-you note, then the mentor sees it, and the "Was this mentoring helpful" answer is seen only by admins.
13. Given a member at Blossom Tree turning on mentoring, when they open "I can help with", then it is empty and "Fill from my profile" is offered.
14. Given a mentee in an active mentoring connection, when they block their mentor, then the connection ends at once, it no longer counts toward their two mentors, and the mentor sees only that the connection has ended.

## 13. Gamification

Members earn Sunlight points when others find them helpful, and their profile tree grows through five levels, from Seed to Orange Tree. It works like Reddit karma. The tree shows next to every member's name, and Blossom Tree unlocks mentoring. Sunlight is a working name, and all point values below are starting values that admins can tune during the beta.

**User stories**

- As a member, I want to see my tree grow when I help others so that I feel my support matters.
- As a member, I want to see someone's tree next to their name so that I know how experienced and trusted they are.
- As a member, I want my level to stay even after a hard week so that I am never punished for struggling.
- As a member, I want to invite friends and be rewarded so that I can grow the community I rely on.

**Levels**

| Level | Name | Sunlight needed | What it unlocks |
|---|---|---|---|
| 1 | Seed | 0, on finishing onboarding | Full community access |
| 2 | Bush | 50 | Level badge |
| 3 | Tree | 250 | Level badge |
| 4 | Blossom Tree | 750 | Mentoring can be turned on |
| 5 | Orange Tree | 2,000 | Top level badge |

**How members earn Sunlight**

| Event | Sunlight | Limits |
|---|---|---|
| An upvote on your post or comment | +1 | Up to 100 per day |
| A downvote on your post or comment | −1 | Never on Support needed or Just venting posts |
| A new follower | +2 | Up to 20 per day. Removed if they unfollow within 7 days |
| A friend joins with your invite link and finishes onboarding | +10 | Up to 10 per month |

**Where members see it**

- A small tree icon next to every member's name in posts, comments, messages and profiles.
- On their Dashboard (section 6), the current level, total Sunlight and a progress bar to the next level. [Updated v1.2]
- A private Sunlight history on their Dashboard listing what earned or lost points. [Updated v1.2]
- A short celebration when they reach a new level, with what the level unlocks.

**Rules**

- Trees never shrink. Sunlight can go down after downvotes, but a level once reached is kept.
- Only members who confirmed their email can vote (section 4). Votes from accounts younger than 24 hours count in the score and ranking at once, but earn the author no Sunlight.
- Votes between linked partners do not earn Sunlight.
- Removing an upvote or downvote reverses its Sunlight.
- When moderators remove a post or comment for breaking the guidelines, the Sunlight it earned is removed too. Levels are not reduced.
- A referral counts once per new account, and only if that person was not already a member.
- Admins can change point values, daily limits and level thresholds from the admin panel. Changes apply from that moment on, not to past points.

**Acceptance criteria (FG-GAME-01 to FG-GAME-03)**

1. Given a member who finishes onboarding, when they reach screen 8, then their level is Seed with 0 Sunlight.
2. Given a post that receives an upvote from a member whose account is over 24 hours old, when the vote is saved, then the author gains 1 Sunlight.
3. Given a post that receives an upvote from an account under 24 hours old, when the vote is saved, then the post's score goes up by 1 and the author gains no Sunlight.
4. Given a member who has earned 100 Sunlight from upvotes today, when they get another upvote, then their score rises but their Sunlight does not.
5. Given a member at Tree level whose Sunlight drops below 250 after downvotes, when they view their profile, then their level is still Tree.
6. Given two linked partners, when one upvotes the other's post, then the author earns no Sunlight from that vote.
7. Given a member who removes their upvote, when the vote is removed, then the Sunlight it earned is taken back.
8. Given a post removed by a moderator for breaking the guidelines, when it is removed, then the Sunlight it earned is taken back and the author's level stays the same.
9. Given a member who reaches 750 Sunlight, when the points are added, then they see a short celebration and are told that mentoring is now available.
10. Given an admin who changes a point value, when they save, then only points earned after that moment use the new value.
11. Given a friend who joins with a member's invite link, when the friend finishes onboarding, then the member gains 10 Sunlight, up to 10 referrals a month.
12. Given someone who already had an account, when they open a member's invite link, then the member gains no Sunlight.

## 14. Direct messages

Members send private one-to-one messages. Each member decides who can message them, and anyone can block or report a conversation. Group chats are not in the MVP.

**User stories**

- As a member, I want to message someone privately after reading their post so that I can ask about their experience.
- As a member, I want to control who can message me so that I never get unwanted messages.
- As a member, I want to send a post to someone so that we can talk about it.
- As a member, I want to block someone from a conversation so that they can no longer reach me.

**Flow. Starting a conversation**

1. The member taps Message on a profile, a peer match, a post author's menu or an accepted mentor request.
2. If the other member follows the sender, or allows Anyone, a conversation opens. Otherwise the first message is sent as a message request. If they chose No one, the Message button is not shown.
3. The member writes and sends. The other member sees an unread badge and gets a notification.
4. The conversation appears at the top of both members' Messages list.

**Message fields**

| Field | Type | Required | Options and rules |
|---|---|---|---|
| Message | Long text | Required unless a post is attached | Up to 5,000 characters. Links allowed. No images or files in the MVP |
| Attached post | Post card | Optional | Added through Send in a message on a post. Part of FG-SOC-04. If it is not ready at launch, messages are text only |

**Messages list**

| Element | Rules |
|---|---|
| Order | Most recent message first |
| Each row | Avatar, display identity, tree icon, Mentoring label when it applies, last message preview, time, unread dot |
| Filters | All. Unread. Mentoring. Requests. Requests is part of FG-DM-01, since message requests wait there |
| Search | By the display identity shown in the list, and by words in the member's own conversations. Never by a hidden real name |

**Conversation actions**

| Action | What happens |
|---|---|
| Mute | No notifications from this conversation. Messages still arrive |
| Delete for me | Removes the conversation from this member's list only. The other member keeps their copy |
| Block | The other member cannot message, follow, view the profile or see the blocker's posts. The block is never disclosed. In a Mentoring conversation, it also ends the mentoring connection (section 12) |
| Report | Sends the conversation to moderation with a reason. The reporter can also block in the same step |
| End mentoring | Shown only in Mentoring conversations. See section 12 |

**Rules**

- Messages are private to the two members. Moderators can read a conversation only after one of them reports it, or when crisis words put it in the Priority queue. For a report, they see the 30 most recent messages at the time of the report. For crisis words, they see only the flagged message and the 10 messages before it. Every view is written to the audit log, and this is explained in the Privacy Policy and the community guidelines.
- "Who can message me" is checked every time. If a member changes it to No one, existing conversations stay but new messages cannot be sent. Mentoring conversations and messages from the Fertility Grove Support account are always allowed.
- The Fertility Grove Support account is how the team messages a member, for example a moderator's Reach out (section 19). The member can reply. Replies go to the Support inbox in the admin panel, where Lauren reads them. A reply to a Reach out counts as a Priority item. Other replies are normal Support inbox items unless they contain crisis words (section 19). The Support account shows a "Fertility Grove team" badge that no member can get. It cannot be blocked.
- Message requests. With Members I follow, the default, a member they do not follow can send one first message. It waits under Requests. The member can accept it, which opens the conversation, or delete it. The sender is never told it was deleted, and cannot send more until it is accepted.
- Until a request is accepted, the sender sees "You can send more once [name] accepts your message request."
- A message to someone who blocked the sender looks sent on the sender's side and is never delivered.
- A message to a member who is suspended or deleting their account shows "This member can't receive messages right now."
- Accounts younger than 7 days have a daily limit on new conversations, set in section 21, to limit spam. Past the limit, they see "You've reached today's limit for new conversations. Try again tomorrow."
- If a message contains crisis words, the sender sees a card with crisis resources before it sends. The message still sends, and the conversation is added to the Priority queue. The moderator sees only the flagged message and the 10 messages before it.
- Members can edit or delete a message within 15 minutes of sending. Deleted messages show "Message deleted".
- When a member's account deletion completes, the other member keeps the conversation, and the deleted member shows as "Deleted member". Once both members have deleted a conversation, it is removed for good.

**Acceptance criteria (FG-DM-01 to FG-DM-03)**

1. Given a member whose "Who can message me" is set to No one, when another member views their profile, then no Message button is shown.
2. Given a member who changes "Who can message me" to No one, when someone in an existing conversation tries to send a new message, then it cannot be sent and the old messages stay.
3. Given a member who blocked a sender, when that sender sends a message, then it looks sent on the sender's side and is never delivered.
4. Given an account younger than 7 days that has already started 10 new conversations today, when it tries to start an 11th, then the conversation is not started and it sees "You've reached today's limit for new conversations. Try again tomorrow."
5. Given an account 7 days old or older, when it starts an 11th new conversation in a day, then the conversation starts.
6. Given a member writing a message that contains crisis words, when they tap Send, then a card with crisis resources appears first, and the message still sends.
7. Given a conversation flagged for crisis words, when a moderator opens it from the Priority queue, then they see only the flagged message and the 10 messages before it, and the view is written to the audit log.
8. Given a conversation nobody reported or flagged, when a moderator or admin looks for it in the admin panel, then they cannot read it.
9. Given a message sent less than 15 minutes ago, when the sender deletes it, then both members see "Message deleted" in its place.
10. Given a message sent more than 15 minutes ago, when the sender opens its menu, then Edit and Delete are not offered.
11. Given a member who uses Delete for me on a conversation, when they confirm, then it disappears from their list only and the other member still has their copy.
12. Given a member with the default "Members I follow", when someone they do not follow sends a first message, then it waits under Requests, and the sender cannot send more until it is accepted.
13. Given a conversation that was reported, when a moderator opens it, then they see only the 30 most recent messages at the time of the report, and the view is written to the audit log.
14. Given a member whose account deletion completes, when the other member opens their conversation, then it is still there and the deleted member shows as "Deleted member".
15. Given a member who replies to a Reach out from the Fertility Grove Support account, when they send it, then it appears in the Support inbox as a Priority item.
16. Given a member who replies to a Fertility Grove email with no crisis words, when the reply arrives, then it is a normal Support inbox item, not a Priority item.
17. Given a member who uses a handle, when another member searches their Messages for that member's real first name, then the conversation is not found by it.
18. Given a member who picks the Unread filter, when the list loads, then only conversations with unread messages show.

## 15. Notifications

The MVP sends notifications in the app and by email. Push notifications are not part of the MVP. Members choose which events reach them by email, and account and safety emails always send right away. Everything else arrives in one daily update email at most, as the onboarding promises. It is sent around 8 am in the member's time zone, worked out from their ZIP code.

**User stories**

- As a member, I want to know when someone replies to me or messages me so that I can respond.
- As a member, I want to choose what reaches my inbox so that emails never feel like pressure during treatment.
- As a member, I want a daily summary instead of many emails so that I can catch up once a day.

**Events**

| Event | Channel | Email timing | Member can turn off the email |
|---|---|---|---|
| Email confirmation | Email only | Right away | No |
| Password reset requested | Email only | Right away | No |
| Password or email changed | Email only | Right away | No |
| Sign-in from a new device | Email only | Right away | No |
| Welcome, after onboarding | Email only | Right away | No |
| Account deletion scheduled, restored or completed | Email only | Right away | No |
| Data file ready to download | Email only | Right away | No |
| AI credit purchase receipt | Email only | Right away | No |
| Partner invite, to the invited person | Email only | Right away | Not a member yet |
| Sign-ups reopened, to a guest who left their email | Email only | Right away | Not a member yet |
| Reply to my post or comment | Both | In the daily update | Yes. On by default |
| New direct message | Both | In the daily update | Yes. On by default |
| New message request | Both | In the daily update | Yes, with New direct messages |
| Mentor request received, accepted, declined or expired | Both | In the daily update | Yes. On by default |
| I can now become a mentor | Both | In the daily update | Yes. On by default |
| I was given the Founding mentor badge | Both | In the daily update | Yes. On by default |
| Partner accepted my invite, or unlinked | Both | In the daily update | Yes. On by default |
| My partner invite expired or couldn't be accepted | Both | In the daily update | Yes. On by default |
| My partner blocked me, and we are no longer linked | In-app only | Never | Not needed |
| Something was shared with me in the family space | Both | In the daily update | Yes. On by default |
| A moderator removed or moved my content, warned or suspended me, or removed my mentor badge | Both | Right away | No |
| Appeal decided | Both | Right away | No |
| Suspension ended | Email only | Right away | No |
| New follower | In-app only | In the daily update when "Include follows, levels and matches" is on | Off by default |
| New post from someone I follow | In-app only | In the daily update when "Include follows, levels and matches" is on | Off by default |
| I reached a new tree level | In-app only | In the daily update when "Include follows, levels and matches" is on | Off by default |
| Mentoring connection ended | In-app only | In the daily update when "Include follows, levels and matches" is on | Off by default |
| New matches this week | In-app only | In the daily update when "Include follows, levels and matches" is on | Off by default |
| AI credits running low | In-app only | Never | Not needed |
| Someone tried to sign up with my email | Email only | Right away | No |
| Learn article review due in 30 days, for admins | Admin panel only | Never | Not needed |
| Account flagged after a chargeback, for admins | Admin panel only | Never | Not needed |

**Notification settings**

| Setting | Type | Default | Rules |
|---|---|---|---|
| Comments and replies on my posts | Toggle | On | Included in the daily update |
| New direct messages | Toggle | On | Included in the daily update |
| Mentoring updates | Toggle | On | Requests, answers and becoming eligible |
| Partner and family space updates | Toggle | On | Linking, unlinking and new shares |
| Include follows, levels and matches in my daily update | Toggle | Off | Adds the in-app only events to the daily update |
| Pause all optional emails | Toggle | Off | Pauses everything that can be turned off, for example during a hard week |

**Rules**

- The bell icon shows the number of unread notifications. Opening the list marks what is shown as read.
- Tapping a notification opens the exact post, comment, conversation or screen it is about.
- Notifications about community activity show the other member's display identity, even when that member is the linked partner (section 7).
- Notifications from muted groups and muted conversations are not sent.
- Emails never include post text, message text, diagnosis or any medical detail. They say what happened and link to the app. For example "You have a new message on Fertility Grove".
- Every optional email has an unsubscribe link for that event type.

**Acceptance criteria (FG-NOTE-01 and FG-NOTE-02)**

1. Given a member with comment notifications on, when someone replies to their post, then the bell count goes up and the reply appears in the daily update email.
2. Given a member who taps a notification, when it opens, then it shows the exact post, comment, conversation or screen the notification is about.
3. Given a member who muted a group, when someone posts or comments there, then no notification is sent for it.
4. Given a member who received 3 replies and 2 messages in one day, when emails go out, then they get one daily update email for that activity, not five emails.
5. Given a member with "Include follows, levels and matches in my daily update" off, when they gain a new follower, then it shows in the app only and is not in any email.
6. Given a member with "Pause all optional emails" on, when activity happens, then no optional email is sent, and account and safety emails still send right away.
7. Given any notification email, when it is sent, then it contains no post text, message text, diagnosis, stage, treatment or other medical detail.
8. Given a member whose appeal is decided, when the moderator saves the decision, then the member gets a notification in the app and by email right away.
9. Given a member whose suspension ends, when the end date passes, then they are notified that they can sign in again.

## 15a. Email templates

Fertility Grove sends 20 email templates in the MVP. Account and safety emails go right away. Community activity is bundled into one daily update. Every email follows the same rules, so nothing private ever appears in an inbox.

**Rules for every email**

- Sent from "Fertility Grove". Replies go to the Support inbox as normal items, and become Priority items only when they contain crisis words (section 19).
- One clear button that opens the right screen in the app. The same link is shown as text below it.
- No post text, message text, diagnosis, stage, treatment or any medical detail. Emails say what happened, not what was said.
- Other members appear by their display identity. A member using a handle is never named in an email. Partner and family space emails name the linked partner by first name only (section 7). Every other email shows them by display identity.
- Greets the recipient by first name. When there is no first name, such as a partner invite to someone who is not a member yet, it says "Hi there".
- Footer with a link to notification settings. Optional emails also have a one-click unsubscribe for that category.
- Readable on phones, with a plain text version.
- Placeholders in square brackets are filled in when the email is sent.

**Account and security**

| Template | Sent when | Subject | What it says | Button |
|---|---|---|---|---|
| Confirm your email | A member signs up with email, or asks for a new link | Confirm your email for Fertility Grove | Welcome, and the link works for 60 minutes | Confirm my email |
| Welcome | The member finishes onboarding | Welcome to Fertility Grove, [first name] | Three first steps. Join your groups, ask the Grove Guide, invite your partner | Go to my home |
| Reset your password | A password reset is requested | Reset your Fertility Grove password | The link works for 60 minutes. Ignore this email if it wasn't you | Reset my password |
| Password changed | The password is changed | Your password was changed | When it happened, and that other devices were signed out. Contact support if it wasn't you | Contact support |
| Email changed | The email is changed. Sent to both the old and the new address | Your email address was changed | The new address, when it happened. The new address must confirm it | Confirm my new email, on the new address only |
| New sign-in | Someone signs in from a new device or browser | New sign-in to your account | The device type and time. Reset the password if it wasn't you | Reset my password |
| Deletion scheduled | The member confirms account deletion | Your account will be deleted on [date] | The account is closed for now. Signing in within 14 days restores everything. After that, the profile, messages, chats and family space are removed for good | Restore my account |
| Account restored | The member signs in within the 14 days | Your account is back | Everything is restored as it was | Go to my home |
| Account deleted | The 14 days end | Your account has been deleted | What was removed. What happened to their posts and comments, matching their choice: removed, or kept as "Deleted member". Thank you for being part of the community | None |
| Sign-up attempt | Someone tries to sign up with an email that already has an account | Someone tried to sign up with your email | You already have an account. If it was you, sign in or reset your password. If it wasn't, no action is needed | Sign in |
| Data file ready | A data export finishes | Your Fertility Grove data is ready | That the file is ready and the link works for 7 days. No data in the email | Download my data |
| Sign-ups reopened | Sign-ups reopen after a pause, or open to everyone after the beta [Updated v1.2]. Sent once to each email left on the paused screen or in a guest's sign-up prompt | Fertility Grove is open for sign-ups again | That sign-up is open again and their invite link still works. The email address is deleted once this is sent | Create account |

**Community and mentoring**

| Template | Sent when | Subject | What it says | Button |
|---|---|---|---|---|
| Daily update | Once a day at most, when there is something new in the categories the member left on. Sent around 8 am local time | You have new activity on Fertility Grove | Counts per category. For example 2 new replies, 1 new message, 1 mentor request. With "Include follows, levels and matches" on, also new followers, posts from people you follow, matches and tree levels | Open Fertility Grove |

**Partners and family space**

| Template | Sent when | Subject | What it says | Button |
|---|---|---|---|---|
| Partner invite | A member invites their partner | [member first name] invited you to Fertility Grove | What a partner account is, and that the account stays private. The invite works for 14 days. The personal note is never in the email. It shows on the invite page once the link is opened | Accept invite |

**Payments**

| Template | Sent when | Subject | What it says | Button |
|---|---|---|---|---|
| Credit purchase receipt | A credit pack payment succeeds | Your Fertility Grove receipt | Pack name, credits added, amount in US dollars including any sales tax, date and receipt number | View my credits |

**Moderation**

| Template | Sent when | Subject | What it says | Button |
|---|---|---|---|---|
| Content action | A moderator removes or moves a post or comment, or sends a warning | About your activity on Fertility Grove | Which guideline it relates to and the moderator's note. The post text is not repeated | See details and appeal |
| Suspension | A moderator suspends the account | Your account is paused until [date] | The guideline, the moderator's note, and how to appeal within 14 days | Appeal |
| Appeal decision | A moderator decides an appeal | We reviewed your appeal | Whether the decision stands or was reversed, and the moderator's note. The content is not repeated | See details |
| Suspension ended | A suspension ends | Your account is active again | That the member can sign in again, with a link to the community guidelines | Sign in |
| Mentor badge removed | A moderator or admin removes the mentor badge | Your mentor badge was removed | The guideline it relates to and the moderator's note. Their tree level stays. How to appeal within 14 days | Appeal |

**Rules**

- Final wording and design of every template are agreed in design, using this table as the brief.
- Admins can edit template text in the admin panel without a new release.
- If an email fails to send, the action that triggered it still happens. Fertility Grove retries sending, and account emails can be requested again from the app.

**Acceptance criteria (FG-NOTE-01 to FG-NOTE-03)**

1. Given any email from Fertility Grove, when it is opened, then it is from "Fertility Grove", has one button and the same link as text below it, greets the recipient by first name, and has a plain-text version.
2. Given a member who uses a handle, when they are mentioned in another member's email, then only their handle appears and never their real name, except their first name in partner and family space emails to their linked partner.
3. Given a member who asks for a data export, when the file is ready, then the email says only that the data is ready and links to a page that asks them to sign in again before downloading.
4. Given a data export link older than 7 days, when the member opens it, then the download is no longer available.
5. Given a member who signs up with email, when the confirmation email arrives, then it says the link works for 60 minutes and has a Confirm my email button.
6. Given a member who changes their email, when the change is saved, then both the old and the new address get the Email changed email, and only the new one has the confirm button.
7. Given any optional email, when it is opened, then it has a one-click unsubscribe for that category and a link to notification settings.
8. Given an email that fails to send, when that happens, then the action that triggered it still completes and the email is retried.
9. Given an admin who edits a template's text in the admin panel, when they save, then the next email of that type uses the new text without a new release.
10. Given a member who deleted their account with "Also delete my posts and comments" ticked, when the Account deleted email is sent, then it says their posts and comments were removed.
11. Given a moderator removes a member's mentor badge, when it is saved, then the member gets the Mentor badge removed email with the guideline, the moderator's note and an Appeal button.

## 16. Learn library

Learn is a library of clinician-reviewed articles. It launches with one overview article for each of six diagnoses. Endometriosis, PCOS, diminished ovarian reserve, male factor, recurrent pregnancy loss and unexplained infertility. Every article shows who reviewed it, its sources and its review date. The Grove Guide answers questions only from these articles.

**User stories**

- As a member, I want articles about my diagnosis shown first so that I find what matters to me quickly.
- As a member, I want to see who reviewed an article and when so that I can trust it.
- As a member, I want to ask the Grove Guide about an article so that I can understand it for my own case.
- As a member, I want to save articles so that I can read them again before an appointment.

**What members see**

| Screen | Contents |
|---|---|
| Learn home | Recommended for you, based on diagnosis and stage. Browse by diagnosis. Browse by topic. Search |
| Article page | Title, summary, body, reviewer name and credentials, last reviewed date, sources, medical disclaimer, related groups, Ask the Grove Guide, Save, Was this helpful |
| Guests | Learn home and article title and summary only, with "Join free to read the full article" |
| Group page | "From the library". Up to 3 links, each to one section of an article, picked by admins per group (section 8). Separate from the article's Related groups field [Added v1.2] |

**Article fields, set by admins**

| Field | Type | Required | Rules |
|---|---|---|---|
| Title | Text | Required | Up to 120 characters |
| Summary | Long text | Required | Up to 300 characters. Shown on cards and to guests |
| Body | Long text | Required | Headings, lists, bold, italic and links. Up to 20,000 characters |
| Diagnoses | Multiple choice | Required, at least 1 | Same list as onboarding |
| Journey stages | Multiple choice | Optional | Same list as onboarding |
| Topics | Multiple choice | Optional | Admin-managed list |
| Reviewed by | Text | Required | Up to 150 characters. Name and credentials. For example "Dr. Aimee Eyvazzadeh, MD, MPH" |
| Sources | Links | Required, at least 1 | Guidelines or studies the article is based on. 1 to 20 links, each up to 2,000 characters |
| Last reviewed | Date | Required | Shown on the article |
| Next review due | Date | Required | Default one year after last reviewed |
| Related groups | Multiple choice | Optional | Linked from the article |
| Status | Single choice | Required | Draft. In review. Published. Unpublished |

**Rules**

- Only published articles are visible to members and used by the Grove Guide.
- An article cannot be published without a reviewer, at least one source and a last reviewed date. The admin sees "Add a reviewer, at least one source and a last reviewed date before publishing."
- Every article shows the same medical disclaimer at the end. It is managed by admins.
- Admins see a list of articles whose next review date has passed, and get a reminder in the admin panel 30 days before.
- "Was this helpful" answers and questions the Grove Guide could not answer are shown to admins to guide which articles to write next.
- Writing and approving articles is outside the platform in the MVP. A clinician editor comes in Phase 2.

**Acceptance criteria (FG-LEARN-01 and FG-LEARN-02)**

1. Given a member with endometriosis in their profile, when they open Learn home, then articles tagged with endometriosis appear first under Recommended for you.
2. Given a guest, when they open an article, then they see only the title and summary and "Join free to read the full article".
3. Given an article with no reviewer, no source or no last reviewed date, when an admin tries to publish it, then publishing is blocked.
4. Given a published article, when a member opens it, then it shows the reviewer's name and credentials, the last reviewed date, its sources and the medical disclaimer at the end.
5. Given an article set to Draft, In review or Unpublished, when a member browses or searches Learn, then it does not appear and the Grove Guide does not use it.
6. Given an article whose next review date is 30 days away, when that day comes, then admins get a reminder, and once the date passes the article shows in the overdue list.
7. Given a member who taps Save on an article, when they open their saved items, then the article is listed there.
8. Given a member with fewer than 4 saved items and health-data consent on, when they open the Saved page, then up to 3 unsaved published articles are suggested under Worth saving, those for their diagnosis first. [Added v1.2]

## 17. Grove Guide AI

The Grove Guide is a private AI assistant with two jobs in the MVP. It answers questions using only the Learn library, with sources shown, and it prepares questions for the member's next doctor visit. It never diagnoses, never gives dosing advice and hands off to people when a member needs support rather than information.

**User stories**

- As a member, I want to ask a question in my own words and get an answer I can trust so that I stop searching forums at night.
- As a member, I want to see where each answer comes from so that I can read more and check it.
- As a member, I want questions prepared for my next appointment so that I make the most of a short visit.
- As a member, I want my chats kept private so that I can ask anything.
- As a member, I want the Guide to tell me when it does not know so that I am never misled.

### Ask the Guide

**Fields**

| Field | Type | Required | Options and rules |
|---|---|---|---|
| Your question | Long text | Required | Up to 1,000 characters, with a live counter. Typing stops at the limit |
| Suggested questions | Single choice | Optional | 3 starter questions based on the member's diagnosis and stage, shown on an empty chat |
| Use my profile answers | Toggle | Optional | On by default. Lets the Guide tailor answers to the member's diagnosis, stage and path. Off and unavailable when health-data consent is withdrawn (section 5) |

**Under the question box, before the member sends, a line shows the cost and balance. "This question uses [N] credits. You have [M] left." The appointment questions form shows the same line.**

**Each answer shows**

- The answer in plain language.
- Links to the Learn articles it used.
- Up to 2 related groups where members discuss this topic.
- Helpful and Not helpful buttons, with an optional reason.
- The cost in AI credits, and the remaining balance.
- A label. "AI, not a doctor. Check with your doctor before acting on this."

### Appointment questions

**Fields**

| Field | Type | Required | Options and rules |
|---|---|---|---|
| Appointment type | Single choice | Required | First consultation. Follow-up. Test results. Monitoring scan. Egg retrieval. Embryo transfer. Second opinion. Other |
| Appointment date | Date | Optional | Shown on the saved list |
| What's on your mind | Long text | Optional | Up to 1,000 characters. Worries or topics to cover |

The Guide returns 8 to 12 questions grouped by topic. A list holds up to 30 questions of up to 300 characters each. The member can edit, delete, reorder and add questions, then save the list, copy it, print it or save it as a PDF, or share it through the device's share options. It is never sent by email. A saved list can also be shared with the partner in the family space (section 7a). Saved lists appear under My appointment questions.

Appointment questions come from general AI knowledge, not only the Learn library, because 6 launch articles cannot cover every appointment type. They carry the "AI, not a doctor" label and never include a diagnosis or dosing advice.

### How the Guide behaves

| Situation | What the Guide does |
|---|---|
| The Learn library covers the question | Answers from those articles and links them |
| The library does not cover it | Says it does not have a reviewed answer yet, suggests asking the doctor or a group, and logs the question for admins |
| The member asks for a diagnosis | Explains it cannot diagnose and suggests questions to ask the doctor |
| The member asks about doses or changing medication | Does not advise. Tells them to contact their clinic |
| The member describes an emergency, such as severe pain or heavy bleeding | Tells them to contact their clinic or emergency services now |
| The member shows signs of crisis or self-harm | Stops the normal answer and shows one-tap Call 988, Text 988 and Chat buttons, with the other crisis resources. The chat stays private. Nothing is sent to moderators |
| The member needs emotional support | Responds kindly and suggests a support group or a mentor |
| A question is off topic | Says it can only help with fertility topics |

**Where members open it** [Added v1.2]

- A floating Grove Guide button sits fixed in the bottom-right corner of every signed-in screen. On phones it sits just above the tab bar. Tapping it opens the Grove Guide.
- It is not shown on the Grove Guide's own screens, in an open direct message conversation, or on public, sign-in and onboarding screens.
- On desktop and tablet it shows the Guide's mark, the label "Grove Guide" and an "AI" tag. On phones it shows the mark only. Its name for screen readers is "Ask Grove Guide, the AI assistant".
- The label folds away while the member scrolls down past the top of the page, and comes back as soon as they scroll up. The mark always stays.
- The Guide is not a navigation item. It is not in the sidebar or the tab bar. The other ways in stay: Ask the Grove Guide on an article (section 16) and the starter questions on onboarding screen 8 (section 5).

**Rules**

- Chats are private to the member. Admins see only anonymous totals and questions the Guide could not answer, never who asked.
- Members can delete a single chat or all chat history.
- For questions, the Guide uses only published Learn articles. Appointment questions also use general AI knowledge. Community posts are never used as a source in the MVP.
- A short disclaimer stays under the chat box. "The Grove Guide shares reviewed information, not medical advice."
- The Guide never diagnoses and never gives dosing or treatment advice. If an answer ever touches on these, it must say clearly that it is an AI, cannot give medical advice, and that the member should talk to their doctor.
- The AI provider keeps no copy of chats and never trains on member data. See section 21.
- Every question and every appointment list uses AI credits, except crisis responses and replies that fail. See section 18.
- What the Guide may and may not say is set by Fertility Grove's advisors and reviewed before launch.

### Acceptance criteria (FG-GUIDE-01 to FG-GUIDE-04)

1. Given a question that the Learn library covers, when the Guide answers, then the answer links the articles it used, shows up to 2 related groups, and shows the credits used and the balance left.
2. Given any Guide answer or appointment question list, when it is shown, then it carries a visible "AI, not a doctor" label telling the member to check with their doctor.
3. Given a question that the Learn library does not cover, when the Guide replies, then it says it does not have a reviewed answer yet, suggests asking the doctor or a group, and logs the question for admins without saying who asked.
4. Given a member who asks for a diagnosis or about doses or changing medication, when the Guide replies, then it does not diagnose or advise, and tells them to ask their doctor or contact their clinic.
5. Given a member who shows signs of crisis or self-harm in a chat, when the Guide replies, then the normal answer stops and one-tap Call 988, Text 988 and Chat buttons with crisis resources are shown.
6. Given a Guide chat that showed crisis resources, when the moderation queues are checked, then nothing from that chat appears in any queue and no moderator or admin can see it.
7. Given a member who asks for appointment questions, when the Guide returns them, then there are 8 to 12 questions grouped by topic that the member can edit, delete, reorder and add to.
8. Given a saved appointment question list, when the member opens its options, then they can print it, save it as a PDF, share it through the device share sheet or copy it, and there is no option to email it.
9. Given a member who deletes one chat or all chat history, when they confirm, then those chats are gone from their history.
10. Given an admin in the Grove Guide area, when they view unanswered questions and ratings, then no member's name, handle or account is shown.
11. Given a member writing a question or an appointment request, when they look under the box before sending, then it shows how many credits it uses and their balance.
12. Given a signed-in member on any screen except the Grove Guide, an open conversation, or public, sign-in and onboarding screens, when the screen loads, then the Grove Guide button shows in the bottom-right corner and opens the Guide when tapped. [Added v1.2]
13. Given a member on a phone, when they look at the Grove Guide button, then it shows the mark only, above the tab bar, and screen readers announce "Ask Grove Guide, the AI assistant". [Added v1.2]

## 18. AI credits and checkout

Every member gets free AI credits each month for the Grove Guide. When they run out, they can buy a credit pack through a Stripe checkout, or wait for the next monthly refill. Everything else in Fertility Grove stays free. Allowance, costs, pack sizes and prices are set by Fertility Grove in the admin panel. The numbers below are placeholders to confirm.

**User stories**

- As a member, I want free credits every month so that I can use the Guide without paying.
- As a member, I want to see my balance before I ask so that I am never surprised.
- As a member, I want to buy more credits in a few taps so that I can keep going before an important appointment.
- As a member, I want a receipt and a purchase history so that I can keep track of what I spent.

![image7.png](prd-images/image7.png)

AI credits, running out and buying a pack

Credits are added only after a successful payment. Crisis responses skip this flow and never need credits.

1. The member asks the Guide. With enough credits, the answer is shown and credits are used.
2. Without enough credits, the Guide shows "You're out of credits" and the next refill date.
3. The member waits for the monthly refill, or picks a pack and pays on Stripe checkout.
4. If payment fails, nothing is added and they can try again.
5. If payment succeeds, credits are added at once, a receipt is emailed, and they can ask again.

**Credit settings, managed by admins**

| Setting | Type | Starting value | Rules |
|---|---|---|---|
| Free credits per month | Number | [\_\_] credits | Refilled on the same day each month, counted from sign-up. In a month without that day, the refill happens on the last day of the month |
| Cost of one Guide question | Number | [\_\_] credits |  |
| Cost of one appointment questions list | Number | [\_\_] credits |  |
| Low balance warning | Number | [\_\_] credits | Shows a warning in the Guide and sends a notification |
| Credit packs | List of packs | 3 packs, [**] credits for [$**] each | Each pack has a name of up to 40 characters, credits and price in US dollars, including sales tax |

**Checkout fields**

| Field | Type | Required | Rules |
|---|---|---|---|
| Credit pack | Single choice | Required | The packs set by admins |
| Payment details | Entered on Stripe's secure checkout | Required | Fertility Grove never sees or stores card details |
| Email for receipt | Email | Required | Prefilled with the account email |

**Where members see credits**

- The balance shows in the Grove Guide header, with the date of the next refill.
- The cost of a question or appointment list, with the balance, shows under the question box before sending (section 17).
- Each answer shows how many credits it used.
- Settings has a Credits page with the balance, the purchase history and a Buy credits button.

**Rules**

- Free credits are used first, then purchased credits.
- Unused free credits do not carry over to the next month. Purchased credits never expire.
- Every reply the Guide delivers is charged, including replies that it has no reviewed answer yet, cannot diagnose, or can only help with fertility topics. If the Guide fails and no reply appears, no credits are used.
- Crisis responses never use credits and are never blocked by a zero balance.
- At zero credits, the Guide shows "You're out of credits" with Buy credits and the next refill date.
- After a successful payment, credits are added at once and a receipt is emailed. A failed payment adds nothing and shows a message to try again.
- A member cannot buy more than 5 packs in one day. The 6th shows "You've reached today's limit of 5 credit packs. Try again tomorrow."
- Credit packs are not refundable. Checkout says so clearly before the member pays.
- Prices include any sales tax. Members pay the price shown. Stripe works out the tax inside each price for Fertility Grove's tax reporting, and the receipt shows it.
- Purchased credits are lost when an account is deleted. The delete pop-up warns first (section 4). They come back if the account is restored within 14 days.
- If a payment is disputed (a chargeback), the credits from that purchase are removed, without the balance going below zero, and the account is flagged for admin review. It shows in the AI credits area (section 20).

**Acceptance criteria (FG-CRED-01 to FG-CRED-03)**

1. Given a member with free and purchased credits, when they ask the Guide a question, then free credits are used first.
2. Given a member who asks a question and the Guide replies that it has no reviewed answer, when the reply is shown, then credits are charged.
3. Given a question where the Guide fails and no reply appears, when the attempt ends, then no credits are taken.
4. Given a member with 0 credits who shows signs of crisis, when they write to the Guide, then the crisis resources are shown and no credits are needed or taken.
5. Given a member with 0 credits, when they ask a normal question, then the Guide shows "You're out of credits" with Buy credits and the next refill date.
6. Given a member whose card payment fails on Stripe checkout, when they return, then no credits are added and they are asked to try again.
7. Given a payment that succeeds, when the member returns from checkout, then the credits are added at once and a receipt email is sent.
8. Given a member who has bought 5 packs today, when they try to buy a sixth, then the purchase is blocked.
9. Given a member who signed up on the 31st, when a month with 30 days comes, then their free credits refill on the 30th.
10. Given a purchase that is charged back, when the chargeback arrives, then that purchase's credits are removed without the balance going below 0 and the account is flagged for admin review.

## 19. Moderation and safety

Members report content, and moderators review it in three queues. Crisis signals go to a priority queue that is always reviewed first, and the member in crisis sees support resources straight away. Every moderator action is explained to the author and written to the audit log.

**User stories**

- As a member, I want to report harmful content in two taps so that the community stays safe.
- As a member in crisis, I want help shown to me right away so that I am not left alone with it.
- As a moderator, I want crisis reports shown before anything else so that I respond to the most urgent cases first.
- As a moderator, I want to remove a post with a clear reason so that the author understands the rule.
- As a member whose post was removed, I want to appeal so that a mistake can be corrected.

![image11.png](prd-images/image11.png)

reports, crisis signals, queues and appeals

A report goes to the queue that matches its reason. Crisis words skip reporting and go straight to Priority. The author also sees crisis resources at once.

1. Crisis signals in any text members write, and reports for self-harm or crisis, go to the Priority queue. Other reports go to the Mentors or Standard queue.
2. A moderator reviews the item and acts.
3. The author is told the reason.
4. The author can appeal within 14 days.
5. The author is told the appeal decision.

**Report fields**

| Field | Type | Required | Options and rules |
|---|---|---|---|
| Reason | Single choice | Required | Self-harm or crisis concern. Medical misinformation. Harassment or bullying. Hate or discrimination. Sexual content. Pretending to be someone else. Spam or selling. Sharing someone's private information. Pregnancy news outside Success stories. Off topic. Other |
| Details | Long text | Required for Other, optional otherwise | Up to 500 characters |
| Also block this member | Toggle | Optional | Off by default |

**Queues**

| Queue | What goes in | Order |
|---|---|---|
| Priority | Reports for self-harm or crisis, and any text with crisis words found automatically (see Rules). Also replies to a Reach out from the Fertility Grove Support account, and Support inbox replies with crisis words | Always first, oldest first |
| Mentors | Any report about a member with the mentor badge | After Priority |
| Standard | All other reports | Most reported first, then oldest |

**Moderator actions**

| Action | What happens | Author is told |
|---|---|---|
| Dismiss | The report closes. Content stays | No |
| Hide while reviewing | Content is hidden from others until a decision | No |
| Remove | Content is removed and replaced with "Removed by a moderator" | Yes, with the reason |
| Move to Success stories | The post moves there | Yes, with the reason |
| Warn | A private warning message from Fertility Grove | Yes |
| Suspend | The member cannot sign in for 1, 7 or 30 days, or permanently | Yes, with the reason and end date |
| Remove mentor badge | The member can no longer mentor. Their tree level stays | Yes, with the reason |
| Reach out | A private message from the Fertility Grove Support account with crisis resources | It is the message |

**Moderator action fields**

| Field | Type | Required | Rules |
|---|---|---|---|
| Action | Single choice | Required | The actions above |
| Reason shown to the author | Single choice plus long text | Required for Remove, Move, Warn, Suspend and Remove badge | Picks a guideline, with an optional note up to 500 characters |
| Suspension length | Single choice | Required for Suspend | 1 day. 7 days. 30 days. Permanent |
| Internal note | Long text | Optional | Up to 1,000 characters. Seen only by moderators and admins |

**Appeal fields**

| Field | Type | Required | Rules |
|---|---|---|---|
| Why this should be reviewed again | Long text | Required | Up to 500 characters. One appeal per action, within 14 days |

**Rules**

- "Crisis words" means a crisis signal found in either of two ways. A phrase list, or an automatic self-harm detector that catches phrasing the list misses. A clinical advisor owns the phrase list, built from 988, Crisis Text Line and AFSP safe-messaging guidance, and admins manage it in Lists. It is reviewed every 3 months. A false alarm only shows crisis resources, and a moderator dismisses it.
- When a post or comment contains crisis words, the author sees a card with crisis resources at once. The content is published as normal and added to the Priority queue. When the automatic detector is highly confident the content describes a method or a plan for self-harm, it is published as Hidden while reviewing instead. The author still sees it and the crisis resources. They are also told, gently, "We've held your post for a moment so our team can check in. You're not alone. If you're in danger now, call or text 988." Others see it only if a moderator restores it. This follows 988 and AFSP safe-messaging guidance.
- "Highly confident" means the detector's score is above a cutoff the clinical advisor approves. Before launch, the advisor approves about 50 example posts: some that must be hidden, and ordinary ones, such as "this cycle is killing me", that must not be. The cutoff is set so every must-hide example is hidden and no more than 1 in 10 ordinary examples is. The examples are rechecked whenever the phrase list is reviewed.
- Crisis words are checked in every piece of text another person reads. Posts, comments, success stories, direct messages and message requests, mentor requests, mentor accept and decline notes, thank-you notes, About me, My story, the mentor bio, family notes, notes on shared family items, appointment question lists shared with Edit, and the partner invite note. Each is checked when it is first saved, and again every time it is edited. For text other than posts, comments and messages, the writer sees the same crisis resources and the item goes to the Priority queue, where moderators see only the flagged text. They never see the rest of the family space or the conversation. Every view is written to the audit log. The Privacy Policy and the community guidelines list every kind of text the crisis check covers and when moderators can see it. Handles are checked when chosen. A handle with crisis words is refused with "That handle isn't available. Try another one." and the member sees the crisis resources.
- Crisis resources are managed by admins and shown in the app, in the Grove Guide and on reported content. In the US this includes the 988 Suicide and Crisis Lifeline.
- Reports are anonymous. The reported member never learns who reported them.
- Members can report a profile from its menu, with the same form and queues. The moderator sees the profile as other members see it.
- Content with 5 or more reports from different members is hidden automatically until a moderator reviews it. Admins can change the number in Limits (section 20).
- When there is more than one moderator, appeals go to a different moderator than the one who acted. At launch, Lauren reviews appeals herself.
- The author is told the appeal decision in the app and by email.
- When an appeal is reversed, the action is undone. Removed or hidden content comes back where it was, and the Sunlight it lost is returned. A suspension ends at once. A removed mentor badge comes back, with mentoring Off. Partner links and mentoring connections that ended are not restored. The member is told they can send a new partner invite or mentor request.
- When a suspended member signs in with the right email and password, they see only a suspension screen. It shows the reason and end date, with Appeal, Download my data and Delete my account, and Restore my account when deletion is pending. Nothing else in the app opens. A wrong password shows the usual sign-in error.
- While suspended, the member's posts and comments stay visible. Mentoring is paused, and their mentees see "Your mentor is away for now." Waiting mentor requests to them are declined with the kind default message. People who message them see "This member can't receive messages right now." The partner link, family space and credits are kept, and free credits keep refilling. Everything resumes when the suspension ends.
- A permanent suspension ends mentoring connections and the partner link, as an unlink does.
- From the suspension screen, the member can appeal, download their data or ask to delete their account. The download works as in section 6, and the suspension screen counts as signing in again.
- Moderators never act under their member identity. Every action records who did it, what, when and why in the audit log.
- Moderation in the MVP is kept minimal and run from the admin panel by Fertility Grove's admin. There are no set hours and no on-call rota. This is an accepted risk. See section 25.
- After reporting, the member sees "Thanks for letting us know. Our team reviews reports within 48 hours." For a Self-harm or crisis concern report, it reads "Thanks for letting us know. We review these first, within 24 hours. If someone is in danger right now, call or text 988."
- The Priority queue is reviewed first, within 24 hours. Other reports are reviewed within 48 hours. Crisis resources are always shown at once, so no one waits for a moderator to get help.

**Error messages**

| Form | When | Message |
|---|---|---|
| Moderator action | Saved without a guideline | Pick the guideline this breaks. |
| Appeal | More than 14 days after the decision | Appeals can be sent within 14 days of a decision. This one can no longer be appealed. |
| Report | 20 reports already this hour | You've reached the limit of 20 reports an hour. Try again a little later. |
| Report | Other is picked and Details is empty | Tell us a little about what's wrong. |

**Acceptance criteria (FG-MOD-01 to FG-MOD-03)**

1. Given a member who reports a post for "Self-harm or crisis concern", when they submit, then the report goes to the Priority queue and they see "Thanks for letting us know. We review these first, within 24 hours. If someone is in danger right now, call or text 988."
2. Given a post or comment that matches the crisis phrase list or the automatic detector, when it is published, then the author sees crisis resources at once, the content is published as normal, and it is added to the Priority queue.
3. Given a moderator opening the queues, when there are items in Priority, Mentors and Standard, then Priority items are shown first (oldest first), then Mentors, then Standard (most reported first, then oldest).
4. Given content reported by 5 different members, when the fifth report arrives, then the content is hidden from others until a moderator reviews it.
5. Given a member whose post is reported, when they look anywhere in the app, then nothing tells them who reported them.
6. Given a moderator who chooses Remove, Move, Warn, Suspend or Remove badge, when they try to save without picking a guideline, then the action is not saved.
7. Given a moderator who removes a post, when it is removed, then others see "Removed by a moderator" in its place and the author gets the Content action email with the guideline and the moderator's note, without the post text.
8. Given a suspended member, when they try to sign in, then they see only the suspension screen with the reason and the end date, and nothing else in the app opens.
9. Given a member whose content was acted on more than 14 days ago, when they try to appeal, then the appeal cannot be sent.
10. Given any moderator action, when it is saved, then the audit log records who did it, what, when and why.
11. Given a post that the automatic detector is highly confident describes a method or plan for self-harm, when it is published, then only the author can see it, they see crisis resources at once, they are told their post is held for the team, and it is in the Priority queue.
12. Given a published post or comment, when its author edits it to add crisis words, then the same crisis handling runs as when it was first published.
13. Given a suspended member, when others view their posts or message them, then the posts are still visible and messages show "This member can't receive messages right now."
14. Given a member opens another member's profile menu, when they tap Report, then the same report form opens and the report goes to the matching queue.
15. Given the advisor-approved example posts, when they are run through the detector before launch, then every must-hide example is hidden and no more than 1 in 10 ordinary examples is.
16. Given a member writes crisis words in a mentor request, when they send it, then they see crisis resources at once and the request is added to the Priority queue.
17. Given a removed post whose appeal is reversed, when the decision is saved, then the post shows again and the Sunlight it lost is returned.
18. Given a permanently suspended member whose appeal is reversed, when the decision is saved, then they can sign in again, and their former partner link stays ended until a new invite is accepted.
19. Given a suspended member, when they try to sign in, then the suspension screen offers Appeal, Download my data and Delete my account.
20. Given a family note flagged by the crisis check, when a moderator opens it from the Priority queue, then they see only that note, not the rest of the family space, and the view is written to the audit log.
21. Given a member who picks a handle containing crisis words, when they save, then it is refused with "That handle isn't available. Try another one." and they see the crisis resources.
22. Given a post that is hidden while reviewing or removed by a moderator, when its author deletes it, then it is deleted for everyone and the moderation record keeps its copy.

## 20. Admin panel

The admin panel is a separate, staff-only area where Fertility Grove runs the platform. Admins see every area below. Moderators see only Moderation, the Support inbox and the read-only member view they need to act on reports.

**User stories**

- As an admin, I want to create and edit groups so that the community fits our members.
- As an admin, I want to publish Learn articles with reviewer and review dates so that every article meets our standard.
- As an admin, I want to tune point values and AI credit settings without a new release so that we can adjust during the beta.
- As an admin, I want to verify clinicians so that their input is clearly marked.
- As an admin, I want to see who did what in the audit log so that every action is accountable.

**Areas**

| Area | What admins do there | Moderators |
|---|---|---|
| Overview | See new members, active members, posts, reports waiting, Guide questions and credit purchases, by day and week | No |
| Members | Search members. See account status, level, badges, linked partner and reports. Suspend or restore. Never see diagnosis or private answers | Read only |
| Roles and badges | Assign moderator and admin roles. Add or remove the verified clinician badge. Remove the mentor badge. Give or remove the Founding mentor badge | No |
| Invites | Create Fertility Grove invite links for the beta and see how many people joined through each. Pause all sign-ups at once if the beta grows faster than moderation can handle. Guests who open sign-up during a pause can leave an email to be told when it reopens | No |
| Groups | Edit the two communities' names, descriptions and who they are suggested to. Create, edit and archive groups. Set group matching tags and who can read. Pick each group's up to 3 reading links. Turn Visible to guests on or off [Updated v1.2] | No |
| Lists | Manage onboarding options, topic tags, report reasons, crisis resources, the crisis phrase list, the community guidelines, the medical disclaimer, the reserved handle list and the Help page. Review the "Other" diagnoses members typed, as an anonymous list with how many typed each | No |
| Email templates | Edit the text of every email template | No |
| Learn | Create, edit, publish and unpublish articles. See articles due for review | No |
| Grove Guide | See questions the Guide could not answer and Helpful ratings, without who asked | No |
| Gamification | Set point values, daily limits and level thresholds | No |
| Limits | Set the spam limits (posts, comments and reports per hour), the new-conversation limit for new accounts, how many reports hide content automatically and the email limits per address (sections 4 and 7) | No |
| Mentoring | See mentoring feedback ("Was this mentoring helpful") | No |
| AI credits | Set the monthly allowance, costs, warning level and credit packs. See purchases and accounts flagged after a chargeback | No |
| Moderation | Work the Priority, Mentors and Standard queues. Review appeals | Yes |
| Support inbox | Read and answer replies to the Fertility Grove Support account. Replies to a Reach out, and replies with crisis words, count as Priority items | Yes |
| Audit log | Read every admin and moderator action | No |

**Verify a clinician fields**

| Field | Type | Required | Rules |
|---|---|---|---|
| Member | Search | Required |  |
| Credentials | Text | Required | Up to 100 characters. For example MD, RN, L.Ac. Shown next to the badge |
| Specialty | Text | Optional | Up to 100 characters. For example reproductive endocrinology |
| How it was verified | Long text | Required | Up to 1,000 characters. Internal note. Never shown to members |

**Rules**

- Only admins can create other admins and moderators.
- Moderator and admin are roles on a member account. The admin panel uses the same sign-in, with no second step. See section 25.
- Admins and moderators never see a member's private answers, Grove Guide chats, messages or family space items. The exceptions are a conversation that was reported, the flagged excerpt of a crisis-flagged conversation (section 14), and a single item flagged by the crisis check, such as a family note or a mentor request (section 19). Every view is written to the audit log.
- Every change in the admin panel is written to the audit log with who, what, when and the previous value.
- The "Other" diagnosis list shows only the words typed and how many members typed each, never who. An entry is removed when the member changes the answer, withdraws consent or deletes their account.
- The audit log cannot be edited or deleted by anyone. Entries are removed automatically after 2 years (section 21).
- Saving a clinician verification with Credentials or How it was verified empty shows "Add the credentials and how they were verified."

**Acceptance criteria (FG-ADM-01 to FG-ADM-03 and FG-AUTH-05)**

1. Given a moderator, when they open the admin panel, then they see only Moderation, the Support inbox and the read-only member view.
2. Given an admin viewing a member in the Members area, when the page loads, then it never shows the member's diagnosis, private answers, Guide chats or unreported messages.
3. Given a member, when an admin assigns them the moderator role, then the admin panel opens for them on their existing account and their member profile looks the same as before.
4. Given an admin verifying a clinician, when they leave Credentials or How it was verified empty, then the badge is not added.
5. Given an admin who adds the verified clinician badge, when they save, then the member's posts and comments show the clinician badge, and "How it was verified" is never shown to members.
6. Given any change in the admin panel, when it is saved, then the audit log records who, what, when and the previous value.
7. Given any admin or moderator, when they try to edit or delete an audit log entry, then they cannot.
8. Given an admin, when they open the Lists area, then they can manage onboarding options, topic tags, report reasons, crisis resources, the crisis phrase list, the community guidelines and the medical disclaimer.
9. Given an admin, when they open Email templates, Lists or Mentoring, then they can edit the text of every email template, review the "Other" diagnoses members typed, and see mentoring feedback.
10. Given an admin in the Groups area, when they look for a way to create or archive a community, then none exists, and they can edit the two communities' name, description, suggested-for and cover image.
11. Given an admin in Roles and badges, when they give a member the Founding mentor badge, then that member can turn on mentoring at any level.
12. Given an admin in Invites, when they pause sign-ups, then no one can create an account with any invite link until sign-ups are turned back on.
13. Given an admin in Limits, when they change a limit and save, then the new limit applies at once and the change is in the audit log.
14. Given an admin opens Overview, when it loads, then it shows new members, active members, posts, reports waiting, Guide questions and credit purchases by day and week, with no individual member's details.
15. Given an admin opens the "Other" diagnoses list, when it loads, then it shows the typed words and counts, and never who typed them.

## 21. Quality, privacy and security

These targets apply to every member and admin screen. Development builds and tests against them.

| Area | Requirement | How it is checked |
|---|---|---|
| Accessibility | Meets WCAG 2.2 AA, the usual bar for ADA compliance in the US | Automated checks on every release. A release with a WCAG 2.2 AA failure is not shipped. A screen reader pass is planned before launch (FG-NFR-03). It is not a launch gate (section 24) |
| Speed | The main content of a page shows within 2.5 seconds on a phone, for at least 75% of visits | Core Web Vitals (Largest Contentful Paint) from real visits |
| Grove Guide speed | The answer starts to appear within 3 seconds and is complete within 15 seconds, for 95% of questions | Measured on every answer |
| Scale | Handles 10,000 members, with 500 using it at the same time | A load test at 3 times that peak, 1,500 at once, planned before opening to everyone (FG-NFR-03). Not a launch gate (section 24) |
| Uptime | Available 99.5% of each month, about 3.6 hours of downtime at most | An outside uptime monitor |
| Browsers and devices | The latest 2 versions of Chrome, Safari (including iPhone), Edge and Firefox, on phones and computers | Tested on each before every release |
| Language | English (US) only in the MVP | Not applicable |
| Backups | Daily backups, kept for 30 days. A restore is tested every 3 months | Restore test record |

**Privacy and health data**

Fertility Grove holds consumer health data. The MVP follows the lessons of the FTC's cases against Flo, GoodRx, BetterHelp, Premom and Cerebral, and the strictest US state law, Washington's My Health My Data Act.

- Health answers (diagnosis, stage, path, treatment and dates) are collected only after a separate, explicit consent on onboarding screen 1. Members can withdraw it in Settings.
- A Consumer Health Data Privacy Policy is published alongside the main Privacy Policy.
- No advertising or tracking pixels on any page, signed in or not, or in any email. This includes the Meta Pixel, TikTok Pixel and Google Ads tags. Success metrics are measured with Fertility Grove's own privacy-safe analytics, which records what members do in the app, never their health answers or what they write. Health data is never sold, and never shared for advertising.
- All data is encrypted in transit and at rest.
- The AI provider keeps no copy of Grove Guide chats and never trains on member data. This is written into the contract.
- If a breach happens, affected members and regulators are told within the deadlines of the FTC Health Breach Notification Rule and state law.
- Members can download their data (section 6) and delete their account (section 4).
- Guests and search engines see a post only when its group is visible to guests and its author turned on Show to visitors, each post one by one (section 10). Comments and profiles are never shown to guests. Joining a group is never public. [Added v1.2]
- Fertility Grove's counsel confirms before launch whether HIPAA applies to any part of the MVP, and which state health-data laws apply.
- Counsel also confirms that requiring the health-data consent to join is allowed (section 5), and the choice to delete posts with an account (section 4).

**Security**

| Area | Requirement |
|---|---|
| Signed-in time | With "Keep me signed in", 30 days on that device. Without it, 1 day, or until the browser closes. Changing the password or email signs out every other device |
| Passwords | 8 to 64 characters, any characters allowed, no forced changes. Checked against lists of known leaked passwords. This follows the US government's NIST guidelines (SP 800-63B) |
| Sign-in attempts | After 5 failed attempts in 15 minutes, sign-in pauses for 15 minutes (section 4) |
| Spam limits | Per member, per hour: 10 posts, 50 comments and 20 reports. Accounts younger than 7 days, up to 10 new conversations a day. Admins change these in the Limits area (section 20) |
| Email limits | Per email address. Up to 3 confirmation or password reset emails an hour, 1 Sign-up attempt email a day, and 3 resends of a partner invite, at most once a day. Admins change these in Limits (section 20) |
| Handles | Reserved handles, such as fertilitygrove, support, admin, moderator, staff and official, cannot be used. A changed handle is held for its owner for 14 days. The owner can switch back to it at any time in those 14 days. A deleted member's handle is retired for good. The Support account has a "Fertility Grove team" badge no member can get |
| Photo uploads | JPG, PNG or HEIC, up to 10 MB. Scanned for viruses. Location data removed. Anything else shows "Use a JPG, PNG or HEIC photo up to 10 MB." |
| Admin panel | Same sign-in as the member account, with no second step. An accepted risk (section 25) |

**How long data is kept**

Fertility Grove keeps data only as long as it is needed.

| Data | Kept for |
|---|---|
| Profile, posts, comments, votes and saved items | Until the member deletes them or the account |
| Health answers | Until the member changes them, withdraws consent or deletes the account |
| Direct messages and mentoring conversations | Until both members have deleted the conversation or their account. When one member's account is deleted, the other keeps the conversation, showing "Deleted member". Delete for me removes only the member's own copy |
| Grove Guide chats and appointment question lists | Until the member deletes them or the account |
| Family space items | Until the owner deletes them or the account. Family notes, until both partners have deleted their copy |
| Reports, moderation actions and appeals | 2 years, then deleted. This includes a copy of the content acted on, even if the author later deletes it |
| Audit log | 2 years, then deleted |
| Sign-in and device records | 90 days |
| Questions the Grove Guide could not answer | Kept with no link to who asked. Deleted after 2 years |
| Data export files | 7 days |
| Credit purchases and receipts | 7 years, even after the account is deleted. Only the date, pack, amount, tax and receipt number, never linked to health answers or activity. Counsel or an accountant confirms the period |
| Partner invites | The invited email of someone who never joined is deleted 30 days after the invite expires or is cancelled |
| Notifications | 90 days |
| Follows and Sunlight history | Until the member unfollows, or the account is deleted |
| Mentoring feedback and thank-you notes | 2 years. When either account is deleted, they stay with no name attached |
| Crisis check flags | 2 years, with the other moderation records |
| Support account conversations and Support inbox items | 2 years, then deleted. The member's own copy follows the direct message rules |
| Emails left while sign-ups are paused | Deleted once the Sign-ups reopened email is sent, or after 90 days |
| "Other" diagnoses typed in onboarding | Until the member changes the answer, withdraws consent or deletes the account. Admins see them only as an anonymous list |
| Retired handles | The handle text only, so it is never reused. Nothing else about the member |
| Backups | 30 days. Deleted data is gone from backups within 30 days |

**Unsaved changes on forms** [Added v1.2]

These forms warn before the member leaves with edits nobody saved.

| Form | "Save and leave" offered |
|---|---|
| Write a post | No |
| Edit a post | Yes |
| Share your story | No |
| Edit profile, on the Dashboard | Yes |
| Settings, Account (email and password) | Yes |
| Settings, Your journey | Yes |
| Mentor setup | Yes |
| Family note, while editing | Yes |
| Appointment question list, while editing a question | Yes for an existing question. No while adding a new one |

- It asks only while the form has unsaved edits, when the member follows any link inside the app (sidebar, tab bar, menus or links on the page), presses the browser's Back button, switches Settings sections, signs out (section 4), or closes Edit profile with its close button or Cancel. A link to another part of the same page does not count as leaving.
- The dialog is titled "You have unsaved changes" and says "If you leave now, what you've changed on this page won't be kept." Its buttons are "Save and leave", only where the form can save in place, "Leave without saving" and "Keep editing".
- "Save and leave" runs the form's normal save and checks. If the save fails, the dialog closes and the member stays on the form with the errors shown.
- Closing or reloading the browser tab shows the browser's own "Leave site?" prompt. Browsers do not allow a custom dialog there.
- A form that was just submitted successfully never asks.

**Acceptance criteria (FG-NFR-01, FG-NFR-02 and FG-NFR-04)** [Updated v1.2]

1. Given any page, signed in or not, or any email, when it loads, then no advertising or tracking pixel loads, including the Meta Pixel, TikTok Pixel and Google Ads tags.
2. Given a member uploads a photo that is not JPG, PNG or HEIC, is over 10 MB or fails the virus scan, when the upload ends, then the photo is rejected. An accepted photo has its location data removed.
3. Given data past its time in "How long data is kept", when the daily cleanup runs, then it is deleted, and it is gone from backups within 30 days.
4. Given a non-member's partner invite that expired or was cancelled 30 days ago, when the cleanup runs, then their email address is deleted.
5. Given a member changed their password, when another of their devices makes its next request, then that device is signed out.
6. Given the analytics tool, when its data is checked, then it holds no health answers, posts, messages, names or emails.
7. Given a member tries to take a handle that is reserved, retired, or held for 14 days after a change, when they save, then it is refused.
8. Given a release candidate, when the automated accessibility checks run, then they find no WCAG 2.2 AA failure.
9. Given real visits over the past 28 days, when Core Web Vitals are checked, then at least 75% of phone visits show the main content within 2.5 seconds.
10. Given the outside uptime monitor's record for a month, when it is checked, then the app was available at least 99.5% of the time.
11. Given a week of Grove Guide answers, when their timings are checked, then 95% started within 3 seconds and finished within 15 seconds.
12. Given a member with unsaved edits in Edit profile, when they tap a sidebar link, then the unsaved-changes dialog opens with "Save and leave", "Leave without saving" and "Keep editing". [Added v1.2]
13. Given a member writing a new post, when they press Back, then the dialog opens without "Save and leave". [Added v1.2]
14. Given a member who taps "Save and leave" with a handle that is taken, when the save fails, then the dialog closes and they stay on Edit profile with "That handle is taken. Try another one." shown. [Added v1.2]
15. Given a member who just saved a form, when they leave the page, then no dialog opens. [Added v1.2]

## 22. Outside services

The MVP depends on these services. Each one can fail without taking the whole app down.

| Service | Used for | If it is down |
|---|---|---|
| Google sign-in | Signing up and signing in with Google | Email sign-in still works. The Google button shows "Google sign-in isn't available right now. Try email instead." |
| Stripe | Credit pack checkout | Free credits still work. Buy credits shows "Payments aren't available right now. Please try again later." |
| AI model provider, to be chosen | Grove Guide answers and appointment questions | The Guide shows "The Grove Guide isn't available right now." No credits are used. Crisis resources still show from the phrase list |
| Automatic self-harm detector | Finding crisis signals the phrase list misses | The phrase list keeps working on its own |
| Leaked-password check, to be chosen | Checking new passwords against known leaks (section 21) | The password is accepted if it meets the other rules, and is checked at the next sign-in |
| Virus scanning, to be chosen | Scanning uploaded photos | The upload is rejected with "Photos can't be uploaded right now. Try again later." Nothing unscanned is shown |
| Email delivery service | All emails | The action still happens and sending is retried (section 15a) |
| 988 Suicide and Crisis Lifeline | Crisis resources | 988 runs independently. Its call and text numbers are shown as plain text, so they work even when a link does not |
| Privacy-safe analytics, to be chosen | Measuring the success metrics | The app works as normal. Metrics have a gap for that time |
| Text message service, to be chosen | Urgent alerts to Lauren (section 22a) | Alerts still go by email to the tech team, who tell Lauren |

**What each service receives**

| Service | What it receives | What it never receives |
|---|---|---|
| Google sign-in | That the member signed in with Google | Health answers, posts, messages or activity |
| Stripe | The account email, the credit pack and the payment | Health answers, posts or messages. Card details stay with Stripe |
| AI model provider | The member's question and chat. With "Use my profile answers" on, also their diagnosis, stage and path | Name, email or handle. It keeps no copy and never trains on it (section 21) |
| Automatic self-harm detector | The text being checked. Everything in the crisis check in section 19, and Grove Guide questions | Name, email or handle |
| Leaked-password check | The first 5 characters of a scrambled (hashed) password, so the password itself is never sent | The password, email or anything else about the member |
| Virus scanning | The uploaded photo, with location data already removed | Name, email, handle or anything else about the member |
| Email delivery service | The email address, first name and the email's text | Post text, message text or any medical detail (section 15a) |
| Text message service | Lauren's phone number and the alert | Member names, handles or anything members write |
| Privacy-safe analytics | What members do in the app, under an internal ID | Health answers, posts, messages, names or emails. Never shared for advertising |
| 988 Suicide and Crisis Lifeline | Nothing. Members contact 988 directly | Anything from Fertility Grove |

## 22a. Alerts

Urgent problems reach Lauren by text message, at any time. Everything else reaches the tech team by email, and they tell Lauren when it affects members. Alerts never include member names, handles or anything members wrote.

| What happens | Who is alerted | How |
|---|---|---|
| A Priority queue item has waited 12 hours without review | Lauren | Text message |
| The automatic self-harm detector is down | Lauren and the tech team | Text to Lauren, email to the team |
| The Grove Guide's AI provider is down | Lauren and the tech team | Text to Lauren, email to the team |
| Payments are failing | Lauren and the tech team | Text to Lauren, email to the team |
| The app is down, found by the outside uptime monitor | Lauren and the tech team | Text to Lauren, email to the team |
| Emails are failing to send | Tech team | Email |
| A daily backup failed | Tech team | Email |
| More than 2% of requests fail for 10 minutes in a row. The tech team can tune this during the beta | Tech team | Email |

**Acceptance criteria (FG-OPS-01)**

1. Given a Priority queue item not reviewed for 12 hours, when the 12th hour passes, then Lauren gets a text message saying an item is waiting, with no member details.
2. Given any alert, when it is sent, then it contains no member name, handle or anything a member wrote.

## 23. Statuses

Each item moves only through the changes listed here. Any change not listed is not allowed.

| Item | Statuses | What moves it |
|---|---|---|
| Account | Unconfirmed → Active. Unconfirmed or Active → Suspended → the status it had before. Any status → Deletion pending → Deleted. Deletion pending → the status it had before | Confirming the email. Google sign-ups start as Active. A moderator suspends, or the suspension ends or is reversed on appeal. The member deletes, signs in within 14 days to restore, or 14 days pass. Restoring returns the status the account had before, so a suspension continues until its end date |
| Onboarding | Not started → In progress → Complete | The member opens screen 1, then reaches screen 8. It never goes back |
| Partner invite | Pending → Accepted, Expired, Cancelled or Not possible | The partner accepts. 14 days pass. The member cancels. The invited person is already linked |
| Partner link | Linked → Unlinked | Either person unlinks or blocks the other, one account is deleted, or one person is permanently suspended |
| Mentoring, for a mentor | Off → On → Paused → On. On or Paused → Off. Any status → Removed. Removed → Off | The mentor turns it on, pauses or turns it off. An admin, or a moderator acting on a report, removes the badge. An admin gives the badge back, or an appeal is reversed. Mentoring also pauses while the mentor is suspended or deleting their account |
| Mentor request | Waiting → Accepted, Declined, Expired or Ended | The mentor accepts or declines, or 7 days pass. Turning mentoring off declines waiting requests. Removing the badge ends them. A block between the two declines it |
| Mentoring connection | Active → Ended | Either person ends it or blocks the other, the mentor badge is removed, either person is permanently suspended, or either account is deleted |
| Group | Draft → Active → Archived. Archived → Active | An admin publishes or archives it, or restores it |
| Learn article | Draft → In review → Published → Unpublished. Unpublished → Published | An admin moves it. Publishing needs a reviewer, a source and a last reviewed date |
| Post and comment | New → Published, or Hidden while reviewing. Published → Hidden while reviewing → Published or Removed. Published → Removed. Published, Hidden while reviewing or Removed → Deleted. Published → Moved to Success stories, posts only, after which it is a Published success story. Removed → Published | The author publishes, edits or deletes it. 5 reports or a high-confidence crisis signal hide it, or a moderator does. A moderator restores, removes or moves it. A reversed appeal publishes removed content again. A high-confidence crisis signal on first save starts it as Hidden while reviewing. Deleting keeps the moderation record (section 21) |
| Report | Open → Closed | A moderator acts. The reported content has its own status, in the Post and comment row |
| Appeal | Open → Decision stands, or Reversed | A moderator decides. Reversing undoes the action (section 19) |
| Credit purchase | Started → Paid or Failed. Paid → Disputed | Stripe confirms or fails the payment. A chargeback arrives |
| Data export | Preparing → Ready → Expired | The file is built. 7 days pass |

## 24. Launch plan

**Beta**

- An 8-week, invite-only beta with about 100 to 300 members from Lauren's community.
- Sign-up needs an invite link from Fertility Grove or from a beta member. Every member has one personal invite link on their Dashboard and onboarding screen 8, built from a fixed code that never changes (section 10). [Updated v1.2] It works for any number of people. Fertility Grove creates its own links in the admin panel's Invites area, sees how many people joined through each, and can pause all sign-ups at once.
- Guest browsing (section 10) is on during the beta. Guests who try to take part are told sign-up is invite-only and can leave an email. [Added v1.2]
- Success metrics (section 1) are checked every week. Point values, daily limits and AI credit settings are tuned in the admin panel.
- Starting targets are reset after the first 4 weeks.

**Gates for opening to everyone in the US**

All of these must be true.

1. Each growth metric in section 1 is at 80% of its target or better. The two safety metrics meet their full target.
2. No open safety issues. In each of the last 2 weeks, 95% or more of Priority items were reviewed within 24 hours. No known bug stops crisis resources from showing.
3. Counsel has finished the legal and privacy review in section 21.
4. Fertility Grove's advisors have approved what the Grove Guide may and may not say (section 17).
5. The clinical advisor has approved the crisis detector's example posts and cutoff (section 19).

Then sign-up opens without an invite link.

If the gates are not all met after 8 weeks, Ben and Lauren review the results together and decide the next step.

## 25. Risks

| Risk | Likelihood | Impact | What we do | Status |
|---|---|---|---|---|
| A member in crisis waits up to 24 hours for human review. One moderator, no backup and no on-call | Medium | High | Crisis resources and 988 show at once, everywhere. Copy never suggests live monitoring | Accepted by Fertility Grove |
| The Grove Guide gives medical advice despite its rules | Medium | High | Rules forbid it. Every answer is labelled "AI, not a doctor". Not helpful ratings are reviewed. There is no formal test before launch | Accepted by Fertility Grove |
| Someone takes over an admin account. The admin panel uses the member password, with no second step | Low | High | New sign-in emails, sign-in pause after 5 failures, audit log | Accepted by Fertility Grove |
| Health data is exposed or misused | Low | High | Privacy rules in section 21. Counsel review before launch | Open |
| A member regrets making a post public. Their group says something about their health, and search engines may keep a copy after they turn it off [Added v1.2] | Medium | Medium | Off by default. Both the group and the author must opt in. Help text says search engines may keep a copy. Extra warning on Support needed and Just venting posts. Turning it off hides the post at once and asks search engines to drop it | Open |
| Members feel cheated paying credits for "no reviewed answer yet", with 6 launch articles | High | Medium | The cost shows before asking. Unanswered questions guide which articles to write next | Accepted. Review in beta |
| Groups feel empty at launch | Medium | High | Invite-only beta from Lauren's community. Launch groups chosen with Lauren. Popular groups fill gaps (section 11) | Open |
| One person (Lauren) runs moderation, admin and appeals | High | Medium | Moderation kept minimal. Content with 5 reports hides automatically | Open |
| Crisis detection flags ordinary posts, such as "this cycle is killing me" | Medium | Low | Only crisis resources are shown. A moderator dismisses it. The phrase list is reviewed every 3 months | Mitigated |
| Point farming or downvote pile-ons | Low | Medium | Daily limits. No Sunlight from new accounts or between partners. No downvotes on support posts | Mitigated |
| Few members reach Blossom Tree during the beta, so there are no mentors | High | High | Admins give the Founding mentor badge to experienced members at launch (section 12) | Mitigated |
| A crisis post that describes a method or plan is read by other vulnerable members | Medium | High | High-confidence posts are hidden until reviewed. Crisis resources show at once (section 19) | Mitigated |
| A blocked partner is told they were blocked, which could put someone in an unhealthy relationship at risk | Low | High | Blocking also unlinks at once and ends all sharing. Crisis resources are always available | Accepted by Fertility Grove |
| Unlimited invites grow the beta faster than one moderator can handle | Medium | High | Admins can pause all sign-ups from the Invites area (section 20) | Open |
| A few people coordinate reports to hide a post | Low | Medium | Auto-hiding needs 5 reports from different members. A moderator restores the post after review | Mitigated |
| Someone uses partner invites to email many people, since a member can have several pending invites and an unconfirmed member can send them | Low | Medium | Resends are limited (section 21). During the beta, sign-up needs an invite link. Admins can pause sign-ups | Accepted by Fertility Grove |
| Counsel finds that a required health-data consent is not allowed | Low | Medium | Counsel reviews before launch. Fallback: members can join without it and get popular groups | Open |

## 26. Glossary

| Term | Meaning |
|---|---|
| Active member | A member who posted, commented, voted, messaged or asked the Grove Guide in a given week. Used in the success metrics and the admin Overview |
| AI credits | What members spend to use the Grove Guide. Free each month, or bought in packs |
| Care provider | A family's doctor, nurse or therapist invited to see shared items. Phase 2 |
| Clinical advisor | A clinician who advises Fertility Grove. Owns the crisis phrase list and the detector's example posts (section 19). With Fertility Grove's other advisors, approves what the Grove Guide may say (section 17) |
| Community | One of the two home spaces, the Women's Community or the Partners & Men's Community. It sets the default feed and suggestions |
| Crisis words | A crisis signal found by the phrase list or the automatic self-harm detector (section 19) |
| Daily update | The one activity email a day, at most |
| Dashboard | The member's own view of their profile, with their posts, replies, groups, saved items and mentoring (section 6). Called "profile" before v1.2. Only they see it [Added v1.2] |
| Display identity | How a member appears to others. Their handle, or their first name and last initial |
| Family space | The shared area for two linked partners |
| Fertility Grove Support account | The account the team uses to message members, for example a moderator's Reach out. Replies go to the Support inbox in the admin panel |
| Feed | The member's home screen with posts from their groups (section 8). Called Home before v1.2. "Home feed" and "home screen" in this PRD mean the Feed [Added v1.2] |
| Founding mentor | An experienced member an admin chose to mentor before reaching Blossom Tree. Same rules as any mentor |
| Grove Guide | The AI assistant. It answers from Learn articles and prepares appointment questions |
| Group | A space for one diagnosis, stage or topic |
| Handle | A chosen name shown with @, used instead of a real name |
| Learn | The library of clinician-reviewed articles |
| Match | A group, person, mentor, article or post suggested from a member's answers, with a reason |
| Members-only group | A group whose posts only members who joined can read. Any member can join |
| Mentor | A member at Blossom Tree or above who turned on mentoring, or a Founding mentor who turned it on |
| Mentoring limit | How many people a mentor takes at once, counting active mentees and waiting requests |
| Message request | A first message from someone the member does not follow. It waits under Requests until accepted |
| Past family notes | A private, read-only copy of family notes each person keeps after partners unlink. Never joins a new family space |
| People search | Search for members by handle only. Never by real name or anything private |
| Popular groups | The groups with the most posts and comments in the last 30 days. Suggested when a member's answers match few groups |
| Priority queue | The moderation queue for crisis signals, replies to a Reach out and Support inbox replies with crisis words, always reviewed first |
| Show to visitors | The author's choice, per post, to let guests and search engines read it. Only in groups visible to guests (section 10) [Added v1.2] |
| Success stories | The separate space for pregnancy news and success stories |
| Visible to guests | An admin setting that lets guests browse a group's page and its posts shown to visitors. Never on Members-only groups (section 8) [Added v1.2] |
| Sunlight | Points members earn when others find them helpful |
| Tech team | The developers who build and run Fertility Grove. They get technical alerts (section 22a) |
| Tree levels | Seed, Bush, Tree, Blossom Tree and Orange Tree. Levels never go down |
| Verified clinician | A clinician whose credentials an admin checked. Their posts carry a badge |

## 27. Not in the MVP, and open questions

**What Fertility Grove is not**

- Not a medical provider. It does not diagnose, treat or prescribe, and it is not telehealth.
- Not a fertility or cycle tracker. Apps like Flo and Ovia already do this.
- Not a replacement for therapy or crisis services. It points members to them.
- Not a clinic directory or marketplace in the MVP.

**Not in the MVP**

| Feature | Planned for, and why |
|---|---|
| Cycle groups for egg freezing and embryo transfer | Phase 2. Needs enough members starting in the same month |
| Partner space | Phase 2. Partners use the main community first, so we learn what they need |
| Mentor availability settings and paid mentor sessions | Phase 2. Free volunteer mentoring is tested first |
| Clinician article editor | Phase 2. The 6 launch articles are written outside the platform |
| Lab result explainer, visit recap, timeline reminders, symptom check-ins, community summaries | Phase 2. Each needs its own medical review |
| Daily quote | Phase 2. Little effect on the MVP goals |
| To-do list and private records storage | Phase 2. Adds more health data to protect |
| Plus accounts | Phase 2. Credit packs test willingness to pay first |
| Care Guide provider directory | Phase 2. Needs provider partnerships |
| Clinic invite links and QR cards | Phase 2. Member invites come first in the beta |
| Care provider access to the family space | Phase 2, after legal review |
| Paperwork helper, weekly partner update, clinic reports | Phase 3. Builds on Phase 2 features |
| Gift Plus, fundraising campaigns, gift wishlist | Phase 3. Payments beyond credits need more legal and tax work |
| Online presence | Phase 3. Comes after the core community works |
| Native iOS and Android apps | Phase 3. The web app works on phones first |
| Push notifications and the installable web app | Not planned yet. Email and in-app notifications come first |
| Images and files in posts and messages, group chats | Not planned yet. Harder to moderate with one moderator |

**Open questions for Lauren**

- ☐ Points name. Sunlight, Drops or Raindrops?
- ☐ Level 2 name. Keep Bush, or use Sprout or Sapling?
- ☐ Starting point values, daily limits and level thresholds in section 13. Keep as proposed?
- ☐ Journey stage, diagnosis and path lists in section 5. Anything to add or rename?
- ☐ Community names and descriptions. Keep Women's Community and Partners & Men's Community as in the prototype?
- ☐ Launch groups. Which diagnosis, stage and topic groups exist on day one, and should one of them be a Partners group?
- ☐ AI credits. Free monthly allowance, cost per question and per appointment list, pack sizes and prices.
- ☐ Exact text of the community guidelines, mentor guidelines and medical disclaimer.
- ☐ Who are the first verified clinicians?
- ☐ Partner sharing in section 7a goes beyond the approved scope sheet. Confirm it is in the MVP. Care provider sharing is Phase 2, after legal review.
- ☐ Who is the clinical advisor who owns the crisis phrase list (section 19)?
- ☐ Which AI provider will the Grove Guide use, and will it agree to no retention and no training (section 21)?
- ☐ Who are the 100 to 300 beta members, and who sends the first invites (section 24)?
- ☐ Counsel. Does HIPAA apply anywhere, and which state health-data laws apply (section 21)?
- ☐ Counsel. Is it allowed to require the health-data consent to join, and is the "Also delete my posts" choice enough (sections 4 and 5)?
- ☐ Counsel or accountant. Is 7 years right for purchase records (section 21)?
- ☐ Who are the founding mentors (section 12)?
- ☐ Which privacy-safe analytics tool, text message service, leaked-password check and virus scanner will we use (section 22)?
- ☐ Confirm the feature priorities in section 27a.
- ☐ Who covers the Priority queue when Lauren is away for more than 12 hours, or is one moderator with no backup accepted (sections 19 and 25)?
- ☐ Matching points in section 11. Keep as proposed?
- ☐ Should the Grove Guide be checked against advisor-approved example questions before launch, as the crisis detector is (sections 17 and 25)?
- ☐ Admin sign-in. Keep the member password with no second step, add a one-time code from an authenticator app for moderators and admins, or use separate staff accounts (sections 20 and 25)?
- ☑ Posts without a source (section 9). Decided: no label and no filter. A missing label means the author gave no source (section 27b). [Added v1.2]
- ☑ Posts and comments a moderator removed, on the Dashboard (section 6). Decided: the author still sees both, marked "Removed by a moderator · Only you can see this", with Appeal and Delete (section 27b). [Added v1.2]
- ☑ Which 4 the Dashboard Mentoring card shows (section 6). Decided: open ones first, then finished ones, each newest first (section 27b). [Added v1.2]
- ☑ Who picks the "From the library" links (sections 8, 16 and 20). Decided: admins, per group, as up to 3 reading links (section 27b). [Added v1.2]
- ☑ Members shown on a group page (sections 8 and 21). Decided: only members who posted in the group, with blocks counted both ways, and none in a Members-only group the viewer has not joined (section 27b). [Added v1.2]
- ☑ What the personal invite link looks like (sections 5, 10 and 24). Decided: one fixed code per member that never changes, never the handle (section 27b). [Added v1.2]
- ☑ Sign out during onboarding (section 4). Decided: it asks too, and lands on the sign-in screen (section 27b). [Added v1.2]

## 27a. Feature priorities

Each feature has an ID for design, development and testing. Must means the MVP cannot launch without it. Should means it is important but can follow within a few weeks of launch. Could means it is nice to have, and is the first to drop if time runs short. This is a first draft for Ben and Lauren to confirm.

| ID | Feature | Priority | Section |
|---|---|---|---|
| FG-AUTH-01 | Email sign-up, confirmation and sign-in | Must | 4 |
| FG-AUTH-02 | Google sign-in | Should | 4 |
| FG-AUTH-03 | Password reset, sign-in pause and signed-in time, and email limits | Must | 4, 21 |
| FG-AUTH-04 | Account deletion with 14 days to restore | Must | 4 |
| FG-AUTH-05 | Beta invite links and pausing sign-ups | Must | 20, 24 |
| FG-AUTH-06 | Landing and Help pages | Must | 4 |
| FG-ONB-01 | 8-screen onboarding that saves progress | Must | 5 |
| FG-ONB-02 | Health-data consent and withdrawal | Must | 5 |
| FG-ONB-03 | Personal start screen | Must | 5 |
| FG-ONB-04 | Complete your profile card | Could | 5 |
| FG-PROF-01 | Profile, display identity and privacy settings | Must | 6 |
| FG-PROF-02 | How others see me preview | Should | 6 |
| FG-PROF-03 | Download my data | Must | 6 |
| FG-PROF-04 | My story | Should | 6 |
| FG-PROF-05 | Dashboard views. Recent activity, the Posts, Replies, Groups and Saved tabs, and the Mentoring card [Added v1.2] | Should | 6 |
| FG-PART-01 | Partner invite, linking, unlinking and blocking | Must | 7 |
| FG-PART-02 | Family space sharing with View and Edit | Must, once confirmed in scope (section 27) | 7a |
| FG-PART-03 | Family space activity list and restoring versions | Should, once confirmed in scope (section 27) | 7a |
| FG-COM-01 | Two communities and groups. Join and leave | Must | 8 |
| FG-COM-02 | Mute a group | Should | 8 |
| FG-COM-03 | Feed sort and filters, and group page sort and filters [Updated v1.2] | Should | 8 |
| FG-COM-04 | "From the library" reading links on group pages [Added v1.2] | Could | 8 |
| FG-COM-05 | Member avatars in the group page header [Added v1.2] | Could | 8 |
| FG-POST-01 | Posts, comments, post types and source tags | Must | 9 |
| FG-POST-02 | Votes and score | Must | 9 |
| FG-POST-03 | Saved posts, success stories and articles, and the Saved page [Updated v1.2] | Should | 6, 9 |
| FG-POST-04 | Topic tags | Could | 9 |
| FG-SOC-01 | Success stories space | Must | 10 |
| FG-SOC-02 | Success story filters | Should | 10 |
| FG-SOC-03 | Follows and the Following tab | Must | 10 |
| FG-SOC-04 | Copy link and send a post in a message, including the attached post card in messages | Should | 10 |
| FG-SOC-05 | Share a post outside Fertility Grove | Could | 10 |
| FG-SOC-07 | Guest browsing. Public feed, public group pages, Show to visitors and Visible to guests [Added v1.2] | Should | 8, 10 |
| FG-SOC-06 | People search by handle | Must | 10 |
| FG-MATCH-01 | Group and article matching with reasons | Must | 11 |
| FG-MATCH-02 | Peer and mentor matching | Must | 11 |
| FG-MATCH-03 | Matched posts in the home feed | Should | 11 |
| FG-MENT-01 | Mentor setup, requests and Mentoring conversations | Must | 12 |
| FG-MENT-02 | Founding mentor badge | Must | 12 |
| FG-MENT-03 | Mentoring feedback and thank-you notes | Could | 12 |
| FG-GAME-01 | Sunlight, tree levels and the tree icon | Must | 13 |
| FG-GAME-02 | Sunlight history and level celebrations | Could | 13 |
| FG-GAME-03 | Referral points | Could | 13 |
| FG-DM-01 | Direct messages, message requests and the Requests tab, block and report | Must | 14 |
| FG-DM-02 | Message search and the All, Unread and Mentoring filters | Should | 14 |
| FG-DM-03 | Edit and delete within 15 minutes | Should | 14 |
| FG-NOTE-01 | In-app notifications, and account and safety emails | Must | 15, 15a |
| FG-NOTE-02 | Daily update email | Must | 15, 15a |
| FG-NOTE-03 | Editing email text in the admin panel | Should | 15a |
| FG-LEARN-01 | Learn library with the 6 reviewed articles | Must | 16 |
| FG-LEARN-02 | Review-due list and reminders | Should | 16 |
| FG-GUIDE-01 | Ask the Guide, with sources and the "AI, not a doctor" label | Must | 17 |
| FG-GUIDE-02 | Crisis handling in the Grove Guide | Must | 17 |
| FG-GUIDE-03 | Appointment questions | Must | 17 |
| FG-GUIDE-04 | Print, PDF and share for appointment lists | Should | 17 |
| FG-CRED-01 | Free monthly credits and balance | Must | 18 |
| FG-CRED-02 | Credit packs and Stripe checkout | Must | 18 |
| FG-CRED-03 | Chargeback handling | Should | 18 |
| FG-MOD-01 | Reports, the three queues and moderator actions | Must | 19 |
| FG-MOD-02 | Crisis detection, crisis resources and the Priority queue | Must | 19 |
| FG-MOD-03 | Appeals | Must | 19 |
| FG-ADM-01 | Admin panel. Members, roles, badges, groups, lists, Learn and credits, limits and the Support inbox | Must | 20 |
| FG-ADM-02 | Audit log | Must | 20 |
| FG-ADM-03 | Overview dashboard | Should | 20 |
| FG-NFR-01 | Speed, uptime, browsers, and automated accessibility checks on every release | Must | 21 |
| FG-NFR-02 | Privacy, security and how long data is kept | Must | 21 |
| FG-NFR-03 | Screen reader pass and load test at 3 times peak | Should | 21 |
| FG-NFR-04 | Unsaved-changes warning on forms [Added v1.2] | Should | 21 |
| FG-OPS-01 | Alerts | Must | 22a |

## 27b. Decisions log

Decisions made while writing this PRD, proposed by Ben for Lauren's approval.

| Decision | Why |
|---|---|
| The Grove Guide crisis response shows crisis resources only, with no team check-in | Keeps chats private. 988 is available at once |
| Lauren alone covers crisis review at launch | One person at launch. Crisis help always shows at once |
| Every Grove Guide reply is charged, except crisis replies and failures | Simple and predictable. The cost shows before asking |
| No formal Grove Guide test before launch. Every answer says "AI, not a doctor" | Fertility Grove's advisors approve the rules before launch |
| Appointment questions use general AI knowledge | 6 launch articles cannot cover every appointment type |
| Care provider access is Phase 2. Partner sharing is in the MVP | Care providers need legal review first |
| Last name is required | Fertility Grove's choice. Only the initial is ever shown |
| Moderator and admin are roles on a member account, with no second sign-in step | Simpler for a one-person team. An accepted risk (section 25) |
| Every feature has acceptance criteria | A clear pass or fail for design and testing |
| Safety metrics must meet their full target at launch. Growth metrics need 80% | Growth can be close. Safety can't slip |
| Crisis items are reviewed within 24 hours, other reports within 48 | One promise everywhere |
| Linked partners never see each other's posts, comments or handle | Keeps each person's account private |
| Account deletion offers "Also delete my posts and comments", ticked by default | Health-data laws give people a right to delete |
| Admins give a Founding mentor badge at launch | Few members reach 750 Sunlight during the beta |
| People a member follows can message them directly. Anyone else sends a message request | Protects members from unwanted messages |
| Member invite links are unlimited, with a pause switch for admins | Fast beta growth, with a way to slow it down |
| Signed in for 30 days with "Keep me signed in", 1 day without | Shared and family devices |
| Data is kept only as long as it is needed (section 21) | Less data to leak |
| Posts describing a self-harm method or plan are hidden until reviewed | Protects other vulnerable readers |
| Crisis words are checked on every edit | Closes a gap in crisis detection |
| Auto-hiding needs 5 reports | Harder to abuse |
| A reported conversation shows its 30 most recent messages | Enough context for a fair decision |
| Location never appears in match reasons | In a small community, location plus diagnosis can identify someone |
| Health-data consent is required. Withdrawing it deletes the answers | Fertility Grove's choice. Counsel confirms |
| No ad trackers on any page | The FTC's cases against GoodRx, BetterHelp and Cerebral |
| Sign-up has no marketing email toggle | No marketing emails in the MVP |
| Active means posted, commented, voted, messaged or asked the Grove Guide that week | Measures real participation |
| The daily update goes out around 8 am local time | When people read their email |
| A suspension pauses rather than erases. Account deletion uses the same away state | Keeps the community's threads whole |
| A blocked partner is told, and so is a member whose invite cannot be accepted | Fertility Grove's choice. An accepted risk (section 25) |
| Shared family items: the last save wins | Simple for two people. History allows a restore |
| Prices include sales tax | One clear price for members |
| Urgent alerts go to Lauren by text | A crisis item can't wait for email |
| If the launch gates are not met, Ben and Lauren decide the next step then | Fertility Grove's choice |
| Members-only groups are never suggested in the home feed, as groups or posts | Their posts stay with people who joined |
| Partner emails name the member by first name only | Linking never reveals a handle |
| All of Follows is a Must | Messaging, the welcome screen and a success metric depend on it |
| Restoring a deleted account returns its earlier status | Deleting can't end a suspension early |
| The credit cost shows under the question box before asking | No surprise charges |
| When a member deletes their account, the other person keeps the conversation | As in Facebook Messenger and WhatsApp. Advice and support aren't lost |
| Purchase records are kept 7 years, with sale details only | US tax record rules. Counsel or an accountant confirms |
| Admins change spam limits and auto-hide in a Limits area | Lauren can react quickly to spam or pile-ons |
| Profiles can be reported | Fake profiles can be reported, as on Instagram and Reddit |
| Public post links are never listed by search engines. Changed in v1.2: still true for posts shared by link only, but posts shown to visitors can be listed [Updated v1.2] | A fertility story shouldn't be searchable for years. In v1.2 the author's separate, deliberate Show to visitors choice, with help text saying copies may last, outweighs this for those posts |
| A community is suggested only when the answers are clear | We don't guess which space someone belongs in |
| Without health-data consent, health fields show "Not shared" | Consent can be withdrawn without pressure |
| Replies to the Support account go to a Support inbox as Priority items | A member who replies may be in crisis |
| The crisis detector is checked against advisor-approved example posts | Makes hiding testable before launch |
| The error alert fires at 2% failed requests for 10 minutes | Alert on what members feel, as Google's SRE guidance advises |
| A linked partner sees the other's first name, only in partner and family space messages | Partners know each other. Community activity never reveals which handle is a partner's |
| "Finds people on the same path" counts real replies, not group joins | Joining is one tap on screen 8. Facebook and Slack measure early success by real two-way connection |
| The author of a held crisis post is told, gently | No one in crisis should wait in silence, as on Instagram and Facebook |
| The crisis check covers all text others read | People show distress wherever they write |
| Admins see "Other" diagnoses only as an anonymous list | Admins never see a member's diagnosis |
| Public health fields start empty, with a "Fill from my profile" button | Privacy by default (GDPR Article 25). Avoids a dark pattern the FTC warns about |
| People search matches handles only | Find people again without exposing who they are, as on Reddit |
| Posts and comments have their own statuses | Moderation, appeals and public links depend on them |
| A reversed appeal undoes the action. Ended partner and mentor links are made again by hand | As on YouTube and under the EU Digital Services Act. The other person may have moved on |
| Unlinked family notes go to a private Past family notes area | A past relationship is never shown to a new partner |
| Only replies to a Reach out, or replies with crisis words, are Priority | Sort by risk, as Crisis Text Line does. Keeps the crisis target honest |
| Emails someone can trigger are limited per address | Stops inbox flooding and invite harassment, as OWASP advises |
| Reserved handles, a 14-day hold on changed handles, and retired handles | Stops impersonation of staff and members, as on Instagram and GitHub |
| Suspended members can download their data | Washington's My Health My Data Act gives a right to access |
| Message search matches only what is on screen | Search never confirms a hidden real name |
| Retention rules for invites, notifications, follows, feedback, crisis flags and retired handles | Keep data only as long as it is needed |
| Landing and Help pages are specified, with a plain privacy summary | Guests see the privacy promise before they sign up |
| A moderator can remove a mentor badge from a report. Only admins give it back | Lauren can act quickly on a report |
| The North Star target is set after 4 weeks of the beta | A target needs a real baseline first |
| The partner invite note shows on the invite page, never in the email | Emails never carry member-written text. Apple Health Sharing keeps shared details inside the app |
| Suspended members see a limited suspension screen to appeal, download their data or delete | As Facebook and Instagram do for disabled accounts. Keeps the right of access under Washington's My Health My Data Act |
| A member can switch back to their held handle within 14 days | As on Instagram. Undoes a mistake without the 30-day wait |
| The Requests tab is part of FG-DM-01, and People search is a Must | Must features can't depend on Should features |
| Moderators see single crisis-flagged items, such as a family note, and the Privacy Policy says so | The same as direct messages. Discord and Instagram disclose safety review of private content |
| A block ends a mentoring connection. The Support account can't be blocked | A block always wins, as on Instagram, Discord and LinkedIn |
| Authors can delete hidden or removed posts. The moderation record keeps its copy | As on Reddit and YouTube. Keeps the right to delete, and appeals still work |
| The pre-launch checks in section 21 are not launch gates | Fertility Grove's choice |
| The crisis check list covers every field others read. Handles with crisis words are refused | A complete list can be tested. Instagram and TikTok screen usernames the same way |
| No extra limits on pending partner invites | Fertility Grove's choice. An accepted risk (section 25) |
| Finishing onboarding and landing in the right groups are measured separately | Onboarding is required, so finishing it says nothing about group fit. Facebook Groups and Slack measure early activity |
| The linked partner setting shows a Partner badge only | Linking never reveals a partner's handle |
| Paused sign-ups offer to email the guest when they reopen | As Clubhouse and Superhuman did during capacity pauses |
| Removing a mentor badge has its own email | Fertility Grove's choice. Clearer for the member |
| Support conversations are kept 2 years | The same as moderation records |
| A post with no source shows no source label, and "no source" gets no filter [Added v1.2] | Absence of a label already says the author gave none. The feed has no source filter to add it to |
| Authors still see their removed posts and comments on the Dashboard, marked, with Appeal and Delete [Added v1.2] | Section 9 lets authors delete removed items, and they need to see them to appeal |
| The Dashboard Mentoring card shows open requests and connections before finished ones [Added v1.2] | A member's current mentors are never pushed off by old, expired requests |
| Admins pick each group's reading links. They are not worked out from Related groups [Added v1.2] | Links go to one section with its own label. With 6 launch articles, picking is a small job |
| Group page avatars show only members who posted in that group, with blocks counted both ways [Added v1.2] | Joining a diagnosis group says something about health. Posters have already shown themselves there |
| The personal invite link uses a fixed code, never the handle [Added v1.2] | A handle link breaks on a handle change, and once the handle is released it credits a stranger |
| Sign out asks first everywhere, onboarding included, and lands on sign-in [Added v1.2] | One behaviour. Onboarding saves after every screen, so nothing is lost |
| Guests can browse a post only when its group is visible to guests and its author turned on Show to visitors [Added v1.2] | The author makes it public on purpose, and admins keep sensitive groups closed |
| Show to visitors is its own toggle, apart from Allow sharing outside [Added v1.2] | A link someone is sent is a smaller step than being listed for anyone to find |
| Visible to guests is a separate group setting, never on Members-only groups [Added v1.2] | Members-only posts stay with people who joined |
| Every post type can be shown to visitors. Support needed and Just venting show an extra warning [Added v1.2] | The author decides, and knows what it means |
| Guests never see comments, only the count [Added v1.2] | Commenters never chose to be public |
| Pages of posts shown to visitors can be listed by search engines [Added v1.2] | Being found in search is the point of guest browsing. Link-only posts stay unlisted |
| Guest browsing runs during the beta, with a waitlist in the sign-up prompt [Added v1.2] | Growth from day one without breaking invite-only sign-up |
