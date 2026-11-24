// Barrel: named re-exports of what other layers consume.
export { GROUPS, groupById } from "@/lib/mock-server/seed/groups";
export type { Placement } from "./api";
export { groupKeys, useGroup, useGroupMatches, useGroups } from "./hooks";
export { groupMatches } from "./selectors";
export { groupService } from "./service";
export type { Group, GroupType } from "./types";
