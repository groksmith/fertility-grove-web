// The refer-a-friend envelope (components/common/ReferFriend.tsx), made fresh
// to match the Messages envelopes: the same registered layers (back, pocket,
// open flap, closed flap), so the fold still lands on its own edges, with the
// aged kraft paper turned crisp white. The fold lines and the gentle overall
// shading stay; the blotchy mottling goes. The peach lining with its tiny
// blossoms stays as it is. The wax seal is replaced by a small glossy orange
// (prompts-restyle/refer-seal.txt, on magenta).
//
// Usage: node scripts/art/refer-fresh.mjs <seal.png>   (from the repo root)
// Writes public/assets/brand/refer/<layer>-v2.webp and seal-v2.webp.
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { box, keyMagenta, shapes } from "./magenta.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DIR = join(ROOT, "public/assets/brand/refer");
const SEAL = process.argv[2];
if (!SEAL) {
  console.error("usage: node scripts/art/refer-fresh.mjs <seal.png>");
  process.exit(2);
}

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
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

/** Box blur of a single channel (3 passes, about Gaussian), inside the layer only. */
function blur(src, alpha, W, H, r) {
  let a = Float32Array.from(src);
  let w = Float32Array.from(alpha, (x) => (x > 0.5 ? 1 : 0));
  for (let k = 0; k < W * H; k++) a[k] *= w[k];
  const pass = (v, horizontal) => {
    const out = new Float32Array(W * H);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        let s = 0;
        for (let d = -r; d <= r; d++) {
          const xx = horizontal ? x + d : x;
          const yy = horizontal ? y : y + d;
          if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
          s += v[yy * W + xx];
        }
        out[y * W + x] = s;
      }
    return out;
  };
  for (let k = 0; k < 3; k++) {
    a = pass(pass(a, true), false);
    w = pass(pass(w, true), false);
  }
  return a.map((v, k) => (w[k] > 1e-6 ? v / w[k] : 0));
}

for (const name of ["back", "pocket", "flap-open", "flap-closed"]) {
  const { data, info } = await sharp(join(DIR, `${name}.webp`)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;
  const N = W * H;
  const alpha = Float32Array.from({ length: N }, (_, i) => data[i * 4 + 3] / 255);
  const L = Float32Array.from({ length: N }, (_, i) => 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]);
  // The lining (only on the back and the open flap): the one large continuous
  // area of peach, blossoms and all. Kraft stains are a similar peach, but
  // they are scattered, so only the largest closed-up region counts.
  const lining = new Uint8Array(N);
  if (name === "back" || name === "flap-open") {
    const peach = new Uint8Array(N);
    for (let i = 0; i < N; i++) {
      const [h, s, v] = hsv(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);
      peach[i] = alpha[i] > 0.5 && s > 0.33 && h <= 28 && v > 0.9 ? 1 : 0;
    }
    // Close it up (so the little blossoms join in), keep the largest region,
    // and fill its holes.
    const near = blur(Float32Array.from(peach), alpha, W, H, 5);
    const closed = Uint8Array.from(near, (v) => (v > 0.35 ? 1 : 0));
    const { owner, parts } = shapes(Float32Array.from(closed), W, H);
    const top = parts[0];
    if (top) for (const p of top.px) lining[p] = 1;
    // Holes: anything the outside can't reach without crossing the lining.
    const outside = new Uint8Array(N);
    const stack = [];
    for (let x = 0; x < W; x++) stack.push(x, (H - 1) * W + x);
    for (let y = 0; y < H; y++) stack.push(y * W, y * W + W - 1);
    while (stack.length) {
      const p = stack.pop();
      if (lining[p] || outside[p]) continue;
      outside[p] = 1;
      const x = p % W;
      if (x > 0) stack.push(p - 1);
      if (x < W - 1) stack.push(p + 1);
      if (p >= W) stack.push(p - W);
      if (p < W * (H - 1)) stack.push(p + W);
    }
    for (let i = 0; i < N; i++) if (!outside[i] && alpha[i] > 0.1) lining[i] = 1;
    void owner;
  }
  const liningNear = blur(Float32Array.from(lining), alpha, W, H, 4);
  const broad = blur(L, alpha, W, H, 30); // the gentle overall shading
  const fine = blur(L, alpha, W, H, 1); // to keep only the crisp fold lines
  const paper = [];
  for (let i = 0; i < N; i++) if (alpha[i] > 0.5 && !lining[i] && liningNear[i] < 0.05) paper.push(broad[i]);
  paper.sort((a, b) => a - b);
  const mid = paper[paper.length >> 1] ?? 200;
  const out = Buffer.from(data);
  for (let i = 0; i < N; i++) {
    if (alpha[i] <= 0) continue;
    // Keep the lining (and its blossoms) as painted.
    if (liningNear[i] > 0.35) continue;
    const shade = (broad[i] - mid) * 0.35;
    const line = clamp(L[i] - fine[i], -40, 20) * 0.9; // fold lines and edges
    const edge = Math.min(0, L[i] - broad[i]) * 0.25; // darker creases along folds
    const v = clamp(246 + shade + line + edge, 150, 253);
    // A clean, very slightly cool white.
    const k = clamp(liningNear[i] / 0.35, 0, 1);
    const fresh = [v - 1, v, v + 2];
    for (let c = 0; c < 3; c++) out[i * 4 + c] = Math.round(fresh[c] * (1 - k) + data[i * 4 + c] * k);
  }
  await sharp(out, { raw: { width: W, height: H, channels: 4 } }).webp({ quality: 90, alphaQuality: 100 }).toFile(join(DIR, `${name}-v2.webp`));
  console.log(`${name}-v2.webp`);
}

// The seal: the painted orange, keyed, trimmed and set in the old seal's square.
const { rgba, alpha, W, H } = await keyMagenta(SEAL);
const { owner, parts } = shapes(alpha, W, H);
const keep = new Set(parts.filter((p) => p.px.length >= (parts[0]?.px.length ?? 0) * 0.12).map((p) => p.id));
for (let i = 0; i < W * H; i++) if (owner[i] >= 0 && !keep.has(owner[i])) rgba[i * 4 + 3] = 0;
const b = box(alpha, W, H, (i) => owner[i] < 0 || keep.has(owner[i]));
const piece = await sharp(rgba, { raw: { width: W, height: H, channels: 4 } })
  .extract({ left: b.x0, top: b.y0, width: b.x1 - b.x0 + 1, height: b.y1 - b.y0 + 1 })
  .resize(244, 248, { fit: "inside" })
  .png()
  .toBuffer();
const m = await sharp(piece).metadata();
await sharp({ create: { width: 260, height: 264, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: piece, left: Math.round((260 - m.width) / 2), top: Math.round((264 - m.height) / 2) }])
  .webp({ quality: 90, alphaQuality: 100 })
  .toFile(join(DIR, "seal-v2.webp"));
console.log("seal-v2.webp");
