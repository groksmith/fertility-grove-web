import { expect, test } from "@playwright/test";

import { fixtures, mockApi, signIn } from "../fixtures/api";
import { watchPageHealth } from "../fixtures/page-health";

// The screens added to match the PRD: a success story's own page with comments, actions on
// suggestions and posts, and Learn for visitors.

const STORY = {
  ...fixtures.POST,
  id: "77777777-7777-4777-8777-777777777777",
  groupId: null,
  groupName: null,
  isSuccessStory: true,
  storyType: "SuccessStory",
  title: "Our rainbow baby arrived",
  isMine: true,
  authorHandle: "annie_grows",
};

test("a success story opens on its own page, with comments and the author's actions", async ({
  page,
}) => {
  await signIn(page, {
    [`GET /posts/${STORY.id}`]: {
      post: STORY,
      commentSort: "Top",
      comments: [
        {
          id: "88888888-8888-4888-8888-888888888888",
          parentCommentId: null,
          mentionedDisplayName: null,
          body: "This gives me so much hope.",
          source: "PersonalExperience",
          status: "Published",
          authorDisplayName: "@maya_m",
          authorHandle: "maya_m",
          authorTreeLevel: "Tree",
          isMine: false,
          score: 2,
          myVote: null,
          isCollapsed: false,
          isEdited: false,
          createdAt: "2026-11-23T12:00:00Z",
          replies: [],
        },
      ],
    },
  });
  const health = watchPageHealth(page);
  await page.goto(`/stories/${STORY.id}`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: STORY.title })).toBeVisible();
  await expect(page.getByText("This gives me so much hope.")).toBeVisible();
  await expect(page.getByLabel("Add a comment")).toBeVisible();
  await page.getByRole("button", { name: "Story options" }).click();
  await expect(page.getByRole("menuitem", { name: "Edit story" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Delete story" })).toBeVisible();
  expect(health.problems).toEqual([]);
});

test("a post author's menu offers Message", async ({ page }) => {
  await signIn(page);
  await page.goto(`/posts/${fixtures.POST.id}`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Post options" }).click();
  await expect(page.getByRole("menuitem", { name: "Message @maya_m" })).toBeVisible();
});

test("a matched post in the feed offers Join group", async ({ page }) => {
  const other = {
    ...fixtures.POST,
    id: "99999999-9999-4999-8999-999999999999",
    groupId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    groupName: "PCOS",
  };
  await signIn(page, {
    "GET /matches/posts": { posts: [{ post: other, reason: "Matched on PCOS" }] },
  });
  await page.goto("/feed", { waitUntil: "networkidle" });
  await expect(page.getByText("Matched on PCOS")).toBeVisible();
  await expect(page.getByRole("button", { name: "Join group" })).toBeVisible();
});

test("visitors can browse Learn and see an article's summary", async ({ page }) => {
  await mockApi(page);
  const health = watchPageHealth(page);
  await page.goto("/learn", { waitUntil: "networkidle" });
  await expect(page).toHaveURL(/\/library$/);
  await page.getByRole("link", { name: /Endometriosis and fertility/ }).click();
  await expect(page.getByRole("heading", { name: "Endometriosis and fertility" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Join free to read the full article" }),
  ).toBeVisible();
  expect(health.problems).toEqual([]);
});
