/* The hero grove grows from bare land: seedlings break the soil, become
   saplings and young trees, the grove matures and closes overhead, blossoms,
   and fruits, ending on the hero painting. It is a short film of painted growth
   stages (scripts/art/hero-growth-film.mjs says how they were made), played
   once over the painting; at its last frame the painting itself takes over, so
   the hero at rest is exactly the painting.

   How it plays:
   - CSS owns the first paint. When scripting is on and motion is allowed
     (globals.css, the same media query as GROW_QUERY), the painting starts
     hidden over the bare land (the film's first frame), so the grown grove
     never flashes before the growth begins. If this script never takes over,
     a CSS timer shows the painting anyway.
   - Here, the film plays over the painting, framed by the same object-fit and
     object-position, inside the same drifting stage; at its end the painting
     returns beneath it and the film fades off and is removed.
   - Reduced motion, data saver, a film that won't load or play: the painting,
     still.
   - `?grow=0.4` on the URL holds the film at that point, for review. */

import { type RefObject, useEffect } from "react";

/** Mirrors the media query in globals.css that hides the painting at first paint. */
export const GROW_QUERY = "(scripting: enabled) and (prefers-reduced-motion: no-preference)";

const GROWTH_DIR = "/assets/brand/gouache/growth";
/** The bare land (the film's first frame), set on the stage for the CSS first paint. */
export const GROW_PLATES = {
  "--plate-wide": `url("${GROWTH_DIR}/wide-land.webp")`,
  "--plate-tall": `url("${GROWTH_DIR}/tall-land.webp")`,
};

/** The hand-over from the film's last frame to the painting. */
const HANDOFF = 500;
/** If the film can't start within this long, show the painting instead. */
const PATIENCE = 6000;

/** Plays the growth inside `stage`: the drifting box that holds the hero <img>. */
export function useHeroGrow(stage: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const box = stage.current;
    const img = box?.querySelector<HTMLImageElement>("img.hero-art");
    if (!box || !img || !window.matchMedia(GROW_QUERY).matches) return;
    const show = (how: "done" | "fallback") => {
      box.dataset.grow = how;
    };
    // The CSS safety net already showed the painting: leave it be.
    if (Number(getComputedStyle(img).opacity) > 0.01) {
      show("done");
      return;
    }
    // Spare a metered connection the film.
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
      ?.saveData;
    if (saveData) {
      show("fallback");
      return;
    }
    box.dataset.grow = "run";
    const pinned = new URLSearchParams(window.location.search).get("grow");
    const pin = pinned === null ? null : Number(pinned);
    const key = window.matchMedia("(min-aspect-ratio: 1/1)").matches ? "wide" : "tall";

    let stopped = false;
    const video = document.createElement("video");
    video.className = "hero-art pointer-events-none absolute inset-0 h-full w-full object-cover";
    video.setAttribute("aria-hidden", "true");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.disablePictureInPicture = true;
    for (const [ext, type] of [
      ["webm", "video/webm"],
      ["mp4", "video/mp4"],
    ] as const) {
      const source = document.createElement("source");
      source.src = `${GROWTH_DIR}/${key}-growth.${ext}`;
      source.type = type;
      video.appendChild(source);
    }

    let patience = 0;
    const release = () => {
      video.pause();
      video.replaceChildren();
      video.load();
      video.remove();
    };
    const fail = () => {
      if (stopped) return;
      clearTimeout(patience);
      release();
      show("fallback");
    };
    patience = window.setTimeout(fail, PATIENCE);

    const start = () => {
      if (stopped) return;
      clearTimeout(patience);
      box.appendChild(video);
      if (pin !== null) return;
      video.play().catch(fail);
    };
    if (pin !== null) {
      video.addEventListener(
        "loadedmetadata",
        () => {
          video.currentTime = Math.min(1, Math.max(0, pin)) * (video.duration || 0);
        },
        { once: true },
      );
      video.addEventListener("seeked", start, { once: true });
    } else {
      video.addEventListener("canplaythrough", start, { once: true });
    }
    // Every source failed: the last one errors.
    video.querySelector("source:last-child")?.addEventListener("error", fail, { once: true });
    // At the last frame the painting returns beneath; the film fades off it.
    video.addEventListener(
      "ended",
      () => {
        if (stopped) return;
        show("done");
        video.style.transition = `opacity ${HANDOFF}ms var(--e-base)`;
        video.style.opacity = "0";
        setTimeout(() => {
          if (!stopped) release();
        }, HANDOFF + 50);
      },
      { once: true },
    );
    video.load();

    return () => {
      stopped = true;
      clearTimeout(patience);
      release();
      delete box.dataset.grow;
    };
  }, [stage]);
}
