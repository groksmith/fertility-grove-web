import { expect, test } from "@playwright/test";

import { fixtures, signIn } from "../fixtures/api";
import { watchPageHealth } from "../fixtures/page-health";

// The screens show what the API sends (tests/fixtures/api.ts), mapped into the shapes the approved
// UI already renders: a post from the feed, a group, an article, the member's own name.

test.beforeEach(async ({ page }) => {
  await signIn(page);
});

test("the feed lists the API's posts", async ({ page }) => {
  const health = watchPageHealth(page);
  await page.goto("/feed", { waitUntil: "networkidle" });
  await expect(page.getByText(fixtures.POST.title).first()).toBeVisible();
  expect(health.problems).toEqual([]);
});

test("a post opens from the API", async ({ page }) => {
  await page.goto(`/posts/${fixtures.POST.id}`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: fixtures.POST.title })).toBeVisible();
});

test("a group page reads GET /groups/{id}", async ({ page }) => {
  await page.goto(`/groups/${fixtures.GROUP.id}`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: fixtures.GROUP.name }).first()).toBeVisible();
});

test("an article renders its Markdown sections", async ({ page }) => {
  await page.goto(`/learn/${fixtures.ARTICLE_CARD.id}`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "What it is" })).toBeVisible();
});

test("signing in calls the API and lands on the feed", async ({ page, context }) => {
  await context.clearCookies();
  await page.addInitScript(() => window.sessionStorage.clear());
  await page.goto("/login");
  await page.getByLabel("Email").fill("annie.m@grove.test");
  await page.getByLabel("Password", { exact: true }).fill("a long passphrase");
  const login = page.waitForRequest((r) => r.url().endsWith("/api/v1/auth/login"));
  await page.getByRole("button", { name: "Sign in" }).click();
  expect((await login).postDataJSON()).toMatchObject({ email: "annie.m@grove.test" });
  await expect(page).toHaveURL(/\/feed$/);
});
