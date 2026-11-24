/* Public runtime configuration. `NEXT_PUBLIC_*` values are inlined at build time, so each deploy's
   `.env` decides which API the bundle talks to. */

const DEFAULT_API_URL = "https://api.fertilitygrove.click";

function trimSlash(url: string) {
  return url.replace(/\/+$/, "");
}

export const env = {
  /** The API origin, without `/api/v1`. */
  apiUrl: trimSlash(process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL),
  /** Google Identity Services web client id. Empty hides nothing: the button reports it's off. */
  googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
} as const;
