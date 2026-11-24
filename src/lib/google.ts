/* Google Identity Services: loads Google's script once and asks for an ID token (the credential the
   API's POST /auth/google verifies). The app keeps its own "Continue with Google" button; this only
   opens Google's account chooser behind it. */

import { env } from "@/config/env";

interface GoogleId {
  initialize(config: {
    client_id: string;
    callback: (response: { credential?: string }) => void;
    cancel_on_tap_outside?: boolean;
    use_fedcm_for_prompt?: boolean;
  }): void;
  prompt(
    listener?: (n: {
      isNotDisplayed?: () => boolean;
      isSkippedMoment?: () => boolean;
      isDismissedMoment?: () => boolean;
      getDismissedReason?: () => string;
    }) => void,
  ): void;
}

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleId } };
  }
}

export const GOOGLE_UNAVAILABLE = "Google sign-in isn't available right now. Try email instead.";

let loading: Promise<GoogleId> | null = null;

function load(): Promise<GoogleId> {
  if (loading) return loading;
  loading = new Promise<GoogleId>((resolve, reject) => {
    const ready = () => {
      const id = window.google?.accounts?.id;
      if (id) resolve(id);
      else reject(new Error(GOOGLE_UNAVAILABLE));
    };
    if (window.google?.accounts?.id) return ready();
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = ready;
    script.onerror = () => {
      loading = null;
      reject(new Error(GOOGLE_UNAVAILABLE));
    };
    document.head.appendChild(script);
  });
  return loading;
}

/** Resolves with a Google ID token, or rejects with a sentence for the member. */
export async function googleIdToken(): Promise<string> {
  if (!env.googleClientId) throw new Error(GOOGLE_UNAVAILABLE);
  const id = await load();
  return new Promise<string>((resolve, reject) => {
    id.initialize({
      client_id: env.googleClientId,
      cancel_on_tap_outside: false,
      use_fedcm_for_prompt: true,
      callback: (response) => {
        if (response.credential) resolve(response.credential);
        else reject(new Error(GOOGLE_UNAVAILABLE));
      },
    });
    id.prompt((n) => {
      const dismissed =
        n.isDismissedMoment?.() && n.getDismissedReason?.() !== "credential_returned";
      if (n.isNotDisplayed?.() || n.isSkippedMoment?.() || dismissed) {
        reject(new Error("Google sign-in was closed. Try again, or use email instead."));
      }
    });
  });
}
