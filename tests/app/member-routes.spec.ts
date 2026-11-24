import { expect, test } from "@playwright/test";

import { signIn } from "../fixtures/api";
import { watchPageHealth } from "../fixtures/page-health";

// The member app, signed in against the API fixtures (tests/fixtures/api.ts): every /api/v1 call is
// answered with a small, fixed member, so the routes render the same way every run, offline.

const MEMBER_ROUTES = [
  "/feed",
  "/groups",
  "/stories",
  "/people",
  "/dashboard",
  "/learn",
  "/guide",
  "/credits",
  "/mentors",
  "/messages",
  "/notifications",
  "/family",
  "/settings",
  "/saved",
  "/posts/new",
];

test.beforeEach(async ({ page }) => {
  await signIn(page);
});

for (const route of MEMBER_ROUTES) {
  test(`${route} renders cleanly for a member`, async ({ page }) => {
    const health = watchPageHealth(page);
    await page.goto(route, { waitUntil: "networkidle" });
    await expect(page).toHaveURL(new RegExp(`${route}$`));
    await expect(page.locator("h1").first()).toBeVisible();
    expect(health.problems).toEqual([]);
  });
}
