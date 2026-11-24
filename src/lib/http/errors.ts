/* RFC 7807 ProblemDetails, as the API sends every error, and the error the client throws for it. */

export interface ApiProblem {
  type?: string;
  title?: string;
  status: number;
  detail?: string;
  /** Field errors from FluentValidation, keyed by the PascalCase property name. */
  errors?: Record<string, string[]>;
  /** On 403 TERMS_NOT_ACCEPTED: the version to accept. */
  termsVersion?: string;
  /** On 403 ONBOARDING_INCOMPLETE: the screen to resume at. */
  nextStep?: number;
  retryAfter?: number;
}

export const NETWORK_MESSAGE =
  "We couldn't reach Fertility Grove. Check your connection and try again.";
export const SERVER_FAULT_MESSAGE = "Something went wrong on our side. Try again in a moment.";

export class ApiRequestError extends Error {
  readonly problem: ApiProblem;
  readonly status: number;
  /** The response asked for the crisis resources card (X-Show-Crisis-Resources). */
  readonly crisis: boolean;

  constructor(problem: ApiProblem, crisis = false) {
    super(problem.detail || problem.title || "Request failed");
    this.name = "ApiRequestError";
    this.problem = problem;
    this.status = problem.status;
    this.crisis = crisis;
  }

  /** The ProblemDetails `title` doubles as a machine code (TERMS_NOT_ACCEPTED, INVITE_REQUIRED…). */
  get code() {
    return this.problem.title;
  }

  /** The first error for a field, matched case-insensitively ("Email" ↔ "email"). */
  fieldError(field: string): string | undefined {
    const errors = this.problem.errors;
    if (!errors) return undefined;
    const key = Object.keys(errors).find((k) => k.toLowerCase() === field.toLowerCase());
    return key ? errors[key]?.[0] : undefined;
  }

  /** Every field error, first message each, keyed in camelCase. */
  fieldErrors(): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [key, messages] of Object.entries(this.problem.errors ?? {})) {
      const first = messages[0];
      if (!first) continue;
      const leaf = key.split(".").pop() ?? key;
      out[leaf.charAt(0).toLowerCase() + leaf.slice(1)] = first;
    }
    return out;
  }
}

export class NetworkError extends Error {
  constructor(options?: { cause?: unknown }) {
    super(NETWORK_MESSAGE, options);
    this.name = "NetworkError";
  }
}

/** The sentence to show a member for any thrown error. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    const first = Object.values(error.problem.errors ?? {})[0]?.[0];
    if (error.status >= 500 && !error.problem.detail) return SERVER_FAULT_MESSAGE;
    return error.problem.detail || first || error.problem.title || SERVER_FAULT_MESSAGE;
  }
  if (error instanceof NetworkError) return error.message;
  return SERVER_FAULT_MESSAGE;
}

export async function parseProblem(response: Response): Promise<ApiProblem> {
  const fallback: ApiProblem = { status: response.status, title: response.statusText };
  const type = response.headers.get("content-type") ?? "";
  if (!type.includes("json")) return fallback;
  try {
    const body = (await response.json()) as Record<string, unknown>;
    const retry = Number(response.headers.get("retry-after"));
    const unhandled =
      response.status >= 500 &&
      (typeof body.exceptionDetails !== "undefined" || /Exception/.test(String(body.title ?? "")));
    return {
      type: typeof body.type === "string" ? body.type : undefined,
      title: typeof body.title === "string" ? body.title : fallback.title,
      status: typeof body.status === "number" ? body.status : response.status,
      // An unhandled server fault's own wording (an exception message) is never for a member.
      detail: unhandled
        ? SERVER_FAULT_MESSAGE
        : typeof body.detail === "string"
          ? body.detail
          : undefined,
      errors:
        body.errors && typeof body.errors === "object"
          ? (body.errors as Record<string, string[]>)
          : undefined,
      termsVersion: typeof body.termsVersion === "string" ? body.termsVersion : undefined,
      nextStep: typeof body.nextStep === "number" ? body.nextStep : undefined,
      retryAfter: Number.isFinite(retry) && retry > 0 ? retry : undefined,
    };
  } catch {
    return fallback;
  }
}
