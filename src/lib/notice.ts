/* A tiny bus for messages raised outside React (a background save that failed). The app's Toaster
   shows them; services raise them without importing UI. */

const listeners = new Set<(text: string) => void>();

export function notice(text: string) {
  for (const l of listeners) l(text);
}

export function onNotice(fn: (text: string) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/* The crisis card: a screen that shows it for its own action marks it handled, so the app-wide
   watcher (for saves that have no screen of their own to show it) doesn't open a second one. */
let crisisHandledAt = 0;
export function markCrisisHandled() {
  crisisHandledAt = Date.now();
}
export function crisisRecentlyHandled(withinMs = 1500) {
  return Date.now() - crisisHandledAt < withinMs;
}
