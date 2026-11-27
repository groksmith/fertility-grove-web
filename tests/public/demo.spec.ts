import { expect, type Request, test } from "@playwright/test";

import { mockApi } from "../fixtures/api";
import { watchPageHealth } from "../fixtures/page-health";

// The /demo personas run offline on the prototype's sample data: no account, no API calls for
// anything a member does, and every flow works as it did before the backend was connected.

function memberCalls(page: import("@playwright/test").Page) {
  const calls: Request[] = [];
  page.on("request", (r) => {
    const url = r.url();
    // Visitor reads (the public library and feed) may still go out; nothing member-only may.
    if (url.includes("/api/v1/") && !/\/api\/v1\/(public|learn\/articles|auth\/sign-up-status)/.test(url)) {
      calls.push(r);
    }
  });
  return calls;
}

test("Annie's demo is filled and saves without the API", async ({ page }) => {
  const health = watchPageHealth(page);
  await mockApi(page);
  const calls = memberCalls(page);
  await page.goto("/demo", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Annie, six weeks in/ }).click();
  await page.waitForURL("**/feed");
  await expect(page.getByRole("article").first()).toBeVisible();
  await expect(page.getByText("People on your path")).toBeVisible();

  await page.goto("/learn", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Recommended for you" })).toBeVisible();
  await expect(page.getByText("Sample", { exact: true })).toHaveCount(0);

  await page.goto("/settings#looking", { waitUntil: "networkidle" });
  await page.getByText("A safe place to vent", { exact: true }).click();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText(/Saved\. Your suggestions will refresh/)).toBeVisible();
  await expect(page.getByRole("link", { name: /Prototype tools/ })).toBeVisible();

  expect(calls.map((r) => `${r.method()} ${r.url()}`)).toEqual([]);
  expect(health.problems).toEqual([]);
});

test("the invited partner sees Annie's invite, not an expired one", async ({ page }) => {
  await mockApi(page);
  const calls = memberCalls(page);
  await page.goto("/demo", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /An invited partner/ }).click();
  await page.waitForURL("**/partner-invite/demo");
  await expect(page.getByRole("heading", { name: "Annie invited you" })).toBeVisible();
  expect(calls.map((r) => r.url())).toEqual([]);
});

test("a new member signs up and starts onboarding without an account", async ({ page }) => {
  await mockApi(page);
  const calls = memberCalls(page);
  await page.goto("/demo", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /A new member/ }).click();
  await page.waitForURL("**/signup");
  await page.getByLabel("Email").fill("new.member@grove.test");
  await page.getByLabel("Password", { exact: true }).fill("sunlight-demo-1");
  for (const box of await page.getByRole("checkbox").all()) await box.check();
  await page.getByRole("button", { name: /Create account|Sign up/ }).click();
  await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL("**/onboarding/1");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(calls.map((r) => r.url())).toEqual([]);
});
