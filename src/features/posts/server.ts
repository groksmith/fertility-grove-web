/* Server-safe reads for server layouts (no client hooks): GET /public/posts/{id} for the page's
   title and whether search engines may list it. Anything that fails stays unlisted, the safe
   default. */

import { env } from "@/config/env";

/** The post's title when search engines may list it (PRD v1.2 §10), otherwise null. */
export async function listedPostTitle(id: string): Promise<string | null> {
  try {
    const r = await fetch(`${env.apiUrl}/api/v1/public/posts/${encodeURIComponent(id)}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    });
    if (!r.ok) return null;
    const p = (await r.json()) as { shownToVisitors?: boolean; title?: string | null };
    return p.shownToVisitors && p.title ? p.title : null;
  } catch {
    return null;
  }
}
