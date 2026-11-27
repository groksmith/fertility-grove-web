import { describe, expect, it } from "vitest";
import { signedOut } from "@/lib/mock-server";
import { isApiId, withSampleGroups, withSamples } from "./samples";

const UUID = "11111111-1111-4111-8111-111111111111";

describe("prototype samples", () => {
  it("tells API ids from sample slugs", () => {
    expect(isApiId(UUID)).toBe(true);
    expect(isApiId("endometriosis")).toBe(false);
    expect(isApiId("g-ivf")).toBe(false);
  });

  it("adds samples only while the API list is empty, and drops them once it has items", () => {
    type Item = { id: string; sample?: true };
    const samples: Item[] = [{ id: "a" }, { id: "b" }];
    const shown = withSamples<Item>([], false, samples, (x) => x.id);
    expect(shown.map((x) => [x.id, x.sample])).toEqual([
      ["a", true],
      ["b", true],
    ]);
    expect(withSamples<Item>([...shown, { id: UUID }], true, samples, (x) => x.id)).toEqual([
      { id: UUID },
    ]);
  });

  it("fills the sample community, never with the member's own posts, and takes it back", () => {
    const s = withSampleGroups(signedOut(), false);
    expect(s.groups.length).toBeGreaterThan(0);
    expect(s.groups.every((g) => g.sample)).toBe(true);
    expect(s.posts.length).toBeGreaterThan(0);
    expect(s.posts.some((p) => p.authorId === "me")).toBe(false);
    const real = { ...s, groups: [...s.groups, { ...s.groups[0]!, id: UUID, sample: undefined }] };
    const back = withSampleGroups(real, true);
    expect(back.groups.map((g) => g.id)).toEqual([UUID]);
    expect(back.posts.some((p) => p.sample)).toBe(false);
  });
});
