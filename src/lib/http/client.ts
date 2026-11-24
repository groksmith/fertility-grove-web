/* The one way the browser talks to the API (`/api/v1`). Bearer auth with a single refresh in flight,
   ProblemDetails → ApiRequestError, the account-wide 403 gates routed centrally, and the crisis
   header surfaced on every response. Modelled on pharos-web's `lib/http.client.ts`. */

import { env } from "@/config/env";
import { ApiRequestError, NetworkError, parseProblem } from "./errors";
import { getTokens, setTokens } from "./tokens";

export const API_BASE = `${env.apiUrl}/api/v1`;

/** Where the global 403 gates and an ended session send the member. */
export const ROUTES = {
  signIn: "/login",
  acceptTerms: "/accept-terms",
  onboarding: (step: number) => `/onboarding/${Math.min(Math.max(step, 1), 8)}`,
} as const;

type QueryValue = string | number | boolean | null | undefined;
export type Query = Record<string, QueryValue | QueryValue[]>;

export interface RequestOptions {
  query?: Query;
  signal?: AbortSignal;
  /** Anonymous call: no bearer, no refresh, no gate routing. */
  anonymous?: boolean;
  /** Don't route 403 gates (the screens that handle them themselves). */
  noGateRedirect?: boolean;
}

export interface Sent<T> {
  data: T;
  /** The response carried `X-Show-Crisis-Resources: true`. */
  crisis: boolean;
}

/* ---------------------------------------------------------------- Crisis */

const crisisListeners = new Set<() => void>();
/** Subscribe to every response that asks for the crisis resources card. */
export function onCrisisSignal(fn: () => void) {
  crisisListeners.add(fn);
  return () => {
    crisisListeners.delete(fn);
  };
}
function crisisOf(response: Response) {
  const on = response.headers.get("x-show-crisis-resources") === "true";
  if (on) for (const l of crisisListeners) l();
  return on;
}

/* --------------------------------------------------------------- Refresh */

let inFlight: Promise<boolean> | null = null;

async function refresh(): Promise<boolean> {
  const tokens = getTokens();
  if (!tokens?.refreshToken) return false;
  try {
    const response = await fetch(`${API_BASE}/auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      credentials: "include",
      cache: "no-store",
    });
    if (!response.ok) return false;
    const body = (await response.json()) as {
      accessToken?: string | null;
      refreshToken?: string | null;
      keepSignedIn?: boolean;
    };
    if (!body.accessToken) return false;
    setTokens({
      accessToken: body.accessToken,
      refreshToken: body.refreshToken || tokens.refreshToken,
      keepSignedIn: body.keepSignedIn ?? tokens.keepSignedIn,
    });
    return true;
  } catch {
    return false;
  }
}

/** One refresh at a time, however many requests hit 401 together. */
export function tryRefresh(): Promise<boolean> {
  if (!inFlight) {
    inFlight = refresh().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

/* ----------------------------------------------------------------- Gates */

function go(path: string) {
  if (typeof window === "undefined") return;
  if (window.location.pathname === path.split("?")[0]) return;
  window.location.assign(path);
}

function endSession() {
  setTokens(null);
  go(ROUTES.signIn);
}

/* --------------------------------------------------------------- Request */

function buildUrl(path: string, query?: Query) {
  const url = new URL(`${API_BASE}${path.startsWith("/") ? path : `/${path}`}`);
  for (const [key, raw] of Object.entries(query ?? {})) {
    for (const value of Array.isArray(raw) ? raw : [raw]) {
      if (value === null || value === undefined || value === "") continue;
      url.searchParams.append(key, String(value));
    }
  }
  return url.toString();
}

async function perform(
  method: string,
  path: string,
  body: unknown,
  options: RequestOptions,
  retry: boolean,
): Promise<Response> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = options.anonymous ? undefined : getTokens()?.accessToken;
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: options.signal,
      // The auth routes set and read the HttpOnly `device_id` cookie (new-sign-in email).
      credentials: path.startsWith("/auth/") ? "include" : "omit",
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new NetworkError({ cause: error });
  }

  if (response.status === 401 && retry && token) {
    if (await tryRefresh()) return perform(method, path, body, options, false);
    endSession();
  }
  return response;
}

async function routeGate(response: Response, options: RequestOptions) {
  if (response.status !== 403 || options.anonymous || options.noGateRedirect) return;
  const problem = await parseProblem(response.clone());
  if (problem.title === "TERMS_NOT_ACCEPTED") {
    const v = problem.termsVersion ? `?v=${encodeURIComponent(problem.termsVersion)}` : "";
    go(`${ROUTES.acceptTerms}${v}`);
  } else if (problem.title === "ONBOARDING_INCOMPLETE") {
    go(ROUTES.onboarding(problem.nextStep ?? 1));
  }
}

async function send<T>(
  method: string,
  path: string,
  body: unknown,
  options: RequestOptions = {},
): Promise<Sent<T>> {
  const response = await perform(method, path, body, options, true);
  const crisis = crisisOf(response);
  if (!response.ok) {
    await routeGate(response, options);
    throw new ApiRequestError(await parseProblem(response), crisis);
  }
  if (response.status === 204) return { data: undefined as T, crisis };
  const type = response.headers.get("content-type") ?? "";
  if (type.includes("json")) return { data: (await response.json()) as T, crisis };
  return { data: (await response.text()) as T, crisis };
}

function filenameOf(header: string | null): string | null {
  if (!header) return null;
  const star = /filename\*=(?:UTF-8'')?([^;]+)/i.exec(header);
  if (star?.[1]) {
    try {
      return decodeURIComponent(star[1].replace(/^"|"$/g, "").trim());
    } catch {
      /* fall through */
    }
  }
  return /filename="?([^";]+)"?/i.exec(header)?.[1]?.trim() ?? null;
}

/** A POST answered with a file (the data export zip). Errors are still ProblemDetails. */
async function download(
  path: string,
  body: unknown,
  options: RequestOptions = {},
): Promise<{ blob: Blob; filename: string | null }> {
  const response = await perform("POST", path, body, options, true);
  if (!response.ok) {
    await routeGate(response, options);
    throw new ApiRequestError(await parseProblem(response), crisisOf(response));
  }
  return {
    blob: await response.blob(),
    filename: filenameOf(response.headers.get("content-disposition")),
  };
}

export const httpClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    send<T>("GET", path, undefined, options).then((r) => r.data),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    send<T>("POST", path, body ?? {}, options).then((r) => r.data),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    send<T>("PUT", path, body ?? {}, options).then((r) => r.data),
  delete: <T>(path: string, options?: RequestOptions) =>
    send<T>("DELETE", path, undefined, options).then((r) => r.data),
  /** Same calls, also returning whether the crisis card was asked for. */
  send,
  download,
};
