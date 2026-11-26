// The magenta key used for the art painted on flat #FF00FF (the same recipe as
// key.py, in Node so it runs without OpenCV): alpha from how magenta a pixel
// is (R and B both well above G), a light blur, the magenta unmixed from edge
// pixels, and any spill left capped. Returns RGBA plus the soft alpha.
import sharp from "sharp";

const clamp01 = (v) => Math.min(1, Math.max(0, v));

export async function keyMagenta(file, { glass = false } = {}) {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const N = W * H;
  const a = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const r = data[i * 3];
    const g = data[i * 3 + 1];
    const b = data[i * 3 + 2];
    a[i] = 1 - clamp01(((Math.min(r, b) - g) / Math.max(r, b, 1) - 0.28) / 0.5);
  }
  const alpha = new Float32Array(N);
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
      alpha[y * W + x] = v < 0.05 ? 0 : v;
    }
  const bg = [255, 0, 255];
  const rgba = Buffer.alloc(N * 4);
  for (let i = 0; i < N; i++) {
    const al = alpha[i];
    const c = [0, 1, 2].map((k) => Math.min(255, Math.max(0, al > 0 ? (data[i * 3 + k] - (1 - al) * bg[k]) / Math.max(al, 1e-3) : 0)));
    if (Math.min(c[0], c[2]) - c[1] > 25 && al < 0.98) {
      c[0] = Math.min(c[0], c[1] + 25);
      c[2] = Math.min(c[2], c[1] + 25);
    }
    let out = al;
    // Glass and thin edges carry the magenta through: anything still purple
    // becomes a pale neutral, half see-through (as key.py does).
    if (glass && al > 0 && Math.min(c[0], c[2]) - c[1] > 18 && c[2] > c[0] * 0.82) {
      const neutral = Math.min(255, (c[1] + Math.min(c[0], c[2])) / 2 + 20);
      c[0] = c[1] = c[2] = neutral;
      out = al * 0.55;
    }
    rgba.set([c[0], c[1], c[2], Math.round(out * 255)], i * 4);
  }
  return { rgba, alpha, W, H };
}

/** Connected shapes of solid paint (alpha > 0.5), largest first. */
export function shapes(alpha, W, H) {
  const N = W * H;
  const owner = new Int32Array(N).fill(-1);
  const parts = [];
  for (let i = 0; i < N; i++) {
    if (alpha[i] <= 0.5 || owner[i] >= 0) continue;
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
          if (alpha[j] > 0.5 && owner[j] < 0) {
            owner[j] = id;
            px.push(j);
          }
        }
    }
    let sx = 0;
    for (const p of px) sx += p % W;
    parts.push({ id, px, cx: sx / px.length });
  }
  return { owner, parts: parts.sort((p, q) => q.px.length - p.px.length) };
}

/** Bounding box of the pixels where `keep(i)` and alpha > 0.05. */
export function box(alpha, W, H, keep) {
  let x0 = W;
  let y0 = H;
  let x1 = -1;
  let y1 = -1;
  for (let i = 0; i < W * H; i++) {
    if (alpha[i] <= 0.05 || !keep(i)) continue;
    const x = i % W;
    const y = (i - x) / W;
    if (x < x0) x0 = x;
    if (y < y0) y0 = y;
    if (x > x1) x1 = x;
    if (y > y1) y1 = y;
  }
  return { x0, y0, x1, y1 };
}
