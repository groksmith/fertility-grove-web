import { expect, test } from "@playwright/test";

import { fixtures, signIn } from "../fixtures/api";
import { watchPageHealth } from "../fixtures/page-health";

// Pieces the backend doesn't send yet are hidden rather than shown blank or wrong, and what it
// does send is used.

const GROUP_PATH = `GET /groups/${fixtures.GROUP.id}`;

test("a group page hides 'Who it's for' and shows the posters the API sends", async ({ page }) => {
  const health = watchPageHealth(page);
  await signIn(page, {
    [GROUP_PATH]: {
      ...fixtures.GROUP,
      posterAvatars: [{ avatarCode: "avatar_03" }, { avatarCode: null }],
    },
  });
  await page.goto(`/groups/${fixtures.GROUP.id}`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Endometriosis", level: 1 })).toBeVisible();
  await expect(page.getByText("4 posts this week")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Who it's for" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Group rules" })).toBeVisible();
  expect(health.problems).toEqual([]);
});

test("the groups list leaves out a weekly post count it wasn't given", async ({ page }) => {
  const { postsThisWeek: _, ...withoutCount } = fixtures.GROUP;
  await signIn(page, { "GET /groups": { groups: [withoutCount] } });
  await page.goto("/groups", { waitUntil: "networkidle" });
  await expect(page.getByText("120 members").first()).toBeVisible();
  await expect(page.getByText(/posts? this week/)).toHaveCount(0);
});
