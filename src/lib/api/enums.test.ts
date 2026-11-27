import { describe, expect, it } from "vitest";
import {
  apiMessagePolicy,
  apiPostType,
  apiSource,
  contentStatus,
  messagePolicy,
  minutesSince,
  postType,
  source,
  treeLevel,
} from "./enums";
import { avatarCode, decodeAvatar, memberFromRef } from "./members";
import { codeOf, labelOf, labelsOf, pronounsText, registerOptions } from "./options";

describe("enum mapping", () => {
  it("round-trips the API's enums through the PRD's words", () => {
    expect(treeLevel("BlossomTree")).toBe("Blossom Tree");
    expect(postType(apiPostType("Support needed"))).toBe("Support needed");
    expect(source(apiSource("From research or guidelines"))).toBe("From research or guidelines");
    expect(messagePolicy(apiMessagePolicy("no-one"))).toBe("no-one");
    expect(contentStatus("HiddenForReview")).toBe("held");
  });

  it("measures time from ISO timestamps", () => {
    const now = Date.parse("2026-11-23T12:00:00Z");
    expect(minutesSince("2026-11-23T11:00:00Z", now)).toBe(60);
    expect(minutesSince("2027-01-01T00:00:00Z", now)).toBe(0);
    expect(minutesSince(null, now)).toBe(0);
  });
});

describe("options and avatars", () => {
  it("codes labels as snake_case until the catalogue loads", () => {
    expect(codeOf("Recently diagnosed")).toBe("recently_diagnosed");
    expect(labelOf("recently_diagnosed")).toBe("Recently diagnosed");
  });

  it("shows nothing for a code nobody knows, never the raw code", () => {
    expect(labelOf("unknown_code")).toBe("");
    expect(labelsOf(["recently_diagnosed", "retired_code", null])).toEqual(["Recently diagnosed"]);
  });

  it("decodes pronoun codes and keeps a member's own words", () => {
    registerOptions({ pronouns: [{ code: "she_her", label: "she/her" }] });
    expect(pronounsText("she_her")).toBe("she/her");
    expect(pronounsText("xe/xem")).toBe("xe/xem");
    expect(pronounsText("retired_code")).toBeUndefined();
    expect(pronounsText(null)).toBeUndefined();
  });

  it("sends an avatar as its catalogue code, or null for none", () => {
    expect(avatarCode(-1)).toBeNull();
    expect(avatarCode(undefined)).toBeNull();
    // Before the catalogue loads, the seeded code for that place.
    expect(avatarCode(2)).toBe("avatar_03");
    registerOptions({
      avatar: [
        { code: "avatar_01", label: "Avatar 1" },
        { code: "fern", label: "Fern" },
      ],
    });
    expect(avatarCode(1)).toBe("fern");
    expect(decodeAvatar("fern")).toEqual({ preset: 1 });
    expect(decodeAvatar("avatar_07")).toEqual({ preset: 6 });
  });

  it("still reads a pre-catalogue colour code and tolerates unknown ones", () => {
    expect(decodeAvatar("coral:3")).toEqual({ hue: "coral", preset: 3 });
    expect(decodeAvatar("leaf-3")).toEqual({});
    expect(decodeAvatar(null)).toEqual({});
  });

  it("leaves another member's Sunlight unknown rather than 0", () => {
    expect(memberFromRef({ handle: "bea", displayName: "@bea" }).sunlight).toBeUndefined();
  });

  it("reads display identity from the API's display name", () => {
    expect(memberFromRef({ handle: "annie", displayName: "Annie M." })).toMatchObject({
      showRealName: true,
      firstName: "Annie",
      lastInitial: "M",
      handle: "annie",
    });
    expect(memberFromRef({ handle: "annie", displayName: "@annie" })).toMatchObject({
      showRealName: false,
      handle: "annie",
    });
  });
});
