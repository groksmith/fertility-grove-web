/* The auth endpoints: sign-up, sign-in (email and Google), email confirmation, password reset,
   Terms re-acceptance and sign-out. Each resolves to the `Result` the screens already handle; the
   session itself is loaded into the store by `session.ts`. */

import { attempt, failure, ok, type Result } from "@/lib/api/result";
import { GOOGLE_UNAVAILABLE, googleIdToken } from "@/lib/google";
import { ApiRequestError } from "@/lib/http";
import { demoResult, get, isDemo, set } from "@/lib/mock-server";
import { notice } from "@/lib/notice";
import { normalizeEmail } from "@/lib/rules/validation";
import { authApi, type LoginResponse } from "./api";
import { demo } from "./demo";
import { endSession, loadSession, startSession } from "./session";

type SignUpResult =
  | { ok: true; duplicate: boolean }
  | { ok: false; error: string; errs?: Record<string, string> };

/** The API names fields as it binds them; the forms name them as the PRD does. */
const SIGN_UP_FIELDS: Record<string, string> = {
  email: "email",
  password: "password",
  isAdult: "adult",
  acceptsTerms: "terms",
};

function signUpErrors(errs: Record<string, string> | undefined) {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(errs ?? {})) out[SIGN_UP_FIELDS[k] ?? k] = v;
  return out;
}

async function signedIn(r: LoginResponse) {
  await startSession(r);
  if (r.wasRestored) notice("Your account is back. Nothing will be deleted.");
}

export const authService = {
  /** POST /auth/signup (email) or POST /auth/google (Google, with the two toggles). */
  async signUp(input: {
    email: string;
    password?: string;
    adult: boolean;
    terms: boolean;
    google?: boolean;
  }): Promise<SignUpResult> {
    if (isDemo()) {
      const r = demoResult(demo.signUp(input));
      return r.ok ? { ok: true, duplicate: false } : r;
    }
    const invite = get().pendingInvite;
    try {
      if (input.google) {
        const idToken = await googleIdToken();
        const r = await authApi.google({
          idToken,
          keepSignedIn: false,
          isAdult: input.adult,
          acceptsTerms: input.terms,
          inviteCode: invite?.code ?? null,
          partnerInviteToken: invite?.partnerToken ?? null,
        });
        await signedIn(r);
        return { ok: true, duplicate: false };
      }
      await authApi.signUp({
        email: normalizeEmail(input.email),
        password: input.password ?? "",
        isAdult: input.adult,
        acceptsTerms: input.terms,
        inviteCode: invite?.code ?? null,
        partnerInviteToken: invite?.partnerToken ?? null,
      });
      // A duplicate email gets the same 202 and the same screen (PRD §4); the API never says.
      set((s) => ({ ...s, me: { ...s.me, email: normalizeEmail(input.email) } }));
      return { ok: true, duplicate: false };
    } catch (error) {
      if (error instanceof Error && !(error instanceof ApiRequestError) && error.message) {
        return { ok: false, error: error.message };
      }
      const f = failure(error);
      return { ok: false, error: f.ok ? "" : f.error, errs: signUpErrors(f.ok ? {} : f.errs) };
    }
  },

  /** POST /auth/login. A sign-in within 14 days of deleting also restores the account. */
  signIn(email: string, password: string, keep: boolean): Promise<Result> {
    if (isDemo()) return Promise.resolve(demoResult(demo.signIn(email, password, keep)));
    return attempt(async () => {
      const r = await authApi.login({ email: normalizeEmail(email), password, keepSignedIn: keep });
      await signedIn(r);
    });
  },

  /** POST /auth/google for an existing account (sign-in screen). */
  async signInWithGoogle(keep: boolean): Promise<Result> {
    if (isDemo()) return demoResult(demo.signInWithGoogle(keep));
    let idToken: string;
    try {
      idToken = await googleIdToken();
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : GOOGLE_UNAVAILABLE };
    }
    const invite = get().pendingInvite;
    return attempt(async () => {
      const r = await authApi.google({
        idToken,
        keepSignedIn: keep,
        isAdult: false,
        acceptsTerms: false,
        inviteCode: invite?.code ?? null,
        partnerInviteToken: invite?.partnerToken ?? null,
      });
      await signedIn(r);
    });
  },

  /** POST /auth/logout, allowed during onboarding. Local state goes whatever the answer. */
  async signOut() {
    // Signing out of the offline demo leaves it: the next sign-in is a real one.
    if (isDemo()) return endSession();
    try {
      await authApi.logout();
    } catch {
      /* the session ends locally regardless */
    }
    endSession();
  },

  logout() {
    return authService.signOut();
  },

  /** POST /auth/sign-out-everywhere: every session on every device ends, this one included. */
  async signOutEverywhere(): Promise<Result> {
    if (isDemo()) {
      endSession();
      return ok();
    }
    const r = await attempt(() => authApi.signOutEverywhere());
    if (r.ok) endSession();
    return r;
  },

  /** POST /auth/verify-email with the link's token. */
  async confirmEmail(token: string): Promise<Result> {
    if (isDemo()) return demo.confirmEmail();
    if (!token) return { ok: false, error: "" };
    const r = await attempt(() => authApi.verifyEmail(token));
    if (r.ok) await loadSession();
    return r;
  },

  /** POST /auth/resend-verification. The same answer whether or not the email exists. */
  resendLink(email?: string): Promise<Result> {
    if (isDemo()) {
      demo.resendLink();
      return Promise.resolve(ok());
    }
    const to = email || get().pendingEmail || get().me.email;
    if (!to) return Promise.resolve(ok());
    return attempt(() => authApi.resendVerification(to));
  },

  /** POST /auth/forgot-password. The same message whether or not an account exists. */
  forgotPassword(email: string): Promise<Result> {
    if (isDemo()) return Promise.resolve(ok());
    return attempt(() => authApi.forgotPassword(normalizeEmail(email)));
  },

  /** POST /auth/reset-password with the link's email and token. Ends every session. */
  async resetPassword(
    link: { email: string; token: string },
    pw: string,
    confirm: string,
  ): Promise<{ ok: true } | { ok: false; error: string; errs: Record<string, string> }> {
    if (isDemo()) {
      const r = demo.resetPassword(pw, confirm);
      return r.ok ? r : { ...r, errs: r.errs };
    }
    try {
      await authApi.resetPassword({
        email: link.email,
        token: link.token,
        newPassword: pw,
        confirmNewPassword: confirm,
      });
      endSession();
      return { ok: true };
    } catch (error) {
      const f = failure(error);
      if (f.ok) return { ok: true };
      const errs: Record<string, string> = {};
      for (const [k, v] of Object.entries(f.errs ?? {})) {
        errs[k === "confirmNewPassword" ? "confirm" : k === "newPassword" ? "password" : k] = v;
      }
      return { ok: false, error: Object.keys(errs).length ? "" : f.error, errs };
    }
  },

  /** POST /auth/terms with the version the member was shown. */
  async acceptTerms(version: string): Promise<Result> {
    if (isDemo()) return ok();
    const r = await attempt(() => authApi.acceptTerms(version));
    if (r.ok) await loadSession();
    return r;
  },

  /** Remember the invite a link carried, so sign-up sends it (PRD §24 beta). */
  arriveWithInvite(kind: "beta" | "partner", value: string, inviterFirstName?: string) {
    if (isDemo()) return demo.arriveWithInvite(kind);
    set((s) => ({
      ...s,
      pendingInvite:
        kind === "beta"
          ? { code: value }
          : { partnerToken: value, inviterFirstName: inviterFirstName || undefined },
      invitedBy: kind === "partner" ? inviterFirstName || s.invitedBy : s.invitedBy,
    }));
  },

  /** POST /auth/sign-up-waitlist: kept while sign-ups are paused or invite-only. */
  joinWaitlist(email: string): Promise<Result> {
    if (isDemo()) return Promise.resolve(demoResult(demo.joinWaitlist(email)));
    return attempt(() => authApi.waitlist(normalizeEmail(email)));
  },

  /** PUT /auth/account: a new sign-in email, confirmed by a link sent to it. */
  async changeEmail(email: string, currentPassword: string): Promise<Result> {
    if (isDemo()) {
      set((s) => ({ ...s, me: { ...s.me, email: normalizeEmail(email) } }));
      return ok();
    }
    const r = await attempt(() => authApi.changeEmail(normalizeEmail(email), currentPassword));
    if (r.ok) await loadSession();
    return r;
  },

  /** POST /auth/account/deletion. Every session ends; signing in within 14 days restores it. */
  async requestDeletion(deletePosts: boolean): Promise<Result & { deletesOn?: string }> {
    try {
      const r = await authApi.requestDeletion(deletePosts);
      endSession();
      return { ok: true, note: r.deletesOn };
    } catch (error) {
      return failure(error);
    }
  },
};
