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
import { codeOf, labelOf } from "./options";

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
    expect(labelOf("unknown_code")).toBe("unknown_code");
  });

  it("round-trips avatar codes and tolerates unknown ones", () => {
    expect(decodeAvatar(avatarCode("coral", 3))).toEqual({ hue: "coral", preset: 3 });
    expect(decodeAvatar(avatarCode("blue", undefined))).toEqual({ hue: "blue", preset: undefined });
    expect(decodeAvatar("leaf-3")).toEqual({ hue: "green" });
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
