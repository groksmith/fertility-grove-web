// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { API_BASE, httpClient, onCrisisSignal } from "./client";
import { ApiRequestError, errorMessage, NetworkError, SERVER_FAULT_MESSAGE } from "./errors";
import { getTokens, setTokens } from "./tokens";

function json(status: number, body: unknown, headers: Record<string, string> = {}) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

const fetchMock = vi.fn<typeof fetch>();
/** The request init of the n-th fetch call. */
const initOf = (n: number): RequestInit => fetchMock.mock.calls[n]?.[1] ?? {};
const authOf = (n: number) => (initOf(n).headers as Record<string, string>).Authorization;

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  setTokens({ accessToken: "a1", refreshToken: "r1", keepSignedIn: false });
});
afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
  setTokens(null);
});

describe("httpClient", () => {
  it("sends the bearer token and builds the query", async () => {
    fetchMock.mockResolvedValueOnce(json(200, { ok: 1 }));
    await httpClient.get("/feed", { query: { page: 2, groupIds: ["a", "b"], sort: undefined } });
    expect(fetchMock.mock.calls[0]?.[0]).toBe(`${API_BASE}/feed?page=2&groupIds=a&groupIds=b`);
    expect(authOf(0)).toBe("Bearer a1");
    expect(initOf(0).credentials).toBe("omit");
  });

  it("includes cookies on auth routes only", async () => {
    fetchMock.mockResolvedValueOnce(json(200, {}));
    await httpClient.post("/auth/login", { email: "x" }, { anonymous: true });
    expect(initOf(0).credentials).toBe("include");
    expect(authOf(0)).toBeUndefined();
  });

  it("refreshes once on 401 and retries with the new token", async () => {
    fetchMock
      .mockResolvedValueOnce(json(401, { title: "Unauthorized", status: 401 }))
      .mockResolvedValueOnce(
        json(200, { accessToken: "a2", refreshToken: "r2", keepSignedIn: false }),
      )
      .mockResolvedValueOnce(json(200, { done: true }));
    await expect(httpClient.get("/profile/me")).resolves.toEqual({ done: true });
    expect(getTokens()?.accessToken).toBe("a2");
    expect(authOf(2)).toBe("Bearer a2");
  });

  it("maps ProblemDetails, field errors and the crisis header", async () => {
    const seen = vi.fn();
    const off = onCrisisSignal(seen);
    fetchMock.mockResolvedValueOnce(
      json(
        422,
        { title: "Validation", status: 422, errors: { Handle: ["That handle isn't available."] } },
        { "x-show-crisis-resources": "true" },
      ),
    );
    const error = (await httpClient
      .put("/profile/me/handle", { handle: "x" })
      .catch((e: unknown) => e)) as ApiRequestError;
    off();
    expect(error).toBeInstanceOf(ApiRequestError);
    expect(error.crisis).toBe(true);
    expect(error.fieldErrors()).toEqual({ handle: "That handle isn't available." });
    expect(errorMessage(error)).toBe("That handle isn't available.");
    expect(seen).toHaveBeenCalledOnce();
  });

  it("never shows an unhandled exception's text", async () => {
    fetchMock.mockResolvedValueOnce(
      json(500, { title: "Npgsql.PostgresException", status: 500, detail: "42703: column" }),
    );
    const error = await httpClient.get("/groups").catch((e) => e);
    expect(errorMessage(error)).toBe(SERVER_FAULT_MESSAGE);
  });

  it("turns a failed fetch into a NetworkError", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    await expect(httpClient.get("/groups")).rejects.toBeInstanceOf(NetworkError);
  });

  it("returns undefined on 204", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(httpClient.post("/auth/logout")).resolves.toBeUndefined();
  });
});
