// The hero's growth film: the grove growing from bare land into the hero painting.
//
// The stages are painted by scripts/art/gen.py (ART_STYLE=style-branch.txt),
// each an edit of the one after it, walking back from the hero painting:
// prompts-growth/s6 (in blossom, no fruit), s5 (leaves only), s4 (younger),
// s3 (young trees), s2 (saplings), s1 (seedlings), s0 (bare land). Then the
// in-betweens, each painted from its two neighbours: s35 (s3 -> s4); with
// between.txt s15, s32 (s3 -> s35) and s38 (s35 -> s4); and with their own
// prompts s05 (first shoots), s25 (slender young trees), s55 (buds, s5 -> s6)
// and s65 (young fruit, s6 -> the painting). Then one more in-between in each
// gap with between.txt, named after the earlier stage plus "a" (s05a, s1a ...
// s65a), so every step is small. Every stage keeps the
// painting's composition, so each tree grows where it stands.
//
// This joins them into one film ending on the painting itself. Each new stage
// arrives the way a grove grows: the rows rise from the ground up and the
// framing branches spread in from the frame's edges (a soft, slightly ragged
// front), then blossom and fruit come in softly. The page plays the film over
// the hero and hands over to the painting at its last frame.
//
// Usage: node scripts/art/hero-growth-film.mjs <stages dir>   (from the repo root)
//   <stages dir> holds wide-<stage>.png for every stage below, and tall-<stage>.png.
// Writes public/assets/brand/gouache/growth/<key>-growth.mp4 / .webm and
// <key>-land.webp (the bare-land stage, the hero's first paint).
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const ART = join(ROOT, "public/assets/brand/gouache");
const OUT = join(ART, "growth");
const STAGES = process.argv[2];
if (!STAGES) {
  console.error("usage: node scripts/art/hero-growth-film.mjs <stages dir>");
  process.exit(2);
}

const FPS = 30;
const FILMS = {
  wide: { final: "grove-branch-style.webp", w: 1920, h: 1072, horizon: 0.78 },
  tall: { final: "grove-branch-style-tall.webp", w: 1072, h: 1920, horizon: 0.64 },
};
/** The stages in order, the shortest time a step may take (seconds), and how
    the next stage arrives. The film runs on one gently eased clock through all
    of them, so the growth never stops and starts at a stage. */
const STAGES_IN_ORDER = [
  ["s0", 0.12, "grow"],
  ["s05", 0.12, "grow"],
  ["s05a", 0.12, "grow"],
  ["s1", 0.12, "grow"],
  ["s1a", 0.12, "grow"],
  ["s15", 0.12, "grow"],
  ["s15a", 0.12, "grow"],
  ["s2", 0.12, "grow"],
  ["s2a", 0.12, "grow"],
  ["s25", 0.12, "grow"],
  ["s25a", 0.12, "grow"],
  ["s3", 0.12, "grow"],
  ["s3a", 0.12, "grow"],
  ["s32", 0.12, "grow"],
  ["s32a", 0.12, "grow"],
  ["s35", 0.12, "grow"],
  ["s35a", 0.12, "grow"],
  ["s38", 0.12, "grow"],
  ["s38a", 0.12, "grow"],
  ["s4", 0.12, "fade"],
  ["s5", 0.12, "fade"],
  ["s5a", 0.12, "fade"],
  ["s55", 0.12, "fade"],
  ["s55a", 0.12, "fade"],
  ["s6", 0.12, "fade"],
  ["s6a", 0.12, "fade"],
  ["s65", 0.12, "fade"],
  ["s65a", 0.12, "fade"],
  ["final", 0, "hold"],
];
/** How long the growth itself lasts (seconds). Each step's share of it is in
    proportion to how much the picture changes in that step, measured, so the
    growth runs at one even pace; the seconds above are only a floor. */
const GROWTH_SECONDS = 4;
/** Still frames before the growth starts and after it ends (seconds). */
const HOLD_START = 0.15;
const HOLD_END = 0.4;

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (u) => u * u * (3 - 2 * u);

function hsv(r, g, b) {
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const d = mx - mn;
  let h = 0;
  if (d) {
    if (mx === r) h = ((g - b) / d) % 6;
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, mx ? d / mx : 0, mx / 255];
}
function rgb(h, s, v) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

/** The tall stages paint the path's shade blue; the hero's tall painting has it
    warm (sand-brown). Warm it the same way, on the path only. */
function warmPath(data, W, H) {
  for (let y = Math.floor(H * 0.6); y < H; y++) {
    const f = (y / H - 0.6) / 0.4;
    const half = (0.1 + 0.42 * f) * W;
    for (let x = 0; x < W; x++) {
      const edge = clamp01((half - Math.abs(x - W / 2)) / (0.05 * W));
      if (!edge) continue;
      const i = (y * W + x) * 3;
      const [h, s, v] = hsv(data[i], data[i + 1], data[i + 2]);
      const w = edge * clamp01((h - 150) / 15) * clamp01((235 - h) / 15) * clamp01((0.5 - s) / 0.1) * clamp01((v - 0.42) / 0.1);
      if (!w) continue;
      const [r, g, b] = rgb(32, Math.min(0.3, s * 0.9 + 0.1), Math.min(1, v * 1.02));
      data[i] += (r - data[i]) * w;
      data[i + 1] += (g - data[i + 1]) * w;
      data[i + 2] += (b - data[i + 2]) * w;
    }
  }
}

/** Smooth value noise in 0..1 (a ragged growth front, never a straight wipe). */
function noise(W, H, cell, seed) {
  const gw = Math.ceil(W / cell) + 2;
  const gh = Math.ceil(H / cell) + 2;
  let s = seed;
  const g = Float32Array.from({ length: gw * gh }, () => (s = (s * 16807) % 2147483647) / 2147483647);
  const out = new Float32Array(W * H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const fx = x / cell;
      const fy = y / cell;
      const x0 = Math.floor(fx);
      const y0 = Math.floor(fy);
      const ax = smooth(fx - x0);
      const ay = smooth(fy - y0);
      out[y * W + x] = (g[y0 * gw + x0] * (1 - ax) + g[y0 * gw + x0 + 1] * ax) * (1 - ay) + (g[(y0 + 1) * gw + x0] * (1 - ax) + g[(y0 + 1) * gw + x0 + 1] * ax) * ay;
    }
  return out;
}

async function film(key, { final, w: W, h: H }) {
  const load = async (file, stage) => {
    const { data } = await sharp(file).resize(W, H, { fit: "fill" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const f = Float32Array.from(data);
    if (key === "tall" && stage !== "final") warmPath(f, W, H);
    return f;
  };
  const frames = {};
  for (const [st] of STAGES_IN_ORDER)
    frames[st] = await load(st === "final" ? join(ART, final) : join(STAGES, `${key}-${st}.png`), st);

  // When the growth front reaches each pixel, 0..1: from the ground up (the
  // rows rise) or in from the side and top edges (the framing branches spread
  // in), whichever is sooner, roughened a little.
  const n1 = noise(W, H, Math.round(W / 18), 7);
  const n2 = noise(W, H, Math.round(W / 60), 11);
  const front = new Float32Array(W * H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const up = 1 - y / H;
      const edge = Math.min(x / W, (W - x) / W, y / H) * 2.4;
      front[y * W + x] = clamp01(Math.min(up, edge) + (n1[y * W + x] - 0.5) * 0.12 + (n2[y * W + x] - 0.5) * 0.05);
    }
  // Spread the front evenly over 0..1 (by rank), so every moment of a step
  // changes about as much of the picture: no rush, then no stall.
  const order = Array.from(front.keys()).sort((a, b) => front[a] - front[b]);
  order.forEach((p, r) => {
    front[p] = r / (order.length - 1);
  });

  mkdirSync(OUT, { recursive: true });
  const enc = (args, file) => {
    const p = spawn("ffmpeg", ["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${W}x${H}`, "-r", String(FPS), "-i", "-", ...args, file], { stdio: ["pipe", "inherit", "inherit"] });
    return p;
  };
  const mp4 = enc(["-c:v", "libx264", "-preset", "slow", "-crf", "27", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an"], join(OUT, `${key}-growth.mp4`));
  const webm = enc(["-c:v", "libvpx-vp9", "-crf", "39", "-b:v", "0", "-row-mt", "1", "-deadline", "good", "-cpu-used", "2", "-pix_fmt", "yuv420p", "-an"], join(OUT, `${key}-growth.webm`));
  const write = (proc, buf) => new Promise((ok) => (proc.stdin.write(buf) ? ok() : proc.stdin.once("drain", ok)));

  const out = Buffer.alloc(W * H * 3);
  // A wide, soft front: each new stage rises from the ground and in from the
  // edges, but mostly it blends, so it reads as growth rather than a wipe.
  const band = 0.5;
  const blend = (A, B, t, how) => {
    if (how === "fade") {
      for (let i = 0; i < out.length; i++) out[i] = A[i] + (B[i] - A[i]) * t;
      return;
    }
    const reach = t * (1 + band);
    for (let p = 0; p < W * H; p++) {
      const k = smooth(clamp01((reach - front[p]) / band));
      const i = p * 3;
      out[i] = A[i] + (B[i] - A[i]) * k;
      out[i + 1] = A[i + 1] + (B[i + 1] - A[i + 1]) * k;
      out[i + 2] = A[i + 2] + (B[i + 2] - A[i + 2]) * k;
    }
  };
  const still = async (F, secs) => {
    for (let i = 0; i < out.length; i++) out[i] = F[i];
    for (let f = 0; f < Math.round(secs * FPS); f++) await Promise.all([write(mp4, out), write(webm, out)]);
    count += Math.round(secs * FPS);
  };
  let count = 0;
  await still(frames.s0, HOLD_START);
  const trail = Buffer.from(out);
  // Measure each step's change, and share the growth's time out by it.
  const change = STAGES_IN_ORDER.slice(0, -1).map(([from], k) => {
    const A = frames[from];
    const B = frames[STAGES_IN_ORDER[k + 1][0]];
    let sum = 0;
    let n = 0;
    for (let i = 0; i < A.length; i += 21) {
      sum += Math.abs(A[i] - B[i]);
      n++;
    }
    return (sum / n) ** 0.85;
  });
  const changeTotal = change.reduce((a, b) => a + b, 0);
  const steps = STAGES_IN_ORDER.slice(0, -1).map(([from, floor, how], k) => [from, Math.max(floor, (GROWTH_SECONDS * change[k]) / changeTotal), how]);
  console.log(`${key} steps: ${steps.map(([from, secs]) => `${from} ${secs.toFixed(2)}s`).join(", ")}`);
  const total = steps.reduce((a, [, secs]) => a + secs, 0);
  const n = Math.round(total * FPS);
  for (let f = 1; f <= n; f++) {
    // One clock for the whole growth: nearly even, easing only at its ends.
    const u = f / n;
    const tau = 0.65 * u + 0.35 * (0.5 - 0.5 * Math.cos(Math.PI * u));
    let at = tau * total;
    let k = 0;
    while (k < steps.length - 1 && at > steps[k][1]) {
      at -= steps[k][1];
      k++;
    }
    const [from, secs, how] = steps[k];
    const to = STAGES_IN_ORDER[k + 1][0];
    blend(frames[from], frames[to], clamp01(at / secs), how);
    // A little of the last frame stays in each new one (a light motion blur),
    // so the growth flows rather than steps. The held ending settles it.
    for (let i = 0; i < out.length; i++) trail[i] = trail[i] * 0.35 + out[i] * 0.65;
    await Promise.all([write(mp4, trail), write(webm, trail)]);
    count++;
  }
  await still(frames.final, HOLD_END);
  mp4.stdin.end();
  webm.stdin.end();
  await Promise.all([new Promise((ok) => mp4.on("close", ok)), new Promise((ok) => webm.on("close", ok))]);

  // The bare-land stage is the hero's first paint, before the film starts.
  const land = Buffer.from(frames.s0.map((v) => Math.max(0, Math.min(255, Math.round(v)))));
  await sharp(land, { raw: { width: W, height: H, channels: 3 } }).webp({ quality: 82 }).toFile(join(OUT, `${key}-land.webp`));
  console.log(`${key}: ${count} frames (${(count / FPS).toFixed(1)}s)`);
}

for (const [key, cfg] of Object.entries(FILMS)) await film(key, cfg);
