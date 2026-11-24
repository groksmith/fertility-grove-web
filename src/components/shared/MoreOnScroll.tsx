"use client";

/* Loads a list's next page as its end comes into view. Invisible: no button and no spinner, so a
   long list simply keeps going (the PRD sets no paging UI). Put it right after the list. */

import { useEffect, useRef } from "react";

export function MoreOnScroll({
  query,
}: {
  query: { hasNextPage: boolean; isFetchingNextPage: boolean; fetchNextPage: () => unknown };
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query;
  useEffect(() => {
    const el = ref.current;
    if (!el || !hasNextPage) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !isFetchingNextPage) void fetchNextPage();
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  if (!hasNextPage) return null;
  return <div ref={ref} aria-hidden className="h-px" />;
}
