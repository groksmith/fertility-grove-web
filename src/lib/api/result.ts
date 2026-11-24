/* What every service method resolves to, mock or API: the screens' `useResult` reads it. A refused
   request becomes `{ ok: false }` with the API's own sentence; field errors ride along in `errs`. */

import { ApiRequestError, errorMessage, type Sent } from "@/lib/http";
import type { CrisisLevel } from "@/lib/rules/crisis";

export type Result =
  | { ok: true; id?: string; crisis?: CrisisLevel; note?: string }
  | {
      ok: false;
      error: string;
      code?: "unconfirmed" | "join" | "credits";
      errs?: Record<string, string>;
    };

export const ok = (extra: Omit<Extract<Result, { ok: true }>, "ok"> = {}): Result => ({
  ok: true,
  ...extra,
});
export const fail = (error: string, code?: "unconfirmed" | "join" | "credits"): Result => ({
  ok: false,
  error,
  code,
});

/** A thrown request error as a failed Result. */
export function failure(error: unknown): Extract<Result, { ok: false }> {
  if (error instanceof ApiRequestError) {
    const code = error.code === "EMAIL_NOT_CONFIRMED" ? "unconfirmed" : undefined;
    const errs = error.fieldErrors();
    return { ok: false, error: errorMessage(error), code, errs };
  }
  return { ok: false, error: errorMessage(error) };
}

/** The write models' crisis flags as the level the crisis dialog shows: held → "high"; resources
    asked for (body flag or response header) → "signal". */
export function crisisOf(
  sent: Pick<Sent<unknown>, "crisis">,
  body?: { showCrisisResources?: boolean; heldForReview?: boolean } | null,
): CrisisLevel | undefined {
  if (body?.heldForReview) return "high";
  if (body?.showCrisisResources || sent.crisis) return "signal";
  return undefined;
}

/** Run a request and fold its outcome into a Result. */
export async function attempt<T>(
  run: () => Promise<T>,
  then?: (value: T) => Omit<Extract<Result, { ok: true }>, "ok"> | undefined,
): Promise<Result> {
  try {
    const value = await run();
    return ok(then?.(value) ?? {});
  } catch (error) {
    return failure(error);
  }
}
