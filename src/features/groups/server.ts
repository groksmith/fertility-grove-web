/* Server-safe reads for server layouts (no client hooks): GET /public/groups/{id}, so a group open
   to visitors may be listed. Anything that fails stays unlisted, the safe default. */

import { env } from "@/config/env";

/** The group's name and description when it is visible to guests (PRD v1.2 §10), otherwise null. */
export async function listedGroup(
  id: string,
): Promise<{ name: string; description: string } | null> {
  try {
    const r = await fetch(`${env.apiUrl}/api/v1/public/groups/${encodeURIComponent(id)}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    });
    if (!r.ok) return null;
    const g = (await r.json()) as { name?: string | null; description?: string | null };
    return { name: g.name ?? "", description: g.description ?? "" };
  } catch {
    return null;
  }
}
