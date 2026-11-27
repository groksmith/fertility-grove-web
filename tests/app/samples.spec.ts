import { expect, type Request, test } from "@playwright/test";

import { mockApi, signIn } from "../fixtures/api";
import { watchPageHealth } from "../fixtures/page-health";

// While the backend has no content, the prototype's samples stand in, marked "Sample" and
// read-only; real content replaces them.

const EMPTY_LIBRARY = {
  "GET /learn/articles": { articles: [], totalCount: 0, page: 1, pageSize: 20 },
  "GET /learn/recommended": { isPersonal: false, articles: [] },
};

test("an empty library shows the sample articles, read-only", async ({ page }) => {
  const health = watchPageHealth(page);
  const writes: Request[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/v1/learn/") && r.method() !== "GET") writes.push(r);
  });
  await signIn(page, EMPTY_LIBRARY);
  await page.goto("/learn", { waitUntil: "networkidle" });
  await expect(page.getByText("Endometriosis and fertility").first()).toBeVisible();
  await expect(page.getByText("Sample", { exact: true }).first()).toBeVisible();

  // Searching works over the samples, as the prototype did.
  await page.getByPlaceholder(/Search the library/).fill("AMH");
  await expect(page.getByRole("heading", { name: /Results for/ })).toBeVisible();

  // A sample opens from its slug without asking the API for it.
  const asked: string[] = [];
  page.on("request", (r) => {
    if (/\/api\/v1\/learn\/articles\/[^/?]+$/.test(r.url())) asked.push(r.url());
  });
  await page.goto("/learn/endometriosis", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.getByRole("button", { name: "Save article" }).click();
  await expect(page.getByText(/This is a sample article/)).toBeVisible();
  expect(asked).toEqual([]);
  expect(writes).toEqual([]);
  expect(health.problems).toEqual([]);
});

test("real articles replace the samples", async ({ page }) => {
  await signIn(page);
  await page.goto("/learn", { waitUntil: "networkidle" });
  await expect(page.getByText("Endometriosis and fertility").first()).toBeVisible();
  await expect(page.getByText("Sample", { exact: true })).toHaveCount(0);
});

test("visitors see the sample library while it is empty", async ({ page }) => {
  await mockApi(page, EMPTY_LIBRARY);
  await page.goto("/library", { waitUntil: "networkidle" });
  await expect(page.getByText("Sample", { exact: true }).first()).toBeVisible();
  await page.getByText("Sample", { exact: true }).first().click();
  await expect(page.getByText(/Join free to read the full article/)).toBeVisible();
});

test("no groups yet: the sample groups open with their posts, read-only", async ({ page }) => {
  const writes: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/v1/groups/") && r.method() !== "GET") writes.push(r.url());
  });
  await signIn(page, { "GET /groups": { groups: [] } });
  await page.goto("/groups", { waitUntil: "networkidle" });
  await expect(page.getByText("Sample", { exact: true }).first()).toBeVisible();
  await page.goto("/groups/g-endo", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("article").first()).toBeVisible();
  await page.getByRole("button", { name: /^Join/ }).first().click();
  await expect(page.getByText(/This is a sample group/)).toBeVisible();
  expect(writes).toEqual([]);
});
