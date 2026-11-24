/* The store doubles as the client cache of what the API returned: each query maps its response into
   the same collections the prototype's selectors read (posts, comments, groups, members…). These
   merge helpers keep that cache coherent. */

/** Insert or replace by id, keeping the order of what was there and appending what's new. */
export function upsert<T extends { id: string }>(list: T[], items: T[]): T[] {
  if (!items.length) return list;
  const next = new Map(items.map((i) => [i.id, i]));
  const out = list.map((x) => {
    const n = next.get(x.id);
    if (!n) return x;
    next.delete(x.id);
    return n;
  });
  return [...out, ...next.values()];
}

/** Like `upsert`, but merges fields into what's cached (a richer copy keeps its extra fields). */
export function merge<T extends { id: string }>(list: T[], items: Partial<T>[]): T[] {
  if (!items.length) return list;
  const byId = new Map(list.map((x) => [x.id, x]));
  for (const item of items) {
    if (!item.id) continue;
    const had = byId.get(item.id);
    byId.set(item.id, (had ? { ...had, ...item } : item) as T);
  }
  return [...byId.values()];
}

/** Replace everything a response is the whole truth for (e.g. "my posts") with that response. */
export function replaceWhere<T extends { id: string }>(
  list: T[],
  covers: (x: T) => boolean,
  items: T[],
): T[] {
  const ids = new Set(items.map((i) => i.id));
  return [...list.filter((x) => !covers(x) && !ids.has(x.id)), ...items];
}

export const without = <T extends { id: string }>(list: T[], id: string) =>
  list.filter((x) => x.id !== id);
