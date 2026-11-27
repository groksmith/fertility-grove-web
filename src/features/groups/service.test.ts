import { describe, expect, it } from "vitest";
import { get, persona, replace, signedOut } from "@/lib/mock-server";
import { groupService } from "./service";

describe("groupService in the offline demo", () => {
  it("joins on the store without calling the API", async () => {
    replace(persona("member"));
    expect(get().demo).toBe(true);
    const r = await groupService.toggleJoin("g-pcos");
    expect(r.ok).toBe(true);
    expect(get().joined).toContain("g-pcos");
  });

  it("leaves sample groups alone outside the demo", async () => {
    replace(signedOut());
    const r = await groupService.toggleJoin("g-pcos");
    expect(r.ok).toBe(false);
    expect(get().joined).not.toContain("g-pcos");
  });
});
