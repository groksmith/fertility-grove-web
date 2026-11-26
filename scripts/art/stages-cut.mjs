// The five tree levels for the landing's "How deep your roots go" row, in the
// hero's hand. They are painted together, in one row on flat magenta
// (prompts-stages/stages-row.txt with gen.py, ART_STYLE=style-branch.txt), so
// they share one style, one scale and one ground line; this cuts the magenta
// away (the same key as key.py), splits the row into its five stages and sets
// each on a 640x640 square at one shared scale, standing on the square's
// ground line, as STAGE_SRC expects (components/art/Tree.tsx).
//
// Usage: node scripts/art/stages-cut.mjs <row.png>   (from the repo root)
// Writes public/assets/brand/art/stage-{seed,bush,tree,blossom,orange}-v2.webp.
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const OUT = join(ROOT, "public/assets/brand/art");
const NAMES = ["seed-v2", "bush-v2", "tree-v2", "blossom-v2", "orange-v2"];
const SIZE = 640;
const GROUND = 630; // where each stage stands in its square
const TALLEST = 586; // the orange tree's height; the others follow at the same scale

const src = process.argv[2];
if (!src) {
  console.error("usage: node scripts/art/stages-cut.mjs <row.png>");
  process.exit(2);
}
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;
const N = W * H;

// Key: how magenta each pixel is (R and B both above G), as in key.py.
const bg = [255, 0, 255];
const a = new Float32Array(N);
for (let i = 0; i < N; i++) {
  const r = data[i * 3];
  const g = data[i * 3 + 1];
  const b = data[i * 3 + 2];
  const m = (Math.min(r, b) - g) / Math.max(r, b, 1);
  a[i] = 1 - clamp01((m - 0.28) / 0.5);
}
// Blur the alpha a touch (3x3) and drop the faintest.
const soft = new Float32Array(N);
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) {
    let s = 0;
    let n = 0;
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx;
        const yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
        s += a[yy * W + xx];
        n++;
      }
    const v = s / n;
    soft[y * W + x] = v < 0.05 ? 0 : v;
  }
// Unmix the magenta from edge pixels, then cap any magenta spill left.
const rgba = Buffer.alloc(N * 4);
for (let i = 0; i < N; i++) {
  const al = soft[i];
  let c = [0, 1, 2].map((k) => (al > 0 ? (data[i * 3 + k] - (1 - al) * bg[k]) / Math.max(al, 1e-3) : 0));
  c = c.map((v) => Math.min(255, Math.max(0, v)));
  if (Math.min(c[0], c[2]) - c[1] > 25 && al < 0.98) {
    c[0] = Math.min(c[0], c[1] + 25);
    c[2] = Math.min(c[2], c[1] + 25);
  }
  rgba[i * 4] = c[0];
  rgba[i * 4 + 1] = c[1];
  rgba[i * 4 + 2] = c[2];
  rgba[i * 4 + 3] = Math.round(al * 255);
}

// Split the row: the five largest connected shapes of solid paint are the
// five stages, left to right; specks and stray leaves join the nearest stage.
const owner = new Int32Array(N).fill(-1);
const parts = [];
for (let i = 0; i < N; i++) {
  if (soft[i] <= 0.5 || owner[i] >= 0) continue;
  const id = parts.length;
  const px = [i];
  owner[i] = id;
  for (let q = 0; q < px.length; q++) {
    const p = px[q];
    const x = p % W;
    const y = (p - x) / W;
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx;
        const yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
        const j = yy * W + xx;
        if (soft[j] > 0.5 && owner[j] < 0) {
          owner[j] = id;
          px.push(j);
        }
      }
  }
  let sx = 0;
  for (const p of px) sx += p % W;
  parts.push({ id, px, cx: sx / px.length });
}
const big = [...parts].sort((p, q) => q.px.length - p.px.length).slice(0, 5).sort((p, q) => p.cx - q.cx);
if (big.length !== 5) throw new Error(`found ${big.length} stages, expected 5`);
const stageOf = new Int32Array(parts.length).fill(-1);
big.forEach((p, k) => (stageOf[p.id] = k));
for (const p of parts) if (stageOf[p.id] < 0) stageOf[p.id] = big.reduce((best, q, k) => (Math.abs(q.cx - p.cx) < Math.abs(big[best].cx - p.cx) ? k : best), 0);
// Each pixel with any paint belongs to the stage of its nearest solid shape.
const stage = new Int8Array(N).fill(-1);
for (let i = 0; i < N; i++) if (owner[i] >= 0) stage[i] = stageOf[owner[i]];
for (let pass = 0; pass < 4; pass++)
  for (let i = 0; i < N; i++) {
    if (stage[i] >= 0 || soft[i] <= 0) continue;
    for (const j of [i - 1, i + 1, i - W, i + W]) if (j >= 0 && j < N && stage[j] >= 0) stage[i] = stage[j];
  }

const boxes = big.map((_, k) => {
  let x0 = W;
  let x1 = 0;
  let y0 = H;
  let y1 = 0;
  for (let i = 0; i < N; i++)
    if (stage[i] === k && soft[i] > 0.5) {
      const x = i % W;
      const y = (i - x) / W;
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x + 1);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
    }
  // Centre on the foot (the bottom tenth of the stage), not the canopy.
  let sx = 0;
  let n = 0;
  for (let i = 0; i < N; i++) {
    const y = Math.floor(i / W);
    if (stage[i] === k && soft[i] > 0.5 && y >= y1 - (y1 - y0) * 0.1) {
      sx += i % W;
      n++;
    }
  }
  return { x0, x1, y0, y1, foot: n ? sx / n : (x0 + x1) / 2 };
});
const tallest = boxes[4];
const scale = TALLEST / (tallest.y1 - tallest.y0 + 1);

for (const [k, b] of boxes.entries()) {
  // This stage alone: every other stage's paint is cleared.
  const mine = Buffer.from(rgba);
  for (let i = 0; i < N; i++) if (stage[i] !== k) mine[i * 4 + 3] = 0;
  const full = await sharp(mine, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
  const pad = 6;
  const left = Math.max(0, b.x0 - pad);
  const top = Math.max(0, b.y0 - pad);
  const w = Math.min(W, b.x1 + pad) - left;
  const h = Math.min(H, b.y1 + pad + 1) - top;
  const piece = await sharp(full).extract({ left, top, width: w, height: h }).resize(Math.round(w * scale), Math.round(h * scale), { kernel: "lanczos3" }).png().toBuffer();
  const pw = Math.round(w * scale);
  const ph = Math.round(h * scale);
  const footX = (b.foot - left) * scale;
  const dx = Math.round(SIZE / 2 - footX);
  const dy = Math.round(GROUND - (b.y1 - top) * scale);
  // Keep it inside the square (a wide canopy is trimmed to fit, centred).
  const x = Math.max(0, Math.min(SIZE - pw, dx));
  const y = Math.max(0, dy);
  await sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: piece, left: pw > SIZE ? 0 : x, top: Math.min(y, SIZE - 1) }])
    .webp({ quality: 88, alphaQuality: 100 })
    .toFile(join(OUT, `stage-${NAMES[k]}.webp`));
  console.log(`stage-${NAMES[k]}.webp ${pw}x${ph} at ${x},${y}`);
}
