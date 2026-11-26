// Finishes the landing art repainted in the hero's hand (the hand of the orange
// branches, style-branch.txt). Each picture was repainted by gen.py from its
// old version as the master (prompts-restyle/: painting.txt for the round
// paintings, cover.txt for the Learn covers, cutout.txt for the cut-out
// elements on magenta, leaves.txt for the six loose leaves). This sets each
// one at its old file's size, next to it, as <name>-v2.webp:
//   - paintings and covers: resized to the old size
//   - cut-outs: magenta keyed away, trimmed (8px pad), set to the old width
//   - leaves: the row split into six, each at most 160px, as cozy/leaf-<n>-v2
//   - the app's five trees (TREE_SRC): cut from the stage row (stages-cut.mjs
//     input), each filling its 640 square on the ground, as art/tree-<lvl>-v2
//
// Usage: node scripts/art/restyle-finish.mjs <restyle dir> <stage row.png>
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { box, keyMagenta, shapes } from "./magenta.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const BRAND = join(ROOT, "public/assets/brand");
const [DIR, ROW] = process.argv.slice(2);
if (!DIR || !ROW) {
  console.error("usage: node scripts/art/restyle-finish.mjs <restyle dir> <stage row.png>");
  process.exit(2);
}

const PAINTINGS = ["landing/stage-trying", "landing/stage-waiting", "landing/stage-treatment", "landing/stage-break", "landing/stage-partner", "landing/partners", "gouache/privacy-gate-round", "learn/endometriosis-topic", "learn/pcos-topic", "learn/diminished-ovarian-reserve-topic", "learn/male-factor-topic", "learn/recurrent-pregnancy-loss-topic", "learn/unexplained-infertility-topic"];
// (The Grove Guide card keeps its original picture, way-guide-closeup.webp, by choice.)
const CUTOUTS = ["landing/way-mentors-bench", "landing/way-groups", "landing/way-stories", "landing/way-family"];

const generated = (path) => join(DIR, `${path.split("/")[1]}.png`);

for (const path of PAINTINGS) {
  const src = generated(path);
  if (!existsSync(src)) continue;
  const old = await sharp(join(BRAND, `${path}.webp`)).metadata();
  await sharp(src).resize(old.width, old.height, { fit: "cover" }).webp({ quality: 86 }).toFile(join(BRAND, `${path}-v2.webp`));
  console.log(`${path}-v2.webp ${old.width}x${old.height}`);
}

/** Key a single subject: keep the large shapes (as key.py), trim with a pad. */
async function cutout(src) {
  const { rgba, alpha, W, H } = await keyMagenta(src, { glass: true });
  const { owner, parts } = shapes(alpha, W, H);
  const big = parts[0]?.px.length ?? 0;
  const keepIds = new Set(parts.filter((p) => p.px.length >= big * 0.12).map((p) => p.id));
  // Faint paint next to a kept shape stays (soft edges); everything else goes.
  const keep = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) if (owner[i] >= 0 && keepIds.has(owner[i])) keep[i] = 1;
  for (let pass = 0; pass < 3; pass++)
    for (let i = 0; i < W * H; i++) {
      if (keep[i] || alpha[i] <= 0) continue;
      if ((i % W > 0 && keep[i - 1]) || (i % W < W - 1 && keep[i + 1]) || (i >= W && keep[i - W]) || (i < W * (H - 1) && keep[i + W])) keep[i] = 2;
    }
  for (let i = 0; i < W * H; i++) if (!keep[i]) rgba[i * 4 + 3] = 0;
  const b = box(alpha, W, H, (i) => keep[i] > 0);
  const pad = 8;
  const left = Math.max(0, b.x0 - pad);
  const top = Math.max(0, b.y0 - pad);
  const width = Math.min(W, b.x1 + pad + 1) - left;
  const height = Math.min(H, b.y1 + pad + 1) - top;
  return sharp(rgba, { raw: { width: W, height: H, channels: 4 } }).extract({ left, top, width, height }).png().toBuffer();
}

for (const path of CUTOUTS) {
  const src = generated(path);
  if (!existsSync(src)) continue;
  const old = await sharp(join(BRAND, `${path}.webp`)).metadata();
  const piece = await cutout(src);
  await sharp(piece).resize({ width: old.width }).webp({ quality: 88, alphaQuality: 100 }).toFile(join(BRAND, `${path}-v2.webp`));
  const m = await sharp(join(BRAND, `${path}-v2.webp`)).metadata();
  console.log(`${path}-v2.webp ${m.width}x${m.height} (was ${old.width}x${old.height})`);
}

/** Split a row of separate elements on magenta into its `count` largest shapes, left to right. */
async function splitRow(src, count) {
  const { rgba, alpha, W, H } = await keyMagenta(src);
  const { owner, parts } = shapes(alpha, W, H);
  const big = parts.slice(0, count).sort((p, q) => p.cx - q.cx);
  if (big.length !== count) throw new Error(`${src}: found ${big.length} shapes, expected ${count}`);
  const stageOf = new Map();
  big.forEach((p, k) => stageOf.set(p.id, k));
  for (const p of parts) if (!stageOf.has(p.id)) stageOf.set(p.id, big.reduce((best, q, k) => (Math.abs(q.cx - p.cx) < Math.abs(big[best].cx - p.cx) ? k : best), 0));
  const of = new Int8Array(W * H).fill(-1);
  for (let i = 0; i < W * H; i++) if (owner[i] >= 0) of[i] = stageOf.get(owner[i]);
  for (let pass = 0; pass < 4; pass++)
    for (let i = 0; i < W * H; i++) {
      if (of[i] >= 0 || alpha[i] <= 0) continue;
      for (const j of [i - 1, i + 1, i - W, i + W]) if (j >= 0 && j < W * H && of[j] >= 0) of[i] = of[j];
    }
  const out = [];
  for (let k = 0; k < count; k++) {
    const mine = Buffer.from(rgba);
    for (let i = 0; i < W * H; i++) if (of[i] !== k) mine[i * 4 + 3] = 0;
    const b = box(alpha, W, H, (i) => of[i] === k);
    const left = Math.max(0, b.x0 - 4);
    const top = Math.max(0, b.y0 - 4);
    out.push(await sharp(mine, { raw: { width: W, height: H, channels: 4 } }).extract({ left, top, width: Math.min(W, b.x1 + 5) - left, height: Math.min(H, b.y1 + 5) - top }).png().toBuffer());
  }
  return out;
}

const leavesSrc = join(DIR, "leaves.png");
if (existsSync(leavesSrc)) {
  const leaves = await splitRow(leavesSrc, 6);
  for (const [k, leaf] of leaves.entries()) {
    await sharp(leaf).resize(160, 160, { fit: "inside" }).webp({ quality: 88, alphaQuality: 100 }).toFile(join(BRAND, `cozy/leaf-${k + 1}-v2.webp`));
    console.log(`cozy/leaf-${k + 1}-v2.webp`);
  }
}

// The app's five trees: each stage from the row, filling its square on the
// ground as the old tree-*.webp did (about 580px tall or wide, foot at 624).
const levels = ["seed", "bush", "tree", "blossom", "orange"];
const trees = await splitRow(ROW, 5);
for (const [k, t] of trees.entries()) {
  const fitted = await sharp(t).resize(580, 580, { fit: "inside" }).png().toBuffer();
  const m = await sharp(fitted).metadata();
  await sharp({ create: { width: 640, height: 640, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: fitted, left: Math.round(320 - m.width / 2), top: 624 - m.height }])
    .webp({ quality: 88, alphaQuality: 100 })
    .toFile(join(BRAND, `art/tree-${levels[k]}-v2.webp`));
  console.log(`art/tree-${levels[k]}-v2.webp`);
}
