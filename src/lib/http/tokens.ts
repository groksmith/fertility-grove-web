/* The session's bearer and refresh tokens. "Keep me signed in" keeps them in localStorage (they
   survive the browser closing); otherwise sessionStorage (this tab's session only). The access token
   is also held in memory so a request never waits on storage. */

const KEY = "fg-session";

export interface Tokens {
  accessToken: string;
  refreshToken: string;
  keepSignedIn: boolean;
}

let memory: Tokens | null = null;
let loaded = false;
const listeners = new Set<() => void>();

function stores(): Storage[] {
  if (typeof window === "undefined") return [];
  const out: Storage[] = [];
  try {
    out.push(window.localStorage);
  } catch {
    /* blocked */
  }
  try {
    out.push(window.sessionStorage);
  } catch {
    /* blocked */
  }
  return out;
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  for (const store of stores()) {
    try {
      const raw = store.getItem(KEY);
      if (raw) {
        memory = JSON.parse(raw) as Tokens;
        return;
      }
    } catch {
      /* unreadable: treat as signed out */
    }
  }
}

export function getTokens(): Tokens | null {
  load();
  return memory;
}

export function setTokens(next: Tokens | null) {
  load();
  memory = next;
  for (const store of stores()) {
    try {
      store.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }
  if (next && typeof window !== "undefined") {
    try {
      (next.keepSignedIn ? window.localStorage : window.sessionStorage).setItem(
        KEY,
        JSON.stringify(next),
      );
    } catch {
      /* in-memory only */
    }
  }
  for (const l of listeners) l();
}

export function hasSession() {
  return !!getTokens()?.accessToken;
}

export function onTokensChange(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
